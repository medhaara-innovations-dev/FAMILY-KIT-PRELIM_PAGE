# API contracts

Last verified: 2026-11-22. Gateway routes and integrations were verified live. Payloads were reviewed in source. The deployed and tracked PIN and Family Members handlers have the same static contracts. Live requests remain untested. See the [reconciliation decision](07-AWS-INFRASTRUCTURE.md#lambda-source-reconciliation).

## Transport

The host pattern is `https://<api-id>.execute-api.ap-southeast-2.amazonaws.com`, with no stage prefix for `$default`. Protected routes use `Authorization: Bearer <access-token>`. JSON bodies use `Content-Type: application/json`. The direct photo upload instead sends S3 form data.

Gateway CORS allows the Amplify development origin, the authorization and content-type headers, each API's relevant methods, and OPTIONS. Credentialed CORS is disabled. PIN and Family Members return max age 0, the other four use 300 seconds.

## PIN and identity — gwy0jd7fs1

[PIN handler](../backend/familykit-pin-service/lambda_function.py) and [auth service](../src/auth/authService.js). Responses include `success` and commonly `message`.

| Method and path | Auth | Request | Success |
|---|---|---|---|
| POST /pin | JWT | `pin` string, `yourName`, `familyName`, optional `mobile` in +91 followed by 10 digits | 200, confirmation |
| GET /registration-status | JWT | No body | 200, `registrationComplete` boolean |
| GET /profile | JWT | No body | 200, `yourName`, `familyName` |
| PUT /profile | JWT | `yourName` and `familyName` are required. Optional profile fields are `mobile`, `email`, `bloodGroup`, `dateOfBirth`, `height`, `weight` and `address`. Email and mobile are profile contact details. The optional registration mobile is stored as a profile contact and does not change Cognito verification. | 200, owner profile fields. The updated GET handler returns the same fields. |
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

### Events

Events reuses HTTP API `kvi1br0fnl` and its Cognito JWT authorizer. [The handler](../backend/FamilyKit-Events/lambda_function.py) uses the authenticated subject for every read and write.

| Method and path | Result |
|---|---|
| GET /events | List the owner's event series and standalone events |
| POST /events | Create an event |
| PUT or DELETE /events/{eventId} | Update or delete the complete event or series |
| PUT or DELETE /events/{eventId}/occurrences/{occurrenceDate} | Reschedule or remove a single monthly or yearly occurrence using its original ISO date |

Writes accept a title, ISO start and end dates, optional category and notes, and an event type, all-day flag, and recurrence. Timed events use `HH:mm` in IST. A nonempty `reminderTime` displays a reminder in FamilyKit on the start date. The Reminders filter includes reminders and special events with a reminder time. The deployed handler accepts monthly recurrence and a completion-only body such as {"completed":true} on existing PUT routes. For a recurring event, send that body to the occurrence route. Monthly repeats use the last day in shorter months and return to the original day when available. February 29 yearly events appear in leap years. Changing a series start date or recurrence clears occurrence overrides and completion history.
| Contacts `09ngtow570` | GET/POST `/contacts`, GET/PUT/DELETE `/contacts/{contactId}`, GET `/contacts/categories` | `name`, `category`, `role`, `mobileNumber`, optional `email`. List accepts optional `category` query. | List `contacts` and `count`, object `contact`, delete `deleted: true`, catalog `categories` with `name` and `roles` |

The repository Contacts update adds optional `relation` and `photo` (a JPEG thumbnail supplied as base64). `customRole` is required for `Other / Custom Role`. Pass `schema=2` to the categories endpoint for the expanded catalog and to the list endpoint for photos and paginated results. Use the returned `cursor` to request the next page. The deployed handler retains the authenticated owner's partition and existing Emergency contact limit.

Sources: [Diary](../backend/FamilyKit-Diary/lambda_function.py), [Notes](../backend/FamilyKit-Notes/lambda_function.py), [Contacts](../backend/FamilyKit-ImportantContacts/lambda_function.py), and [frontend wrappers](../src/api).

## Errors

Handlers commonly return 400 for invalid input, 401 for missing or invalid authorization, 404 for missing resources, and 500 for unexpected failures. Profile Photos can return 403 for a key outside the profile. Contacts can return 409 for conflicting writes or the Emergency limit. Body fields vary by endpoint, commonly `message` or `error`. Match the handler and wrapper instead of assuming a universal envelope. See [troubleshooting](15-TROUBLESHOOTING.md) and [data schema](09-DATABASE-SCHEMA.md).

### Document uploads

The Sydney HTTP API `qdks44cu0f` uses the existing Cognito JWT issuer and app client. `document_uploader` requires an access token and derives record ownership from its subject.

| Route | Purpose |
|---|---|
| GET /documents | List the caller's saved document records |
| POST /documents/upload | Return a 10-minute S3 upload form for a PDF, JPEG, or PNG |
| POST /documents/{documentId}/complete | Validate the uploaded file and selected `memberId`, then save the document record |
| GET /documents/{documentId}/download | Return a 60-second signed download URL for the caller's record |
| DELETE /documents/{documentId} | Delete the caller's file and remove it from the document inventory |

The upload flow accepts files up to 10 MiB. The private `fk-documents-storage` bucket expires staging files under `uploads/` after one day. Saved records use the existing `Fkdocuments` keys `userId` and `documentid`. The API returns the sort key as `documentId`. Profile assignment accepts `PROFILE#SELF` or a member record belonging to the caller. Gemini extraction is pending.

Deletion leaves only the owner and document keys and a deleted flag in DynamoDB to prevent replaying an old upload completion. The uploader role has `s3:DeleteObject` on the existing staging and saved document prefixes and `dynamodb:UpdateItem` on `Fkdocuments`.

## Founding family connections

The local deployment template and Lambda are in `backend/FamilyKit-Connections`. Use the existing Cognito issuer and app client with the new HTTP API. The template creates a dedicated DynamoDB table and execution role. The Lambda checks account activation using a projected read of the existing PIN-record table. No PIN verification material is returned.

The table uses a single string partition key. `CONTROL` stores `mode` and `families`. `FAMILY#<uuid>` stores the first and optional second account. `USER#<sub>` enforces a single founding membership per account. `INVITE#<sha256>` stores the invitation state, expiry, and relationship in both directions. A link can be accepted once. Tokens are carried in a URL fragment and sent to the API in a request body.

The frontend is enabled by `VITE_FAMILY_CONNECTIONS_API_URL`. A new table defaults to closed until the control record is initialized. Set mode to founding with a starting count of zero for an empty table. The founding service enforces the 100-family cap transactionally. Before opening the pilot, enforce the same policy at the existing registration-completion boundary. The current PIN registration endpoint can independently activate an account, and the new service does not block that legacy path. Existing accounts are not automatically enrolled or migrated. This implementation does not alter document access.

The Sydney deployment uses Lambda and DynamoDB table `FamilyKit-Connections` and HTTP API `ammfp7dxh5`. The `$default` stage uses the existing Cognito JWT authorizer configuration. The deployed control record is closed with zero families enrolled. Local Vite is configured through the ignored development environment file. Amplify has not been configured for this service.

The PIN registration code supports an optional server-side capacity guard. When `FAMILY_CONNECTIONS_TABLE` is set, PIN creation and the founding slot claim are a single DynamoDB transaction. Invitation-based signup reserves the token for that account without connecting the profiles until explicit acceptance. The capacity guard is disabled while the Lambda environment variable is unset. The API's legacy enrollment route now returns an existing membership or defers enrollment to PIN registration.

The live PIN registration guard is enabled against `FamilyKit-Connections`. The control record is in founding mode. Localhost reads the live status. The hosted landing page has not been updated as part of this rollout.

New invitations use a manually shared link. Previously emailed invitations retain their verified-recipient checks. Invitations created from an existing managed profile carry its memberId and require the recipient to sign in with the specified verified email. POST /invitations/review returns permitted suggestions to that recipient. Acceptance saves only explicitly selected fields and links the original memberId in the same transaction. POST /family-connection/link-profile lets either connected account explicitly link one of its own existing profile cards to the connection. Linking preserves document ownership.

During founding mode, the public status endpoint exposes displayRemainingFamilies (100 minus enabled Cognito accounts with verified email) and remainingMemberSpots (200 minus the same eligible account count). Verified Google accounts are included. The Lambda caches the aggregate for up to 60 seconds per execution environment and omits the landing count when unavailable. The DynamoDB family count remains the source of truth for registration availability.

## Isolated document scanner

The local SAM template in `backend/FamilyKit-DocumentScanner` defines a dedicated private S3 bucket, DynamoDB table, scanner Lambda and Cognito-protected HTTP API. The frontend enables `/documents/scanner` from Documents when `VITE_SCANNER_API_URL` is set to the new API output. Documents saved before scanner integration stay in their original system.

| Route | Purpose |
|---|---|
| GET /scans | List the caller's scanner records and their current status |
| POST /scans/upload | Issue a short-lived S3 upload form for PDF, JPEG or PNG |
| POST /scans/{documentId}/complete | Verify the original and the selected profile, then queue the scan |
| GET /scans/{documentId} | Read the existing scan result without invoking Bedrock |
| GET /scans/{documentId}/original | Issue a short-lived download URL for the caller's file |

The API uses the verified Cognito subject as the owner. The scanner table keys are `userId` and `documentId`. Only the ownership check reads the existing family members table. Originals and scan results remain private to the uploader, including when filed under a managed profile. Upload limits are 10 MiB for PDF and 3.75 MB for images.

The DynamoDB stream starts the worker on a queued insert. A conditional transition from QUEUED to SCANNING prevents duplicate stream deliveries from issuing another model call. Nova 2 Lite runs via `global.amazon.nova-2-lite-v1:0` and may process outside Sydney. The worker validates and saves bounded extraction fields, including health policy details, covered people, Advisor Contact and Nominees. The local scanner code also extracts Aadhaar name, printed birth date or year, gender, address and the visible Aadhaar digits. For other document types, the local worker saves up to 24 document-specific label and value pairs. The prompt asks for masked identifiers and omission of authentication secrets. Existing scan results are read as saved. New unmasked Aadhaar scans store the full identifier in a separate attribute on the existing owner-scoped DynamoDB record, using the table?s existing encryption at rest. The authenticated POST /scans/{documentId}/aadhaar/reveal route returns it on demand. Normal detail responses return only the last four digits and a reveal availability flag. The scanner page shows the saved suggestions for review. Field editing and reminder creation are outside this implementation. Staging objects expire after one day. A failed or interrupted scan leaves the original available.

The scanner was deployed directly in Sydney to API Gateway `2ig3ifyd46`. The Lambda and table are named `FamilyKit-DocumentScanner`. The private originals bucket is `familykit-document-scanner-748348796658`. The ignored local Vite development environment points to the API. The hosted frontend has not been released for this feature.

The regular Documents page files scanner records under Other Documents using the selected family and search filters. Category counts include those records. Connected Documents on each profile uses the same scanned card and actions. View opens the persisted extraction in place. The upload dialog and scanner page require an explicit family profile selection before enabling file selection or starting upload. Saved records appear under the selected profile. When `VITE_SCANNER_API_URL` is configured, selecting a PDF, JPG, JPEG or PNG shows a local preview. Confirm and scan uploads the file and queues extraction for the selected family member. The Review Details screen polls the saved scan status and shows 33% when queued, 66% while scanning and 100% when ready. The matching card shows the scan status. View retrieves saved extraction without invoking the model again. DELETE /scans/{documentId} removes the owner?s original, staging object and saved extraction. Both scanned-document views ask for confirmation before deleting.
