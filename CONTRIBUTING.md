# Contributing to FamilyKit

Last verified: 2026-11-22.

1. Start with the [overview](docs/01-PROJECT-OVERVIEW.md) and [agent instructions](AGENTS.md). Check the current branch and working tree before editing.
2. Identify affected routes, components, data contracts and resources. For layout work, compare against the existing desktop and mobile behavior and consult the [design system](docs/03-UI-DESIGN-SYSTEM.md).
3. Keep changes focused. Use synthetic fixtures and preserve authenticated account boundaries. Update contracts and the relevant documentation alongside behavioral changes.
4. Run the [testing checklist](docs/12-TESTING-CHECKLIST.md) that matches your changes. Run `npm run build` for frontend changes.
5. Inspect `git status --short` and `git diff --check`. In the review summary, list affected areas, evidence, verification gaps and rollback implications.
6. Obtain explicit approval before committing, pushing or deploying. A push to `DEV_BRANCH` can trigger the [Amplify build](docs/11-DEPLOYMENT-GUIDE.md).

Needs verification: the intended PR review and production promotion process.
