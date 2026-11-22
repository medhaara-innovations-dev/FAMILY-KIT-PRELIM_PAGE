# FamilyKit

FamilyKit is a React web app for organizing family profiles, important contacts, notes, and diary entries. It started as a mobile landing-page implementation and now has a deployed AWS backend.

Last verified: 2026-11-22.

## Local development

From the repository root, use npm with Node.js `^20.19.0 || >=22.12.0`, as required by the locked Vite package. The Amplify build image's Node.js version needs verification.

```sh
npm ci
npm run dev
npm run build
```

Open the URL printed by Vite, usually `http://localhost:5173`. The API and photo bucket CORS configurations observed in Sydney allow the Amplify development origin. An unauthenticated local screen review can work independently of those services.

Poppins is used for headings and Mulish for body text. The landing page uses React markup and CSS, with illustrative images and mockups under `src/assets/images/`.

## Documentation

| Document | Use it for |
|---|---|
| [01 Project overview](docs/01-PROJECT-OVERVIEW.md) | Product scope and verification baseline |
| [02 System architecture](docs/02-SYSTEM-ARCHITECTURE.md) | Components and data flows |
| [03 UI design system](docs/03-UI-DESIGN-SYSTEM.md) | Source-derived styling and approval boundaries |
| [04 User journeys](docs/04-USER-JOURNEYS.md) | Signup, login, recovery, profiles and records |
| [05 Feature specifications](docs/05-FEATURE-SPECIFICATIONS.md) | Feature status and business rules |
| [06 Frontend architecture](docs/06-FRONTEND-ARCHITECTURE.md) | Routes, components and configuration |
| [07 AWS infrastructure](docs/07-AWS-INFRASTRUCTURE.md) | Live resource inventory and approved Lambda source baseline |
| [08 API contracts](docs/08-API-CONTRACTS.md) | Methods, payloads and response formats |
| [09 Database schema](docs/09-DATABASE-SCHEMA.md) | DynamoDB keys, item models and ownership |
| [10 Authentication and security](docs/10-AUTHENTICATION-SECURITY.md) | Identity, sessions and security requirements |
| [11 Deployment guide](docs/11-DEPLOYMENT-GUIDE.md) | GitHub, Amplify, Lambda and rollback |
| [12 Testing checklist](docs/12-TESTING-CHECKLIST.md) | Build checks and synthetic end-to-end cases |
| [13 Decisions and constraints](docs/13-DECISIONS-AND-CONSTRAINTS.md) | Owner approvals and unresolved decisions |
| [14 Roadmap](docs/14-ROADMAP.md) | Proposed sequence and feature candidates |
| [15 Troubleshooting](docs/15-TROUBLESHOOTING.md) | Symptoms and safe diagnostics |

See [AGENTS.md](AGENTS.md) for AI contributor instructions, [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow, and [CHANGELOG.md](CHANGELOG.md) for tracked changes. The [backend README](backend/README.md) covers handler packaging and environment variable names.
