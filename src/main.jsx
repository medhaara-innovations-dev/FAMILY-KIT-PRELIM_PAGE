import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App.jsx";
import SignupPage from "./auth/SignupPage.jsx";
import LoginPage from "./auth/LoginPage.jsx";
import MyFamilyPage from "./MyFamilyPage.jsx";

import "./App.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/my-family" element={<MyFamilyPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);