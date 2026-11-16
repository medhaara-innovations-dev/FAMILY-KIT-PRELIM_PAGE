
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./MyFamilyPage.css";
import familyKitLogo from "./assets/images/Family kit Logo.png";

import { getFamilyKitProfile } from "./auth/authService.js";

export default function MyFamilyPage() {
  const navigate = useNavigate();

  // Existing Cognito authentication token
  const accessToken = sessionStorage.getItem(
    "familykit_access_token"
  );

  // Registered user profile
  const [yourName, setYourName] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  // =====================================================
  // AUTHENTICATION PROTECTION
  // =====================================================

  useEffect(() => {
    if (!accessToken) {
      navigate("/login", {
        replace: true,
      });
    }
  }, [accessToken, navigate]);

  // =====================================================
  // FETCH REGISTERED USER NAME FROM AWS
  // =====================================================

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let active = true;

    async function loadUserProfile() {
      try {
        const profile = await getFamilyKitProfile(
          accessToken
        );

        if (!active) return;

        setYourName(profile.yourName || "");
        setProfileError("");
      } catch (error) {
        if (!active) return;

        console.error(
          "Unable to retrieve FamilyKit profile:",
          error
        );

        setProfileError(
          error.message ||
            "Unable to load your profile."
        );
      } finally {
        if (active) {
          setProfileLoading(false);
        }
      }
    }

    loadUserProfile();

    return () => {
      active = false;
    };
  }, [accessToken]);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    sessionStorage.removeItem(
      "familykit_access_token"
    );

    sessionStorage.removeItem(
      "familykit_id_token"
    );

    sessionStorage.removeItem(
      "familykit_refresh_token"
    );

    navigate("/", {
      replace: true,
    });
  };

  // Prevent protected content appearing before redirect
  if (!accessToken) {
    return null;
  }

  return (
    <div className="my-family-page">
      {/* HEADER */}
      <header className="my-family-header">
        <div className="my-family-brand">
          <img
            src={familyKitLogo}
            alt="FamilyKit"
            className="my-family-logo"
          />
        </div>

        <button
          type="button"
          className="my-family-logout"
          onClick={handleLogout}
        >
          Log out
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="my-family-main">
        {/* WELCOME */}
        <section className="my-family-welcome">
          <p className="my-family-eyebrow">
            YOUR FAMILYKIT
          </p>

          {/* REGISTERED USER NAME */}
          <h1>
            {profileLoading
              ? "Loading your profile..."
              : yourName || "Your FamilyKit"}
          </h1>

          <p>Welcome Back!</p>

          {profileError && (
            <p role="alert" className="my-family-description">
              {profileError}
            </p>
          )}

          <p className="my-family-description">
            Keep your family's important information
            organized, secure, and ready when you need it.
          </p>
        </section>

        {/* FAMILY CARD */}
        <section className="my-family-card">
          <div className="my-family-card-icon">
            ♡
          </div>

          <div className="my-family-card-content">
            <p className="my-family-card-label">
              YOUR FAMILY
            </p>

            <h2>
              Start building your FamilyKit
            </h2>

            <p>
              Add your family information and begin
              organizing the things that matter most.
            </p>

            <button
              type="button"
              className="my-family-primary-button"
              onClick={() => {
                alert(
                  "Family setup will be connected next."
                );
              }}
            >
              Get started
            </button>
          </div>
        </section>

        {/* INFORMATION CARDS */}
        <section className="my-family-grid">
          <article className="my-family-info-card">
            <div className="my-family-info-icon">
              ✓
            </div>

            <h3>
              Signed in securely
            </h3>

            <p>
              Your FamilyKit account is authenticated
              and ready to use.
            </p>
          </article>

          <article className="my-family-info-card">
            <div className="my-family-info-icon">
              ⌂
            </div>

            <h3>
              Family information
            </h3>

            <p>
              Your family members and important
              details will appear here.
            </p>
          </article>

          <article className="my-family-info-card">
            <div className="my-family-info-icon">
              +
            </div>

            <h3>
              Build your FamilyKit
            </h3>

            <p>
              Add documents, important dates,
              tasks, notes, and other family
              information.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
