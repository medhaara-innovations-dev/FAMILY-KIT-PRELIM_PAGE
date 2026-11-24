# DynamoDB schema

Last verified: 2026-11-22. Key schemas came from Sydney table metadata. Item shapes come from handler code. No records were read.

All keys below are strings. No global or local secondary indexes were listed.

| Table | Partition key | Sort key | Representative item fields or purpose |
|---|---|---|---|
| FamilyKitFamilyMembers | userId | memberId | Name, relationship, mobile, optional profile details. The repository handler stores the custom label for Other as `relationshipDetail`. The Photo Lambda persists `profilePictureKey` and uses `PROFILE#SELF` for the owner photo. |
| FamilyKitPinCredentials | userId | — | Registration names and PIN verification material. |
| FamilyKitPinResetOTP | resetId | — | Recovery verification state, counters and `expiresAt`, which is the enabled TTL attribute. |
| FamilyKit-Diary | userId | entryId | `entryDate`, title, content, mood, timestamps. |
| FamilyKit-Notes | userId | noteId | Title, content, boolean reminder, `createdAt`, `updatedAt` and `createdDate`. |
| FamilyKit-Events | userId | eventId | Private event fields, optional reminder time, recurrence, and yearly occurrence overrides keyed by original date. |
| FamilyKit-ImportantContacts | userId | contactId | Name, category, role, mobileNumber, optional email and timestamps. The handler also uses transactional state to enforce the Emergency cap. |
| AWSintegration-success | id | — | Needs verification. |
| Test | id | — | Needs verification. |
| Type3 | id | — | No tracked application use found. Intended purpose needs verification. |

## Ownership and lifecycle

The repository member-uniqueness check uses the internal `parentRelationshipsRevision` attribute on the owner's existing `PROFILE#SELF` key. A conditional transaction serializes member creation and changes to identifying fields, including parent assignments. This leaves existing member IDs and photos intact and requires no key or index changes. The member-uniqueness check is deployed.

The deployed social-links update adds optional `instagramUrl`, `facebookUrl`, and `linkedinUrl` attributes to existing owner and member records when saved. Profiles with missing or empty values have disabled social icons. No key or index changes were required.

The tracked Family Members handler generates a UUID for each additional `memberId`. It also accepts `photoKey`, whose compatibility with `profilePictureKey` needs verification. The [Step 5 comparison](07-AWS-INFRASTRUCTURE.md#lambda-source-reconciliation) verified matching keys, ownership conditions and update expressions for both PIN and Family Members handler pairs. Source reconciliation requires no migration.

Business records are scoped to the Cognito subject as `userId`. Preserve that boundary for list and item operations and avoid accepting caller-supplied ownership. The profile picture object is stored in S3, with only the reference stored alongside the profile. Recovery expiry is also enforced by code. Data retention, deletion and backup policies need verification.

The repository owner-profile update adds optional profile details to the existing `FamilyKitPinCredentials` item. The owner-profile route is deployed. Existing items remain readable without those attributes, and the update does not change the key or credential fields. See the [owner profile API contract](08-API-CONTRACTS.md#pin-and-identity--gwy0jd7fs1).

Sources: [tracked handlers](../backend), [AWS inventory](07-AWS-INFRASTRUCTURE.md), and [API contracts](08-API-CONTRACTS.md).
