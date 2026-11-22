
import json
import os
import uuid
import base64
import logging
from datetime import datetime, date, timezone
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

TABLE_NAME = os.environ["DIARY_TABLE_NAME"]
table = boto3.resource("dynamodb").Table(TABLE_NAME)

MAX_TITLE_LENGTH = 200
MAX_CONTENT_LENGTH = 50000

HEADERS = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
}


def json_default(value):
    if isinstance(value, Decimal):
        return float(value)
    raise TypeError("Not JSON serializable")


def response(status, data):
    return {
        "statusCode": status,
        "headers": HEADERS,
        "body": json.dumps(
            data,
            default=json_default,
            ensure_ascii=False
        )
    }


def get_user_id(event):
    """
    Identity must come from API Gateway's
    verified Cognito/JWT authorizer.

    Never accept userId from the request body.
    """

    context = event.get("requestContext") or {}
    authorizer = context.get("authorizer") or {}

    # HTTP API JWT authorizer
    jwt = authorizer.get("jwt") or {}
    claims = jwt.get("claims") or {}

    # REST API Cognito authorizer
    if not claims:
        claims = authorizer.get("claims") or {}

    return claims.get("sub")


def get_method_and_path(event):
    context = event.get("requestContext") or {}
    http = context.get("http") or {}

    method = (
        http.get("method")
        or event.get("httpMethod")
        or ""
    ).upper()

    path = (
        event.get("rawPath")
        or event.get("path")
        or http.get("path")
        or ""
    )

    path = path.rstrip("/") or "/"

    return method, path


def parse_body(event):
    raw = event.get("body")

    if event.get("isBase64Encoded") and raw:
        raw = base64.b64decode(raw).decode("utf-8")

    if raw is None or raw == "":
        return {}

    if isinstance(raw, dict):
        return raw

    parsed = json.loads(raw)

    if not isinstance(parsed, dict):
        raise ValueError("Request body must be an object")

    return parsed


def validate_entry(data, existing=None):
    if not isinstance(data, dict):
        raise ValueError("Invalid entry")

    existing = existing or {}

    entry_date = data.get(
        "entryDate",
        existing.get("entryDate")
    )

    title = data.get(
        "title",
        existing.get("title", "")
    )

    content = data.get(
        "content",
        existing.get("content", "")
    )

    mood = data.get(
        "mood",
        existing.get("mood", "😊")
    )

    if not isinstance(entry_date, str):
        raise ValueError("Entry date is required")

    try:
        parsed_date = date.fromisoformat(entry_date)

        if parsed_date.isoformat() != entry_date:
            raise ValueError()

    except (ValueError, TypeError):
        raise ValueError(
            "entryDate must be YYYY-MM-DD"
        )

    if not isinstance(title, str):
        raise ValueError("Title must be text")

    if len(title) > MAX_TITLE_LENGTH:
        raise ValueError("Title is too long")

    if not isinstance(content, str):
        raise ValueError("Content must be text")

    if not content.strip():
        raise ValueError("Diary content is required")

    if len(content) > MAX_CONTENT_LENGTH:
        raise ValueError("Diary content is too long")

    if not isinstance(mood, str):
        raise ValueError("Mood must be text")

    if len(mood) > 16:
        raise ValueError("Mood is too long")

    return {
        "entryDate": entry_date,
        "title": title.strip(),
        "content": content,
        "mood": mood,
    }


def utc_now():
    return datetime.now(
        timezone.utc
    ).isoformat(timespec="seconds")


def create_entry(user_id, data):
    validated = validate_entry(data)

    now = utc_now()

    item = {
        "userId": user_id,
        "entryId": str(uuid.uuid4()),
        **validated,
        "createdAt": now,
        "updatedAt": now,
    }

    table.put_item(
        Item=item,
        ConditionExpression=(
            "attribute_not_exists(userId) "
            "AND attribute_not_exists(entryId)"
        )
    )

    return response(201, {
        "success": True,
        "message": "Diary entry saved",
        "entry": item,
    })


def list_entries(user_id):
    """
    Retrieve all diary entries belonging
    to the authenticated user.
    """

    entries = []

    query_args = {
        "KeyConditionExpression": (
            boto3.dynamodb.conditions.Key("userId")
            .eq(user_id)
        )
    }

    while True:
        result = table.query(**query_args)

        entries.extend(
            result.get("Items", [])
        )

        last_key = result.get(
            "LastEvaluatedKey"
        )

        if not last_key:
            break

        query_args["ExclusiveStartKey"] = last_key

    entries.sort(
        key=lambda item: (
            item.get("entryDate", ""),
            item.get("createdAt", ""),
            item.get("entryId", "")
        ),
        reverse=True
    )

    return response(200, {
        "success": True,
        "count": len(entries),
        "entries": entries,
    })


