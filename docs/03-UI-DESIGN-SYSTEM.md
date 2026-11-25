# UI design system

Last verified: 2026-11-22. Approved references below come from the owner. Responsive rendering remains untested.

## Verified source values

| Surface | Values and behavior | Source |
|---|---|---|
| Global palette | White #FFFFFF, ink #050011, muted #4D485A, lavender #EBE6F7, border #EDEAF3, yellow #DAD05A. Primary #2D0B84, hover #3D2184, pressed #130438, focus #B294FF. | [App.css](../src/App.css) |
| Typography | Poppins headings, Mulish body. Imported Poppins weights 400–800, Mulish weights 300–800 across duplicate imports. Landing mobile step heading 16px/23px at 600, body 14px/21px at 400. | [App.css](../src/App.css) |
| App background | 180-degree gradient from #C4ADFF at 0% to #F0EEF3 at 50%. | [AppScreenBackground.css](../src/AppScreenBackground.css) |
| Glass and header | Fixed glass headers use 12px backdrop blur. Add Member reserves 77px for the header and overrides it to 65px at its responsive rule. | [GlassHeader.css](../src/components/GlassHeader.css), [AddFamilyMemberPage.css](../src/AddFamilyMemberPage.css) |
| Landing cards | Step-card rules include 16px radius and 13px padding. A later mobile override uses 11px radius, 11px 10px 11px 34px padding, and a 0 4px 10px #2D0B8408 shadow. | [App.css](../src/App.css) |
| Actions and avatars | Shared primary states use the purple tokens. Icon buttons, circular avatars and image cropping appear throughout account and family screens. | [ProfileAvatar.jsx](../src/components/ProfileAvatar.jsx), [ProfilePhotoCropper.jsx](../src/ProfilePhotoCropper.jsx), [MyProfile.css](../src/MyProfile.css) |
| Responsive layout | The landing swaps compositions at 700/701px. Auth rules use 768/769px and 1024/1025px, plus small-width overrides around 380/390px and a 1440px Forgot PIN rule. Signup presents a mobile keypad. | [App.jsx](../src/App.jsx), [SignupPage.css](../src/auth/SignupPage.css), [ForgotPinPage.css](../src/auth/ForgotPinPage.css) |
| App navigation | Home, My Family, center Add and Categories repeat on dashboard screens. Each page controls active state and responsive positioning. | [MyFamilyPage.jsx](../src/MyFamilyPage.jsx), [CategoriesPage.css](../src/CategoriesPage.css), [EventsCalendarPage.css](../src/EventsCalendarPage.css) |

## Owner-approved requirements

The shared app navigation uses the approved Home outline and outline Categories grid from the icon reference. The active item uses the FamilyKit purple highlight, while unavailable controls are muted. Camera controls use the approved Camera glyph. Facebook, Instagram, and LinkedIn use their company artwork, and Categories keeps colored icon tiles.

Quick Actions, Categories, and the Notes screen share the stacked Notes SVG. Important Contacts uses the contact card and handset SVG across its entry points and empty state. WhatsApp uses the same SVG artwork in member lists, profile cards, and contact cards. The category tiles and search filters render SVG glyphs with their existing colors. Shared icon implementations are in [ReferenceIcons.jsx](../src/components/ReferenceIcons.jsx).

| Design area | Approved specification |
|---|---|
| Colors | Primary purple `#2D0B84`, lavender surface `#EBE6F7`, primary text `#050011`, secondary text `#4D485A` |
| Dashboard gradient | `#C4ADFF` to `#F0EEF3` |
| Glass header | `blur(12px)` |
| Typography | Poppins headings and Mulish body |

Preserve approved desktop and mobile layouts, typography, spacing, gradients and component behavior. Changes to approved designs and new colors require explicit approval. Other source tokens and breakpoints need owner confirmation before adoption as standards.

### Approved audit rollout

Shared app navigation switches from the bottom bar to the desktop sidebar at 1200 px. Bottom-bar labels use Poppins 12/16, with semibold for the active item. Home, Categories and Events apply the approved responsive heading scale. Categories uses the audit's verified color pairs where supplied. Education retains its existing treatment because the audit does not list a verified pair for it. The shared glass header applies `blur(12px)`. [Responsive styles](../src/responsive.css) [Shared header CSS](../src/components/GlassHeader.css#L24)

