# Deployment guide

Last verified: 2026-11-22.

## Verified frontend deployment

The [GitHub repo](https://github.com/medhaara-innovations-dev/FAMILY-KIT-PRELIM_PAGE) has `DEV_BRANCH`, `main` and `PROD_BRANCH`. Amplify app `d1l6et3gtffr4z` in Sydney tracks `DEV_BRANCH` with automatic builds enabled. The checkout and remote development head matched at `da84351`, which had a successful Amplify job.

Amplify runs `npm ci`, then `npm run build`, and publishes `dist/`. The SPA rewrite serves `/index.html` for client routes. Automatic branch creation is off. Diff-based frontend deployment is disabled at app and branch level. The branch has no build-spec override. The observed frontend origin is `https://dev-branch.d1l6et3gtffr4z.amplifyapp.com`.

For an approved frontend release, review the diff, run the [frontend checks](12-TESTING-CHECKLIST.md), confirm the intended branch and push authorization, then inspect the Amplify job for the intended commit. Run approved smoke checks against the deployed site. Coordinate rollback through an explicitly approved known-good revision. The intended production promotion and rollback flow needs verification.

## Environment and testing

| Dimension | Current state |
|---|---|
| GitHub deployment branch | `DEV_BRANCH` |
| Amplify branch stage | `PRODUCTION` |
| Application lifecycle | Active development |
| Hosted environment | The current Amplify site serves the connected branch at the origin above. |
| Dedicated testing environment | Needs verification. The GitHub branch and Amplify stage labels establish no separation of Cognito, APIs or data. |

Define an owner-approved testing strategy in Step 6 covering environment isolation, synthetic accounts and data, access, and cleanup. See the [testing checklist](12-TESTING-CHECKLIST.md).

## Documentation-only synchronization

A normal Markdown-only push to `DEV_BRANCH` can trigger a build and frontend deployment. AWS Amplify supports skipping a commit's automatic build by appending `[skip-cd]` to its message. This applies to the connected Git workflow. App-specific behavior has not been exercised, and the marker governs automatic builds for that commit. [AWS Amplify build settings](https://docs.aws.amazon.com/amplify/latest/userguide/edit-build-settings.html)

After explicit Step 4C approval, verify the branch and remote head. Stage exactly the four root Markdown files and the 15 numbered guides, then validate the staged diff. Create the commit `docs: add FamilyKit architecture and maintenance guides [skip-cd]`. Recheck the remote head and confirm push authorization before a normal push to `origin/DEV_BRANCH`. Verify the GitHub commit and check Amplify for an unexpected job. Keep `backend/README.md` as a linked reference outside the commit.

## Documented Lambda procedure

The [backend README](../backend/README.md) describes a separate ZIP workflow. Before any approved code-only release, verify account, Region, function, current revision and rollback package. Review the matching directory and [API contract](08-API-CONTRACTS.md), then package only its `lambda_function.py` at the ZIP root. Release to the specified function only with explicit deployment approval. Verify code revision, runtime and an approved synthetic smoke case. Do not deploy either drifting handler until the owner approves its [reconciliation](07-AWS-INFRASTRUCTURE.md#unresolved-deployed-source-drift).

No tracked GitHub Actions workflow was found in the assessed branch. CodePipeline, CodeBuild and CodeConnections list permissions were denied. Any independent automatic Lambda deploy, Node.js build image version, custom domains, aliases, and production config need verification.

See [contributing](../CONTRIBUTING.md), [AWS inventory](07-AWS-INFRASTRUCTURE.md), and [troubleshooting](15-TROUBLESHOOTING.md).
