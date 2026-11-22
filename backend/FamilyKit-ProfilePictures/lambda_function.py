
import os
import json
import uuid
import boto3
from datetime import datetime, timezone
from botocore.exceptions import ClientError

s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

BUCKET = os.environ["PROFILE_PICTURES_BUCKET"]
TABLE = dynamodb.Table(os.environ["FAMILY_MEMBERS_TABLE"])

MAX_BYTES = 5 * 1024 * 1024
SELF_MEMBER_ID = "PROFILE#SELF"

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
}


def response(status, data):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
        },
        "body": json.dumps(data)
    }


def get_user_id(event):
    """
    Obtain the authenticated user ID from API Gateway.
    Never trust a userId supplied in the request body.
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


def get_request(event):
    method = (
        (event.get("requestContext") or {})
        .get("http", {})
        .get("method")
        or event.get("httpMethod")
        or ""
    ).upper()

    path = (
        event.get("rawPath")
        or event.get("path")
        or ""
    ).rstrip("/")

    return method, path


def get_body(event):
    raw = event.get("body") or "{}"

    if isinstance(raw, dict):
        return raw

    try:
        return json.loads(raw)
    except (ValueError, TypeError):
        raise ValueError("Invalid JSON request body")


def get_member_id(data):
    member_id = data.get("memberId")

    if not isinstance(member_id, str) or not member_id:
        raise ValueError("memberId is required")

    return member_id


def get_record(user_id, member_id):
    result = TABLE.get_item(
        Key={
            "userId": user_id,
            "memberId": member_id
        }
    )
    return result.get("Item")


def ensure_member_exists(user_id, member_id):
    if member_id == SELF_MEMBER_ID:
        return

    if not get_record(user_id, member_id):
        raise LookupError("Family member not found")


def make_key(user_id, member_id, extension):
    photo_id = str(uuid.uuid4())

    return (
        f"profile-pictures/"
        f"{user_id}/"
        f"{member_id}/"
        f"{photo_id}{extension}"
    )


def belongs_to_profile(key, user_id, member_id):
    prefix = (
        f"profile-pictures/"
        f"{user_id}/"
        f"{member_id}/"
    )

    return (
        isinstance(key, str)
        and key.startswith(prefix)
        and "/" not in key[len(prefix):]
    )


def create_upload(event, user_id):
    data = get_body(event)

    member_id = get_member_id(data)
    content_type = data.get("contentType")

    if content_type not in ALLOWED_TYPES:
        return response(
            400,
            {"error": "Only JPG, PNG and WebP are supported"}
        )

    ensure_member_exists(user_id, member_id)

    extension = ALLOWED_TYPES[content_type]
    key = make_key(user_id, member_id, extension)

    upload = s3.generate_presigned_post(
        Bucket=BUCKET,
        Key=key,
        Fields={
            "Content-Type": content_type
        },
        Conditions=[
            {"Content-Type": content_type},
            ["content-length-range", 1, MAX_BYTES]
        ],
        ExpiresIn=300
    )

    return response(200, {
        "success": True,
        "memberId": member_id,
        "profilePictureKey": key,
        "upload": upload,
        "maxFileSize": MAX_BYTES,
        "expiresIn": 300
    })


def confirm_upload(event, user_id):
    data = get_body(event)

    member_id = get_member_id(data)
    key = data.get("profilePictureKey")

    if not belongs_to_profile(key, user_id, member_id):
        return response(403, {
            "error": "Invalid profile picture key"
        })

    ensure_member_exists(user_id, member_id)

    try:
        obj = s3.head_object(Bucket=BUCKET, Key=key)
    except ClientError as exc:
        if exc.response["Error"]["Code"] in (
            "404", "NoSuchKey", "NotFound"
        ):
            return response(404, {
                "error": "Uploaded photo not found"
            })
        raise

    content_type = obj.get("ContentType")
    size = obj.get("ContentLength", 0)

    if content_type not in ALLOWED_TYPES or not (
        0 < size <= MAX_BYTES
    ):
        return response(400, {
            "error": "Invalid photo type or size"
        })

    current = get_record(user_id, member_id)
    old_key = (
        current.get("profilePictureKey")
        if current else None
    )

    now = datetime.now(timezone.utc).isoformat()

    if member_id == SELF_MEMBER_ID:
        # Create the main-user photo metadata record
        # only if it does not already exist.
        try:
            TABLE.put_item(
                Item={
                    "userId": user_id,
                    "memberId": SELF_MEMBER_ID,
                    "profilePictureKey": key,
                    "profilePictureUpdatedAt": now
                },
                ConditionExpression=(
                    "attribute_not_exists(userId) AND "
                    "attribute_not_exists(memberId)"
                )
            )
        except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
            TABLE.update_item(
                Key={
                    "userId": user_id,
                    "memberId": member_id
                },
                UpdateExpression=(
                    "SET profilePictureKey = :k, "
                    "profilePictureUpdatedAt = :t"
                ),
                ConditionExpression=(
                    "attribute_exists(userId) AND "
                    "attribute_exists(memberId)"
                ),
                ExpressionAttributeValues={
                    ":k": key,
                    ":t": now
                }
            )
    else:
        TABLE.update_item(
            Key={
                "userId": user_id,
                "memberId": member_id
            },
            UpdateExpression=(
                "SET profilePictureKey = :k, "
                "profilePictureUpdatedAt = :t"
            ),
            ConditionExpression=(
                "attribute_exists(userId) AND "
                "attribute_exists(memberId)"
            ),
            ExpressionAttributeValues={
                ":k": key,
                ":t": now
            }
        )

    # Delete the previous photo after saving the new one.
    if (
        old_key
        and old_key != key
        and belongs_to_profile(old_key, user_id, member_id)
    ):
        try:
            s3.delete_object(Bucket=BUCKET, Key=old_key)
        except ClientError:
            # The new photo is already saved.
            # A cleanup can be retried separately.
            pass

    return response(200, {
        "success": True,
        "message": "Profile picture saved",
        "memberId": member_id,
        "profilePictureKey": key
    })


def view_photo(event, user_id):
    params = event.get("queryStringParameters") or {}
    member_id = params.get("memberId")

    if not member_id:
        return response(400, {
            "error": "memberId is required"
        })

    ensure_member_exists(user_id, member_id)

    item = get_record(user_id, member_id)
    key = item.get("profilePictureKey") if item else None

    if not key:
        return response(200, {
            "success": True,
            "hasPhoto": False,
            "memberId": member_id
        })

    if not belongs_to_profile(key, user_id, member_id):
        return response(403, {
            "error": "Invalid stored photo reference"
        })

    url = s3.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": BUCKET,
            "Key": key
        },
        ExpiresIn=300
    )

    return response(200, {
        "success": True,
        "hasPhoto": True,
        "memberId": member_id,
        "photoUrl": url,
        "expiresIn": 300
    })


def delete_photo(event, user_id):
    data = get_body(event)
    member_id = get_member_id(data)

    ensure_member_exists(user_id, member_id)

    item = get_record(user_id, member_id)
    key = item.get("profilePictureKey") if item else None

    if not key:
        return response(200, {
            "success": True,
            "message": "No profile picture to remove"
        })

    if not belongs_to_profile(key, user_id, member_id):
        return response(403, {
            "error": "Invalid stored photo reference"
        })

    # Remove only photo metadata, not the profile.
    TABLE.update_item(
        Key={
            "userId": user_id,
            "memberId": member_id
        },
        UpdateExpression=(
            "REMOVE profilePictureKey, "
            "profilePictureUpdatedAt"
        ),
        ConditionExpression=(
            "attribute_exists(userId) AND "
            "attribute_exists(memberId) AND "
            "profilePictureKey = :k"
        ),
        ExpressionAttributeValues={
            ":k": key
        }
    )

    s3.delete_object(
        Bucket=BUCKET,
        Key=key
    )

    return response(200, {
        "success": True,
        "message": "Profile picture removed",
        "memberId": member_id
    })


def lambda_handler(event, context):
    try:
        user_id = get_user_id(event)

        if not user_id:
            return response(401, {
                "error": "Authentication required"
            })

        method, path = get_request(event)

        if method == "POST" and path.endswith("/upload"):
            return create_upload(event, user_id)

        if method == "POST" and path.endswith("/confirm"):
            return confirm_upload(event, user_id)

        if method == "GET" and path.endswith("/photo"):
            return view_photo(event, user_id)

        if method == "DELETE" and path.endswith("/photo"):
            return delete_photo(event, user_id)

        return response(404, {
            "error": "Route not found"
        })

    except ValueError as exc:
        return response(400, {"error": str(exc)})

    except LookupError as exc:
        return response(404, {"error": str(exc)})

    except ClientError as exc:
        print("AWS operation failed:", str(exc))
        return response(500, {
            "error": "Unable to process profile picture"
        })

    except Exception as exc:
        print("Unexpected error:", str(exc))
        return response(500, {
            "error": "Internal server error"
        })


print("success")
