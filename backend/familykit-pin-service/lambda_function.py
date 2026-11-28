import os
import re
import json
import hmac
import hashlib
import secrets
from uuid import uuid4
import base64
import urllib.parse
import urllib.request
from email.message import EmailMessage
from datetime import datetime, timezone
from time import time
from boto3.dynamodb.conditions import Attr

import boto3
from botocore.exceptions import ClientError


TABLE_NAME = os.environ["PIN_TABLE_NAME"]

# Required for resolving an email address to the real
# Cognito username, including Google federated users.
USER_POOL_ID = os.environ["USER_POOL_ID"]


dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME)
otp_table = dynamodb.Table(os.environ["OTP_TABLE_NAME"])
ddb_client = boto3.client("dynamodb")

cognito = boto3.client("cognito-idp")


PBKDF2_ITERATIONS = 600_000
MAX_PIN_ATTEMPTS = 5


# =========================================================
# PIN HASHING / STORAGE
# =========================================================

def validate_pin(pin):
    if not isinstance(pin, str):
        raise ValueError("PIN must be a string.")

    if not re.fullmatch(r"\d{4}", pin):
        raise ValueError(
            "PIN must contain exactly 4 digits."
        )


def hash_pin(
    pin,
    salt,
    iterations=PBKDF2_ITERATIONS
):
    return hashlib.pbkdf2_hmac(
        "sha256",
        pin.encode("utf-8"),
        salt,
        iterations
    )


def create_pin(user_id, pin, your_name=None, family_name=None, *, registration=False, invitation=None, claims=None, mobile=None):
    validate_pin(pin)

    if mobile is not None and (not isinstance(mobile, str) or not re.fullmatch(r"\+91[0-9]{10}", mobile)):
        raise ValueError("Enter a 10-digit Indian mobile number.")
    if your_name is not None:
        if not isinstance(your_name, str) or not 1 <= len(your_name.strip()) <= 100:
            raise ValueError("Your Name must be between 1 and 100 characters.")
        your_name = your_name.strip()

    if family_name is not None:
        if not isinstance(family_name, str) or not 1 <= len(family_name.strip()) <= 100:
            raise ValueError("Family Name must be between 1 and 100 characters.")
        family_name = family_name.strip()

    if not user_id:
        raise ValueError(
            "userId is required."
        )

    salt = secrets.token_bytes(32)

    pin_hash = hash_pin(
        pin,
        salt
    )

    now = datetime.now(
        timezone.utc
    ).isoformat()

    item = {
            "userId": user_id,
            "pinHash": pin_hash.hex(),
            "salt": salt.hex(),
            "iterations": PBKDF2_ITERATIONS,
            "createdAt": now,
            "updatedAt": now
    }
    if your_name is not None:
        item["yourName"] = your_name
    if family_name is not None:
        item["familyName"] = family_name
    if mobile is not None:
        item["mobile"] = mobile

    connections = os.environ.get("FAMILY_CONNECTIONS_TABLE") if registration else None
    if not connections:
        table.put_item(Item=item, ConditionExpression="attribute_not_exists(userId)")
        return

    pin_write = {"Put": {"TableName": table.name, "Item": item,
                         "ConditionExpression": "attribute_not_exists(userId)"}}
    control_key = {"pk": "CONTROL"}
    control = dynamodb.Table(connections).get_item(Key=control_key, ConsistentRead=True).get("Item") or {}
    mode = control.get("mode", "closed")
    if invitation:
        if not isinstance(invitation, str) or not re.fullmatch(r"[A-Za-z0-9_-]{43}", invitation):
            raise RegistrationUnavailable("This invitation is invalid.")
        invite_key = "INVITE#" + hashlib.sha256(invitation.encode()).hexdigest()
        stored = dynamodb.Table(connections).get_item(Key={"pk": invite_key}, ConsistentRead=True).get("Item") or {}
        stored_digest = stored.get("recipientDigest")
        if stored_digest:
            username = (claims or {}).get("username") or (claims or {}).get("cognito:username")
            identity = cognito.admin_get_user(UserPoolId=USER_POOL_ID, Username=username) if username else {}
            attrs = {entry["Name"]: entry["Value"] for entry in identity.get("UserAttributes", [])}
            email = attrs.get("email", "").strip().lower()
            digest = hashlib.sha256(email.encode()).hexdigest()
            if (not identity.get("Enabled") or attrs.get("sub") != user_id or attrs.get("email_verified") != "true"
                    or not secrets.compare_digest(digest, stored_digest)):
                raise RegistrationUnavailable("Sign up with the verified email that received this invitation.")
        actions = [{"Update": {
            "TableName": connections, "Key": {"pk": invite_key},
            "UpdateExpression": "SET reservedFor = :user",
            "ConditionExpression": "#state = :pending AND expiresAt > :now AND inviter <> :user "
                                   "AND (attribute_not_exists(reservedFor) OR reservedFor = :user)",
            "ExpressionAttributeNames": {"#state": "state"},
            "ExpressionAttributeValues": {":pending": "PENDING", ":user": user_id, ":now": int(time())},
        }}]
        if stored_digest:
            actions[0]["Update"]["ConditionExpression"] += " AND recipientDigest = :digest"
            actions[0]["Update"]["ExpressionAttributeValues"][":digest"] = stored_digest
        else:
            actions[0]["Update"]["ConditionExpression"] += " AND attribute_not_exists(recipientDigest)"
    elif mode == "founding":
        family_id = str(uuid4())
        actions = [
            {"Update": {
                "TableName": connections, "Key": control_key, "UpdateExpression": "ADD families :one",
                "ConditionExpression": "#mode = :founding AND families < :cap",
                "ExpressionAttributeNames": {"#mode": "mode"},
                "ExpressionAttributeValues": {":one": 1, ":founding": "founding", ":cap": 100},
            }},
            {"Put": {"TableName": connections, "Item": {"pk": "FAMILY#" + family_id, "firstUser": user_id},
                     "ConditionExpression": "attribute_not_exists(pk)"}},
            {"Put": {"TableName": connections, "Item": {"pk": "USER#" + user_id, "familyId": family_id},
                     "ConditionExpression": "attribute_not_exists(pk)"}},
        ]
    elif mode == "public":
        actions = [{"ConditionCheck": {
            "TableName": connections, "Key": control_key,
            "ConditionExpression": "#mode = :public",
            "ExpressionAttributeNames": {"#mode": "mode"},
            "ExpressionAttributeValues": {":public": "public"},
        }}]
    else:
        raise RegistrationUnavailable("New FamilyKit registration is currently closed.")
    try:
        dynamodb.meta.client.transact_write_items(TransactItems=[pin_write, *actions])
    except ClientError as error:
        if error.response["Error"]["Code"] == "TransactionCanceledException":
            raise RegistrationUnavailable("Registration could not claim a family slot or invitation. Please try again.") from error
        raise


