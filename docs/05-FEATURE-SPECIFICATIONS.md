# Feature specifications

Last verified: 2026-11-22.

Status reflects the reviewed source and deployed configuration. No end-to-end user feature was classified **Implemented and tested** during discovery.

| Feature | Status | Evidence and business rules |
|---|---|---|
| Landing and Contact Us | Partially implemented | [App.jsx](../src/App.jsx) presents public content, FAQ, and auth navigation. Contact form validates locally and displays completion without submitting. |
| Email registration and OTP | Implemented but not fully tested | [SignupPage.jsx](../src/auth/SignupPage.jsx) and Cognito handle signup, six-digit confirmation, resend, profile review and progression. |
| Profile creation and PIN | Implemented but not fully tested | [SignupPage.jsx](../src/auth/SignupPage.jsx) requires identity details and matching four-digit PIN entries. PIN API saves the profile and verification material. |
| Login and forgot PIN | Implemented but not fully tested | [LoginPage.jsx](../src/auth/LoginPage.jsx), [ForgotPinPage.jsx](../src/auth/ForgotPinPage.jsx), Cognito, and the PIN API. See [auth](10-AUTHENTICATION-SECURITY.md). |
| Google sign-in | Requires verification | [authService.js](../src/auth/authService.js) has OAuth handling. Provider setup and round trip need verification. |
| Profile sync and dashboard | Implemented but not fully tested | [MyFamilyPage.jsx](../src/MyFamilyPage.jsx) and [MyProfile.jsx](../src/MyProfile.jsx) load the registered profile and use session checks. |
| My Family, additional profiles, add and edit | Implemented but not fully tested | [FamilyMembersPage.jsx](../src/FamilyMembersPage.jsx), [FamilyMemberProfile.jsx](../src/FamilyMemberProfile.jsx), [AddFamilyMemberPage.jsx](../src/AddFamilyMemberPage.jsx). Required on creation: name, relationship, mobile. Optional attributes are in the [contract](08-API-CONTRACTS.md). The deployed route inventory has no delete operation. |
| Family tree | UI only | The family member screen has a placeholder tree area. |
| Profile photo management | Implemented but not fully tested | [Photo API wrapper](../src/api/profilePicturesApi.js) and [cropper](../src/ProfilePhotoCropper.jsx). JPEG, PNG, WebP, up to 5 MiB, with owner-scoped presigned access. |
| Categories and relationship filters | Partially implemented | [CategoriesPage.jsx](../src/CategoriesPage.jsx) searches card names and generates filter options from member data. Relationship selection does not filter stored records. Some cards have no destination. |
| Events and reminders | UI only | [EventsCalendarPage.jsx](../src/EventsCalendarPage.jsx) renders month, today and filter state. Create is a placeholder. |
| Diary | Implemented but not fully tested | [DiaryEditorPage.jsx](../src/DiaryEditorPage.jsx) and Diary API. Valid date and nonempty content. Server title limit is 200, editor limit is 150, server content limit is 50,000. |
| Notes | Implemented but not fully tested | [NotesEditorPage.jsx](../src/NotesEditorPage.jsx) and Notes API. Content required. A reminder flag is supported in data, and delivery needs verification. |
| Important Contacts | Implemented but not fully tested | [ImportantContactsPage.jsx](../src/ImportantContactsPage.jsx) and Contacts API. Category and role must match. Up to two Emergency contacts per owner, enforced by backend writes. UI is India-specific. |
| Documents | Planned | Landing and category UI mention it. No document route or backend mapping was found. |
| Smart suggestions, search, voice and notifications | UI only | [SmartSuggestionsPage.jsx](../src/SmartSuggestionsPage.jsx), [SearchPage.jsx](../src/SearchPage.jsx), [VoiceSearchPage.jsx](../src/VoiceSearchPage.jsx), [NotificationsPage.jsx](../src/NotificationsPage.jsx). No verified model, full-record search, speech-to-search or notification delivery integration. |

## Family ownership and filtering

- **Approved rules:** The registered account owner is distinct from additional members and forms the initial family alone. Member data must remain isolated by authenticated owner. Future record filters must use stable member IDs. Relationship labels serve as display text.
- **Current source:** The [dashboard](../src/MyFamilyPage.jsx#L161) puts the owner first and uses authenticated `GET /family/members` for additional entries. The tracked handler derives ownership from the authenticated identity and generates a UUID for each additional member. Exact deployed behavior is subject to [Step 5](07-AWS-INFRASTRUCTURE.md#unresolved-deployed-source-drift). Photo flows use `PROFILE#SELF` for the owner and the additional member IDs for other profiles.
- **Current filters:** [CategoriesPage.jsx](../src/CategoriesPage.jsx#L132) starts with **All Family** and **Me**, excludes the self profile from additional options, keys each additional option by `memberId`, and can append names to duplicate relationship labels. The selection changes UI state. Category search filters card names, and family selection currently leaves stored records unfiltered.

Needs verification: release scope, international contact requirements, household sharing, and which statuses can be promoted after [Step 6 testing](12-TESTING-CHECKLIST.md).
