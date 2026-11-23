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
| My Family, additional profiles, add and edit | Implemented but not fully tested | [FamilyMembersPage.jsx](../src/FamilyMembersPage.jsx), [FamilyMemberProfile.jsx](../src/FamilyMemberProfile.jsx), [AddFamilyMemberPage.jsx](../src/AddFamilyMemberPage.jsx). Basic Details requests DOB immediately after Relationship. Name, relationship and DOB are required for creation. Mobile is optional only for a Son or Daughter under 18. The add form hides Mother and Father independently once present for the owner. Backend enforcement is deployed. The updated add form is local. |
| Remove an additional member | Backend deployed, end-to-end removal untested | Edit Profile offers a named confirmation at the bottom. The owner can remove an additional member record. The registered Self profile has no remove action. Photos and linked records are outside the removal scope. |
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

The repository checks duplicates among the signed-in owner's additional member profiles when adding a member or changing identifying details. A matching mobile number blocks the save unless the profile being saved is a Son or Daughter under 18. On the Add Family Member form, Basic Details checks the mobile number against the existing family list while typing and blocks Next for a conflicting number. A Son or Daughter under 18 can share a mobile number without a warning or confirmation based on the number alone. A matching name and mobile with the same or an unknown DOB still blocks the save, as does the same name, relationship and DOB with both phones blank. Matches on name and DOB with different numbers prompt review. The Mother and Father uniqueness rules still apply. The backend rules are deployed. The inline check is local.

In the local mobile frontend, the registered owner and additional family members use the same profile card layout. Details unavailable from the profile API display as dashes. Call and WhatsApp use a saved number, and Share shares the authenticated member-profile link. Both pencils open a prefilled details form. The optional Social Links section accepts Instagram, Facebook and LinkedIn profile URLs. A saved link enables its icon, and clearing the field disables it. Both Lambda updates are deployed. Live profile saves for these fields remain untested. The owner's relationship stays Self. Owner updates use the JWT-protected profile route documented in [API contracts](08-API-CONTRACTS.md). The camera on either avatar opens the photo picker.

- **Approved rules:** The registered account owner is distinct from additional members and forms the initial family alone. Member data must remain isolated by authenticated owner. Future record filters must use stable member IDs. Relationship labels serve as display text.
- **Current source:** The [dashboard](../src/MyFamilyPage.jsx#L161) puts the owner first and uses authenticated `GET /family/members` for additional entries. The tracked handler derives ownership from the authenticated identity and generates a UUID for each additional member. [Step 5 confirmed executable parity](07-AWS-INFRASTRUCTURE.md#lambda-source-reconciliation). End-to-end deployed behavior remains untested. Legacy photo-field compatibility needs verification. Photo flows use `PROFILE#SELF` for the owner and the additional member IDs for other profiles.
- **Current filters:** [CategoriesPage.jsx](../src/CategoriesPage.jsx#L132) starts with **All Family** and **Me**, excludes the self profile from additional options, keys each additional option by `memberId`, and can append names to duplicate relationship labels. The selection changes UI state. Category search filters card names, and family selection currently leaves stored records unfiltered.

Needs verification: release scope, international contact requirements, household sharing, and which statuses can be promoted after [Step 6 testing](12-TESTING-CHECKLIST.md).