class RegistrationUnavailable(Exception):
    pass


def verify_pin(user_id, pin):
    try:
        validate_pin(pin)

    except ValueError:
        return False

    if not user_id:
        return False

    result = table.get_item(
        Key={
            "userId": user_id
        }
    )

    item = result.get("Item")

    if not item:
        return False

    try:
        salt = bytes.fromhex(
            item["salt"]
        )

        stored_hash = bytes.fromhex(
            item["pinHash"]
        )

        iterations = int(
            item.get(
                "iterations",
                PBKDF2_ITERATIONS
            )
        )

        entered_hash = hashlib.pbkdf2_hmac(
            "sha256",
            pin.encode("utf-8"),
            salt,
            iterations
        )

        return hmac.compare_digest(
            entered_hash,
            stored_hash
        )

    except (
        KeyError,
        ValueError,
        TypeError
    ):
        return False


# =========================================================
# COGNITO CUSTOM AUTH
# =========================================================

def get_cognito_user_id(event):
    """
    Used by Cognito custom authentication triggers.

    Cognito supplies user attributes directly to
    the Lambda trigger event.
    """

    attributes = (
        event
        .get("request", {})
        .get("userAttributes", {})
    )

    return attributes.get("sub")


def define_auth_challenge(event):
    """
    Controls Cognito custom PIN authentication.
    """

    session = (
        event
        .get("request", {})
        .get("session", [])
    )

    # First challenge.
    if not session:

        event["response"][
            "challengeName"
        ] = "CUSTOM_CHALLENGE"

        event["response"][
            "issueTokens"
        ] = False

        event["response"][
            "failAuthentication"
        ] = False

        return event

    last_challenge = session[-1]

    # Correct PIN.
    if (
        last_challenge.get(
            "challengeName"
        ) == "CUSTOM_CHALLENGE"
        and
        last_challenge.get(
            "challengeResult"
        ) is True
    ):

        event["response"][
            "issueTokens"
        ] = True

        event["response"][
            "failAuthentication"
        ] = False

        return event

    # Count failed PIN attempts.
    custom_attempts = [
        challenge
        for challenge in session
        if challenge.get(
            "challengeName"
        ) == "CUSTOM_CHALLENGE"
    ]

    if (
        len(custom_attempts)
        >= MAX_PIN_ATTEMPTS
    ):

        event["response"][
            "issueTokens"
        ] = False

        event["response"][
            "failAuthentication"
        ] = True

        return event

    # Wrong PIN but attempts remain.
    event["response"][
        "challengeName"
    ] = "CUSTOM_CHALLENGE"

    event["response"][
        "issueTokens"
    ] = False

    event["response"][
        "failAuthentication"
    ] = False

    return event


