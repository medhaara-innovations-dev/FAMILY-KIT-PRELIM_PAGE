"""Dedicated founding-family enrollment and single-use invitations."""
import base64
import hashlib
import json
import os
import re
import secrets
import time
from datetime import date
from email.message import EmailMessage
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen

from uuid import UUID, uuid4

import boto3
from boto3.dynamodb.conditions import Attr, Key
from dependent_sharing import route_request as dependent_sharing
from botocore.exceptions import ClientError

db = boto3.resource("dynamodb")
cognito = boto3.client("cognito-idp")
s3 = boto3.client("s3")
photo_bucket = os.environ.get("PROFILE_PICTURES_BUCKET", "family-kit-profile-pictures")
table = db.Table(os.environ["TABLE_NAME"])
profiles = db.Table(os.environ["ACTIVATION_TABLE"])
members = db.Table(os.environ.get("MEMBERS_TABLE", "FamilyKitFamilyMembers"))
REVIEW_FIELDS = {"yourName": 100, "dateOfBirth": 10, "height": 16, "weight": 16, "bloodGroup": 16, "address": 1000}
SHARE_FIELDS = set(REVIEW_FIELDS) - {"yourName"} | {"mobile", "instagramUrl", "facebookUrl", "linkedinUrl"}
CAP = 100
MEMBERS_PER_FAMILY = 2
family_count_cache = (0, None)
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


def managed_profile(owner, member_id):
    if not isinstance(member_id, str) or not member_id:
        raise ValueError("Choose a valid family profile.")
    member_id = str(UUID(member_id))
    fields = "memberId, #name, dateOfBirth, height, weight, bloodGroup, address"
    item = members.get_item(Key={"userId": owner, "memberId": member_id},
                            ProjectionExpression=fields, ExpressionAttributeNames={"#name": "name"},
                            ConsistentRead=True).get("Item")
    if not item:
        raise ValueError("That family profile is unavailable.")
    return item


def review_values(body):
    values = body.get("profile", {})
    if not isinstance(values, dict) or values.keys() - REVIEW_FIELDS.keys():
        raise ValueError("Invalid profile details.")
    result = {}
    for field, value in values.items():
        if not isinstance(value, str) or len(value.strip()) > REVIEW_FIELDS[field]:
            raise ValueError("Check the profile details and try again.")
        value = value.strip()
        if field == "yourName" and not value:
            raise ValueError("Enter your full name or skip that field.")
        if field == "dateOfBirth" and value:
            if not re.fullmatch(r"[0-9]{4}-[0-9]{2}-[0-9]{2}", value) or date.fromisoformat(value) > date.today():
                raise ValueError("Enter a valid date of birth.")
        if field in {"height", "weight"} and value and not re.fullmatch(r"[0-9]{1,3}(?:[.][0-9]{1,2})?", value):
            raise ValueError("Enter height and weight as numbers.")
        result[field] = value
    return result


def profile_update(user, values):
    names = {f"#field{i}": field for i, field in enumerate(values)}
    params = {f":value{i}": value for i, value in enumerate(values.values())}
    return {"Update": {"TableName": profiles.name, "Key": {"userId": user},
                       "UpdateExpression": "SET " + ", ".join(f"#field{i} = :value{i}" for i in range(len(values))),
                       "ConditionExpression": "attribute_exists(userId)",
                       "ExpressionAttributeNames": names, "ExpressionAttributeValues": params}}


def connected_photo(user):
    member_id = "PROFILE#SELF"
    item = members.get_item(Key={"userId": user, "memberId": member_id},
                            ProjectionExpression="profilePictureKey", ConsistentRead=True).get("Item") or {}
    key = item.get("profilePictureKey")
    prefix = f"profile-pictures/{user}/{member_id}/"
    if not isinstance(key, str) or not key.startswith(prefix):
        return None
    return s3.generate_presigned_url("get_object", Params={"Bucket": photo_bucket, "Key": key}, ExpiresIn=300)


