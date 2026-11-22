# AWS infrastructure inventory

Last verified: 2026-11-22. The inventory covers the AWS account in `ap-southeast-2`, accessed through profile `familykit`. Customer records, object contents, logs and secret values were outside the assessment.

## Lambda

All six functions use Python 3.14, x86_64 and `lambda_function.lambda_handler`. Their ZIPs each contain one source file, and no layers or Lambda event-source mappings were listed. API Gateway provides HTTP triggers. Cognito invokes the PIN function for three challenge phases.

| Function | Timeout | Memory | Execution role | Responsibility |
|---|---:|---:|---|---|
| familykit-pin-service | 10 s | 256 MB | PowerUserRole | PIN registration, account/profile lookup, challenge verification and recovery |
| FamilyKit-FamilyMembers | 3 s | 128 MB | FamilyKit-FamilyMembers-Role | Owner-scoped member reads and writes |
| FamilyKit-ProfilePictures | 30 s | 128 MB | FamilyKit-ProfilePictures-Role | Presigned photo lifecycle and metadata |
| FamilyKit-Diary | 30 s | 256 MB | FamilyKit-Diary-Lambda-Role | Diary CRUD |
| FamilyKit-Notes | 30 s | 256 MB | FamilyKit-Notes-Lambda-Role | Notes CRUD |
| FamilyKit-ImportantContacts | 30 s | 256 MB | FamilyKit-ImportantContacts-DynamoDB-Policy | Contact CRUD and category catalog |

## Other services

- API Gateway: six HTTP APIs with auto-deploying `$default` stages. No REST APIs were returned. The [API contracts](08-API-CONTRACTS.md) list route and CORS configuration.
- DynamoDB: nine tables. See [schema](09-DATABASE-SCHEMA.md).
- S3: `family-kit-profile-pictures` has all four public-access blocks, BucketOwnerEnforced ownership, AES256 default encryption and no bucket policy. CORS allows GET, HEAD, PUT and POST from the Amplify development origin, exposes ETag, and has a 3,000-second max age. See [photo handler](../backend/FamilyKit-ProfilePictures/lambda_function.py). Document storage needs verification.
- Cognito: two pools observed. See [authentication](10-AUTHENTICATION-SECURITY.md) for active pool, clients and triggers.
- Amplify: app `d1l6et3gtffr4z` hosts the frontend. See [deployment](11-DEPLOYMENT-GUIDE.md).
- CloudWatch Logs: all six `/aws/lambda/<function-name>` groups exist with no configured retention period returned. Alarms and log contents need verification.
- IAM: the PIN execution role has `PowerUserAccess` attached. Other roles' effective permissions need verification. SES email identity and Bedrock inference profile listing were denied. Tracked PIN source uses Gmail via Secrets Manager. No verified Bedrock invocation is identified in tracked source.

## Lambda environment variables

See the [handler environment-variable names](../backend/README.md#lambda-environment-variables-and-resources) in the backend reference. Effective IAM permissions, SES configuration and any Bedrock account integration need verification.

## Lambda source reconciliation

Step 5A found text differences between the deployed and tracked handlers. Steps 5A and 5B verified that the differences were limited to whitespace and line endings. Step 5C approved Git commit `6e8eb4303e84bf057dbe6da250442d146cc7cf58` as the authoritative development baseline for these two functions only.

| Finding | Function and tracked handler | Accepted difference | Deployed ZIP `CodeSha256` |
|---|---|---|---|
| PIN-DIFF-001 | `familykit-pin-service`, [handler](../backend/familykit-pin-service/lambda_function.py) | Whitespace on an otherwise blank line, plus line-ending normalization. | `fZ/ZnbJTkKkEEiN7OT2em3FM+z8UjZqXQXk7udPQWzQ=` |
| FAMILY-DIFF-001 | `FamilyKit-FamilyMembers`, [handler](../backend/FamilyKit-FamilyMembers/lambda_function.py) | Trailing blank lines, plus line-ending normalization. | `B3W0XBF0REG4PMqO1q9FO8EPqjiXmZg7yA5P2vRyuAo=` |

Both findings are closed. No functional reconciliation, standalone formatting change or Lambda redeployment is required. The deployed implementations were unchanged. The preserved ZIP checksums matched AWS, and static Python syntax comparison verified executable parity. This comparison does not establish ZIP byte identity with the tracked files, full runtime dependency or configuration parity, or end-to-end behavior. See [deployment and rollback](11-DEPLOYMENT-GUIDE.md#documented-lambda-procedure).


Source: [backend README](../backend/README.md) and the live Lambda, Gateway, S3, Cognito, DynamoDB, Amplify, CloudWatch and IAM metadata checked during discovery.
