"""Dedicated founding-family enrollment and single-use invitations."""
import hashlib
import json
import os
import re
import secrets
import time
from uuid import uuid4

import boto3
from botocore.exceptions import ClientError

db = boto3.resource("dynamodb")
cognito = boto3.client("cognito-idp")
table = db.Table(os.environ["TABLE_NAME"])
profiles = db.Table(os.environ["ACTIVATION_TABLE"])
CAP = 100
CONTROL = "CONTROL"
RELATIONS = {"Father", "Mother", "Parent", "Spouse", "Son", "Daughter", "Child",
             "Brother", "Sister", "Sibling", "Grandfather", "Grandmother", "Grandchild", "Other"}


def reply(status, body):
    return {"statusCode": status, "headers": {"Content-Type": "application/json", "Cache-Control": "no-store"},
            "body": json.dumps(body)}


def get(key):
    return table.get_item(Key={"pk": key}, ConsistentRead=True).get("Item")


def put(item):
    return {"Put": {"TableName": table.name, "Item": item, "ConditionExpression": "attribute_not_exists(pk)"}}


def update(key, expression, condition, values):
    item = {"TableName": table.name, "Key": {"pk": key}, "UpdateExpression": expression,
            "ConditionExpression": condition, "ExpressionAttributeValues": values}
    if key == CONTROL:
        item["ExpressionAttributeNames"] = {"#mode": "mode"}
    return {"Update": item}


def transact(*items):
    db.meta.client.transact_write_items(TransactItems=list(items))


def profile(user):
    return profiles.get_item(Key={"userId": user}, ProjectionExpression="yourName, familyName",
                             ConsistentRead=True).get("Item")


def invite_key(token):
    if not isinstance(token, str) or not re.fullmatch(r"[A-Za-z0-9_-]{43}", token):
        raise ValueError("Invalid invitation link.")
    return "INVITE#" + hashlib.sha256(token.encode()).hexdigest()


def active_invite(invite, now):
    return invite and invite["state"] == "PENDING" and invite["expiresAt"] > now


def family_record(user):
    membership = get("USER#" + user)
    return get("FAMILY#" + membership["familyId"]) if membership else None


def verified_recipient(claims):
    username = claims.get("username") or claims.get("cognito:username")
    pool = os.environ.get("USER_POOL_ID")
    if not username or not pool:
        return None
    identity = cognito.admin_get_user(UserPoolId=pool, Username=username)
    attrs = {item["Name"]: item["Value"] for item in identity["UserAttributes"]}
    if (identity.get("Enabled") and attrs.get("sub") == claims["sub"]
            and attrs.get("email_verified") == "true"):
        return attrs.get("email", "").strip().lower()
    return None


def email_digest(address):
    return hashlib.sha256(address.encode()).hexdigest()


