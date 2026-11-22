# Authentication and security

Last verified: 2026-11-22.

## Cognito and sessions

- Active pool: `ap-southeast-2_XKEDA5qep`, referenced by frontend config and all six Gateway JWT authorizers. `ap-southeast-2_GCOtDIJFU` is also configured and additionally requires the name attribute. Its intended use needs verification.
- Both pools use email sign-in and auto-verification, the Cognito default email sender, password and EMAIL_OTP first factors, and MFA off. The PIN Lambda implements Define, Create and Verify Auth Challenge triggers.
- SPA clients permit custom, refresh-token, user-auth and SRP flows. User-existence error prevention is enabled. Access and ID token lifetimes are 60 minutes and refresh tokens last five days. Rotation was not returned in the observed config.
- [sessionManager.js](../src/auth/sessionManager.js) uses sessionStorage, checks expiry with a two-minute buffer, coalesces refresh and retries one 401. Browser decoding schedules refresh. Gateway verifies JWTs. Signup has a local profile cache. Family member and dashboard records should stay out of localStorage.

## PIN and email

Tracked code stores salted PBKDF2 verification material and allows five failed PIN attempts per Cognito challenge sequence. Signup email uses Cognito. Tracked recovery sends email through Gmail using Secrets Manager at runtime. Recovery uses a five-minute OTP, up to five verification attempts and up to five sends per hour. Writes enforce expiry and verification state. The reset authorization is consumed when the PIN changes. Step 5 closed the reported source timing difference. Both handlers use the same 300-second OTP lifetime, 60-second resend cooldown and five verification attempts per OTP. Neither defines a separate failed-attempt reset timer. Reset authorization uses the remainder of the original OTP lifetime. The 60-second browser countdown starts after a generic acknowledgement, so delivery and exact server timing require verification. The live Lambda budget is 10 seconds and the two sequential mail-client timeouts are 15 seconds each. Delivery, cleanup and counter retention remain open Step 6 verification items. No timing values were changed.

## Security requirements and risks

- Preserve JWT-derived ownership and data isolation. Use short-lived signed photo access and private storage. Use synthetic accounts for testing.
- Keep secrets, PIN verification values, email codes, tokens and personal records out of docs, commands shared with others, screenshots and logs.
- The PIN role carries a broad managed policy. Verify permissions before proposing least-privilege changes.
- Verify cross-session abuse controls, public identity response consistency, recovery timing, browser storage exposure, and log retention policy. A four-digit PIN makes server-side abuse controls important.
- Confirm Google sign-in support, intended second pool use, and shared-device sign-out policy with the owner.

## Open security findings

| Step 5B finding | Severity | Sanitized scope |
|---|---|---|
| SEC-01 | HIGH | Login identity disclosure |
| SEC-02 | HIGH | PIN and recovery attempt-limiting gaps |
| SEC-03 | HIGH | Broad PIN execution-role permissions |
| SEC-04 | MEDIUM | Recovery email timeout and cleanup risks |
| SEC-05 | MEDIUM | PIN reset consistency and session revocation policy |
| SEC-06 | MEDIUM | Profile photo validation and cleanup integrity |
| SEC-07 | MEDIUM | Family member listing scalability |
| SEC-08 | LOW | Input validation inconsistencies |

These findings are open and shared by the compared implementations. SEC-06 concerns the shared photo dependency. The static assessment did not test exploitation or production customer impact and did not confirm cross-account family member or photo access. Effective permissions and some runtime controls remain unverified. Adopting GitHub as the baseline resolves the source discrepancy only. See the [proposed remediation backlog](14-ROADMAP.md#security-remediation-backlog).

Sources: [authService.js](../src/auth/authService.js), [PIN handler](../backend/familykit-pin-service/lambda_function.py), [AWS inventory](07-AWS-INFRASTRUCTURE.md), and [testing checklist](12-TESTING-CHECKLIST.md).
