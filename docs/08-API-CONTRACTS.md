# API contracts

Last verified: 2026-11-22. Gateway routes and integrations were verified live. Payloads were reviewed in source. The exact deployed payload behavior of PIN and Family Members needs verification because of [source drift](07-AWS-INFRASTRUCTURE.md#unresolved-deployed-source-drift).

## Transport

The host pattern is `https://<api-id>.execute-api.ap-southeast-2.amazonaws.com`, with no stage prefix for `$default`. Protected routes use `Authorization: Bearer <access-token>`. JSON bodies use `Content-Type: application/json`. The direct photo upload instead sends S3 form data.

Gateway CORS allows the Amplify development origin, the authorization and content-type headers, each API's relevant methods, and OPTIONS. Credentialed CORS is disabled. PIN and Family Members return max age 0, the other four use 300 seconds.

## PIN and identity — gwy0jd7fs1

[PIN handler](../backend/familykit-pin-service/lambda_function.py) and [auth service](../src/auth/authService.js). Responses include `success` and commonly `message`.

| Method and path | Auth | Request | Success |
|---|---|---|---|
| POST /pin | JWT | `pin` string, `yourName`, `familyName` | 200, confirmation |
| GET /registration-status | JWT | No body | 200, `registrationComplete` boolean |
| GET /profile | JWT | No body | 200, `yourName`, `familyName` |
| POST /resolve-login | Public | `email` | 200, `username` |
| POST /pin-reset/request | Public | `email` | 200, generic acknowledgement |
| POST /pin-reset/verify | Public | `email`, `otp` string | 200, `resetToken` |
| POST /pin-reset/reset | Public | `email`, `newPin`, `confirmPin`, `resetToken` | 200, reset confirmation |

## Family Members — qi5ggu1olj

[Handler](../backend/FamilyKit-FamilyMembers/lambda_function.py) and [API wrapper](../src/api/familyMembersApi.js). All routes require JWT. Create accepts required `name`, `relationship`, `mobile` and optional `email`, `bloodGroup`, `dateOfBirth`, `height`, `weight`, `address`, `photoKey`. Supply mutable profile fields on update. Use the photo routes for the upload flow. The tracked Family Members handler accepts `photoKey`, while the Profile Pictures handler uses `profilePictureKey` for confirmation and persistence. Compatibility between these fields needs verification.

| Method and path | Request | Success |
|---|---|---|
| GET /family/members | No body | 200, `members` array |
| POST /family/members | Member fields | 201, `member` object |
| GET /family/members/{memberId} | Path ID | 200, `member` object |
| PUT /family/members/{memberId} | Path ID and update fields | 200, `member` object |

## Profile Pictures — a8h5fl7bi0

[Handler](../backend/FamilyKit-ProfilePictures/lambda_function.py) and [API wrapper](../src/api/profilePicturesApi.js). All routes require JWT and return 200 on success. Use the opaque `memberId`; browser code uses `PROFILE#SELF` for self photos.

| Method and path | Request | Success fields |
|---|---|---|
| POST /profile-picture/upload | JSON `memberId`, `contentType` | `success`, `memberId`, `profilePictureKey`, `upload` with S3 URL and form fields, `maxFileSize`, `expiresIn` |
| POST /profile-picture/confirm | JSON `memberId`, `profilePictureKey` | `success`, `message`, `memberId`, `profilePictureKey` |
| GET /profile-picture/photo | Query `memberId` | `success`, `memberId`, `hasPhoto` and, when present, `photoUrl`, `expiresIn` |
| DELETE /profile-picture/photo | JSON `memberId` | `success`, `message`, `memberId` |

## Diary, Notes and Important Contacts

All routes in this table require JWT. Create returns 201. List, read, update and delete return 200 on success.

| API | Resource and methods | Write body | Success payload |
|---|---|---|---|
| Diary `xjjpa0ph1m` | GET/POST `/diary`, GET/PUT/DELETE `/diary/{entryId}` | `entryDate` (YYYY-MM-DD) and nonempty `content`, plus optional `title` and `mood` | List `entries` and `count`, object `entry`, delete confirmation |
| Notes `kvi1br0fnl` | GET/POST `/notes`, GET/PUT/DELETE `/notes/{noteId}` | `content`, optional string `title` and boolean `reminder`. Edit accepts update fields. | List `notes` and `count`, object `note`, delete confirmation |
| Contacts `09ngtow570` | GET/POST `/contacts`, GET/PUT/DELETE `/contacts/{contactId}`, GET `/contacts/categories` | `name`, `category`, `role`, `mobileNumber`, optional `email`. List accepts optional `category` query. | List `contacts` and `count`, object `contact`, delete `deleted: true`, catalog `categories` with `name` and `roles` |

Sources: [Diary](../backend/FamilyKit-Diary/lambda_function.py), [Notes](../backend/FamilyKit-Notes/lambda_function.py), [Contacts](../backend/FamilyKit-ImportantContacts/lambda_function.py), and [frontend wrappers](../src/api).

## Errors

Handlers commonly return 400 for invalid input, 401 for missing or invalid authorization, 404 for missing resources, and 500 for unexpected failures. Profile Photos can return 403 for a key outside the profile. Contacts can return 409 for conflicting writes or the Emergency limit. Body fields vary by endpoint, commonly `message` or `error`. Match the handler and wrapper instead of assuming a universal envelope. See [troubleshooting](15-TROUBLESHOOTING.md) and [data schema](09-DATABASE-SCHEMA.md).
