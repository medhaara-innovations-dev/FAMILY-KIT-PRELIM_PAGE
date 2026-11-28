"""Owner-controlled access to managed family profiles."""
import base64
import binascii
from datetime import datetime, timezone
import re
from decimal import Decimal
from uuid import UUID, uuid4

from boto3.dynamodb.conditions import Key


PROFILE_FIELDS = ("name", "dateOfBirth", "bloodGroup", "height", "weight", "mobile", "email", "address")
DOCUMENT_MODES = {"none", "selected", "existing", "future"}


def json_profile(item):
    return {field: str(item[field]) for field in PROFILE_FIELDS if isinstance(item.get(field), (str, Decimal, int))}


def route_request(route, body, user, *, db, table, members, s3, photo_bucket, family_record, profile, get, transact, reply):
    def query(resource, condition, fields=None):
        params = {"KeyConditionExpression": condition, "ConsistentRead": True}
        if fields:
            params["ProjectionExpression"] = fields
        while True:
            page = resource.query(**params)
            yield from page["Items"]
            if not page.get("LastEvaluatedKey"):
                return
            params["ExclusiveStartKey"] = page["LastEvaluatedKey"]

    def pair_for(account):
        family = family_record(account)
        if not family or family.get("supersededBy") or not family.get("secondUser"):
            return None, None
        first, second = family["firstUser"], family["secondUser"]
        return (family, second if account == first else first) if account in (first, second) else (None, None)

    def managed(owner, member_id):
        return members.get_item(Key={"userId": owner, "memberId": member_id}, ProjectionExpression="memberId, #name, relationship, dateOfBirth, bloodGroup, height, weight, mobile, email, address, profilePictureKey, updatedAt",
                                ExpressionAttributeNames={"#name": "name"}, ConsistentRead=True).get("Item")

    def linked(family, owner, member_id):
        return family.get("linkedMemberId" if owner == family["firstUser"] else "secondLinkedMemberId") == member_id

    def grant_key(recipient, owner, member_id):
        return f"DEPENDENT#{recipient}#{owner}#{member_id}"

    def projected_documents(owner, member_id):
        sources = (
            ("scan", "FamilyKit-DocumentScanner", "documentId", "objectKey", "familykit-document-scanner-748348796658"),
            ("upload", "Fkdocuments", "documentid", "s3Key", "fk-documents-storage"),
        )
        for source, name, id_field, path_field, bucket in sources:
            fields = f"{id_field}, {path_field}, memberId, fileName, createdAt"
            if source == "upload":
                fields += ", deleted"
            for item in query(db.Table(name), Key("userId").eq(owner), fields):
                if item.get("memberId") != member_id or item.get("deleted"):
                    continue
                doc_id = item[id_field]
                object_key = item.get(path_field)
                if object_key != f"documents/{owner}/{doc_id}":
                    continue
                yield {"id": f"{source}:{doc_id}", "fileName": item["fileName"],
                       "createdAt": item.get("createdAt", ""), "bucket": bucket, "key": object_key}

    def document_list(owner, member_id, grant=None):
        if grant and grant["documentAccess"] == "none":
            return []
        selected = set(grant.get("documentIds", [])) if grant else set()
        return [item for item in projected_documents(owner, member_id)
                if not grant or grant["documentAccess"] == "future" or item["id"] in selected]

    def activity(owner, member_id):
        audit = get(f"DEPENDENT-HISTORY#{owner}#{member_id}") or {}
        entries = audit.get("activity", [])
        current = (managed(owner, member_id) or {}).get("updatedAt")
        if current and (not entries or current > entries[0]["at"]):
            entries = [{"by": (profile(owner) or {}).get("yourName") or "Profile owner", "at": current, "fields": []}, *entries]
        return entries[:10]

    family, peer = pair_for(user)
    if route == "GET /dependent-profiles":
        if not peer:
            return reply(200, {"members": []})
        granted = get(f"DEPENDENT-INDEX#{user}#{peer}") or {}
        result = []
        for member_id in granted.get("memberIds", []):
            item = managed(peer, member_id)
            grant = get(grant_key(user, peer, member_id))
            if item and grant and grant.get("familyKey") == family["pk"] and grant.get("profileAccess") in {"view", "edit"}:
                result.append({"memberId": member_id, "name": item.get("name", "Family member"),
                               "relationship": grant["relationship"]})
        return reply(200, {"members": result})
    if not peer:
        return reply(404, {"message": "No connected family account is available."})

    raw_id = body.get("memberId")
    if not isinstance(raw_id, str):
        raise ValueError("Choose a managed family profile.")
    member_id = str(UUID(raw_id))
    if route in {"POST /dependent-profiles/permissions", "POST /dependent-profiles/grant"}:
        item = managed(user, member_id)
        if not item or linked(family, user, member_id):
            return reply(404, {"message": "This managed profile is unavailable."})
        key = grant_key(peer, user, member_id)
        current = get(key)
        if current and current.get("familyKey") != family["pk"]:
            current = None
        if route.endswith("/permissions"):
            return reply(200, {
                "recipients": [{"id": "connected", "name": (profile(peer) or {}).get("yourName") or "Connected member",
                                **{field: current[field] for field in ("profileAccess", "documentAccess", "documentIds", "relationship") if current and field in current}}],
                "documents": [{k: doc[k] for k in ("id", "fileName")} for doc in document_list(user, member_id)],
                "activity": activity(user, member_id),
            })
        if body.get("recipient") != "connected":
            raise ValueError("Choose a connected family member.")
        access, mode = body.get("profileAccess"), body.get("documentAccess")
        if access not in ("none", "view", "edit") or not isinstance(mode, str) or mode not in DOCUMENT_MODES:
            raise ValueError("Choose valid access permissions.")
        relation = body.get("relationship") or item.get("relationship") or "Family member"
        if not isinstance(relation, str) or not 1 <= len(relation.strip()) <= 80:
            raise ValueError("Enter a relationship for the recipient.")
        ids = body.get("documentIds", [])
        if not isinstance(ids, list) or len(ids) > 200 or any(not isinstance(value, str) for value in ids):
            raise ValueError("Choose valid documents.")
        if access == "none":
            mode = "none"
        if mode in {"selected", "existing"}:
            available = {doc["id"] for doc in projected_documents(user, member_id)}
            if mode == "selected" and not set(ids) <= available:
                raise ValueError("One of the selected documents is unavailable.")
            ids = sorted(set(current["documentIds"]) & available if mode == "existing" and current
                         and current.get("documentAccess") == "existing" and not body.get("refreshSnapshot")
                         else available if mode == "existing" else set(ids))
            if len(ids) > 200:
                raise ValueError("Select up to 200 documents.")
        else:
            ids = []
        index = f"DEPENDENT-INDEX#{peer}#{user}"
        peer_guard = {"ConditionCheck": {"TableName": table.name, "Key": {"pk": family["pk"]},
                      "ConditionExpression": "firstUser = :first AND secondUser = :second AND attribute_not_exists(supersededBy)",
                      "ExpressionAttributeValues": {":first": family["firstUser"], ":second": family["secondUser"]}}}
        index_change = {"Update": {"TableName": table.name, "Key": {"pk": index},
                         "UpdateExpression": ("DELETE" if access == "none" else "ADD") + " memberIds :member",
                         "ExpressionAttributeValues": {":member": {member_id}}}}
        grant = {"pk": key, "familyKey": family["pk"], "profileAccess": access, "documentAccess": mode,
                 "documentIds": ids, "relationship": relation.strip(), "revision": str(uuid4())}
        transact(peer_guard, index_change, {"Put": {"TableName": table.name, "Item": grant}})
        return reply(200, {"permissions": {field: grant[field] for field in
                           ("profileAccess", "documentAccess", "documentIds", "relationship")}})

    grant = get(grant_key(user, peer, member_id))
    item = managed(peer, member_id) if grant and grant.get("familyKey") == family["pk"] else None
    if not item or grant.get("profileAccess") not in ("view", "edit"):
        return reply(404, {"message": "This shared profile is unavailable."})
    if route == "POST /dependent-profiles/open":
        key = item.get("profilePictureKey")
        prefix = f"profile-pictures/{peer}/{member_id}/"
        photo = s3.generate_presigned_url("get_object", Params={"Bucket": photo_bucket, "Key": key},
                                         ExpiresIn=60) if isinstance(key, str) and key.startswith(prefix) else None
        return reply(200, {"member": {**json_profile(item), "memberId": member_id, "relationship": grant["relationship"],
                                       "profileAccess": "view" if linked(family, peer, member_id) else grant["profileAccess"],
                                       "photoUrl": photo, "updatedAt": item.get("updatedAt", "")},
                           "documents": [{k: doc[k] for k in ("id", "fileName")} for doc in document_list(peer, member_id, grant)],
                           "activity": activity(peer, member_id)})
    if route == "POST /dependent-profiles/document":
        doc = next((doc for doc in document_list(peer, member_id, grant) if doc["id"] == body.get("documentId")), None)
        if not doc:
            return reply(404, {"message": "This document is unavailable."})
        url = s3.generate_presigned_url("get_object", Params={"Bucket": doc["bucket"], "Key": doc["key"],
                                       "ResponseContentDisposition": "inline"}, ExpiresIn=60)
        return reply(200, {"url": url})
    if route in {"POST /dependent-profiles/edit", "POST /dependent-profiles/photo"}:
        if grant["profileAccess"] != "edit" or linked(family, peer, member_id):
            return reply(403, {"message": "You have view-only access to this profile."})
        if body.get("updatedAt") != item.get("updatedAt", ""):
            return reply(409, {"message": "The profile changed. Reopen it before saving."})
        photo_update = route.endswith("/photo")
        values = body.get("profile")
        if not photo_update:
            if not isinstance(values, dict) or not values or values.keys() - set(PROFILE_FIELDS):
                raise ValueError("Choose valid profile fields.")
            for field, value in values.items():
                if not isinstance(value, str) or len(value.strip()) > (1000 if field == "address" else 254):
                    raise ValueError("Check the profile fields.")
                values[field] = value.strip()
            if "name" in values and not values["name"]:
                raise ValueError("Enter a full name.")
            if values.get("mobile") and not re.fullmatch(r"[+]?[0-9]{10,15}", values["mobile"]):
                raise ValueError("Enter a valid mobile number.")
            if values.get("email") and not re.fullmatch(r"[^@\s]+@[^@\s]+[.][^@\s]+", values["email"]):
                raise ValueError("Enter a valid email address.")
            if values.get("dateOfBirth") and datetime.strptime(values["dateOfBirth"], "%Y-%m-%d").date() > datetime.now(timezone.utc).date():
                raise ValueError("Enter a valid date of birth.")
            if any(values.get(field) and not re.fullmatch(r"[0-9]{1,3}(?:[.][0-9]{1,2})?", values[field])
                   for field in ("height", "weight")):
                raise ValueError("Enter height and weight as numbers.")
        stamp = datetime.now(timezone.utc).isoformat()
        photo_key = None
        if photo_update:
            payload, mime = body.get("base64"), body.get("mime")
            formats = {"image/jpeg": (".jpg", b"\xff\xd8\xff"), "image/png": (".png", b"\x89PNG\r\n\x1a\n")}
            if not isinstance(mime, str) or mime not in formats or not isinstance(payload, str) or len(payload) > 1_398_104:
                raise ValueError("Choose a JPEG or PNG up to 1 MB.")
            try:
                content = base64.b64decode(payload, validate=True)
            except (ValueError, binascii.Error):
                raise ValueError("Choose a valid photo.") from None
            extension, signature = formats[mime]
            if len(content) > 1_048_576 or not content.startswith(signature):
                raise ValueError("Choose a valid JPEG or PNG up to 1 MB.")
            photo_key = f"profile-pictures/{peer}/{member_id}/dependent-{uuid4()}{extension}"
            fields = {"profilePictureKey": photo_key}
        else:
            fields = {field: value for field, value in values.items() if value != str(item.get(field, ""))}
        if not fields:
            return reply(200, {"saved": True})
        names = {f"#f{i}": field for i, field in enumerate(fields)}
        args = {f":f{i}": value for i, value in enumerate(fields.values())}
        args[":now"] = stamp
        args[":before"] = item.get("updatedAt", "")
        history_key = f"DEPENDENT-HISTORY#{peer}#{member_id}"
        history = get(history_key) or {}
        revision = str(uuid4())
        entries = [{"by": (profile(user) or {}).get("yourName") or "Connected member",
                    "at": stamp, "fields": list(fields)}] + history.get("activity", [])[:9]
        link_field = "linkedMemberId" if peer == family["firstUser"] else "secondLinkedMemberId"
        if photo_key:
            s3.put_object(Bucket=photo_bucket, Key=photo_key, Body=content, ContentType=mime)
        try:
            transact(
                {"ConditionCheck": {"TableName": table.name, "Key": {"pk": grant["pk"]},
                 "ConditionExpression": "revision = :revision", "ExpressionAttributeValues": {":revision": grant["revision"]}}},
                {"ConditionCheck": {"TableName": table.name, "Key": {"pk": family["pk"]},
                 "ConditionExpression": f"firstUser = :first AND secondUser = :second AND (attribute_not_exists({link_field}) OR {link_field} <> :member)",
                 "ExpressionAttributeValues": {":first": family["firstUser"], ":second": family["secondUser"], ":member": member_id}}},
                {"Update": {"TableName": members.name, "Key": {"userId": peer, "memberId": member_id},
                 "UpdateExpression": "SET updatedAt = :now, " + ", ".join(f"#f{i} = :f{i}" for i in range(len(fields))),
                 "ConditionExpression": "attribute_exists(memberId) AND (attribute_not_exists(updatedAt) OR updatedAt = :before)",
                 "ExpressionAttributeNames": names, "ExpressionAttributeValues": args}},
                {"Put": {"TableName": table.name, "Item": {"pk": history_key, "activity": entries, "revision": revision},
                 "ConditionExpression": "attribute_not_exists(pk)" if not history else "revision = :before",
                 **({"ExpressionAttributeValues": {":before": history["revision"]}} if history else {})}},
            )
        except Exception:
            if photo_key:
                current = managed(peer, member_id) or {}
                if current.get("profilePictureKey") != photo_key:
                    s3.delete_object(Bucket=photo_bucket, Key=photo_key)
            raise
        if photo_key:
            old = item.get("profilePictureKey")
            if isinstance(old, str) and old.startswith(f"profile-pictures/{peer}/{member_id}/dependent-"):
                s3.delete_object(Bucket=photo_bucket, Key=old)
        return reply(200, {"saved": True})
    return reply(404, {"message": "Route not found."})
