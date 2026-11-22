# Authentication and security

Last verified: 2026-11-22.

## Cognito and sessions

- Active pool: `ap-southeast-2_XKEDA5qep`, referenced by frontend config and all six Gateway JWT authorizers. `ap-southeast-2_GCOtDIJFU` is also configured and additionally requires the name attribute. Its intended use needs verification.
- Both pools use email sign-in and auto-verification, the Cognito default email sender, password and EMAIL_OTP first factors, and MFA off. The PIN Lambda implements Define, Create and Verify Auth Challenge triggers.
- SPA clients permit custom, refresh-token, user-auth and SRP flows. User-existence error prevention is enabled. Access and ID token lifetimes are 60 minutes and refresh tokens last five days. Rotation was not returned in the observed config.
- [sessionManager.js](../src/auth/sessionManager.js) uses sessionStorage, checks expiry with a two-minute buffer, coalesces refresh and retries one 401. Browser decoding schedules refresh. Gateway verifies JWTs. Signup has a local profile cache. Family member and dashboard records should stay out of localStorage.

## PIN and email

Tracked code stores salted PBKDF2 verification material and allows five failed PIN attempts per Cognito challenge sequence. Signup email uses Cognito. Tracked recovery sends email through Gmail using Secrets Manager at runtime. Recovery uses a five-minute OTP, up to five verification attempts and up to five sends per hour. Writes enforce expiry and verification state. The reset authorization is consumed when the PIN changes. The deployed PIN handler differs from Git, so exact live recovery behavior and Gmail delivery remain unverified. The deployed PIN Lambda timeout is 10 seconds. The tracked OAuth and Gmail requests can each wait up to 15 seconds. Compare the actual behavior in Step 5 and verify delivery with approved synthetic testing in Step 6.

## Security requirements and risks

- Preserve JWT-derived ownership and data isolation. Use short-lived signed photo access and private storage. Use synthetic accounts for testing.
- Keep secrets, PIN verification values, email codes, tokens and personal records out of docs, commands shared with others, screenshots and logs.
- The PIN role carries a broad managed policy. Verify permissions before proposing least-privilege changes.
- Verify cross-session abuse controls, public identity response consistency, recovery timing, browser storage exposure, and log retention policy. A four-digit PIN makes server-side abuse controls important.
- Confirm Google sign-in support, intended second pool use, and shared-device sign-out policy with the owner.

Sources: [authService.js](../src/auth/authService.js), [PIN handler](../backend/familykit-pin-service/lambda_function.py), [AWS inventory](07-AWS-INFRASTRUCTURE.md), and [testing checklist](12-TESTING-CHECKLIST.md).
