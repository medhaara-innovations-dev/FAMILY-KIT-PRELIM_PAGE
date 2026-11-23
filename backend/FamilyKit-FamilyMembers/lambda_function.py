
import json
import os
import re
import uuid
import unicodedata
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key
from boto3.dynamodb.types import TypeSerializer

TABLE_NAME = os.environ.get(
    "TABLE_NAME",
    "FamilyKitFamilyMembers"
)

table = boto3.resource("dynamodb").Table(TABLE_NAME)
transaction_client = boto3.client("dynamodb")
serializer = TypeSerializer()

SELF_MEMBER_ID = "PROFILE#SELF"
UNIQUE_RELATIONSHIPS = {"mother", "father"}
PARENT_REVISION = "parentRelationshipsRevision"
IDENTITY_FIELDS = ("name", "relationship", "dateOfBirth", "mobile")

FIELDS = {
    "name",
    "relationship",
    "relationshipDetail",
    "mobile",
    "email",
    "bloodGroup",
    "dateOfBirth",
    "height",
    "weight",
    "address",
    "instagramUrl",
    "facebookUrl",
    "linkedinUrl",
    "photoKey"
}

SOCIAL_PROFILE_PATTERNS = {
    "instagramUrl": r"https://www\.instagram\.com/[A-Za-z0-9_.-]+",
    "facebookUrl": r"https://www\.facebook\.com/(?:profile\.php\?id=[0-9]+|(?![A-Za-z0-9_.-]*\.[pP][hH][pP]$)(?![A-Za-z0-9_.-]*\.\.)[A-Za-z0-9_.-]+)",
    "linkedinUrl": r"https://www\.linkedin\.com/in/[A-Za-z0-9_-]+",
}

REQUIRED = {
    "name",
    "relationship",
    "dateOfBirth",
}


def respond(status, data):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
        },
        "body": json.dumps(data, default=str)
    }


def get_user_id(event):
    auth = (
        (event.get("requestContext") or {})
        .get("authorizer") or {}
    )

    jwt_claims = (
        (auth.get("jwt") or {})
        .get("claims") or {}
    )

    claims = jwt_claims or auth.get("claims") or {}

    return claims.get("sub")


def parse_body(event):
    if event.get("isBase64Encoded"):
        raise ValueError(
            "Base64 request bodies are not supported"
        )

    raw = event.get("body")

    try:
        data = (
            json.loads(raw)
            if isinstance(raw, str)
            else (raw or {})
        )
    except (ValueError, TypeError):
        raise ValueError("Invalid JSON request body")

    if not isinstance(data, dict):
        raise ValueError(
            "Request body must be an object"
        )

    return data


def clean(data, *, create):
    result = {}

    for field in FIELDS:
        if field in data:
            value = data[field]

            if not isinstance(value, str):
                raise ValueError(
                    f"{field} must be a string"
                )

            value = value.strip()

            if len(value) > (
                1000 if field == "address" else 256
            ):
                raise ValueError(
                    f"{field} is too long"
                )

            pattern = SOCIAL_PROFILE_PATTERNS.get(field)
            if pattern and value and not re.fullmatch(pattern, value):
                raise ValueError(f"Invalid {field} profile link.")

            result[field] = value

    if create and any(
        not result.get(field)
        for field in REQUIRED
    ):
        raise ValueError(
            "Full name, relationship and date of birth are required."
        )

    if result.get("relationship", "").casefold() == "other":
        result["relationship"] = "Other"
        if not result.get("relationshipDetail"):
            raise ValueError("Specify the relationship.")
        if len(result["relationshipDetail"]) > 80:
            raise ValueError("Relationship detail must be 80 characters or fewer.")
    elif "relationshipDetail" in result:
        raise ValueError("Relationship detail is only supported with Other.")
    elif not create and "relationship" in result:
        result["relationshipDetail"] = ""

    if not create and not result:
        raise ValueError(
            "No supported fields to update"
        )

    if (
        "mobile" in result
        and result["mobile"]
        and not re.fullmatch(
            r"\+?[0-9]{10,15}",
            result["mobile"]
        )
    ):
        raise ValueError("Invalid mobile number")

    if (
        "email" in result
        and result["email"]
        and not re.fullmatch(
            r"[^\s@]+@[^\s@]+\.[^\s@]+",
            result["email"]
        )
    ):
        raise ValueError("Invalid email address")

    if result.get("dateOfBirth"):
        value = result["dateOfBirth"]
        try:
            birth_date = datetime.strptime(value, "%Y-%m-%d").date()
        except ValueError:
            raise ValueError("Enter a valid date of birth.") from None
        if birth_date.isoformat() != value or birth_date > datetime.now(timezone.utc).date():
            raise ValueError("Enter a valid date of birth.")

    if create:
        validate_mobile_requirement(result)

    return result


