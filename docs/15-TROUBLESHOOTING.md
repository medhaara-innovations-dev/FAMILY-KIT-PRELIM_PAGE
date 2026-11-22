# Troubleshooting

Last verified: 2026-11-22. Use these diagnostics to identify the layer involved without exposing tokens, signed URLs or personal records.

| Symptom | Check first |
|---|---|
| AWS credentials or permission error | Verify the intended account and Region with `aws sts get-caller-identity --profile familykit`. Record the denied API permission and resource type. Obtain approval before changing permissions or resources. |
| Frontend differs from Git | Compare local and remote branch references and the Amplify job's commit and status. Confirm the SPA rewrite for deep links. |
| Login redirects or 401s | Verify the active Cognito pool, JWT authorizer and whether refresh expired. Check the single-retry behavior in [sessionManager.js](../src/auth/sessionManager.js). Inspect status and request ID without copying headers. |
| Signup code or PIN reset email missing | Distinguish Cognito email confirmation from Gmail-based PIN recovery in tracked source. Check approved synthetic accounts, timing and deployment drift. |
| Family API differs from the repo | Check the exact Lambda revision and compare using the [drift process](07-AWS-INFRASTRUCTURE.md#unresolved-deployed-source-drift). |
| Photo upload fails | Check the frontend origin, both Gateway and bucket CORS, signed form expiry, 5 MiB limit, MIME type and confirm request. Redact signed URLs. |
| CORS error on localhost | Compare browser origin with the allowlists. The observed APIs and photo bucket allow the Amplify development host. Configuration changes require approval. |
| Contact write returns 409 | Refresh the list and check concurrent edits and the two-contact Emergency limit. |
| Diary title differs between UI and API | Editor currently caps titles at 150 characters and the handler accepts up to 200. |
| Calendar or Contact Us reports no persisted result | Calendar Create is a placeholder. The landing contact form sets a local completion state. See [feature specs](05-FEATURE-SPECIFICATIONS.md). |

When authorized to review logs, use minimal request identifiers and avoid copying event bodies or customer information. Alarm ownership, escalation contacts, and formal incident procedures need verification.

Sources: [deployment](11-DEPLOYMENT-GUIDE.md), [API contracts](08-API-CONTRACTS.md), [photo handler](../backend/FamilyKit-ProfilePictures/lambda_function.py), and [AWS infrastructure](07-AWS-INFRASTRUCTURE.md).