def lambda_handler(event, _context):
    route = event.get("routeKey")
    if route == "GET /founding":
        control = get(CONTROL) or {}
        mode = control.get("mode", "closed")
        remaining = max(0, CAP - int(control.get("families", 0)))
        return reply(200, {"mode": mode, "remainingFamilies": remaining,
                           "newFamiliesOpen": mode == "public" or (mode == "founding" and remaining > 0)})
    try:
        body = json.loads(event.get("body") or "{}")
        if not isinstance(body, dict):
            raise ValueError("Invalid request.")
        now = int(time.time())
        if route == "POST /invitations/preview":
            invitation = get(invite_key(body.get("token")))
            if not active_invite(invitation, now):
                return reply(404, {"message": "This invitation is unavailable or has expired."})
            return reply(200, {"inviterName": invitation["inviterName"],
                               "relationship": invitation["reverseRelationship"]})

        claims = event.get("requestContext", {}).get("authorizer", {}).get("jwt", {}).get("claims", {})
        user = claims.get("sub")
        if not user or claims.get("token_use") != "access":
            return reply(401, {"message": "Sign in to continue."})
        user_key = "USER#" + user
        if route == "GET /family-connection":
            family = family_record(user)
            if not family:
                return reply(200, {"connection": None, "invitation": None, "canInvite": False})
            other = family.get("secondUser") if user == family["firstUser"] else family["firstUser"]
            invitation = get(family["inviteKey"]) if family.get("inviteKey") else None
            other_profile = profile(other) if other else None
            return reply(200, {
                "connection": {"name": other_profile.get("yourName") or "Family member",
                               "relationship": family["relationship"] if user == family["firstUser"]
                               else family["reverseRelationship"]} if other_profile else None,
                "invitation": {"relationship": invitation["relationship"],
                               "shared": bool(invitation.get("sharedAt"))}
                if active_invite(invitation, now) and user == family["firstUser"] else None,
                "canInvite": user == family["firstUser"] and not other,
            })

        if route == "POST /founding/enroll":
            existing = get(user_key)
            if existing:
                return reply(200, {"familyId": existing["familyId"]})
            return reply(409, {"message": "Founding enrollment takes place during registration."})

        account = profile(user)
        if not account:
            return reply(403, {"message": "Complete FamilyKit registration first."})
        if route == "POST /invitations":
            family = family_record(user)
            if not family or family["firstUser"] != user or family.get("secondUser"):
                return reply(409, {"message": "Your family does not have an available invitation slot."})
            relationship, reverse = body.get("relationship"), body.get("reverseRelationship")
            if relationship not in RELATIONS or reverse not in RELATIONS:
                raise ValueError("Choose a relationship for both family members.")
            if "recipientEmail" in body:
                return reply(400, {"message": "Create and share an invitation link manually."})
            token = secrets.token_urlsafe(32)
            key = invite_key(token)
            previous = get(family["inviteKey"]) if family.get("inviteKey") else None
            guard = "attribute_not_exists(secondUser) AND attribute_not_exists(supersededBy) AND "
            values = {":key": key}
            changes = []
            if family.get("inviteKey"):
                guard += "inviteKey = :previous"
                values[":previous"] = family["inviteKey"]
                if previous and previous["state"] == "PENDING":
                    changes.append(update(previous["pk"], "SET #state = :cancelled",
                                          "#state = :pending", {":cancelled": "CANCELLED", ":pending": "PENDING"}))
                    changes[-1]["Update"]["ExpressionAttributeNames"] = {"#state": "state"}
            else:
                guard += "attribute_not_exists(inviteKey)"
            transact(
                update(family["pk"], "SET inviteKey = :key", guard, values),
                put({"pk": key, "familyKey": family["pk"], "inviter": user,
                     "inviterName": account.get("yourName") or "A family member", "state": "PENDING",
                     "expiresAt": now + 7 * 86400, "relationship": relationship, "reverseRelationship": reverse}),
                *changes,
            )
            return reply(201, {"token": token})

        if route in {"POST /invitations/shared", "POST /invitations/cancel", "POST /invitations/decline", "POST /invitations/accept"}:
            token = body.get("token")
            if route.endswith("/cancel") and not token:
                family = family_record(user)
                key = family.get("inviteKey") if family and family["firstUser"] == user else None
                if not key:
                    return reply(404, {"message": "No pending invitation."})
            else:
                key = invite_key(token)
            invitation = get(key)
            if invitation and invitation.get("acceptedBy") == user and route.endswith("/accept"):
                return reply(200, {"connected": True})
            if not active_invite(invitation, now):
                return reply(404, {"message": "This invitation is unavailable or has expired."})
            owner_action = route.endswith(("/shared", "/cancel"))
            if owner_action != (invitation["inviter"] == user):
                return reply(403, {"message": "This action is unavailable for your account."})
            if not owner_action and invitation.get("recipientDigest"):
                address = verified_recipient(claims)
                if not address or not secrets.compare_digest(email_digest(address), invitation["recipientDigest"]):
                    return reply(403, {"message": "Sign in with the verified email that received this invitation."})
            if not owner_action and invitation.get("reservedFor") not in (None, user):
                return reply(403, {"message": "This invitation is reserved for another account."})
            values = {":pending": "PENDING", ":now": now}
            if route.endswith("/shared"):
                expression = "SET sharedAt = :now"
            elif route.endswith("/accept"):
                expression = "SET #state = :accepted, acceptedBy = :user"
                values.update({":accepted": "ACCEPTED", ":user": user})
            else:
                expression = "SET #state = :closed"
                values[":closed"] = "CANCELLED" if owner_action else "REJECTED"
            change = update(key, expression, "#state = :pending AND expiresAt > :now", values)
            change["Update"]["ExpressionAttributeNames"] = {"#state": "state"}
            if not owner_action:
                change["Update"]["ConditionExpression"] += " AND (attribute_not_exists(reservedFor) OR reservedFor = :requester)"
                values[":requester"] = user
            if route.endswith("/accept"):
                family_key = invitation["familyKey"]
                family_id = family_key.removeprefix("FAMILY#")
                membership = get(user_key)
                if membership:
                    old_id = membership["familyId"]
                    old = get("FAMILY#" + old_id)
                    if (membership.get("assignment") != "legacy" or not old
                            or old.get("assignment") != "legacy" or old.get("firstUser") != user
                            or old.get("secondUser") or old.get("supersededBy")):
                        return reply(409, {"message": "This account already belongs to a family and cannot join another."})
                    old_invite = old.get("inviteKey")
                    if old_invite and active_invite(get(old_invite), now):
                        return reply(409, {"message": "Cancel your outgoing invitation before accepting this one."})
                    old_guard = "firstUser = :user AND assignment = :legacy AND attribute_not_exists(secondUser) AND attribute_not_exists(supersededBy)"
                    old_values = {":user": user, ":legacy": "legacy", ":new": family_id}
                    if old_invite:
                        old_guard += " AND inviteKey = :oldInvite"
                        old_values[":oldInvite"] = old_invite
                    else:
                        old_guard += " AND attribute_not_exists(inviteKey)"
                    membership_changes = [
                        update(old["pk"], "SET supersededBy = :new", old_guard, old_values),
                        update(user_key, "SET familyId = :new REMOVE assignment", "familyId = :old AND assignment = :legacy",
                               {":new": family_id, ":old": old_id, ":legacy": "legacy"}),
                    ]
                else:
                    membership_changes = [put({"pk": user_key, "familyId": family_id})]
                transact(
                    change,
                    update(family_key, "SET secondUser = :user, relationship = :relation, reverseRelationship = :reverse",
                           "inviteKey = :invite AND attribute_not_exists(secondUser) AND attribute_not_exists(supersededBy)",
                           {":user": user, ":relation": invitation["relationship"],
                            ":reverse": invitation["reverseRelationship"], ":invite": key}),
                    *membership_changes,
                )
                return reply(200, {"connected": True})
            transact(change)
            return reply(200, {"updated": True})
        return reply(404, {"message": "Route not found."})
    except (ValueError, TypeError) as error:
        return reply(400, {"message": str(error) if isinstance(error, ValueError) and not isinstance(error, json.JSONDecodeError) else "Invalid request."})
    except ClientError as error:
        if error.response["Error"]["Code"] == "TransactionCanceledException":
            if route == "POST /founding/enroll":
                existing = get(user_key)
                if existing:
                    return reply(200, {"familyId": existing["familyId"]})
            return reply(409, {"message": "The family slot or invitation is unavailable. Refresh and try again."})
        print("Connections request failed:", error.operation_name, error.response["Error"]["Code"])
        return reply(503, {"message": "Family connections are temporarily unavailable."})

