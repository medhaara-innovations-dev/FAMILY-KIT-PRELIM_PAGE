import json
import logging
import os
import uuid
from datetime import date, datetime, time, timezone

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

table = boto3.resource("dynamodb").Table(os.environ["EVENTS_TABLE_NAME"])
logger = logging.getLogger(__name__)
CATEGORIES = {"Personal", "Work", "Health", "Birthday", "Anniversary", "Festival", "Family", "Insurance"}


def respond(status, body):
    return {"statusCode": status, "headers": {"Content-Type": "application/json"}, "body": json.dumps(body)}


def text(body, field, limit, default=""):
    value = body.get(field, default)
    if not isinstance(value, str) or len(value.strip()) > limit:
        raise ValueError(f"Invalid {field}.")
    return value.strip()


def iso_date(value):
    parsed = date.fromisoformat(value)
    if parsed.isoformat() != value:
        raise ValueError("Use a valid date.")
    return parsed


def clock(value):
    if len(value) != 5 or time.fromisoformat(value).strftime("%H:%M") != value:
        raise ValueError("Use a valid time.")
    return value


def clean(body):
    if not isinstance(body, dict):
        raise ValueError("Invalid event.")
    title = text(body, "title", 120)
    start = text(body, "startDate", 10)
    end = text(body, "endDate", 10, start) or start
    iso_date(start)
    iso_date(end)
    all_day = body.get("allDay", False)
    if type(all_day) is not bool:
        raise ValueError("Invalid all-day setting.")
    start_time = "" if all_day else clock(text(body, "startTime", 5, "09:00"))
    end_time = "" if all_day else clock(text(body, "endTime", 5, start_time))
    if (end, end_time) < (start, start_time):
        raise ValueError("End must be on or after the start.")
    reminder = text(body, "reminderTime", 5)
    if reminder:
        clock(reminder)
    recurrence = text(body, "recurrence", 12, "none")
    kind = text(body, "kind", 12, "special")
    category = text(body, "category", 20, "Personal")
    if not title or recurrence not in {"none", "yearly"} or kind not in {"special", "reminder"} or category not in CATEGORIES:
        raise ValueError("Enter a title and select valid event options.")
    return {
        "title": title, "startDate": start, "endDate": end, "startTime": start_time,
        "endTime": end_time, "allDay": all_day, "reminderTime": reminder,
        "recurrence": recurrence, "kind": kind, "category": category,
        "notes": text(body, "notes", 2000),
    }


def public(item):
    return {key: value for key, value in item.items() if key != "userId"}


def lambda_handler(event, context):
    request = event.get("requestContext") or {}
    user = ((request.get("authorizer") or {}).get("jwt") or {}).get("claims", {}).get("sub")
    if not user:
        return respond(401, {"message": "Sign in to access events."})
    method = (request.get("http") or {}).get("method")
    params = event.get("pathParameters") or {}
    event_id = params.get("eventId")
    occurrence = params.get("occurrenceDate")
    key = {"userId": user, "eventId": event_id}
    exists = "attribute_exists(userId) AND attribute_exists(eventId)"
    try:
        if method == "GET" and not event_id:
            query = {"KeyConditionExpression": Key("userId").eq(user)}
            items = []
            while True:
                page = table.query(**query)
                items.extend(public(item) for item in page.get("Items", []))
                if not page.get("LastEvaluatedKey"):
                    return respond(200, {"events": items})
                query["ExclusiveStartKey"] = page["LastEvaluatedKey"]

        if method == "POST" and not event_id:
            fields = clean(json.loads(event.get("body") or "{}"))
            item = {**fields, "userId": user, "eventId": str(uuid.uuid4()), "exceptions": {}}
            table.put_item(Item=item, ConditionExpression="attribute_not_exists(eventId)")
            return respond(201, {"event": public(item)})

        if occurrence and method in {"PUT", "DELETE"}:
            original = table.get_item(Key=key, ConsistentRead=True).get("Item")
            if not original:
                return respond(404, {"message": "Event not found."})
            selected = iso_date(occurrence)
            first = iso_date(original["startDate"])
            if original["recurrence"] != "yearly" or selected < first or (selected.month, selected.day) != (first.month, first.day):
                raise ValueError("Select an occurrence of this yearly event.")
            changed = clean(json.loads(event.get("body") or "{}")) if method == "PUT" else {"cancelled": True}
            if method == "PUT":
                changed["recurrence"] = "none"
            result = table.update_item(
                Key=key, UpdateExpression="SET #exceptions.#occurrence = :value",
                ConditionExpression=exists + " AND #recurrence = :yearly AND #start = :start",
                ExpressionAttributeNames={"#exceptions": "exceptions", "#occurrence": occurrence,
                                          "#recurrence": "recurrence", "#start": "startDate"},
                ExpressionAttributeValues={":value": changed, ":yearly": "yearly", ":start": original["startDate"]},
                ReturnValues="ALL_NEW",
            )
            return respond(200, {"event": public(result["Attributes"])})

        if event_id and method == "PUT":
            fields = clean(json.loads(event.get("body") or "{}"))
            current = table.get_item(Key=key, ConsistentRead=True).get("Item")
            if not current:
                return respond(404, {"message": "Event not found."})
            if (current["startDate"], current["recurrence"]) != (fields["startDate"], fields["recurrence"]):
                fields["exceptions"] = {}
            names = {f"#f{i}": field for i, field in enumerate(fields)}
            values = {f":v{i}": value for i, value in enumerate(fields.values())}
            expression = ", ".join(f"#f{i} = :v{i}" for i in range(len(fields)))
            result = table.update_item(
                Key=key, UpdateExpression=f"SET {expression}", ConditionExpression=exists,
                ExpressionAttributeNames=names, ExpressionAttributeValues=values, ReturnValues="ALL_NEW",
            )
            return respond(200, {"event": public(result["Attributes"])})

        if event_id and method == "DELETE":
            table.delete_item(Key=key, ConditionExpression=exists)
            return respond(200, {"deleted": True})

        return respond(405, {"message": "Method unavailable."})
    except (ValueError, TypeError):
        return respond(400, {"message": "Check the event title, dates, times, and options."})
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            return respond(409 if occurrence else 404, {"message": "The event changed or is unavailable."})
        logger.error("Events data request failed: %s", error.response.get("Error", {}).get("Code"))
        return respond(500, {"message": "Unable to process the event."})
