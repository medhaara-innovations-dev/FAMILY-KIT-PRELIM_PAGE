# Project overview

Last verified: 2026-11-22.

FamilyKit gives a household one place to organize profiles, important contacts, notes and diary entries. The landing page also presents a broader vision for documents, reminders and AI-assisted organization. See the [feature status](05-FEATURE-SPECIFICATIONS.md) for current scope.

## Working baseline

- GitHub repository: `medhaara-innovations-dev/FAMILY-KIT-PRELIM_PAGE`.
- Assessed branch and commit: `DEV_BRANCH` at `da84351`.
- AWS profile and Region used for discovery: `familykit` in `ap-southeast-2`.
- Amplify, APIs, and resource metadata were verified against AWS. The assessment did not exercise user journeys or access customer records.

## Source and ownership

The frontend and Lambda handler sources live in the same repository. Amplify hosts the frontend. AWS runs separately packaged handlers, with two unresolved differences from Git. See [architecture](02-SYSTEM-ARCHITECTURE.md), [AWS inventory](07-AWS-INFRASTRUCTURE.md), and [decisions](13-DECISIONS-AND-CONSTRAINTS.md).

Needs verification: launch scope, intended production branch, and support ownership.
