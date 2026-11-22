
import json
import os
import re
import uuid
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key

TABLE_NAME = os.environ.get(
    "TABLE_NAME",
    "FamilyKitFamilyMembers"
)

table = boto3.resource("dynamodb").Table(TABLE_NAME)

SELF_MEMBER_ID = "PROFILE#SELF"

FIELDS = {
    "name",
    "relationship",
    "mobile",
    "email",
    "bloodGroup",
    "dateOfBirth",
    "height",
    "weight",
    "address",
    "photoKey"
}

REQUIRED = {
    "name",
    "relationship",
    "mobile"
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

            result[field] = value

    if create and any(
        not result.get(field)
        for field in REQUIRED
    ):
        raise ValueError(
            "name, relationship and mobile are required"
        )

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

    return result


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

            values = clean(
                parse_body(event),
                create=True
            )

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

            table.put_item(
                Item=item,
                ConditionExpression=(
                    "attribute_not_exists(userId) "
                    "AND attribute_not_exists(memberId)"
                )
            )

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
                )
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
        # PUT - UPDATE FAMILY MEMBER
        # ----------------------------------------
        if method == "PUT" and member_id:

            if member_id == SELF_MEMBER_ID:
                return respond(404, {
                    "message": "Family member not found"
                })

            values = clean(
                parse_body(event),
                create=False
            )

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

            result = table.update_item(
                Key={
                    "userId": user_id,
                    "memberId": member_id
                },
                ConditionExpression=(
                    "attribute_exists(userId) "
                    "AND attribute_exists(memberId)"
                ),
                UpdateExpression=(
                    "SET " + ", ".join(updates)
                ),
                ExpressionAttributeNames=names,
                ExpressionAttributeValues=attrs,
                ReturnValues="ALL_NEW"
            )

            return respond(200, {
                "member": result["Attributes"]
            })

        return respond(404, {
            "message": "Route not found"
        })

    except ValueError as exc:
        return respond(400, {
            "message": str(exc)
        })

    except ClientError as exc:
        if (
            exc.response.get("Error", {}).get("Code")
            == "ConditionalCheckFailedException"
        ):
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
