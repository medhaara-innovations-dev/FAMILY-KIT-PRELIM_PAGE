# Frontend architecture

Last verified: 2026-11-22.

## Layout and responsibilities

| Location | Role |
|---|---|
| [index.html](../index.html), [src/main.jsx](../src/main.jsx) | SPA mount, React Strict Mode, BrowserRouter and route declarations |
| [src/App.jsx](../src/App.jsx), [src/App.css](../src/App.css) | Public landing, interactions and responsive compositions |
| [src/auth](../src/auth) | Signup, login, forgot PIN, Cognito client calls and session refresh |
| [src/api](../src/api) | Family Members, Profile Pictures, Diary, Notes, Important Contacts wrappers |
| [src/components](../src/components) | ProfileAvatar, PageTransition and shared glass-header styling |
| [src/assets/images](../src/assets/images) | Illustrations, logos, category art and mockups |
| [src](../src) feature pages and styles | Screen state, navigation, forms and CSS |

## Routes

The public landing at `/` is implemented in `App.jsx` and `App.css`. The original draft remains available in development at `/?preview=landing-nav` for comparison. Navigation links jump to sections on the current page. The Early Access form validates locally and does not submit or store contact details. Footer items without confirmed destinations are placeholders.

| Route group | Primary components |
|---|---|
| `/`, `/signup`, `/login`, `/forgot-pin` | App and respective auth pages |
| `/my-family`, `/my-profile` | MyFamilyPage dashboard and MyProfile |
| `/family`, `/family/add`, `/family/:memberId` | FamilyMembersPage, AddFamilyMemberPage, FamilyMemberProfile |
| `/categories`, `/events`, `/important-contacts` | CategoriesPage, EventsCalendarPage, ImportantContactsPage |
| `/diary`, `/diary/new`, `/diary/:entryId`, `/diary/:entryId/edit` | DiaryPage and DiaryEditorPage |
| `/notes`, `/notes/new`, `/notes/details`, `/notes/:noteId`, `/notes/:noteId/edit` | NotesPage, NotesEditorPage, NotesDetailsPage, NotesViewPage |
| `/search`, `/search/voice`, `/smart-suggestions`, `/notifications` | SearchPage, VoiceSearchPage, SmartSuggestionsPage, NotificationsPage |

## Responsive layouts and PWA

The public landing offers to install FamilyKit when a secure browser signals that installation is available. Safari on iPhone and iPad shows Add to Home Screen instructions. The offer is hidden in standalone mode and stays dismissed for the current tab session.

Shared app motion in `src/responsive.css` adds short screen, card, and dialog entrances, desktop hover lifts, and mobile press and navigation feedback. The rules follow the device’s reduced-motion setting. The public landing manages its own animations.

The Categories member filter uses the shared ProfileAvatar component to show the same profile photos as My Family. The All Family option has no avatar.

Family Member Profile and the read-only self profile use the same compact card, actions and Connected Documents controls at every viewport width. Wider viewports increase card width, spacing and action sizes. A family member’s email and address are available under Profile actions on all devices.

The dashboard uses a single column on narrow displays and two columns on wider displays. From 1200 px, signed-in pages with primary navigation use a full-height left panel. The dashboard uses a main column for reminders, events and family profiles, with Quick Actions and Smart Suggestions in an adjacent column. Categories uses horizontal cards at that breakpoint. Signed-in screens with primary navigation use the shared FamilyBottomNav component. The desktop sidebar places Add above the links and highlights the active section. Narrower widths use the same five-item bottom navigation. Categories, the family directory and supported lists use wider grids from 768 px. Responsive overrides are in `src/responsive.css`.

The local Vite configuration generates a release-specific service worker from `src/service-worker.js` for production builds. The manifest at `public/manifest.webmanifest` sets standalone display, app icons, and startup colors. The worker precaches built JavaScript, CSS, and an offline screen. Navigation fetches from the network and displays that screen if the request fails. API responses, credentials, documents, and member records are outside its cache. Registration requires HTTPS or loopback. Use the production preview to check worker behavior locally.

The [package manifest](../package.json) defines Vite dev, build and preview scripts. The [lockfile](../package-lock.json) records React 19.3.1, Vite 8.3.5 and React Router 7.18.5. Cognito configuration lives in [authService.js](../src/auth/authService.js) and application base URLs live in API modules. The reviewed setup hardcodes environment endpoints in client source. Dev/production separation needs verification.

Page-level session checks coordinate with [sessionManager.js](../src/auth/sessionManager.js). Domain wrappers send protected requests through the session path and use module-specific error handling. See [auth and security](10-AUTHENTICATION-SECURITY.md), [API contracts](08-API-CONTRACTS.md), and [design system](03-UI-DESIGN-SYSTEM.md).