def auto_link_profile(user, other, family, relationship, is_inviter):
    field = "linkedMemberId" if is_inviter else "secondLinkedMemberId"
    if family.get(field):
        return family[field]
    pool = os.environ.get("USER_POOL_ID")
    if not pool:
        return None
    subject = str(UUID(other))
    accounts = cognito.list_users(UserPoolId=pool, Filter=f'sub = "{subject}"').get("Users", [])
    if len(accounts) != 1 or not accounts[0].get("Enabled"):
        return None
    attributes = {item["Name"]: item["Value"] for item in accounts[0].get("Attributes", [])}
    email = attributes.get("email", "").strip().casefold()
    if not email or attributes.get("email_verified") != "true":
        return None
    request = {
        "KeyConditionExpression": Key("userId").eq(user),
        "ProjectionExpression": "memberId, email, relationship",
        "ConsistentRead": True,
    }
    matches = []
    while True:
        page = members.query(**request)
        matches.extend(item["memberId"] for item in page["Items"]
                       if item["memberId"] != "PROFILE#SELF"
                       and str(item.get("email", "")).strip().casefold() == email
                       and item.get("relationship") == relationship)
        if len(matches) > 1:
            return None
        if "LastEvaluatedKey" not in page:
            break
        request["ExclusiveStartKey"] = page["LastEvaluatedKey"]
    if len(matches) != 1:
        return None
    try:
        transact(update(family["pk"], f"SET {field} = :member",
                        f"attribute_not_exists({field}) AND firstUser = :first AND secondUser = :second AND attribute_not_exists(supersededBy)",
                        {":member": matches[0], ":first": family["firstUser"], ":second": family["secondUser"]}))
    except ClientError as error:
        if error.response["Error"]["Code"] != "TransactionCanceledException":
            raise
        return (get(family["pk"]) or {}).get(field)
    return matches[0]


def connection_share_fields(family, is_inviter):
    if is_inviter:
        return family.get("firstSharedProfileFields", sorted(SHARE_FIELDS))
    if family.get("recipientSharingCustomized"):
        return family.get("sharedProfileFields", [])
    return sorted(SHARE_FIELDS)


def shared_details(user, fields):
    allowed = sorted(SHARE_FIELDS.intersection(fields))
    if not allowed:
        return {}
    item = profiles.get_item(Key={"userId": user}, ProjectionExpression=", ".join(allowed),
                             ConsistentRead=True).get("Item") or {}
    return {field: item[field] for field in allowed if isinstance(item.get(field), str)}


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


def gmail_request(request, step):
    try:
        with urlopen(request, timeout=8) as response:
            return json.load(response)
    except HTTPError as error:
        with error:
            try:
                details = json.loads(error.read(4096)).get("error")
            except (ValueError, OSError):
                details = None
        if isinstance(details, dict):
            details = details.get("status")
        codes = {"invalid_grant", "invalid_client", "unauthorized_client", "PERMISSION_DENIED",
                 "UNAUTHENTICATED", "RESOURCE_EXHAUSTED", "FAILED_PRECONDITION", "INVALID_ARGUMENT"}
        print("Invitation Gmail failure:", step, error.code,
              details if isinstance(details, str) and details in codes else "unclassified")
        raise