def create_auth_challenge(event):
    """
    Tell the client that Cognito expects
    the FamilyKit PIN.
    """

    if (
        event["request"]["challengeName"]
        == "CUSTOM_CHALLENGE"
    ):

        event["response"][
            "publicChallengeParameters"
        ] = {
            "challengeType": "PIN"
        }

        event["response"][
            "privateChallengeParameters"
        ] = {}

        event["response"][
            "challengeMetadata"
        ] = "FAMILYKIT_PIN"

    return event


def verify_auth_challenge_response(event):
    """
    Verify the FamilyKit PIN against
    DynamoDB during Cognito login.
    """

    user_id = get_cognito_user_id(
        event
    )

    entered_pin = (
        event
        .get("request", {})
        .get(
            "challengeAnswer",
            ""
        )
    )

    pin_is_correct = verify_pin(
        user_id,
        entered_pin
    )

    event["response"][
        "answerCorrect"
    ] = pin_is_correct

    return event


# =========================================================
# API RESPONSE
# =========================================================

def api_response(
    status_code,
    body
):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type":
                "application/json"
        },
        "body": json.dumps(body)
    }


# =========================================================
# API GATEWAY JWT USER
# =========================================================

def get_api_gateway_user_id(event):
    """
    Get the authenticated Cognito user's immutable
    'sub' from the JWT that API Gateway already
    validated.

    HTTP API payload format 2.0:

    requestContext
        -> authorizer
            -> jwt
                -> claims
                    -> sub
    """

    claims = (
        event
        .get("requestContext", {})
        .get("authorizer", {})
        .get("jwt", {})
        .get("claims", {})
    )

    return claims.get("sub")


# =========================================================
# POST /pin
# =========================================================

def handle_create_pin_api(event):
    """
    Secure API Gateway endpoint.

    React sends:

        {
            "pin": "1234",
            "yourName": "Sivayan"
        }

    yourName is optional for compatibility with existing clients,
    but new registration clients should always provide it.

    React does NOT send userId.

    The userId comes from the Cognito JWT.
    """

    user_id = get_api_gateway_user_id(
        event
    )

    if not user_id:
        return api_response(
            401,
            {
                "success": False,
                "message": "Unauthorized."
            }
        )

    raw_body = event.get(
        "body",
        ""
    )

    if not raw_body:
        return api_response(
            400,
            {
                "success": False,
                "message":
                    "Request body is required."
            }
        )

    try:
        body = json.loads(
            raw_body
        )

    except json.JSONDecodeError:

        return api_response(
            400,
            {
                "success": False,
                "message":
                    "Invalid request body."
            }
        )

    pin = body.get("pin")
    your_name = body.get("yourName")
    family_name = body.get("familyName")

    try:
        create_pin(user_id, pin, your_name, family_name,
                   registration=True, invitation=body.get("invitation"), mobile=body.get("mobile"),
                   claims=event.get("requestContext", {}).get("authorizer", {}).get("jwt", {}).get("claims", {}))
    except RegistrationUnavailable as error:
        return api_response(409, {"success": False, "message": str(error)})

    return api_response(
        200,
        {
            "success": True,
            "message":
                "PIN established successfully."
        }
    )


# =========================================================
# GET /registration-status
# =========================================================

def handle_registration_status_api(event):
    """
    Check whether the currently authenticated Cognito user
    has already completed FamilyKit registration.

    FamilyKit considers registration complete when a
    PIN record exists in DynamoDB for the authenticated
    Cognito user's immutable sub.

    The browser does not send userId.

    API Gateway validates the Cognito JWT and the Lambda
    obtains the user's sub from that JWT.
    """

    user_id = get_api_gateway_user_id(
        event
    )

    if not user_id:
        return api_response(
            401,
            {
                "success": False,
                "message": "Unauthorized."
            }
        )

    result = table.get_item(
        Key={
            "userId": user_id
        },
        ProjectionExpression="userId"
    )

    registration_complete = bool(
        result.get("Item")
    )

    return api_response(
        200,
        {
            "success": True,
            "registrationComplete":
                registration_complete
        }
    )


