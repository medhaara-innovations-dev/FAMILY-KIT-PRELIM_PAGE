# FamilyKit backend

This directory contains the six Lambda handlers retrieved from the `familykit` AWS account in Sydney (`ap-southeast-2`). Each function has its own directory and deploys as a ZIP with `lambda_function.py` at the archive root.

## Runtime and dependencies

All six functions use Python 3.14 on `x86_64` with handler `lambda_function.lambda_handler`. The deployed ZIPs contain only the handler source and have no Lambda layers. Imports come from the Python standard library and the `boto3` and `botocore` packages supplied by the Lambda runtime. The functions use their configured Lambda execution roles for AWS access.

## Lambda environment variables and resources

The table and bucket names below are the configured Sydney resource identifiers. Keep the Cognito pool ID and Secrets Manager reference in Lambda configuration. The PIN service reads Gmail OAuth credentials from Secrets Manager at runtime, exchanges the refresh token with Google OAuth, and sends PIN reset messages through the Gmail API.

| Lambda | Environment variable | Resource or purpose |
|---|---|---|
| `familykit-pin-service` | `PIN_TABLE_NAME` | DynamoDB `FamilyKitPinCredentials` |
| `familykit-pin-service` | `OTP_TABLE_NAME` | DynamoDB `FamilyKitPinResetOTP` |
| `familykit-pin-service` | `USER_POOL_ID` | Amazon Cognito user pool used for account and profile lookups |
| `familykit-pin-service` | `GMAIL_SECRET_NAME` | AWS Secrets Manager secret containing Gmail OAuth credentials |
| `FamilyKit-ProfilePictures` | `FAMILY_MEMBERS_TABLE` | DynamoDB `FamilyKitFamilyMembers` stores photo references |
| `FamilyKit-ProfilePictures` | `PROFILE_PICTURES_BUCKET` | S3 `family-kit-profile-pictures` stores profile pictures and accepts presigned uploads |
| `FamilyKit-Diary` | `DIARY_TABLE_NAME` | DynamoDB `FamilyKit-Diary` |
| `FamilyKit-FamilyMembers` | `TABLE_NAME` | DynamoDB `FamilyKitFamilyMembers` |
| `FamilyKit-Notes` | `NOTES_TABLE_NAME` | DynamoDB `FamilyKit-Notes` |
| `FamilyKit-ImportantContacts` | `CONTACTS_TABLE` | DynamoDB `FamilyKit-ImportantContacts` |
| `FamilyKit-ImportantContacts` | `ALLOWED_ORIGIN` | Optional Lambda response CORS origin. The handler defaults to `*` and the variable was absent from the deployed configuration. |

## API Gateway HTTP APIs

These API Gateway routes integrate with the listed Lambda functions. The default execute-api host format is `https://<api-id>.execute-api.ap-southeast-2.amazonaws.com`. Each method listed on a row represents a separate route.

| API | ID | Lambda | Methods and path | Gateway authorization |
|---|---|---|---|---|
| `FamilyKitPinAPI` | `gwy0jd7fs1` | `familykit-pin-service` | `POST /pin`, `GET /profile`, `GET /registration-status` | JWT |
| `FamilyKitPinAPI` | `gwy0jd7fs1` | `familykit-pin-service` | `POST /resolve-login`, `POST /pin-reset/request`, `POST /pin-reset/verify`, `POST /pin-reset/reset` | None |
| `FamilyKit-ProfilePictures-API` | `a8h5fl7bi0` | `FamilyKit-ProfilePictures` | `POST /profile-picture/upload`, `POST /profile-picture/confirm`, `GET /profile-picture/photo`, `DELETE /profile-picture/photo` | JWT |
| `FamilyKit-Diary-API` | `xjjpa0ph1m` | `FamilyKit-Diary` | `GET /diary`, `POST /diary`, `GET /diary/{entryId}`, `PUT /diary/{entryId}`, `DELETE /diary/{entryId}` | JWT |
| `FamilyKit-FamilyMembers-API` | `qi5ggu1olj` | `FamilyKit-FamilyMembers` | `GET /family/members`, `POST /family/members`, `GET /family/members/{memberId}`, `PUT /family/members/{memberId}` | JWT |
| `FamilyKit-Notes-API` | `kvi1br0fnl` | `FamilyKit-Notes` | `GET /notes`, `POST /notes`, `GET /notes/{noteId}`, `PUT /notes/{noteId}`, `DELETE /notes/{noteId}` | JWT |
| `FamilyKit-ImportantContacts-API` | `09ngtow570` | `FamilyKit-ImportantContacts` | `GET /contacts`, `POST /contacts`, `GET /contacts/categories`, `GET /contacts/{contactId}`, `PUT /contacts/{contactId}`, `DELETE /contacts/{contactId}` | JWT |

## Updating a function

Edit and commit the handler in its own directory on `DEV_BRANCH`. Package and deploy the reviewed handler separately as a code-only update to the corresponding Lambda. For edits made directly in AWS, copy the updated handler back into this directory and commit it. Update this reference alongside changes to environment variable names, routes, or resource dependencies.

The React frontend build runs from the repository root with `npm run build` and Vite writes the frontend artifacts to `dist/`. The frontend build has no dependency on this directory, and adding it requires no Amplify build configuration changes.
