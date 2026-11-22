# Decisions and constraints

Last verified: 2026-11-22.

## Owner instructions

- Preserve approved desktop layouts and established responsive behavior. New design colors and approved layout changes require explicit approval.
- Preserve Cognito and session architecture, authenticated ownership, and data isolation. Avoid storing family member or dashboard records in localStorage.
- Commits, pushes, deployments and AWS mutations require explicit authorization. Step 5C approved the Git development baseline for the PIN and Family Members handlers and accepted their formatting-only differences. Preserve the rollback evidence. See the [decision record](07-AWS-INFRASTRUCTURE.md#lambda-source-reconciliation).
- Use this FamilyKit workspace. The separate `FAMILY-APP` and `Family_pack-master` projects require explicit authorization.
- The registered owner forms the initial family. Future record filtering uses stable member IDs and relationship labels serve as display text.
- Never use actual customer information for documentation or routine testing. Keep credentials and secret values out of project artifacts.

## Existing implementation decisions

Amplify auto-builds the development branch. API Gateway authorizes protected traffic using Cognito JWTs. DynamoDB records use owner-partitioned keys, and photo objects use private S3 storage. These describe observed behavior. See [system architecture](02-SYSTEM-ARCHITECTURE.md) and [auth](10-AUTHENTICATION-SECURITY.md).

## Decisions requiring confirmation

| Decision | Needs verification |
|---|---|
| Environment ownership | Purpose of `main`, `PROD_BRANCH`, and the second pool. `DEV_BRANCH` is hosted with Amplify stage `PRODUCTION` while the application is under active development. Environment isolation and a dedicated test environment need verification. |
| Backend source of truth | Development baseline approved for the two handlers. Backend release ownership and procedures remain open. |
| Family identity model | Shared access, member sign-in, roles and editing rights |
| Design standards | Approved palette, type scale, spacing, desktop reference and breakpoint behavior |
| Email and sessions | Account-level PIN attempt restrictions, lockout and recovery policy, OTP send and resend restrictions, counter retention, existing-session behavior after reset, Google sign-in support and Gmail delivery verification |
| Data lifecycle | Removal, retention, backups and intended use of `AWSintegration-success`, `Test` and `Type3` |
| Future scope | Order and acceptance criteria for events, documents, relationship filters and AI |
| Verification | Owner-approved isolated environment, synthetic accounts, effective IAM permissions, SES and Bedrock integration verification, legacy photo metadata, supported family-list size and any pagination contract |

Sources: [agent instructions](../AGENTS.md), [AWS inventory](07-AWS-INFRASTRUCTURE.md), and [design system](03-UI-DESIGN-SYSTEM.md).
