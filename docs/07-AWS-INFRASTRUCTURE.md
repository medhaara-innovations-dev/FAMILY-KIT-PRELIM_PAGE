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

## Unresolved deployed source drift

| Function | Tracked file | Verified difference | Potential impact |
|---|---|---|---|
| PIN service | [lambda_function.py](../backend/familykit-pin-service/lambda_function.py) | The deployed handler text differs after line-ending normalization. Functional changes need verification. | Login challenge, recovery and profile behavior can differ from Git assumptions. |
| Family Members | [lambda_function.py](../backend/FamilyKit-FamilyMembers/lambda_function.py) | The deployed handler text differs after line-ending normalization. Functional changes need verification. | Validation, ownership checks and profile responses can differ from Git assumptions. |

The other four deployed handler texts matched their tracked counterparts. **Reconciliation remains unresolved and is reserved for Step 5, pending explicit owner approval.** Once approved, compare sanitized source diffs in a controlled review, identify behavioral changes and the authoritative version, review ownership and recovery regressions with synthetic accounts, and agree on a release and rollback plan before changes. Keep both current versions intact until that review.

Source: [backend README](../backend/README.md) and the live Lambda, Gateway, S3, Cognito, DynamoDB, Amplify, CloudWatch and IAM metadata checked during discovery.
