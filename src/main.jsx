
import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, useSearchParams } from "react-router-dom";

import App from "./App.jsx";
import SignupPage from "./auth/SignupPage.jsx";
import LoginPage from "./auth/LoginPage.jsx";
import ForgotPinPage from "./auth/ForgotPinPage.jsx";
import InactivityLock from "./auth/InactivityLock.jsx";
import MyFamilyPage from "./MyFamilyPage.jsx";
import FamilyMembersPage from "./FamilyMembersPage.jsx";
import AddFamilyMemberPage from "./AddFamilyMemberPage.jsx";
import FamilyMemberProfile from "./FamilyMemberProfile.jsx";
import MyProfile from "./MyProfile.jsx";
import CategoriesPage from "./CategoriesPage.jsx";
import EventsCalendarPage from "./EventsCalendarPage.jsx";
import DiaryPage from "./DiaryPage.jsx";
import DiaryEditorPage from "./DiaryEditorPage.jsx";
import NotesPage from "./NotesPage.jsx";
import NotesViewPage from "./NotesViewPage.jsx";
import NotesEditorPage from "./NotesEditorPage.jsx";
import NotesDetailsPage from "./NotesDetailsPage.jsx";
import SearchPage from "./SearchPage.jsx";
import VoiceSearchPage from "./VoiceSearchPage.jsx";
import SmartSuggestionsPage from "./SmartSuggestionsPage.jsx";
import NotificationsPage from "./NotificationsPage.jsx";

// Important Contacts integration
import ImportantContactsPage from "./ImportantContactsPage.jsx";

import "./App.css";
import "./AppScreenBackground.css";
import "./components/GlassHeader.css";
import "./responsive.css";

if (import.meta.env.PROD && window.isSecureContext && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch((error) => {
      console.warn("FamilyKit offline support could not start.", error);
    });
  }, { once: true });
}

const LandingNavPreview = import.meta.env.DEV ? lazy(() => import("./LandingNavPreview.jsx")) : null;

function LandingRoute() {
  const [params] = useSearchParams();
  if (LandingNavPreview && params.get("preview") === "landing-nav") {
    return <Suspense fallback={null}><LandingNavPreview /></Suspense>;
  }
  return <App />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-pin" element={<ForgotPinPage />} />
        <Route path="/my-family" element={<MyFamilyPage />} />
        <Route path="/family" element={<FamilyMembersPage />} />
        <Route path="/family/add" element={<AddFamilyMemberPage />} />
        <Route path="/family/:memberId" element={<FamilyMemberProfile />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/documents" element={<CategoriesPage />} />
        <Route path="/events" element={<EventsCalendarPage />} />
        <Route path="/diary" element={<DiaryPage />} />
        <Route path="/diary/new" element={<DiaryEditorPage />} />
        <Route path="/diary/:entryId" element={<DiaryEditorPage />} />
        <Route path="/diary/:entryId/edit" element={<DiaryEditorPage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/notes/new" element={<NotesEditorPage />} />
        <Route path="/notes/details" element={<NotesDetailsPage />} />
        <Route path="/notes/:noteId/edit" element={<NotesEditorPage />} />
        <Route path="/notes/:noteId" element={<NotesViewPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/search/voice" element={<VoiceSearchPage />} />
        <Route path="/smart-suggestions" element={<SmartSuggestionsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Important Contacts */}
        <Route
          path="/important-contacts"
          element={<ImportantContactsPage />}
        />
      </Routes>
      <InactivityLock />
    </BrowserRouter>
  </StrictMode>
);
