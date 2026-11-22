# DynamoDB schema

Last verified: 2026-11-22. Key schemas came from Sydney table metadata. Item shapes come from handler code. No records were read.

All keys below are strings. No global or local secondary indexes were listed.

| Table | Partition key | Sort key | Representative item fields or purpose |
|---|---|---|---|
| FamilyKitFamilyMembers | userId | memberId | Name, relationship, mobile, optional profile details. The Photo Lambda persists `profilePictureKey` and uses `PROFILE#SELF` for the owner photo. |
| FamilyKitPinCredentials | userId | — | Registration names and PIN verification material. |
| FamilyKitPinResetOTP | resetId | — | Recovery verification state, counters and `expiresAt`, which is the enabled TTL attribute. |
| FamilyKit-Diary | userId | entryId | `entryDate`, title, content, mood, timestamps. |
| FamilyKit-Notes | userId | noteId | Title, content, boolean reminder, `createdAt`, `updatedAt` and `createdDate`. |
| FamilyKit-ImportantContacts | userId | contactId | Name, category, role, mobileNumber, optional email and timestamps. The handler also uses transactional state to enforce the Emergency cap. |
| AWSintegration-success | id | — | Needs verification. |
| Test | id | — | Needs verification. |
| Type3 | id | — | No tracked application use found. Intended purpose needs verification. |

## Ownership and lifecycle

The tracked Family Members handler generates a UUID for each additional `memberId`. It also accepts `photoKey`, whose compatibility with `profilePictureKey` needs verification. Exact deployed member behavior remains subject to [Step 5](07-AWS-INFRASTRUCTURE.md#unresolved-deployed-source-drift).

Business records are scoped to the Cognito subject as `userId`. Preserve that boundary for list and item operations and avoid accepting caller-supplied ownership. The profile picture object is stored in S3, with only the reference stored alongside the profile. Recovery expiry is also enforced by code. Data retention, deletion and backup policies need verification.

Sources: [tracked handlers](../backend), [AWS inventory](07-AWS-INFRASTRUCTURE.md), and [API contracts](08-API-CONTRACTS.md).