# =========================================================
# GET /profile
# =========================================================

PROFILE_FIELDS = {
    "yourName": 100, "familyName": 100, "mobile": 16, "email": 254,
    "bloodGroup": 256, "dateOfBirth": 10, "height": 256, "weight": 256,
    "address": 1000, "instagramUrl": 256, "facebookUrl": 256, "linkedinUrl": 256,
}

SOCIAL_PROFILE_PATTERNS = {
    "instagramUrl": r"https://www\.instagram\.com/[A-Za-z0-9_.-]+",
    "facebookUrl": r"https://www\.facebook\.com/(?:profile\.php\?id=[0-9]+|(?![A-Za-z0-9_.-]*\.[pP][hH][pP]$)(?![A-Za-z0-9_.-]*\.\.)[A-Za-z0-9_.-]+)",
    "linkedinUrl": r"https://www\.linkedin\.com/in/[A-Za-z0-9_-]+",
}


def profile_response(item):
    return api_response(200, {
        "success": True,
        **{field: item.get(field) or None for field in PROFILE_FIELDS},
    })


def handle_get_profile_api(event):
    """Return only profile fields for the authenticated owner."""
    user_id = get_api_gateway_user_id(event)
    if not user_id:
        return api_response(401, {"success": False, "message": "Unauthorized."})

    names = {f"#field{i}": field for i, field in enumerate(PROFILE_FIELDS)}
    result = table.get_item(
        Key={"userId": user_id},
        ProjectionExpression="userId, " + ", ".join(names),
        ExpressionAttributeNames=names,
        ConsistentRead=True,
    )
    item = result.get("Item")
    if not item:
        return api_response(404, {"success": False, "message": "Profile not found."})

    return profile_response(item)


def handle_update_profile_api(event):
    user_id = get_api_gateway_user_id(event)
    if not user_id:
        return api_response(401, {"success": False, "message": "Unauthorized."})

    body = parse_json_object(event)
    if body.keys() - PROFILE_FIELDS.keys():
        raise ValueError("Unsupported profile field.")

    values = {}
    for field, maximum in PROFILE_FIELDS.items():
        if field not in body:
            continue
        value = body[field]
        if not isinstance(value, str):
            raise ValueError("Profile fields must be text.")
        value = value.strip()
        if len(value) > maximum:
            raise ValueError(f"{field} is too long.")
        pattern = SOCIAL_PROFILE_PATTERNS.get(field)
        if pattern and value and not re.fullmatch(pattern, value):
            raise ValueError(f"Invalid {field} profile link.")
        values[field] = value

    if not values.get("yourName") or not values.get("familyName"):
        raise ValueError("Full name and family name are required.")
    if values.get("mobile") and not re.fullmatch(r"\+?[0-9]{10,15}", values["mobile"]):
        raise ValueError("Enter a valid mobile number.")
    if values.get("email") and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", values["email"]):
        raise ValueError("Enter a valid email address.")
    if values.get("dateOfBirth"):
        try:
            date_of_birth = datetime.strptime(values["dateOfBirth"], "%Y-%m-%d").date()
            if date_of_birth.isoformat() != values["dateOfBirth"] or date_of_birth > datetime.now(timezone.utc).date():
                raise ValueError
        except ValueError:
            raise ValueError("Enter a valid date of birth.") from None

    values["updatedAt"] = datetime.now(timezone.utc).isoformat()
    names = {f"#field{i}": field for i, field in enumerate(values)}
    placeholders = {f":value{i}": value for i, value in enumerate(values.values())}
    assignments = [f"{name} = {value}" for name, value in zip(names, placeholders)]
    try:
        updated = table.update_item(
            Key={"userId": user_id},
            ConditionExpression="attribute_exists(userId)",
            UpdateExpression="SET " + ", ".join(assignments),
            ExpressionAttributeNames=names,
            ExpressionAttributeValues=placeholders,
            ReturnValues="ALL_NEW",
        )
    except ClientError as error:
        if error.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            return api_response(404, {"success": False, "message": "Profile not found."})
        raise
    return profile_response(updated["Attributes"])


# =========================================================
# EMAIL NORMALIZATION
# =========================================================

def normalize_email(email):
    if not isinstance(email, str):
        raise ValueError(
            "Email address is required."
        )

    normalized_email = (
        email
        .strip()
        .lower()
    )

    if not normalized_email:
        raise ValueError(
            "Email address is required."
        )

    # Basic format validation.
    if not re.fullmatch(
        r"[^@\s]+@[^@\s]+\.[^@\s]+",
        normalized_email
    ):
        raise ValueError(
            "Please enter a valid email address."
        )

    return normalized_email