## Inconsistencies and open decisions

Repeated font imports, page-specific breakpoints, later CSS overrides, and duplicated header and navigation markup make the cascade and rendered differences important. Use the source inventory below to locate authored values, then inspect the applicable selector, breakpoint, and cascade in context. Decide which responsive widths, type scale and component variants should be approved standards before consolidating.

See [frontend architecture](06-FRONTEND-ARCHITECTURE.md) and [testing](12-TESTING-CHECKLIST.md).

## Source token and media-query inventory

The entries below index distinct custom-property declarations and media queries in the stylesheets. Values are authored CSS. Where the same name has multiple values, use the cited file and selector to determine which declaration applies. Component literals such as padding, shadows and icon dimensions are defined in the linked stylesheets.

### AddFamilyMemberPage.css

**Custom properties** — [`--fk-fixed-header-height: 77px`](../src/AddFamilyMemberPage.css#L6), [`--fk-add-purple: #2D0B84`](../src/AddFamilyMemberPage.css#L7), [`--fk-add-dark: #130438`](../src/AddFamilyMemberPage.css#L8), [`--fk-add-lavender: #EBE6F7`](../src/AddFamilyMemberPage.css#L9), [`--fk-add-border: #EDEAF3`](../src/AddFamilyMemberPage.css#L10), [`--fk-add-muted: #4D485A`](../src/AddFamilyMemberPage.css#L11), [`--fk-fixed-header-height: 65px`](../src/AddFamilyMemberPage.css#L333)

**Media queries** — [`@media (max-width: 600px)`](../src/AddFamilyMemberPage.css#L331)

### App.css

**Custom properties** — [`--bg: #FFFFFF`](../src/App.css#L6), [`--hero: #EBE6F7`](../src/App.css#L7), [`--ink: #050011`](../src/App.css#L8), [`--muted: #4D485A`](../src/App.css#L9), [`--purple: #2D0B84`](../src/App.css#L10), [`--purple-dark: #130438`](../src/App.css#L11), [`--purple-card: #130438`](../src/App.css#L12), [`--lavender: #EBE6F7`](../src/App.css#L13), [`--line: #EDEAF3`](../src/App.css#L14), [`--yellow: #DAD05A`](../src/App.css#L15), [`--fk-primary: #2D0B84`](../src/App.css#L16), [`--fk-primary-hover: #3D2184`](../src/App.css#L17), [`--fk-primary-pressed: #130438`](../src/App.css#L18), [`--fk-focus: #B294FF`](../src/App.css#L19), [`--why-purple: #2D0B84`](../src/App.css#L7167), [`--why-body: #4D485A`](../src/App.css#L7168), [`--why-card: #FFFFFF`](../src/App.css#L7169), [`--why-border: #EDEAF3`](../src/App.css#L7170), [`--how-purple: #2D0B84`](../src/App.css#L7525), [`--how-purple-soft: #EDEAF3`](../src/App.css#L7526), [`--how-border: #EDEAF3`](../src/App.css#L7527), [`--how-body: #4D485A`](../src/App.css#L7528), [`--feature-accent: #2D0B84`](../src/App.css#L8229), [`--feature-tint: #EDEAF3`](../src/App.css#L8230), [`--feature-accent: #3D2184`](../src/App.css#L8264), [`--faq-purple: #2D0B84`](../src/App.css#L8511), [`--fk-type-hero: clamp(2.375rem, 4.25vw, 4rem)`](../src/App.css#L8843), [`--fk-type-section: clamp(1.75rem, 2.9vw, 2.625rem)`](../src/App.css#L8844), [`--fk-type-card: clamp(1.125rem, 1.7vw, 1.5rem)`](../src/App.css#L8845), [`--fk-type-body: clamp(1rem, 1.1vw, 1.125rem)`](../src/App.css#L8846), [`--fk-type-label: .875rem`](../src/App.css#L8847), [`--fk-type-hero: clamp(2.25rem, 8.6vw, 2.75rem)`](../src/App.css#L8893), [`--fk-type-section: clamp(1.75rem, 6.6vw, 2.125rem)`](../src/App.css#L8894), [`--fk-type-card: clamp(1.125rem, 4.8vw, 1.375rem)`](../src/App.css#L8895), [`--fk-type-body: 1rem`](../src/App.css#L8896), [`--fk-space-1: clamp(8px, 1vw, 12px)`](../src/App.css#L9012), [`--fk-space-2: clamp(12px, 1.5vw, 18px)`](../src/App.css#L9013), [`--fk-space-3: clamp(16px, 2vw, 24px)`](../src/App.css#L9014), [`--fk-space-4: clamp(24px, 3vw, 36px)`](../src/App.css#L9015), [`--fk-space-section: clamp(44px, 5vw, 76px)`](../src/App.css#L9016), [`--fk-type-hero: clamp(3.5rem, 4.6vw, 4rem)`](../src/App.css#L9358), [`--fk-type-section: clamp(2rem, 3.05vw, 2.75rem)`](../src/App.css#L9359), [`--fk-type-card: clamp(1.25rem, 1.65vw, 1.5rem)`](../src/App.css#L9360), [`--fk-type-body: clamp(1rem, 1.15vw, 1.125rem)`](../src/App.css#L9361), [`--fk-type-hero: clamp(2.375rem,9vw,2.75rem)`](../src/App.css#L9387), [`--fk-type-section: clamp(1.75rem,6.7vw,2.125rem)`](../src/App.css#L9388), [`--fk-type-card: clamp(1.25rem,4.8vw,1.5rem)`](../src/App.css#L9389), [`--fk-type-hero: 2.375rem`](../src/App.css#L9405), [`--fk-type-section: 1.75rem`](../src/App.css#L9405), [`--fk-type-hero: 64px`](../src/App.css#L9526), [`--fk-type-section: 42px`](../src/App.css#L9527), [`--fk-type-card: 24px`](../src/App.css#L9528), [`--fk-type-body: 18px`](../src/App.css#L9529), [`--fk-type-label: 14px`](../src/App.css#L9530), [`--fk-type-hero: 42px`](../src/App.css#L9571), [`--fk-type-section: 32px`](../src/App.css#L9572), [`--fk-type-card: 21px`](../src/App.css#L9573), [`--fk-type-body: 16px`](../src/App.css#L9574)

**Media queries** — [`@media (min-width:701px)`](../src/App.css#L459), [`@media (max-width:700px)`](../src/App.css#L464), [`@media (max-width:380px)`](../src/App.css#L2021), [`@media (max-width:420px)`](../src/App.css#L3067), [`@media (max-width:390px)`](../src/App.css#L3155), [`@media (max-width: 700px)`](../src/App.css#L3406), [`@media (max-width:370px)`](../src/App.css#L3576), [`@media (min-width:901px)`](../src/App.css#L6683), [`@media (min-width:901px) and (max-width:1180px)`](../src/App.css#L6718), [`@media (max-width:900px)`](../src/App.css#L6726), [`@media (min-width: 901px)`](../src/App.css#L6889), [`@media (min-width:901px) and (max-width: 1180px)`](../src/App.css#L6988), [`@media (min-width:701px) and (max-width: 1050px)`](../src/App.css#L7368), [`@media (max-width:1050px) and (min-width: 701px)`](../src/App.css#L7635), [`@media (max-width: 370px)`](../src/App.css#L7851), [`@media (max-width:375px)`](../src/App.css#L8141), [`@media (max-width: 768px)`](../src/App.css#L8153), [`@media(max-width:700px)`](../src/App.css#L8390), [`@media(max-width:900px) and (min-width:701px)`](../src/App.css#L8580), [`@media (min-width: 701px) and (max-width: 1024px)`](../src/App.css#L9059), [`@media (max-width: 375px)`](../src/App.css#L9125), [`@media (min-width: 701px)`](../src/App.css#L9139), [`@media (max-width: 360px)`](../src/App.css#L9222), [`@media (max-width:360px)`](../src/App.css#L9404), [`@media screen and (min-width: 1024px)`](../src/App.css#L9524), [`@media (max-width: 1023px)`](../src/App.css#L9569), [`@media screen and (max-width: 1023px)`](../src/App.css#L9609), [`@media screen and (min-width: 901px)`](../src/App.css#L9663), [`@media screen and (max-width: 767px)`](../src/App.css#L9682), [`@media screen and (min-width: 768px) and (max-width: 1199px)`](../src/App.css#L9705), [`@media screen and (min-width: 1200px)`](../src/App.css#L9711), [`@media (max-width: 767px)`](../src/App.css#L9739), [`@media screen and (min-width: 768px)`](../src/App.css#L9767)

### CategoriesPage.css

**Custom properties** — [`--cat-purple: #2d0b84`](../src/CategoriesPage.css#L7)

**Media queries** — [`@media (min-width: 768px)`](../src/CategoriesPage.css#L478), [`@media (max-width: 390px)`](../src/CategoriesPage.css#L565), [`@media (prefers-reduced-motion: reduce)`](../src/CategoriesPage.css#L620)

### DiaryEditorPage.css

**Media queries** — [`@media (min-width: 700px)`](../src/DiaryEditorPage.css#L114), [`@media (max-width: 600px)`](../src/DiaryEditorPage.css#L119)

### DiaryPage.css

**Custom properties** — [`--diary-purple: #2d0b84`](../src/DiaryPage.css#L2)

**Media queries** — [`@media (max-width: 600px)`](../src/DiaryPage.css#L344), [`@media (max-width: 360px)`](../src/DiaryPage.css#L358), [`@media (min-width: 768px)`](../src/DiaryPage.css#L464), [`@media (prefers-reduced-motion: reduce)`](../src/DiaryPage.css#L465)

### EventsCalendarPage.css

**Media queries** — [`@media(min-width:561px)`](../src/EventsCalendarPage.css#L21), [`@media (min-width: 768px)`](../src/EventsCalendarPage.css#L107), [`@media (prefers-reduced-motion: reduce)`](../src/EventsCalendarPage.css#L108)

### FamilyMemberProfile.css

**Custom properties** — [`--fk-fixed-header-height: 79px`](../src/FamilyMemberProfile.css#L6), [`--fk-profile-purple: #2D0B84`](../src/FamilyMemberProfile.css#L7), [`--fk-profile-dark: #130438`](../src/FamilyMemberProfile.css#L8), [`--fk-profile-lavender: #EBE6F7`](../src/FamilyMemberProfile.css#L9), [`--fk-profile-border: #EDEAF3`](../src/FamilyMemberProfile.css#L10), [`--fk-profile-muted: #4D485A`](../src/FamilyMemberProfile.css#L11), [`--fk-fixed-header-height: 67px`](../src/FamilyMemberProfile.css#L380)

**Media queries** — [`@media (max-width: 600px)`](../src/FamilyMemberProfile.css#L378)

### FamilyMembersPage.css

**Custom properties** — [`--fk-purple: #2D0B84`](../src/FamilyMembersPage.css#L6), [`--fk-purple-dark: #130438`](../src/FamilyMembersPage.css#L7), [`--fk-lavender: #EBE6F7`](../src/FamilyMembersPage.css#L8), [`--fk-text: #050011`](../src/FamilyMembersPage.css#L9), [`--fk-muted: #4D485A`](../src/FamilyMembersPage.css#L10), [`--fk-border: #EDEAF3`](../src/FamilyMembersPage.css#L11)

**Media queries** — [`@media (max-width: 600px)`](../src/FamilyMembersPage.css#L283), [`@media (min-width: 768px)`](../src/FamilyMembersPage.css#L561), [`@media (prefers-reduced-motion: reduce)`](../src/FamilyMembersPage.css#L564)

### ImportantContactsPage.css

**Custom properties** — [`--ic-purple: #2D0B84`](../src/ImportantContactsPage.css#L2), [`--ic-deep: #130438`](../src/ImportantContactsPage.css#L3), [`--ic-light: #EBE6F7`](../src/ImportantContactsPage.css#L4), [`--ic-text: #050011`](../src/ImportantContactsPage.css#L5), [`--ic-secondary: #4D485A`](../src/ImportantContactsPage.css#L6), [`--ic-border: #EDEAF3`](../src/ImportantContactsPage.css#L7)

**Media queries** — [`@media (min-width: 768px)`](../src/ImportantContactsPage.css#L137), [`@media (prefers-reduced-motion: reduce)`](../src/ImportantContactsPage.css#L145), [`@media (max-width: 480px)`](../src/ImportantContactsPage.css#L170)

### MyFamilyPage.css

**Custom properties** — [`--fk-purple: #2d0b84`](../src/MyFamilyPage.css#L5), [`--fk-soft-purple: #a88be9`](../src/MyFamilyPage.css#L6), [`--fk-text: #201a2d`](../src/MyFamilyPage.css#L7)

**Media queries** — [`@media (max-width: 390px)`](../src/MyFamilyPage.css#L668), [`@media (min-width: 768px)`](../src/MyFamilyPage.css#L717), [`@media (prefers-reduced-motion: reduce)`](../src/MyFamilyPage.css#L813)

### MyProfile.css

**Custom properties** — [`--fk-fixed-header-height: 83px`](../src/MyProfile.css#L3), [`--fk-fixed-header-height: 71px`](../src/MyProfile.css#L127)

**Media queries** — [`@media (max-width: 600px)`](../src/MyProfile.css#L126)

### NotesDetailsPage.css

**Media queries** — [`@media (max-width: 480px)`](../src/NotesDetailsPage.css#L271)

### NotesEditorPage.css

**Media queries** — [`@media (max-width: 480px)`](../src/NotesEditorPage.css#L146)

### NotesPage.css

**Custom properties** — [`--notes-purple: #2d0b84`](../src/NotesPage.css#L3)

**Media queries** — [`@media (min-width: 768px)`](../src/NotesPage.css#L312), [`@media (max-width: 390px)`](../src/NotesPage.css#L322)

### NotesViewPage.css

**Media queries** — [`@media (min-width: 768px)`](../src/NotesViewPage.css#L156)

### NotificationsPage.css

**Custom properties** — [`--notif-purple: #2d0b84`](../src/NotificationsPage.css#L2)

**Media queries** — [`@media(max-width:390px)`](../src/NotificationsPage.css#L37)

### SearchPage.css

**Custom properties** — [`--search-purple: #2d0b84`](../src/SearchPage.css#L3)


### SmartSuggestionsPage.css

**Custom properties** — [`--ss-purple: #2d0b84`](../src/SmartSuggestionsPage.css#L8)

**Media queries** — [`@media (max-width: 390px)`](../src/SmartSuggestionsPage.css#L401)

### VoiceSearchPage.css

**Custom properties** — [`--voice-purple: #2d0b84`](../src/VoiceSearchPage.css#L3)


### ForgotPinPage.css

**Custom properties** — [`--fp-purple: #2d0b84`](../src/auth/ForgotPinPage.css#L23), [`--fp-dark: #130438`](../src/auth/ForgotPinPage.css#L24), [`--fp-hover: #3d2184`](../src/auth/ForgotPinPage.css#L25), [`--fp-light: #ebe6f7`](../src/auth/ForgotPinPage.css#L26), [`--fp-border: #edeaf3`](../src/auth/ForgotPinPage.css#L27), [`--fp-text: #050011`](../src/auth/ForgotPinPage.css#L28), [`--fp-secondary: #4d485a`](../src/auth/ForgotPinPage.css#L29), [`--fp-muted: #9b9b9d`](../src/auth/ForgotPinPage.css#L30)

**Media queries** — [`@media screen and (min-width: 1440px)`](../src/auth/ForgotPinPage.css#L531), [`@media screen and (min-width: 769px) and (max-width: 1439px)`](../src/auth/ForgotPinPage.css#L585), [`@media screen and (max-width: 768px)`](../src/auth/ForgotPinPage.css#L651), [`@media screen and (max-width: 390px)`](../src/auth/ForgotPinPage.css#L763)

### LoginPage.css

On mobile, the “Welcome back” heading follows the back button and FamilyKit header.

**Media queries** — [`@media (min-width: 769px) and (max-width: 1024px)`](../src/auth/LoginPage.css#L36), [`@media (max-width: 768px)`](../src/auth/LoginPage.css#L54), [`@media (max-width: 380px)`](../src/auth/LoginPage.css#L97), [`@media (prefers-reduced-motion: reduce)`](../src/auth/LoginPage.css#L131), [`@media (min-width: 1025px)`](../src/auth/LoginPage.css#L156)

### SignupPage.css

**Media queries** — [`@media (min-width: 769px) and (max-width: 1024px)`](../src/auth/SignupPage.css#L65), [`@media (max-width: 768px)`](../src/auth/SignupPage.css#L219), [`@media (max-width: 380px)`](../src/auth/SignupPage.css#L472), [`@media (min-width: 1025px)`](../src/auth/SignupPage.css#L582), [`@media (max-width: 1024px)`](../src/auth/SignupPage.css#L1506), [`@media (prefers-reduced-motion: reduce)`](../src/auth/SignupPage.css#L2583)