def send_invitation_email(sender, address, content):
    secret = boto3.client("secretsmanager").get_secret_value(SecretId=os.environ["GMAIL_SECRET_NAME"])
    credentials = json.loads(secret["SecretString"])
    token_request = Request("https://oauth2.googleapis.com/token", data=urlencode({
        "client_id": credentials["GOOGLE_CLIENT_ID"],
        "client_secret": credentials["GOOGLE_CLIENT_SECRET"],
        "refresh_token": credentials["GOOGLE_REFRESH_TOKEN"],
        "grant_type": "refresh_token",
    }).encode(), method="POST")
    access_token = gmail_request(token_request, "token refresh")["access_token"]

    message = EmailMessage()
    message["From"], message["To"], message["Subject"] = sender, address, "Your FamilyKit invitation"
    message.set_content(content)
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode("ascii")
    send = Request("https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
                   data=json.dumps({"raw": raw}).encode(), method="POST",
                   headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"})
    if not gmail_request(send, "send").get("id"):
        raise ValueError("Mail provider did not accept the invitation.")


def invitation_email_enabled():
    return bool(os.environ.get("INVITATION_FROM_EMAIL") and os.environ.get("INVITATION_WEB_ORIGIN")
                and os.environ.get("GMAIL_SECRET_NAME") and os.environ.get("USER_POOL_ID"))


def founding_display_counts():
    global family_count_cache
    pool = os.environ.get("USER_POOL_ID")
    if not pool:
        return None, None
    now = time.monotonic()
    if now < family_count_cache[0]:
        return family_count_cache[1]

    current_accounts = set()
    verified_accounts = set()
    for page in cognito.get_paginator("list_users").paginate(UserPoolId=pool):
        for user in page.get("Users", []):
            attrs = {attribute["Name"]: attribute["Value"] for attribute in user.get("Attributes", [])}
            subject = attrs.get("sub")
            if not subject or not user.get("Enabled"):
                continue
            current_accounts.add(subject)
            if user.get("UserStatus") in {"CONFIRMED", "EXTERNAL_PROVIDER"} and attrs.get("email_verified") == "true":
                verified_accounts.add(subject)

    connected = 0
    request = {
        "ProjectionExpression": "pk, firstUser, secondUser, supersededBy",
        "FilterExpression": Attr("pk").begins_with("FAMILY#") & Attr("secondUser").exists()
                            & Attr("supersededBy").not_exists(),
        "ConsistentRead": True,
    }
    while True:
        page = table.scan(**request)
        connected += sum(
            item.get("firstUser") in current_accounts
            and item.get("secondUser") in current_accounts
            and item["firstUser"] != item["secondUser"]
            for item in page["Items"]
        )
        if "LastEvaluatedKey" not in page:
            break
        request["ExclusiveStartKey"] = page["LastEvaluatedKey"]

    counts = max(0, CAP - connected), max(0, CAP * MEMBERS_PER_FAMILY - len(verified_accounts))
    family_count_cache = (now + 60, counts)
    return counts


def lambda_handler(event, _context):
    route = event.get("routeKey")
    if route == "GET /founding":
        control = get(CONTROL) or {}
        mode = control.get("mode", "closed")
        remaining = max(0, CAP - int(control.get("families", 0)))
        display_families = member_spots = None
        if mode == "founding":
            try:
                display_families, member_spots = founding_display_counts()
            except ClientError as error:
                print("Founding Cognito count unavailable:", error.response["Error"]["Code"])
        return reply(200, {"mode": mode, "remainingFamilies": remaining, "displayRemainingFamilies": display_families,
                           "remainingMemberSpots": member_spots,
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
            connection = None
            if other_profile:
                is_inviter = user == family["firstUser"]
                connection = {"name": other_profile.get("yourName") or "Family member",
                              "relationship": family["relationship"] if is_inviter else family["reverseRelationship"]}
                linked = family.get("linkedMemberId" if is_inviter else "secondLinkedMemberId")
                if not linked:
                    try:
                        linked = auto_link_profile(user, other, family, connection["relationship"], is_inviter)
                    except (ClientError, ValueError):
                        print("Automatic profile link unavailable")
                if linked:
                    connection["linkedMemberId"] = linked
                connection.update(shared_details(other, connection_share_fields(family, not is_inviter)))
                try:
                    connection["photoUrl"] = connected_photo(other)
                except ClientError as error:
                    print("Connected profile photo unavailable:", error.response["Error"]["Code"])
            return reply(200, {
                "connection": connection,
                "mySharedProfileFields": connection_share_fields(family, user == family["firstUser"]),
                "invitation": {"relationship": invitation["relationship"],
                               "shared": bool(invitation.get("sharedAt"))}
                if active_invite(invitation, now) and user == family["firstUser"] else None,
                "canInvite": user == family["firstUser"] and not other,
                "emailEnabled": invitation_email_enabled(),
            })

        if route == "POST /founding/enroll":
            existing = get(user_key)
            if existing:
                return reply(200, {"familyId": existing["familyId"]})
            return reply(409, {"message": "Founding enrollment takes place during registration."})

        account = profile(user)
        if not account:
            return reply(403, {"message": "Complete FamilyKit registration first."})
        if route and route.split(" ", 1)[-1].startswith("/dependent-profiles"):
            return dependent_sharing(route, body, user, db=db, table=table, members=members, s3=s3,
                                     photo_bucket=photo_bucket, family_record=family_record, profile=profile,
                                     get=get, transact=transact, reply=reply)
        if route == "POST /family-connection/profile-sharing":
            family = family_record(user)
            if not family or not family.get("secondUser") or user not in (family["firstUser"], family["secondUser"]):
                return reply(409, {"message": "Connect an account before sharing profile details."})
            fields = body.get("fields")
            if not isinstance(fields, list) or len(fields) > len(SHARE_FIELDS) or any(
                not isinstance(field, str) or field not in SHARE_FIELDS for field in fields
            ):
                raise ValueError("Select valid profile fields.")
            unique_fields = sorted(set(fields))
            field = "firstSharedProfileFields" if user == family["firstUser"] else "sharedProfileFields"
            expression = f"SET {field} = :fields"
            values = {":fields": unique_fields, ":first": family["firstUser"], ":second": family["secondUser"]}
            if user == family["secondUser"]:
                expression += ", recipientSharingCustomized = :customized"
                values[":customized"] = True
            transact(update(family["pk"], expression,
                            "firstUser = :first AND secondUser = :second AND attribute_not_exists(supersededBy)",
                            values))
            return reply(200, {"mySharedProfileFields": unique_fields})
        if route == "POST /family-connection/link-profile":
            family = family_record(user)
            if not family or not family.get("secondUser"):
                return reply(409, {"message": "Connect an account before linking a profile."})
            profile_item = managed_profile(user, body.get("memberId"))
            first = family["firstUser"] == user
            field = "linkedMemberId" if first else "secondLinkedMemberId"
            transact(update(family["pk"], f"SET {field} = :member",
                            "firstUser = :first AND secondUser = :second AND "
                            f"(attribute_not_exists({field}) OR {field} = :member)",
                            {":member": profile_item["memberId"], ":first": family["firstUser"],
                             ":second": family["secondUser"]}))
            return reply(200, {"linked": True})
        if route == "POST /invitations":
            family = family_record(user)
            if not family or family["firstUser"] != user or family.get("secondUser"):
                return reply(409, {"message": "Your family does not have an available invitation slot."})
            relationship, reverse = body.get("relationship"), body.get("reverseRelationship")
            if relationship not in RELATIONS or reverse not in RELATIONS:
                raise ValueError("Choose a relationship for both family members.")
            delivery_address = body.get("recipientEmail")
            sender = os.environ.get("INVITATION_FROM_EMAIL")
            origin = os.environ.get("INVITATION_WEB_ORIGIN", "").rstrip("/")
            if delivery_address is not None:
                if not isinstance(delivery_address, str):
                    raise ValueError("Enter a valid recipient email.")
                delivery_address = delivery_address.strip().lower()
                if len(delivery_address) > 254 or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", delivery_address):
                    raise ValueError("Enter a valid recipient email.")
                target = urlsplit(origin)
                if not invitation_email_enabled() or target.scheme != "https" or not target.hostname or target.path or target.query or target.fragment:
                    return reply(503, {"message": "Email invitations are unavailable. You can still create a link."})
                if delivery_address == verified_recipient(claims):
                    raise ValueError("Enter a family member's email address.")
            linked = {}
            if body.get("memberId"):
                if delivery_address is not None:
                    raise ValueError("Share linked profile invitations manually.")
                managed = managed_profile(user, body["memberId"])
                address = body.get("verifiedAccountEmail", "")
                if not isinstance(address, str) or len(address) > 254 or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", address.strip()):
                    raise ValueError("Enter the email the recipient will verify with FamilyKit.")
                linked = {"linkedMemberId": managed["memberId"], "recipientDigest": email_digest(address.strip().lower())}
            elif delivery_address:
                linked["recipientDigest"] = email_digest(delivery_address)
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
                     "expiresAt": now + 7 * 86400, "relationship": relationship, "reverseRelationship": reverse, **linked}),
                *changes,
            )
            if delivery_address:
                try:
                    send_invitation_email(sender, delivery_address, (
                        f"{account.get('yourName') or 'A family member'} invited you to connect on FamilyKit. "
                        f"They will appear as your {reverse}.\n\n"
                        f"{origin}/?invite=1#token={token}\n\n"
                        "Sign in or sign up with this email address, then accept. The link expires in 7 days."
                    ))
                except (ClientError, URLError, TimeoutError, KeyError, ValueError) as error:
                    print("Invitation email failed:", type(error).__name__)
                    return reply(502, {"message": "Email delivery could not start. Please try again."})
                table.update_item(Key={"pk": key}, UpdateExpression="SET sharedAt = :now",
                                  ConditionExpression="attribute_exists(pk)",
                                  ExpressionAttributeValues={":now": int(time.time())})
                return reply(201, {"sent": True})
            return reply(201, {"token": token})

        if route in {"POST /invitations/shared", "POST /invitations/cancel", "POST /invitations/decline", "POST /invitations/accept", "POST /invitations/review"}:
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
            linked_id = invitation.get("linkedMemberId")
            if route.endswith("/review"):
                if not linked_id:
                    return reply(200, {"reviewRequired": False})
                managed = managed_profile(invitation["inviter"], linked_id)
                hints = {}
                current = shared_details(user, REVIEW_FIELDS)
                current["yourName"] = account.get("yourName")
                for field in REVIEW_FIELDS:
                    value = current.get(field) or managed.get("name" if field == "yourName" else field)
                    if value is not None:
                        hints[field] = str(value)
                return reply(200, {"reviewRequired": True, "profile": hints})
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
                family_values = {":user": user, ":relation": invitation["relationship"],
                                 ":reverse": invitation["reverseRelationship"], ":invite": key}
                family_expression = "SET secondUser = :user, relationship = :relation, reverseRelationship = :reverse"
                if linked_id:
                    if body.get("reviewed") is not True:
                        raise ValueError("Review the profile details before accepting.")
                    managed_profile(invitation["inviter"], linked_id)
                    reviewed = review_values(body)
                    family_values.update({":member": linked_id, ":fields": [field for field, value in reviewed.items() if value]})
                    family_expression += ", linkedMemberId = :member, sharedProfileFields = :fields"
                    if reviewed:
                        membership_changes.append(profile_update(user, reviewed))
                transact(
                    change,
                    update(family_key, family_expression,
                           "inviteKey = :invite AND attribute_not_exists(secondUser) AND attribute_not_exists(supersededBy)",
                           family_values),
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

