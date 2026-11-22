# Roadmap

Last verified: 2026-11-22.

## Project milestones

| Step | Status |
|---|---|
| 1. Initial Project Discovery | COMPLETE |
| 2. Detailed Technical Assessment | COMPLETE |
| 3. Permanent Project Documentation | COMPLETE |
| 4. Documentation Review and GitHub Synchronization | COMPLETE |
| 5A. Lambda Source Code Comparison | COMPLETE |
| 5B. Technical and Security Assessment | COMPLETE |
| 5C. Authoritative Source Decision | COMPLETE |
| 5D. Documentation Reconciliation and Closure | LOCAL DOCUMENTATION UPDATE IN PROGRESS |
| 5E. AWS Lambda Synchronization | NOT REQUIRED FOR SOURCE RECONCILIATION, subject to final owner closure approval |
| 6. End-to-End Testing | PENDING |
| 7. Standardized Deployment Workflow | PENDING |
| 8. Regular FamilyKit Development | PENDING |

The [source decision](07-AWS-INFRASTRUCTURE.md#lambda-source-reconciliation) accepts formatting-only differences. Future security releases require their own approval and verification. Step 6 requires an owner-approved [testing plan](12-TESTING-CHECKLIST.md). Step 7 covers packaging, versioning, configuration management, deployment verification and rollback. Later product work includes UI standards, relationship-based record filtering, events, documents, search, AI, notifications and the family tree. See the [feature specifications](05-FEATURE-SPECIFICATIONS.md).

## Security remediation backlog

Every task is **PENDING**. The [Step 5B findings](10-AUTHENTICATION-SECURITY.md#open-security-findings) remain open. The four HIGH tasks require prompt owner review and verification before affected production releases. Implementation requires owner approval for each task. AWS changes and deployments require separate approval.

| Task and source finding | Priority | Components and dependencies | Verification, owner decision and release gate |
|---|---|---|---|
| FK-SEC-001. PIN Lambda least-privilege IAM policy (SEC-03) | HIGH | PIN role, Cognito, DynamoDB, mail secret and logs | Verify effective permissions and required calls. Approve IAM scope. Gate affected releases on permission review and synthetic workflow tests. |
| FK-SEC-002. Login identity disclosure protection (SEC-01) | HIGH | PIN API, Cognito login and auth client | Verify public response consistency and client dependencies. Approve compatible responses. Gate identity changes on isolated login and disclosure regression tests. |
| FK-SEC-003. Account-level PIN attempt protection (SEC-02) | HIGH | PIN Lambda, Cognito challenges and existing limits | Verify cross-session controls. Approve attempt limits and lockout or recovery policy. Gate auth changes on isolated policy and concurrency tests. |
| FK-SEC-004. Recovery OTP counter lifecycle protection (SEC-02) | HIGH | Recovery API, DynamoDB recovery state and TTL | Verify persistence and concurrency. Approve sending, resend and retention limits. Gate recovery changes on synthetic lifecycle and limit tests. |
| FK-SEC-005. Recovery email timeout, failure handling and cleanup (SEC-04) | MEDIUM | PIN Lambda, Gmail and recovery storage | Verify mail delivery and runtime. Approve timeout and failure handling. Gate timing changes on mocked delays and isolated delivery and cleanup tests. |
| FK-SEC-006. PIN reset consistency and existing-session policy (SEC-05) | MEDIUM | PIN credentials, Cognito sessions and browser refresh | Verify old and new PIN and existing-session behavior. Approve the session policy. Gate reset changes on replay and session regressions. |
| FK-SEC-007. Profile photo content validation and safe replacement (SEC-06) | MEDIUM | Photo Lambda, API client, DynamoDB references and S3 | Verify legacy fields and object lifecycle. Approve image and cleanup rules. Gate media changes on synthetic validation, isolation and replacement tests. |
| FK-SEC-008. Family member listing scalability (SEC-07) | MEDIUM | Family Members Lambda, DynamoDB, dashboard and categories | Measure synthetic listings. Approve supported size and any pagination contract. Gate list changes on API and frontend regression tests. |
| FK-SEC-009. Consistent request and field validation (SEC-08) | LOW | Both handlers, auth and family member forms | Verify current contracts and existing-format fixtures. Approve digit and update rules. Gate tighter validation on malformed-input and compatibility tests. |

See [owner decisions](13-DECISIONS-AND-CONSTRAINTS.md) for open policy and testing approvals.
