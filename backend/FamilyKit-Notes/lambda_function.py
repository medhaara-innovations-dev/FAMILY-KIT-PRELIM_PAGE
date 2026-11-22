
import json
import os
import uuid
import boto3

from datetime import datetime, timezone, timedelta
from decimal import Decimal
from botocore.exceptions import ClientError

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["NOTES_TABLE_NAME"])

IST = timezone(timedelta(hours=5, minutes=30))


def response(status, data):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps(data, default=str)
    }


def get_user_id(event):
    return (
        event.get("requestContext", {})
        .get("authorizer", {})
        .get("jwt", {})
        .get("claims", {})
        .get("sub")
    )


def parse_body(event):
    try:
        body = event.get("body") or "{}"
        if isinstance(body, str):
            body = json.loads(body)
        return body if isinstance(body, dict) else None
    except (ValueError, TypeError):
        return None


def now_ist():
    return datetime.now(IST).isoformat()


def created_date_ist():
    return datetime.now(IST).strftime("%d-%m-%Y")


def clean_note(item):
    return json.loads(json.dumps(item, default=str))


def lambda_handler(event, context):

    user_id = get_user_id(event)

    if not user_id:
        return response(401, {
            "success": False,
            "message": "Unauthorized"
        })

    method = event.get("requestContext", {}).get(
        "http", {}
    ).get("method", "")

    path_params = event.get("pathParameters") or {}
    note_id = path_params.get("noteId")

    try:

        # CREATE NOTE
        if method == "POST" and not note_id:

            body = parse_body(event)

            if body is None:
                return response(400, {
                    "success": False,
                    "message": "Invalid JSON body"
                })

            content = body.get("content", "")
            title = body.get("title", "Untitled Note")
            reminder = body.get("reminder", False)

            if not isinstance(content, str) or not content.strip():
                return response(400, {
                    "success": False,
                    "message": "Note content is required"
                })

            if not isinstance(title, str):
                return response(400, {
                    "success": False,
                    "message": "Invalid title"
                })

            if not isinstance(reminder, bool):
                return response(400, {
                    "success": False,
                    "message": "Invalid reminder value"
                })

            timestamp = now_ist()

            item = {
                "userId": user_id,
                "noteId": str(uuid.uuid4()),
                "title": title.strip() or "Untitled Note",
                "content": content.strip(),
                "reminder": reminder,
                "createdAt": timestamp,
                "updatedAt": timestamp,
                "createdDate": created_date_ist()
            }

            table.put_item(
                Item=item,
                ConditionExpression=(
                    "attribute_not_exists(userId) "
                    "AND attribute_not_exists(noteId)"
                )
            )

            return response(201, {
                "success": True,
                "message": "Note saved successfully",
                "note": clean_note(item)
            })

        # GET ALL NOTES
        if method == "GET" and not note_id:

            from boto3.dynamodb.conditions import Key

            items = []
            query_args = {
                "KeyConditionExpression": Key("userId").eq(user_id)
            }

            while True:
                result = table.query(**query_args)
                items.extend(result.get("Items", []))

                if "LastEvaluatedKey" not in result:
                    break

                query_args["ExclusiveStartKey"] = (
                    result["LastEvaluatedKey"]
                )

            items.sort(
                key=lambda item: item.get("createdAt", ""),
                reverse=True
            )

            return response(200, {
                "success": True,
                "count": len(items),
                "notes": clean_note(items)
            })

        # GET SINGLE NOTE
        if method == "GET" and note_id:

            result = table.get_item(
                Key={
                    "userId": user_id,
                    "noteId": note_id
                }
            )

            item = result.get("Item")

            if not item:
                return response(404, {
                    "success": False,
                    "message": "Note not found"
                })

            return response(200, {
                "success": True,
                "note": clean_note(item)
            })

        # UPDATE NOTE
        if method == "PUT" and note_id:

            body = parse_body(event)

            if body is None:
                return response(400, {
                    "success": False,
                    "message": "Invalid JSON body"
                })

            updates = []
            values = {}
            names = {}

            if "title" in body:
                title = body["title"]

                if not isinstance(title, str):
                    return response(400, {
                        "success": False,
                        "message": "Invalid title"
                    })

                updates.append("#title = :title")
                names["#title"] = "title"
                values[":title"] = (
                    title.strip() or "Untitled Note"
                )

            if "content" in body:
                content = body["content"]

                if (
                    not isinstance(content, str)
                    or not content.strip()
                ):
                    return response(400, {
                        "success": False,
                        "message": "Note content is required"
                    })

                updates.append("#content = :content")
                names["#content"] = "content"
                values[":content"] = content.strip()

            if "reminder" in body:
                if not isinstance(body["reminder"], bool):
                    return response(400, {
                        "success": False,
                        "message": "Invalid reminder value"
                    })

                updates.append("#reminder = :reminder")
                names["#reminder"] = "reminder"
                values[":reminder"] = body["reminder"]

            if not updates:
                return response(400, {
                    "success": False,
                    "message": "No fields to update"
                })

            updates.append("#updatedAt = :updatedAt")
            names["#updatedAt"] = "updatedAt"
            values[":updatedAt"] = now_ist()

            result = table.update_item(
                Key={
                    "userId": user_id,
                    "noteId": note_id
                },
                UpdateExpression="SET " + ", ".join(updates),
                ConditionExpression=(
                    "attribute_exists(userId) "
                    "AND attribute_exists(noteId)"
                ),
                ExpressionAttributeNames=names,
                ExpressionAttributeValues=values,
                ReturnValues="ALL_NEW"
            )

            return response(200, {
                "success": True,
                "message": "Note updated successfully",
                "note": clean_note(result["Attributes"])
            })

        # DELETE NOTE
        if method == "DELETE" and note_id:

            table.delete_item(
                Key={
                    "userId": user_id,
                    "noteId": note_id
                },
                ConditionExpression=(
                    "attribute_exists(userId) "
                    "AND attribute_exists(noteId)"
                )
            )

            return response(200, {
                "success": True,
                "message": "Note deleted successfully"
            })

        return response(404, {
            "success": False,
            "message": "Route not found"
        })

    except ClientError as error:

        code = error.response["Error"]["Code"]

        if code == "ConditionalCheckFailedException":
            return response(404, {
                "success": False,
                "message": "Note not found or already exists"
            })

        print("DynamoDB error:", code)

        return response(500, {
            "success": False,
            "message": "Database operation failed"
        })

    except Exception as error:

        print("Unexpected error:", str(error))

        return response(500, {
            "success": False,
            "message": "Internal server error"
        })
