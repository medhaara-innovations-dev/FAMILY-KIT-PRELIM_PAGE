# Decisions and constraints

Last verified: 2026-11-22.

## Owner instructions

- Preserve approved desktop layouts and established responsive behavior. New design colors and approved layout changes require explicit approval.
- Preserve Cognito and session architecture, authenticated ownership, and data isolation. Avoid storing family member or dashboard records in localStorage.
- Commits, pushes, deployments and AWS mutations require explicit authorization. Keep the deployed and repository PIN and Family Members Lambda versions intact until Step 5 reconciliation is explicitly approved.
- Use this FamilyKit workspace. The separate `FAMILY-APP` and `Family_pack-master` projects require explicit authorization.
- The registered owner forms the initial family. Future record filtering uses stable member IDs and relationship labels serve as display text.
- Never use actual customer information for documentation or routine testing. Keep credentials and secret values out of project artifacts.

## Existing implementation decisions

Amplify auto-builds the development branch. API Gateway authorizes protected traffic using Cognito JWTs. DynamoDB records use owner-partitioned keys, and photo objects use private S3 storage. These describe observed behavior. See [system architecture](02-SYSTEM-ARCHITECTURE.md) and [auth](10-AUTHENTICATION-SECURITY.md).

## Decisions requiring confirmation

| Decision | Needs verification |
|---|---|
| Environment ownership | Purpose of `main`, `PROD_BRANCH`, and the second pool. `DEV_BRANCH` is hosted with Amplify stage `PRODUCTION` while the application is under active development. Environment isolation and a dedicated test environment need verification. |
| Backend source of truth | Authoritative PIN and Family Members revisions, backend release owner |
| Family identity model | Shared access, member sign-in, roles and editing rights |
| Design standards | Approved palette, type scale, spacing, desktop reference and breakpoint behavior |
| Email and sessions | Gmail ownership, Google sign-in support, expiry and recovery expectations |
| Data lifecycle | Removal, retention, backups and intended use of `AWSintegration-success`, `Test` and `Type3` |
| Future scope | Order and acceptance criteria for events, documents, relationship filters and AI |
| Verification | Owner-approved Step 6 testing strategy, synthetic accounts, environment isolation and support/log access |

Sources: [agent instructions](../AGENTS.md), [AWS inventory](07-AWS-INFRASTRUCTURE.md), and [design system](03-UI-DESIGN-SYSTEM.md).
