# API contracts

Last verified: 2026-11-22. Gateway routes and integrations were verified live. Payloads were reviewed in source. The deployed and tracked PIN and Family Members handlers have the same static contracts. Live requests remain untested. See the [reconciliation decision](07-AWS-INFRASTRUCTURE.md#lambda-source-reconciliation).

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
| PUT /profile | JWT | `yourName` and `familyName` are required. Optional profile fields are `mobile`, `email`, `bloodGroup`, `dateOfBirth`, `height`, `weight` and `address`. Email and mobile are profile contact details. | 200, owner profile fields. The updated GET handler returns the same fields. |
| POST /resolve-login | Public | `email` | 200, `username` |
| POST /pin-reset/request | Public | `email` | 200, generic acknowledgement |
| POST /pin-reset/verify | Public | `email`, `otp` string | 200, `resetToken` |
| POST /pin-reset/reset | Public | `email`, `newPin`, `confirmPin`, `resetToken` | 200, reset confirmation |

Owner profile changes use the deployed PIN Lambda and JWT-authorized `PUT /profile` route. The handler selects the existing owner record from the JWT subject, updates allowed profile attributes only, and preserves PIN credentials.

## Family Members — qi5ggu1olj

The deployed PIN and Family Members Lambdas accept optional `instagramUrl`, `facebookUrl`, and `linkedinUrl` fields in profile writes and return saved links in profile responses. The client normalizes supported HTTPS profile links before sending them. An empty string clears a link, and an omitted field preserves its current value. Existing JWT routes and keys are reused. Live profile saves for these fields remain untested.

[Handler](../backend/FamilyKit-FamilyMembers/lambda_function.py) and [API wrapper](../src/api/familyMembersApi.js). All routes require JWT. The repository create handler requires `name`, `relationship` and a valid nonfuture `dateOfBirth` in `YYYY-MM-DD` format. Mobile is optional only for a Son or Daughter with a valid DOB who is under 18. A supplied mobile number must be valid. The same rule applies when updating relationship, DOB or mobile, using the existing value of an omitted field. Optional fields include `email`, `bloodGroup`, `height`, `weight`, `address` and `photoKey`. Creating a second Mother or Father, or changing a member to an occupied parent relationship, returns 409. Legacy member edits can still omit DOB. These constraints are deployed. Use the photo routes for upload. The tracked Family Members handler accepts `photoKey`, while the Profile Pictures handler uses `profilePictureKey` for confirmation and persistence. Compatibility between these fields needs verification.

| Method and path | Request | Success |
|---|---|---|
| GET /family/members | No body | 200, `members` array |
| POST /family/members | Member fields | 201, `member` object |
| GET /family/members/{memberId} | Path ID | 200, `member` object |
| PUT /family/members/{memberId} | Path ID and update fields | 200, `member` object |
| DELETE /family/members/{memberId} | Path ID, no body | 200, `deleted: true`. Returns 404 for missing members, members outside the caller's partition, and `PROFILE#SELF`. |

When creating or editing a member with `relationship: "Other"`, include `relationshipDetail` with 1–80 characters after trimming. When changing to a standard relationship, omit the detail and the handler clears the stored value. The backend accepts this field. The updated form is local.

The repository returns HTTP 409 for duplicate checks during creation or edits to identifying fields. `DUPLICATE_MEMBER` blocks the save and identifies the existing owner-scoped member profile. Matching mobile numbers are blocked unless the profile being saved is a Son or Daughter under 18. The shared number alone does not require confirmation for those children. Clear duplicate profiles are still blocked. `POSSIBLE_DUPLICATE` returns matching member IDs and names for review. After confirmation, retry with `acknowledgedDuplicateMemberIds` containing the returned IDs. This field is request-only. A changed match set requires confirmation again. These backend checks are deployed.

Member removal uses the deployed Family Members Lambda, the JWT-authorized DELETE route, CORS allowing DELETE for the application origins, and the execution role's table-scoped `dynamodb:DeleteItem` permission. The handler conditionally deletes only the caller's member record. It does not delete S3 objects or linked records. End-to-end removal has not been tested against live member data.

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
