import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "./MyFamilyPage.css";
import familyKitLogo from "./assets/images/Family kit Logo.png";

export default function MyFamilyPage() {
  const navigate = useNavigate();

  const accessToken = sessionStorage.getItem("familykit_access_token");

  // Protect the page from unauthenticated access
  useEffect(() => {
    if (!accessToken) {
      navigate("/login", {
        replace: true,
      });
    }
  }, [accessToken, navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("familykit_access_token");
    sessionStorage.removeItem("familykit_id_token");
    sessionStorage.removeItem("familykit_refresh_token");

    navigate("/", {
      replace: true,
    });
  };

  // Prevent protected content from appearing before redirect
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

          <h1>
            Welcome to your FamilyKit
          </h1>

          <p className="my-family-description">
            Keep your family's important information organized,
            secure, and ready when you need it.
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
              Add your family information and begin organizing
              the things that matter most.
            </p>

            <button
              type="button"
              className="my-family-primary-button"
              onClick={() => {
                alert("Family setup will be connected next.");
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
              Your FamilyKit account is authenticated and ready
              to use.
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
              Your family members and important details will
              appear here.
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
              Add documents, important dates, tasks, notes,
              and other family information.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}