def get_entry(user_id, entry_id):
    result = table.get_item(
        Key={
            "userId": user_id,
            "entryId": entry_id,
        },
        ConsistentRead=True
    )

    entry = result.get("Item")

    if not entry:
        return response(404, {
            "success": False,
            "message": "Diary entry not found",
        })

    return response(200, {
        "success": True,
        "entry": entry,
    })


def update_entry(user_id, entry_id, data):
    result = table.get_item(
        Key={
            "userId": user_id,
            "entryId": entry_id,
        },
        ConsistentRead=True
    )

    existing = result.get("Item")

    if not existing:
        return response(404, {
            "success": False,
            "message": "Diary entry not found",
        })

    validated = validate_entry(
        data,
        existing=existing
    )

    now = utc_now()

    try:
        updated = table.update_item(
            Key={
                "userId": user_id,
                "entryId": entry_id,
            },
            UpdateExpression=(
                "SET entryDate = :entryDate, "
                "title = :title, "
                "#body = :content, "
                "mood = :mood, "
                "updatedAt = :updatedAt"
            ),
            ConditionExpression=(
                "attribute_exists(userId) "
                "AND attribute_exists(entryId)"
            ),
            ExpressionAttributeNames={
                "#body": "content"
            },
            ExpressionAttributeValues={
                ":entryDate": validated["entryDate"],
                ":title": validated["title"],
                ":content": validated["content"],
                ":mood": validated["mood"],
                ":updatedAt": now,
            },
            ReturnValues="ALL_NEW"
        )

    except ClientError as error:
        if error.response["Error"]["Code"] == (
            "ConditionalCheckFailedException"
        ):
            return response(404, {
                "success": False,
                "message": "Diary entry not found",
            })

        raise

    return response(200, {
        "success": True,
        "message": "Diary entry updated",
        "entry": updated["Attributes"],
    })


def delete_entry(user_id, entry_id):
    """
    Delete only when the authenticated
    user explicitly requests DELETE.
    """

    try:
        table.delete_item(
            Key={
                "userId": user_id,
                "entryId": entry_id,
            },
            ConditionExpression=(
                "attribute_exists(userId) "
                "AND attribute_exists(entryId)"
            )
        )

    except ClientError as error:
        if error.response["Error"]["Code"] == (
            "ConditionalCheckFailedException"
        ):
            return response(404, {
                "success": False,
                "message": "Diary entry not found",
            })

        raise

    return response(200, {
        "success": True,
        "message": "Diary entry deleted",
    })


def lambda_handler(event, context):
    try:
        # Reject requests without verified identity.
        user_id = get_user_id(event)

        if not user_id:
            return response(401, {
                "success": False,
                "message": "Unauthorized",
            })

        method, path = get_method_and_path(event)

        # Handle both /diary and /diary/{entryId}.
        # Also supports API Gateway stage prefixes.
        parts = [
            part for part in path.split("/")
            if part
        ]

        if "diary" not in parts:
            return response(404, {
                "success": False,
                "message": "Unknown endpoint",
            })

        diary_index = parts.index("diary")
        remaining = parts[diary_index + 1:]

        if len(remaining) > 1:
            return response(404, {
                "success": False,
                "message": "Unknown endpoint",
            })

        entry_id = (
            remaining[0] if remaining else None
        )

        if method == "POST" and not entry_id:
            data = parse_body(event)
            return create_entry(user_id, data)

        if method == "GET" and not entry_id:
            return list_entries(user_id)

        if method == "GET" and entry_id:
            return get_entry(user_id, entry_id)

        if method in ("PUT", "PATCH") and entry_id:
            data = parse_body(event)
            return update_entry(
                user_id,
                entry_id,
                data
            )

        if method == "DELETE" and entry_id:
            return delete_entry(
                user_id,
                entry_id
            )

        return response(405, {
            "success": False,
            "message": "Method not allowed",
        })

    except (ValueError, json.JSONDecodeError) as error:
        return response(400, {
            "success": False,
            "message": str(error),
        })

    except ClientError:
        logger.exception("DynamoDB operation failed")

        return response(500, {
            "success": False,
            "message": "Database operation failed",
        })

    except Exception:
        logger.exception("Unexpected diary error")

        return response(500, {
            "success": False,
            "message": "Internal server error",
        })
