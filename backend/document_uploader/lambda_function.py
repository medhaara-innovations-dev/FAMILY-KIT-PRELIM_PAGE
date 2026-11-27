import json
import re
from datetime import datetime, timezone
from uuid import UUID, uuid4

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

BUCKET = "fk-documents-storage"
LIMIT = 10 * 1024 * 1024
TYPES = {"application/pdf": b"%PDF-", "image/jpeg": b"\xff\xd8\xff", "image/png": b"\x89PNG\r\n\x1a\n"}
s3 = boto3.client("s3", endpoint_url="https://s3.ap-southeast-2.amazonaws.com",
                  config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}))
db = boto3.resource("dynamodb")
documents = db.Table("Fkdocuments")
members = db.Table("FamilyKitFamilyMembers")


def response(status, payload):
    return {"statusCode": status, "headers": {"Content-Type": "application/json", "Cache-Control": "no-store"},
            "body": json.dumps(payload)}


def identity(value):
    return str(UUID(value))


def document(item):
    return {**{field: item[field] for field in ("memberId", "fileName", "contentType", "createdAt")},
            "documentId": item["documentid"], "sizeBytes": int(item["sizeBytes"])}


def lambda_handler(event, _context):
    claims = event.get("requestContext", {}).get("authorizer", {}).get("jwt", {}).get("claims", {})
    try:
        user = identity(claims.get("sub", ""))
    except (TypeError, ValueError, AttributeError):
        return response(401, {"message": "Sign in to access documents."})
    if claims.get("token_use") != "access":
        return response(401, {"message": "Sign in to access documents."})
    route = event.get("routeKey")
    try:
        if route == "GET /documents":
            params = {"KeyConditionExpression": "#owner = :owner", "ExpressionAttributeNames": {"#owner": "userId"},
                      "ExpressionAttributeValues": {":owner": user}, "ConsistentRead": True}
            items = []
            while True:
                page = documents.query(**params)
                items.extend(document(item) for item in page["Items"] if not item.get("deleted"))
                if not page.get("LastEvaluatedKey"):
                    break
                params["ExclusiveStartKey"] = page["LastEvaluatedKey"]
            return response(200, {"documents": sorted(items, key=lambda item: item["createdAt"], reverse=True)})

        if route == "POST /documents/upload":
            data = json.loads(event.get("body") or "{}")
            kind = data["contentType"]
            if kind not in TYPES:
                return response(400, {"message": "Choose a PDF, JPEG or PNG."})
            uid = str(uuid4())
            upload = s3.generate_presigned_post(
                BUCKET, f"uploads/{user}/{uid}", Fields={"Content-Type": kind},
                Conditions=[{"Content-Type": kind}, ["content-length-range", 1, LIMIT]],
                ExpiresIn=600,
            )
            return response(201, {"documentId": uid, "upload": upload})

        uid = identity((event.get("pathParameters") or {}).get("documentId", ""))
        key = {"userId": user, "documentid": uid}
        existing = documents.get_item(Key=key, ConsistentRead=True).get("Item")
        if route == "DELETE /documents/{documentId}":
            if not existing:
                return response(404, {"message": "Document not found."})
            # Preserve the ID so an old completion request cannot recreate this record.
            s3.delete_object(Bucket=BUCKET, Key=f"uploads/{user}/{uid}")
            s3.delete_object(Bucket=BUCKET, Key=f"documents/{user}/{uid}")
            documents.update_item(Key=key, UpdateExpression="SET deleted = :deleted REMOVE "
                                  "memberId, fileName, s3Key, contentType, sizeBytes, createdAt",
                                  ExpressionAttributeValues={":deleted": True})
            return response(200, {"deleted": True})
        if existing and existing.get("deleted"):
            return response(404, {"message": "Document not found."})
        if route == "GET /documents/{documentId}/download":
            if not existing:
                return response(404, {"message": "Document not found."})
            url = s3.generate_presigned_url("get_object", Params={
                "Bucket": BUCKET, "Key": existing["s3Key"], "ResponseContentType": "application/octet-stream",
                "ResponseContentDisposition": "attachment",
            }, ExpiresIn=60)
            return response(200, {"url": url})

        if route != "POST /documents/{documentId}/complete":
            return response(404, {"message": "Route not found."})
        data = json.loads(event.get("body") or "{}")
        member = data["memberId"]
        name = data["fileName"]
        if not isinstance(name, str) or not re.fullmatch(r"[^/\\\x00-\x1f]{1,255}", name):
            return response(400, {"message": "Choose a file with a valid name."})
        if not isinstance(member, str) or not 1 <= len(member) <= 255:
            return response(400, {"message": "Choose a family profile."})
        if member != "PROFILE#SELF" and not members.get_item(
            Key={"userId": user, "memberId": member}, ConsistentRead=True
        ).get("Item"):
            return response(404, {"message": "Family profile not found."})
        if existing:
            if existing["memberId"] != member:
                return response(409, {"message": "This document is already linked to another profile."})
            return response(200, document(existing))

        staging = f"uploads/{user}/{uid}"
        final = f"documents/{user}/{uid}"
        # Keep the final object immutable, including across concurrent completion requests.
        try:
            head = s3.head_object(Bucket=BUCKET, Key=final)
        except ClientError as error:
            if error.response["Error"]["Code"] not in ("403", "404", "NoSuchKey"):
                raise
            try:
                uploaded = s3.get_object(Bucket=BUCKET, Key=staging)
            except ClientError as error:
                if error.response["Error"]["Code"] in ("AccessDenied", "NoSuchKey", "404"):
                    return response(409, {"message": "Upload the file before saving it."})
                raise
            stream = uploaded["Body"]
            try:
                length, kind = uploaded["ContentLength"], uploaded["ContentType"]
                if kind not in TYPES or not 1 <= length <= LIMIT:
                    return response(400, {"message": "Choose a supported file up to 10 MB."})
                content = stream.read()
                if not content.startswith(TYPES[kind]):
                    return response(400, {"message": "The file does not match its declared type."})
            finally:
                stream.close()
            try:
                s3.put_object(Bucket=BUCKET, Key=final, Body=content, ContentType=kind, IfNoneMatch="*")
            except ClientError as error:
                if error.response["Error"]["Code"] not in ("PreconditionFailed", "ConditionalRequestConflict"):
                    raise
            head = s3.head_object(Bucket=BUCKET, Key=final)

        item = {**key, "memberId": member, "fileName": name, "s3Key": final,
                "contentType": head["ContentType"], "sizeBytes": head["ContentLength"],
                "createdAt": datetime.now(timezone.utc).isoformat()}
        try:
            documents.put_item(Item=item, ConditionExpression="attribute_not_exists(documentid)")
        except ClientError as error:
            if error.response["Error"]["Code"] != "ConditionalCheckFailedException":
                raise
            item = documents.get_item(Key=key, ConsistentRead=True)["Item"]
            if item["memberId"] != member:
                return response(409, {"message": "This document is already linked to another profile."})
        return response(200, document(item))
    except (ValueError, TypeError, KeyError, AttributeError):
        return response(400, {"message": "Invalid document request."})
    except ClientError as error:
        print("Document storage request failed:", error.operation_name, error.response["Error"]["Code"])
        return response(503, {"message": "Document storage is unavailable. Try again."})

