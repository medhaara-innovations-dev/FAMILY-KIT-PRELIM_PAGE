# Testing checklist

Last verified: 2026-11-22. Formal end-to-end testing is Step 6. A dedicated test environment has not been verified. Confirm the testing strategy and environment isolation with the owner before running the checklist. No test script or tracked automated suite was found in the assessed checkout.

## Before testing

- Use owner-approved test accounts and synthetic data. Write tests only to an approved environment and avoid real family, contact or photo data.
- Review [feature status](05-FEATURE-SPECIFICATIONS.md), [API contracts](08-API-CONTRACTS.md), and [sign-in rules](10-AUTHENTICATION-SECURITY.md).
- For frontend changes, run `npm run build` with the locked dependencies. Use `npm ci` to set up an approved test workspace if necessary. Vite scripts are in [package.json](../package.json).

## Scenarios

| Area | Checks |
|---|---|
| Landing and responsive layouts | Check desktop, tablet and phone at both sides of relevant breakpoints. Verify keyboard navigation, focus, reduced motion, sticky headers, bottom navigation, deep links and readable validation. |
| Signup and email | Valid and invalid email, incorrect and expired OTP, resend, required profile names, PIN confirmation mismatch and successful profile creation. |
| Login, recovery and session | Wrong PIN, allowed retry, expiry and refresh, concurrent requests, logout, page reload, reused reset authorization, and consistent recovery messages. |
| Data isolation | Use two synthetic accounts. Verify list and item actions remain scoped, including photo confirmation and deletion. Check API rejection for missing credentials. |
| Family and photos | Required/optional fields, member list and edit, self vs member picture, JPG/PNG/WebP, wrong MIME type, oversized file, failed confirmation and removal. |
| Diary, notes and contacts | CRUD, refresh persistence, empty/error states, field bounds, session retry, valid category/role combinations, and concurrent Emergency cap enforcement. |
| Partial features | Check category search and navigation without implying record filtering. Verify visible UI states for calendar and AI placeholders. |
| Release | Confirm intended commit or Lambda revision, expected public origin, Gateway/S3 CORS, and approved smoke tests. |

Record date, revision, environment, case, result, and gaps without sensitive payloads. Needs verification: designated test environment, account provisioning, coverage targets and cleanup procedures.

See [user journeys](04-USER-JOURNEYS.md), [design system](03-UI-DESIGN-SYSTEM.md), and [deployment](11-DEPLOYMENT-GUIDE.md).