# =========================================================
# FIND COGNITO USER BY EMAIL
# =========================================================

def resolve_cognito_username_by_email(email):
    """
    Resolve the email entered on the FamilyKit login
    screen to the real Cognito username.

    Native Cognito user example:

        user@gmail.com

    Google federated Cognito user example:

        google_112270982236010788848

    The browser does not need AWS administrative
    Cognito permissions. This lookup happens inside
    Lambda.
    """

    normalized_email = normalize_email(
        email
    )

    response = cognito.list_users(
        UserPoolId=USER_POOL_ID,
        Filter=(
            f'email = "{normalized_email}"'
        ),
        Limit=10
    )

    users = response.get(
        "Users",
        []
    )

    if not users:
        return None

    # Prefer an exact email match.
    exact_matches = []

    for user in users:
        attributes = {
            attribute.get("Name"):
                attribute.get("Value")
            for attribute
            in user.get(
                "Attributes",
                []
            )
        }

        user_email = (
            attributes
            .get(
                "email",
                ""
            )
            .strip()
            .lower()
        )

        if (
            user_email
            == normalized_email
        ):
            exact_matches.append(
                user
            )

    if not exact_matches:
        return None

    # If both a native Cognito account and an external
    # provider account somehow exist for the same email,
    # prefer the account that already has a FamilyKit PIN.
    for user in exact_matches:

        user_sub = None

        for attribute in user.get(
            "Attributes",
            []
        ):
            if (
                attribute.get("Name")
                == "sub"
            ):
                user_sub = (
                    attribute.get(
                        "Value"
                    )
                )
                break

        if not user_sub:
            continue

        pin_record = table.get_item(
            Key={
                "userId": user_sub
            },
            ProjectionExpression="userId"
        )

        if pin_record.get("Item"):
            return user.get(
                "Username"
            )

    # Otherwise use the first exact Cognito match.
    return exact_matches[0].get(
        "Username"
    )


# =========================================================
# POST /resolve-login
# =========================================================

def handle_resolve_login_api(event):
    """
    Public login helper.

    React sends:

        {
            "email": "user@gmail.com"
        }

    Lambda resolves that email to the actual Cognito
    username needed for CUSTOM_AUTH.

    IMPORTANT:
    This endpoint does not expose whether an account
    exists. Unknown emails receive a generic response.
    """

    raw_body = event.get(
        "body",
        ""
    )

    if not raw_body:
        return api_response(
            400,
            {
                "success": False,
                "message":
                    "Request body is required."
            }
        )

    try:
        body = json.loads(
            raw_body
        )

    except json.JSONDecodeError:

        return api_response(
            400,
            {
                "success": False,
                "message":
                    "Invalid request body."
            }
        )

    email = body.get(
        "email",
        ""
    )

    normalized_email = normalize_email(
        email
    )

    username = (
        resolve_cognito_username_by_email(
            normalized_email
        )
    )

    if not username:
        # Keep the message generic.
        return api_response(
            401,
            {
                "success": False,
                "message":
                    "Incorrect email address or FamilyKit PIN."
            }
        )

    return api_response(
        200,
        {
            "success": True,
            "username": username
        }
    )


# =========================================================
# GMAIL API: CONSOLE-ONLY SENDING TEST
# =========================================================

