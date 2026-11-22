# FamilyKit contributor instructions for AI agents

Last verified: 2026-11-22.

## Before changing code

- Inspect the existing implementation and read the relevant documentation before proposing or implementing changes. Use this FamilyKit workspace. The separate `FAMILY-APP` and `Family_pack-master` projects require explicit owner authorization.
- Identify proposed files and affected resources before implementation. Preserve working functionality and avoid unrelated changes.
- Reuse existing components, APIs, Lambda functions and infrastructure where possible. Avoid unnecessary AWS resources and dependencies.
- Verify names and contracts against source and configuration. Never invent endpoints, database attributes or AWS resource names.
- Preserve approved desktop and mobile layouts, colors, typography, spacing, gradients, responsive designs and component behavior. Obtain explicit approval for changes to approved designs or for new colors.
- Preserve the Cognito authentication and session-management architecture. Do not store family member or dashboard records in localStorage.
- Maintain strict authenticated user ownership and data isolation. Never expose credentials, secrets, PIN hashes, salts, access or refresh tokens, or customer data.

## Verification and release

- Run appropriate tests after approved application changes. Run `npm run build` for frontend build validation when applicable.
- Review the Git diff before requesting approval. Distinguish verified implementation, untested behavior and planned functionality. State assumptions and document unresolved issues.
- Update affected documentation whenever approved functionality, architecture, security or deployment procedures change.
- Obtain explicit owner approval for Git commits and pushes, for deployments, and before creating, modifying or deleting AWS resources.
- Use Git commit `6e8eb4303e84bf057dbe6da250442d146cc7cf58` as the approved development baseline for the PIN and Family Members handlers. Preserve the private comparison evidence. Step 5C accepted the formatting-only differences and requires no redeployment. Obtain separate approval for future source changes, security remediation and releases. See the [decision record](docs/07-AWS-INFRASTRUCTURE.md#lambda-source-reconciliation).

## Read by task

| Task | Read first |
|---|---|
| Product scope or behavior | [Overview](docs/01-PROJECT-OVERVIEW.md), [journeys](docs/04-USER-JOURNEYS.md), [features](docs/05-FEATURE-SPECIFICATIONS.md) |
| Frontend and design | [Design system](docs/03-UI-DESIGN-SYSTEM.md), [frontend](docs/06-FRONTEND-ARCHITECTURE.md) |
| API, Lambda, or storage | [Architecture](docs/02-SYSTEM-ARCHITECTURE.md), [AWS](docs/07-AWS-INFRASTRUCTURE.md), [API](docs/08-API-CONTRACTS.md), [schema](docs/09-DATABASE-SCHEMA.md) |
| Identity or data access | [Auth and security](docs/10-AUTHENTICATION-SECURITY.md), [schema](docs/09-DATABASE-SCHEMA.md) |
| Testing, release, or incident | [Testing](docs/12-TESTING-CHECKLIST.md), [deployment](docs/11-DEPLOYMENT-GUIDE.md), [troubleshooting](docs/15-TROUBLESHOOTING.md) |
| Scope and approval | [Decisions](docs/13-DECISIONS-AND-CONSTRAINTS.md), [roadmap](docs/14-ROADMAP.md), [contributing](CONTRIBUTING.md) |