def is_under_18(value):
    today = datetime.now(timezone.utc).date()
    try:
        birth = datetime.strptime(value, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return False
    before_birthday = (today.month, today.day) < (birth.month, birth.day)
    return birth.isoformat() == value and birth <= today and today.year - birth.year - before_birthday < 18


def can_share_mobile(relationship, birth):
    return relationship in {"son", "daughter"} and is_under_18(birth)


def validate_mobile_requirement(profile):
    relationship = " ".join(str(profile.get("relationship") or "").split()).casefold()
    if not profile.get("mobile") and not can_share_mobile(relationship, profile.get("dateOfBirth")):
        raise ValueError("Mobile number is required unless the member is a Son or Daughter under 18.")


class MemberConflict(Exception):
    def __init__(self, code, message, matches=()):
        super().__init__(message)
        self.code = code
        self.matches = list(matches)


def member_identity(profile):
    name = " ".join(unicodedata.normalize("NFKC", str(profile.get("name") or "")).split()).casefold()
    relationship = " ".join(str(profile.get("relationship") or "").split()).casefold()
    birth = profile.get("dateOfBirth") or ""
    try:
        birth = birth if datetime.strptime(birth, "%Y-%m-%d").date().isoformat() == birth else ""
    except (TypeError, ValueError):
        birth = ""
    phone = unicodedata.normalize("NFKC", str(profile.get("mobile") or "")).strip()
    digits = re.sub(r"[^0-9]", "", phone)
    if not phone.startswith("+") and digits.startswith("00"):
        digits = digits[2:]
    elif not phone.startswith("+") and len(digits) == 10:
        digits = "91" + digits
    return name, relationship, birth, digits


def check_duplicate_members(profile, members, acknowledgement, check_parent):
    name, relationship, birth, phone = member_identity(profile)
    can_share_phone = can_share_mobile(relationship, birth)
    warnings = []
    for member in members:
        other_name, other_relationship, other_birth, other_phone = member_identity(member)
        match = {"memberId": member["memberId"], "name": member.get("name") or "Family member"}
        if check_parent and relationship in UNIQUE_RELATIONSHIPS and relationship == other_relationship:
            raise MemberConflict("PARENT_RELATIONSHIP_TAKEN", f"A {relationship.title()} is already in your family.", [match])
        same_name = bool(name and name == other_name)
        same_birth = bool(birth and birth == other_birth)
        same_phone = bool(phone and phone == other_phone)
        if same_phone and not can_share_phone:
            raise MemberConflict("DUPLICATE_MEMBER", "This mobile number is already used by a family member.", [match])
        if same_name and (
            (same_phone and (same_birth or not birth or not other_birth))
            or (same_birth and relationship == other_relationship and not phone and not other_phone)
        ):
            raise MemberConflict("DUPLICATE_MEMBER", "This person already has a profile in your family.", [match])
        if same_name and same_birth:
            warnings.append(match)
    if warnings and {match["memberId"] for match in warnings} != acknowledgement:
        raise MemberConflict("POSSIBLE_DUPLICATE", "Similar profiles were found in your family.", warnings)


def acknowledged_matches(body):
    ids = body.get("acknowledgedDuplicateMemberIds", [])
    if not isinstance(ids, list) or any(not isinstance(value, str) or not value for value in ids):
        raise ValueError("Invalid duplicate confirmation.")
    return set(ids)


def dynamodb_values(values):
    return {key: serializer.serialize(value) for key, value in values.items()}


def write_member_identity(user_id, member_id, profile, write, acknowledgement, *, check_parent):
    """Check matches within the owner partition and serialize identity writes."""
    guard_key = {"userId": user_id, "memberId": SELF_MEMBER_ID}
    guard = table.get_item(Key=guard_key, ConsistentRead=True).get("Item", {})
    revision = guard.get(PARENT_REVISION)
    query = {
        "KeyConditionExpression": Key("userId").eq(user_id),
        "ConsistentRead": True,
        "ProjectionExpression": "memberId, #name, #relationship, dateOfBirth, mobile",
        "ExpressionAttributeNames": {"#name": "name", "#relationship": "relationship"},
    }
    members = []
    while True:
        page = table.query(**query)
        members.extend(
            item
            for item in page.get("Items", [])
            if item.get("memberId") not in (member_id, SELF_MEMBER_ID)
        )
        if "LastEvaluatedKey" not in page:
            break
        query["ExclusiveStartKey"] = page["LastEvaluatedKey"]

    check_duplicate_members(profile, members, acknowledgement, check_parent)
    values = {":next": str(uuid.uuid4())}
    condition = "attribute_not_exists(#revision)"
    if revision is not None:
        condition = "#revision = :previous"
        values[":previous"] = revision
    try:
        transaction_client.transact_write_items(TransactItems=[
            {"Update": {
                "TableName": TABLE_NAME,
                "Key": dynamodb_values(guard_key),
                "UpdateExpression": "SET #revision = :next",
                "ConditionExpression": condition,
                "ExpressionAttributeNames": {"#revision": PARENT_REVISION},
                "ExpressionAttributeValues": dynamodb_values(values),
            }},
            write,
        ])
    except ClientError as exc:
        if exc.response.get("Error", {}).get("Code") in ("TransactionCanceledException", "TransactionConflictException"):
            raise MemberConflict("FAMILY_CHANGED", "Your family changed while saving. Please try again.") from None
        raise


def lambda_handler(event, context):
    user_id = get_user_id(event)

    if not user_id:
        return respond(401, {
            "message": (
                "Unauthorized: validated Cognito "
                "identity required"
            )
        })

    method = (
        ((event.get("requestContext") or {})
         .get("http") or {})
        .get("method")
        or event.get("httpMethod", "")
    ).upper()

    path_params = event.get("pathParameters") or {}
    member_id = path_params.get("memberId")

    try:

        # ----------------------------------------
        # POST - ADD FAMILY MEMBER
        # ----------------------------------------
        if method == "POST" and not member_id:

            body = parse_body(event)
            values = clean(body, create=True)

            now = datetime.now(
                timezone.utc
            ).isoformat()

            item = {
                "userId": user_id,
                "memberId": str(uuid.uuid4()),
                "createdAt": now,
                "updatedAt": now,
                **values
            }

            condition = "attribute_not_exists(userId) AND attribute_not_exists(memberId)"
            write_member_identity(user_id, item["memberId"], item, {
                "Put": {
                    "TableName": TABLE_NAME,
                    "Item": dynamodb_values(item),
                    "ConditionExpression": condition,
                },
            }, acknowledged_matches(body), check_parent=True)

            return respond(201, {
                "member": item
            })

        # ----------------------------------------
        # GET - ALL FAMILY MEMBERS
        # ----------------------------------------
        if method == "GET" and not member_id:

            items = []

            query_args = {
                "KeyConditionExpression": (
                    Key("userId").eq(user_id)
                ),
                "ConsistentRead": True,
            }

            while True:
                page = table.query(**query_args)

                items.extend(
                    page.get("Items", [])
                )

                if "LastEvaluatedKey" not in page:
                    break

                query_args["ExclusiveStartKey"] = (
                    page["LastEvaluatedKey"]
                )

            # IMPORTANT FIX:
            # Exclude the registered user's
            # profile-picture metadata record.
            # Do not delete it from DynamoDB.

            items = [
                item
                for item in items
                if item.get("memberId") != SELF_MEMBER_ID
            ]

            items.sort(
                key=lambda item: item.get(
                    "createdAt", ""
                )
            )

            return respond(200, {
                "members": items
            })

        # ----------------------------------------
        # GET - SINGLE FAMILY MEMBER
        # ----------------------------------------
        if method == "GET" and member_id:

            if member_id == SELF_MEMBER_ID:
                return respond(404, {
                    "message": "Family member not found"
                })

            item = table.get_item(
                Key={
                    "userId": user_id,
                    "memberId": member_id
                }
            ).get("Item")

            if item:
                return respond(200, {
                    "member": item
                })

            return respond(404, {
                "message": "Member not found"
            })

        # ----------------------------------------
        # DELETE - REMOVE FAMILY MEMBER
        # ----------------------------------------
        if method == "DELETE" and member_id:
            if member_id == SELF_MEMBER_ID:
                return respond(404, {"message": "Family member not found"})

            table.delete_item(
                Key={"userId": user_id, "memberId": member_id},
                ConditionExpression="attribute_exists(userId) AND attribute_exists(memberId)",
            )
            return respond(200, {"deleted": True})

        # ----------------------------------------
        # PUT - UPDATE FAMILY MEMBER
        # ----------------------------------------
        if method == "PUT" and member_id:

            if member_id == SELF_MEMBER_ID:
                return respond(404, {
                    "message": "Family member not found"
                })

            body = parse_body(event)
            values = clean(body, create=False)

            names = {
                "#updatedAt": "updatedAt"
            }

            attrs = {
                ":updatedAt": datetime.now(
                    timezone.utc
                ).isoformat()
            }

            updates = [
                "#updatedAt = :updatedAt"
            ]

            for index, (field, value) in enumerate(
                values.items()
            ):
                names[f"#f{index}"] = field
                attrs[f":v{index}"] = value

                updates.append(
                    f"#f{index} = :v{index}"
                )

            key = {"userId": user_id, "memberId": member_id}
            condition = "attribute_exists(userId) AND attribute_exists(memberId)"
            expression = "SET " + ", ".join(updates)
            if any(field in values for field in IDENTITY_FIELDS):
                current = table.get_item(Key=key, ConsistentRead=True).get("Item")
                if not current:
                    return respond(404, {"message": "Family member not found"})
                profile = {**current, **values}
                if any(field in values for field in ("mobile", "dateOfBirth", "relationship")):
                    validate_mobile_requirement(profile)

                # Keep the identity snapshot used for validation current through the write.
                for field in IDENTITY_FIELDS:
                    alias = f"#current{field}"
                    names[alias] = field
                    if field in current:
                        placeholder = f":current{field}"
                        attrs[placeholder] = current[field]
                        condition += f" AND {alias} = {placeholder}"
                    else:
                        condition += f" AND attribute_not_exists({alias})"

                old_identity = member_identity(current)
                new_identity = member_identity(profile)
                if old_identity != new_identity:
                    write_member_identity(user_id, member_id, profile, {
                        "Update": {
                            "TableName": TABLE_NAME,
                            "Key": dynamodb_values(key),
                            "ConditionExpression": condition,
                            "UpdateExpression": expression,
                            "ExpressionAttributeNames": names,
                            "ExpressionAttributeValues": dynamodb_values(attrs),
                        },
                    }, acknowledged_matches(body), check_parent=old_identity[1] != new_identity[1])
                    updated = table.get_item(Key=key, ConsistentRead=True).get("Item")
                    if not updated:
                        return respond(404, {"message": "Family member not found"})
                    return respond(200, {"member": updated})

            result = table.update_item(
                Key=key, ConditionExpression=condition, UpdateExpression=expression,
                ExpressionAttributeNames=names, ExpressionAttributeValues=attrs,
                ReturnValues="ALL_NEW",
            )

            return respond(200, {
                "member": result["Attributes"]
            })

        return respond(404, {
            "message": "Route not found"
        })

    except MemberConflict as exc:
        return respond(409, {"code": exc.code, "message": str(exc), "matches": exc.matches})

    except ValueError as exc:
        return respond(400, {
            "message": str(exc)
        })

    except ClientError as exc:
        if (
            exc.response.get("Error", {}).get("Code")
            == "ConditionalCheckFailedException"
        ):
            if method == "DELETE":
                return respond(404, {"message": "Family member not found"})
            return respond(404, {
                "message": (
                    "Member not found or already exists"
                )
            })

        print(
            "DynamoDB operation failed:",
            exc.response.get(
                "Error", {}
            ).get("Code")
        )

        return respond(500, {
            "message": (
                "Unable to process family member request"
            )
        })

    except Exception as exc:
        print(
            "Unexpected error:",
            type(exc).__name__
        )

        return respond(500, {
            "message": "Internal server error"
        })