def send_gmail(to_address, subject, message_body):
    """Send text email through the Gmail account authorized in Secrets Manager."""
    secret_response = boto3.client("secretsmanager").get_secret_value(
        SecretId=os.environ["GMAIL_SECRET_NAME"]
    )
    credentials = json.loads(secret_response["SecretString"])
    token_body = urllib.parse.urlencode({
        "client_id": credentials["GOOGLE_CLIENT_ID"],
        "client_secret": credentials["GOOGLE_CLIENT_SECRET"],
        "refresh_token": credentials["GOOGLE_REFRESH_TOKEN"],
        "grant_type": "refresh_token",
    }).encode("utf-8")
    request = urllib.request.Request(
        "https://oauth2.googleapis.com/token", data=token_body,
        headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST"
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        access_token = json.load(response)["access_token"]
    message = EmailMessage()
    message["From"] = "familykit2026@gmail.com"
    message["To"] = to_address
    message["Subject"] = subject
    message.set_content(message_body)
    encoded = base64.urlsafe_b64encode(message.as_bytes()).decode("ascii")
    request = urllib.request.Request(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        data=json.dumps({"raw": encoded}).encode("utf-8"),
        headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        return json.load(response)


def test_gmail_sender():
    result = send_gmail(
        "familykit2026@gmail.com", "FamilyKit Gmail API test",
        "FamilyKit Gmail API connection is working. This is a test, not a PIN reset OTP."
    )
    return api_response(200, {
        "success": True,
        "message": "Test email sent to familykit2026@gmail.com.",
        "gmailMessageId": result.get("id"),
    })


# =========================================================
# FORGOT PIN RECOVERY (PUBLIC API ROUTES)
# =========================================================

OTP_LIFETIME_SECONDS = 300
OTP_RESEND_SECONDS = 60
OTP_MAX_ATTEMPTS = 5
OTP_MAX_SENDS_PER_HOUR = 5
GENERIC_OTP_MESSAGE = "If an eligible FamilyKit account exists, a verification code will be emailed."


def parse_json_object(event):
    try:
        raw = event.get("body") or "{}"
        if event.get("isBase64Encoded"):
            raw = base64.b64decode(raw).decode("utf-8")
        value = json.loads(raw)
        if not isinstance(value, dict):
            raise ValueError("Invalid request body.")
        return value
    except (ValueError, TypeError, UnicodeDecodeError):
        raise ValueError("Invalid request body.")


def recovery_key(email):
    # Stable, non-email partition key; one active challenge per email.
    return "pin-reset:" + hashlib.sha256(email.encode("utf-8")).hexdigest()


def find_recovery_user(email):
    username = resolve_cognito_username_by_email(email)
    if not username:
        return None
    response = cognito.admin_get_user(UserPoolId=USER_POOL_ID, Username=username)
    attributes = {v["Name"]: v["Value"] for v in response.get("UserAttributes", [])}
    if attributes.get("email", "").lower() != email or attributes.get("email_verified") != "true":
        return None
    user_id = attributes.get("sub")
    if not user_id:
        return None
    result = table.get_item(Key={"userId": user_id}, ProjectionExpression="userId")
    return user_id if result.get("Item") else None


def handle_request_pin_reset(event):
    body = parse_json_object(event)
    email = normalize_email(body.get("email"))
    key = recovery_key(email)
    now = int(time())
    # Conditional write serializes concurrent requests and enforces cooldown.
    current = otp_table.get_item(Key={"resetId": key}, ConsistentRead=True).get("Item")
    if current and now < int(current.get("nextSendAt", 0)):
        return api_response(200, {"success": True, "message": GENERIC_OTP_MESSAGE})
    window_start = int(current.get("windowStart", 0)) if current else 0
    if now - window_start >= 3600:
        window_start, send_count = now, 0
    else:
        send_count = int(current.get("sendCount", 0))
    if send_count >= OTP_MAX_SENDS_PER_HOUR:
        return api_response(200, {"success": True, "message": GENERIC_OTP_MESSAGE})

    user_id = find_recovery_user(email)
    if not user_id:
        return api_response(200, {"success": True, "message": GENERIC_OTP_MESSAGE})

    otp = f"{secrets.randbelow(1000000):06d}"
    salt = secrets.token_hex(16)
    otp_digest = hashlib.sha256((salt + otp).encode("utf-8")).hexdigest()
    item = {
        "resetId": key, "userId": user_id, "otpSalt": salt, "otpHash": otp_digest,
        "attempts": 0, "verified": False, "expiresAt": now + OTP_LIFETIME_SECONDS,
        "nextSendAt": now + OTP_RESEND_SECONDS, "windowStart": window_start,
        "sendCount": send_count + 1,
    }
    try:
        otp_table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(resetId) OR nextSendAt <= :now",
            ExpressionAttributeValues={":now": now},
        )
    except ClientError as exc:
        if exc.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException":
            return api_response(200, {"success": True, "message": GENERIC_OTP_MESSAGE})
        raise
    try:
        send_gmail(
            email, "FamilyKit - Reset Your PIN",
            f"Your FamilyKit verification code is {otp}.\n\n"
            "This code expires in 5 minutes. Do not share it with anyone.\n"
            "If you did not request a PIN reset, ignore this email."
        )
    except Exception:
        # Never log OTP or Gmail tokens; invalidate challenge if email failed.
        otp_table.delete_item(Key={"resetId": key},
            ConditionExpression="otpHash = :digest",
            ExpressionAttributeValues={":digest": otp_digest})
        raise
    return api_response(200, {"success": True, "message": GENERIC_OTP_MESSAGE})


def handle_verify_pin_reset(event):
    body = parse_json_object(event)
    email = normalize_email(body.get("email"))
    otp = body.get("otp")
    if not isinstance(otp, str) or not re.fullmatch(r"[0-9]{6}", otp):
        return api_response(400, {"success": False, "message": "Invalid or expired verification code."})
    key = recovery_key(email)
    now = int(time())
    record = otp_table.get_item(Key={"resetId": key}, ConsistentRead=True).get("Item")
    if not record or record.get("verified") or now >= int(record.get("expiresAt", 0)) or int(record.get("attempts", 0)) >= OTP_MAX_ATTEMPTS:
        return api_response(400, {"success": False, "message": "Invalid or expired verification code."})
    digest = hashlib.sha256((record["otpSalt"] + otp).encode("utf-8")).hexdigest()
    correct = hmac.compare_digest(digest, record["otpHash"])
    reset_token = secrets.token_urlsafe(32) if correct else None
    token_hash = hashlib.sha256(reset_token.encode("utf-8")).hexdigest() if correct else None
    try:
        if correct:
            otp_table.update_item(
                Key={"resetId": key},
                UpdateExpression="SET verified = :yes, resetTokenHash = :token REMOVE otpHash, otpSalt",
                ConditionExpression="otpHash = :hash AND attempts < :max AND expiresAt > :now AND verified = :no",
                ExpressionAttributeValues={":yes": True, ":no": False, ":token": token_hash,
                                           ":hash": record["otpHash"], ":max": OTP_MAX_ATTEMPTS, ":now": now},
            )
            return api_response(200, {"success": True, "resetToken": reset_token,
                                      "message": "Code verified. You can now set a new PIN."})
        otp_table.update_item(
            Key={"resetId": key},
            UpdateExpression="ADD attempts :one",
            ConditionExpression="otpHash = :hash AND attempts < :max AND expiresAt > :now AND verified = :no",
            ExpressionAttributeValues={":one": 1, ":hash": record["otpHash"], ":max": OTP_MAX_ATTEMPTS,
                                       ":now": now, ":no": False},
        )
    except ClientError as exc:
        if exc.response.get("Error", {}).get("Code") != "ConditionalCheckFailedException":
            raise
    return api_response(400, {"success": False, "message": "Invalid or expired verification code."})


def handle_reset_pin(event):
    body = parse_json_object(event)
    email = normalize_email(body.get("email"))
    pin = body.get("newPin")
    confirmation = body.get("confirmPin")
    validate_pin(pin)
    if pin != confirmation:
        return api_response(400, {"success": False, "message": "PINs do not match."})
    token = body.get("resetToken")
    if not isinstance(token, str) or len(token) < 32:
        return api_response(401, {"success": False, "message": "Verification required."})
    key = recovery_key(email)
    record = otp_table.get_item(Key={"resetId": key}, ConsistentRead=True).get("Item")
    now = int(time())
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    if not record or not record.get("verified") or now >= int(record.get("expiresAt", 0)) or not hmac.compare_digest(record.get("resetTokenHash", ""), token_hash):
        return api_response(401, {"success": False, "message": "Verification expired or invalid."})
    salt = secrets.token_bytes(32)
    pin_hash = hash_pin(pin, salt).hex()
    timestamp = datetime.now(timezone.utc).isoformat()
    # Atomic transaction: update the existing PIN only once, consuming the token.
    try:
        ddb_client.transact_write_items(TransactItems=[
            {"Update": {
                "TableName": TABLE_NAME,
                "Key": {"userId": {"S": record["userId"]}},
                "UpdateExpression": "SET pinHash = :pin, salt = :salt, iterations = :iterations, updatedAt = :updated",
                "ConditionExpression": "attribute_exists(userId)",
                "ExpressionAttributeValues": {
                    ":pin": {"S": pin_hash}, ":salt": {"S": salt.hex()},
                    ":iterations": {"N": str(PBKDF2_ITERATIONS)}, ":updated": {"S": timestamp},
                },
            }},
            {"Delete": {
                "TableName": os.environ["OTP_TABLE_NAME"],
                "Key": {"resetId": {"S": key}},
                "ConditionExpression": "verified = :yes AND resetTokenHash = :token AND expiresAt > :now",
                "ExpressionAttributeValues": {
                    ":yes": {"BOOL": True}, ":token": {"S": token_hash}, ":now": {"N": str(now)},
                },
            }},
        ])
    except ClientError as exc:
        if exc.response.get("Error", {}).get("Code") in ("TransactionCanceledException", "ConditionalCheckFailedException"):
            return api_response(401, {"success": False, "message": "Verification expired or already used."})
        raise
    return api_response(200, {"success": True, "message": "PIN reset successfully. Please log in."})


# =========================================================
# DIRECT PIN OPERATIONS
# =========================================================

def handle_direct_operation(event):
    """
    Retained only for Lambda console testing.

    Do NOT expose this operation directly
    to the browser.
    """

    # Never allow direct test actions through API Gateway.
    if event.get("requestContext") or event.get("routeKey"):
        return api_response(404, {"success": False, "message": "Not found."})

    action = event.get("action")
    if action == "TEST_GMAIL_SENDER":
        return test_gmail_sender()

    user_id = event.get(
        "userId"
    )

    pin = event.get(
        "pin"
    )

    if action == "CREATE_PIN":

        create_pin(
            user_id,
            pin
        )

        return api_response(
            200,
            {
                "success": True,
                "message":
                    "PIN established successfully."
            }
        )

    if action == "VERIFY_PIN":

        valid = verify_pin(
            user_id,
            pin
        )

        return api_response(
            200,
            {
                "success": valid
            }
        )

    return api_response(
        400,
        {
            "success": False,
            "message":
                "Invalid action."
        }
    )


# =========================================================
# MAIN LAMBDA HANDLER
# =========================================================

def lambda_handler(
    event,
    context
):

    try:

        # =================================================
        # COGNITO TRIGGERS
        # =================================================

        trigger_source = event.get(
            "triggerSource",
            ""
        )

        # ---------------------------------------------
        # Cognito Define Auth Challenge
        # ---------------------------------------------

        if trigger_source.startswith(
            "DefineAuthChallenge_"
        ):

            return define_auth_challenge(
                event
            )

        # ---------------------------------------------
        # Cognito Create Auth Challenge
        # ---------------------------------------------

        if trigger_source.startswith(
            "CreateAuthChallenge_"
        ):

            return create_auth_challenge(
                event
            )

        # ---------------------------------------------
        # Cognito Verify Auth Challenge
        # ---------------------------------------------

        if trigger_source.startswith(
            "VerifyAuthChallengeResponse_"
        ):

            return (
                verify_auth_challenge_response(
                    event
                )
            )

        # =================================================
        # API GATEWAY HTTP API
        # =================================================

        route_key = event.get(
            "routeKey",
            ""
        )

        # Public Forgot PIN endpoints. Configure API Gateway routes separately.
        if route_key == "POST /pin-reset/request":
            return handle_request_pin_reset(event)
        if route_key == "POST /pin-reset/verify":
            return handle_verify_pin_reset(event)
        if route_key == "POST /pin-reset/reset":
            return handle_reset_pin(event)

        # ---------------------------------------------
        # POST /pin
        # ---------------------------------------------

        if route_key == "POST /pin":

            return handle_create_pin_api(
                event
            )

        # ---------------------------------------------
        # GET /profile
        # ---------------------------------------------

        if route_key == "GET /profile":
            return handle_get_profile_api(event)
        if route_key == "PUT /profile":
            return handle_update_profile_api(event)

        # ---------------------------------------------
        # POST /resolve-login
        # ---------------------------------------------

        if route_key == "POST /resolve-login":

            return handle_resolve_login_api(
                event
            )

        # ---------------------------------------------
        # GET /registration-status
        # ---------------------------------------------

        if route_key == "GET /registration-status":

            return handle_registration_status_api(
                event
            )

        # =================================================
        # DIRECT LAMBDA CONSOLE TESTING
        # =================================================

        return handle_direct_operation(
            event
        )

    # =====================================================
    # VALIDATION ERRORS
    # =====================================================

    except ValueError as error:

        return api_response(
            400,
            {
                "success": False,
                "message": str(error)
            }
        )

    # =====================================================
    # AWS / DYNAMODB / COGNITO ERRORS
    # =====================================================

    except ClientError as error:

        error_code = (
            error
            .response
            .get(
                "Error",
                {}
            )
            .get("Code")
        )

        # PIN already exists for this Cognito user.
        if (
            error_code
            == "ConditionalCheckFailedException"
        ):

            return api_response(
                409,
                {
                    "success": False,
                    "message":
                        "PIN has already been established."
                }
            )

        print(
            "AWS ClientError:",
            error_code
        )

        return api_response(
            500,
            {
                "success": False,
                "message":
                    "Internal server error."
            }
        )

    # =====================================================
    # UNEXPECTED ERRORS
    # =====================================================

    except Exception as error:

        print(
            "Unexpected error:",
            type(error).__name__
        )

        return api_response(
            500,
            {
                "success": False,
                "message":
                    "Internal server error."
            }
        )
