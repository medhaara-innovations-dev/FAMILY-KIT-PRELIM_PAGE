# Roadmap

Last verified: 2026-11-22. This proposed sequence needs owner approval. It carries no release commitments.

1. **Step 4C. Documentation synchronization.** Publish the reviewed documentation set after explicit approval. See [deployment](11-DEPLOYMENT-GUIDE.md#documentation-only-synchronization).
2. **Step 5. Lambda source reconciliation.** Preserve both versions until explicitly approved. Review the [source differences](07-AWS-INFRASTRUCTURE.md#unresolved-deployed-source-drift) and resolve the source of truth with the owner.
3. **Step 6. Testing.** Confirm an owner-approved test strategy and environment, then run the [synthetic test checklist](12-TESTING-CHECKLIST.md).
4. Review PIN execution permissions, recovery timing, abuse controls, and log retention using the [security assessment](10-AUTHENTICATION-SECURITY.md).
5. Agree on UI standards before consolidating CSS or shared navigation. Resolve validated user-facing discrepancies, including diary title length and contact phone scope.
6. Confirm requirements for relationship-based record filtering, Events and Documents. Prioritize search, AI, notifications and family tree only after acceptance criteria and data-handling requirements are agreed.

Source baseline: [feature implementations](05-FEATURE-SPECIFICATIONS.md) and [owner decisions](13-DECISIONS-AND-CONSTRAINTS.md).
