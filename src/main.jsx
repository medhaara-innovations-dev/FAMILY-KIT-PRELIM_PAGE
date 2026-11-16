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

import "./App.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-pin" element={<ForgotPinPage />} />
        <Route path="/my-family" element={<MyFamilyPage />} />
        <Route path="/family" element={<FamilyMembersPage />} />
        <Route path="/family/add" element={<AddFamilyMemberPage />} />
        <Route path="/family/:memberId" element={<FamilyMemberProfile />} />
        <Route path="/my-profile" element={<MyProfile />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
