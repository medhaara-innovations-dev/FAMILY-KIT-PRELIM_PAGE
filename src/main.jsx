
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App.jsx";
import SignupPage from "./auth/SignupPage.jsx";
import LoginPage from "./auth/LoginPage.jsx";
import ForgotPinPage from "./auth/ForgotPinPage.jsx";
import MyFamilyPage from "./MyFamilyPage.jsx";
import FamilyMembersPage from "./FamilyMembersPage.jsx";
import AddFamilyMemberPage from "./AddFamilyMemberPage.jsx";
import FamilyMemberProfile from "./FamilyMemberProfile.jsx";
import MyProfile from "./MyProfile.jsx";

// Events Calendar
import EventsCalendarPage from "./EventsCalendarPage.jsx";

// Dear Diary
import DiaryPage from "./DiaryPage.jsx";
import DiaryEditorPage from "./DiaryEditorPage.jsx";

// My Notes
import NotesPage from "./NotesPage.jsx";
import NotesEditorPage from "./NotesEditorPage.jsx";
import NotesDetailsPage from "./NotesDetailsPage.jsx";

import "./App.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<App />} />

        {/* Authentication */}
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-pin" element={<ForgotPinPage />} />

        {/* Dashboard */}
        <Route path="/my-family" element={<MyFamilyPage />} />

        {/* Family Members */}
        <Route path="/family" element={<FamilyMembersPage />} />
        <Route path="/family/add" element={<AddFamilyMemberPage />} />
        <Route
          path="/family/:memberId"
          element={<FamilyMemberProfile />}
        />

        {/* My Profile */}
        <Route path="/my-profile" element={<MyProfile />} />

        {/* Events Calendar */}
        <Route path="/events" element={<EventsCalendarPage />} />

        {/* Dear Diary */}
        <Route path="/diary" element={<DiaryPage />} />
        <Route path="/diary/new" element={<DiaryEditorPage />} />
        <Route
          path="/diary/:entryId"
          element={<DiaryEditorPage />}
        />
        <Route
          path="/diary/:entryId/edit"
          element={<DiaryEditorPage />}
        />

        {/* My Notes */}
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/notes/new" element={<NotesEditorPage />} />
        <Route path="/notes/details" element={<NotesDetailsPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
