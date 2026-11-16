
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  Search,
  Mic,
  AudioLines,
  Plus,
  ChevronRight,
  ContactRound,
  BookMarked,
  StickyNote,
  CalendarPlus,
  Sparkles,
  House,
  UsersRound,
  LayoutGrid,
  CreditCard,
  LogOut,
} from "lucide-react";

import { getFamilyKitProfile } from "./auth/authService.js";
import "./MyFamilyPage.css";

function SectionTitle({ title, onViewAll }) {
  return (
    <div className="fk-dash-section-title">
      <h2>{title}</h2>
      <button
        type="button"
        disabled={!onViewAll}
        onClick={onViewAll}
      >
        View All
      </button>
    </div>
  );
}

function QuickAction({ icon: Icon, label, tone, onClick }) {
  return (
    <button
      type="button"
      className="fk-dash-action"
      onClick={onClick}
      disabled={!onClick}
    >
      <span className={`fk-dash-action-icon ${tone}`}>
        <Icon size={23} strokeWidth={1.8} />
      </span>
      <span>{label}</span>
    </button>
  );
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      className={`fk-dash-nav-item ${active ? "active" : ""}`}
      onClick={onClick}
      disabled={!onClick}
      aria-current={active ? "page" : undefined}
    >
      <span className="fk-dash-nav-icon">
        <Icon size={20} strokeWidth={1.8} />
      </span>
      <span>{label}</span>
    </button>
  );
}

export default function MyFamilyPage() {
  const navigate = useNavigate();

  const accessToken = sessionStorage.getItem(
    "familykit_access_token"
  );

  const [yourName, setYourName] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [searchText, setSearchText] = useState("");

  // Keep the existing login protection.
  useEffect(() => {
    if (!accessToken) {
      navigate("/login", { replace: true });
    }
  }, [accessToken, navigate]);

  // Retrieve the registered user's name from AWS.
  useEffect(() => {
    if (!accessToken) return;

    let active = true;

    async function loadProfile() {
      try {
        const profile = await getFamilyKitProfile(accessToken);

        if (!active) return;

        setYourName(profile.yourName || "");
        setProfileError("");
      } catch (error) {
        if (!active) return;

        setProfileError(
          error.message || "Unable to load your profile."
        );
      } finally {
        if (active) setProfileLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [accessToken]);

  const handleLogout = () => {
    sessionStorage.removeItem("familykit_access_token");
    sessionStorage.removeItem("familykit_id_token");
    sessionStorage.removeItem("familykit_refresh_token");

    navigate("/", { replace: true });
  };

  if (!accessToken) return null;

  return (
    <div className="fk-dash-page">
      <div className="fk-dash-container">

        {/* PROFILE HEADER */}
        <header className="fk-dash-header">
          <div className="fk-dash-user">
            <div className="fk-dash-avatar" aria-hidden="true" />

            <div className="fk-dash-user-details">
              <h1>
                {profileLoading
                  ? "Loading..."
                  : yourName || "FamilyKit User"}
              </h1>
              <p>Welcome Back!</p>
            </div>
          </div>

          <div className="fk-dash-header-actions">
            <button
              type="button"
              className="fk-dash-round-button"
              aria-label="Calendar"
              disabled
            >
              <CalendarDays size={19} />
            </button>

            <button
              type="button"
              className="fk-dash-round-button fk-dash-bell-button"
              aria-label="Notifications"
              disabled
            >
              <Bell size={19} />
              <span className="fk-dash-notification-dot" />
            </button>
          </div>
        </header>

        {profileError && (
          <p className="fk-dash-profile-error" role="alert">
            {profileError}
          </p>
        )}

        {/* SEARCH */}
        <div className="fk-dash-search">
          <Search size={21} className="fk-dash-search-icon" />

          <input
            type="search"
            placeholder="Search Aadhaar Card"
            aria-label="Search documents"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />

          <button
            type="button"
            className="fk-dash-mic"
            aria-label="Voice search"
            disabled
          >
            <Mic size={20} />
          </button>

          <button
            type="button"
            className="fk-dash-voice"
            aria-label="AI voice assistant"
            disabled
          >
            <AudioLines size={19} />
          </button>
        </div>

        {/* NEED ATTENTION */}
        <section className="fk-dash-section">
          <SectionTitle title="Need Attention" />

          <div className="fk-dash-attention-card">
            <div className="fk-dash-attention-symbol">
              <Bell size={31} fill="currentColor" />
            </div>

            <h3>No Reminders created yet</h3>

            <p>
              Set reminders for bills, renewals and
              important dates.
            </p>

            <button
              type="button"
              className="fk-dash-outline-button"
              disabled
            >
              <Plus size={16} />
              Add Document
            </button>
          </div>
        </section>

        {/* UPCOMING EVENTS */}
        <section className="fk-dash-section">
          <SectionTitle title="Upcoming Events" />

          <div className="fk-dash-events-card">
            <div className="fk-dash-events-message">
              <CalendarDays size={20} />
              <span>No Events Created Yet</span>
            </div>

            <button
              type="button"
              className="fk-dash-event-button"
              disabled
            >
              Add Event
              <ChevronRight size={15} />
            </button>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="fk-dash-section">
          <SectionTitle title="Quick Actions" />

          <div className="fk-dash-actions-grid">
            <QuickAction
              icon={ContactRound}
              label="Important Contacts"
              tone="coral"
            />

            <QuickAction
              icon={BookMarked}
              label="Diary"
              tone="purple"
            />

            <QuickAction
              icon={StickyNote}
              label="Notes"
              tone="green"
            />

            <QuickAction
              icon={CalendarPlus}
              label="Add Events"
              tone="orange"
            />
          </div>
        </section>

        {/* MY FAMILY */}
        <section className="fk-dash-section">
          <SectionTitle title="My Family" />

          <div className="fk-dash-family-card">
            <div className="fk-dash-family-person">
              <span className="fk-dash-family-top-label">
                &nbsp;
              </span>

              <span className="fk-dash-family-avatar" />
              <span className="fk-dash-family-name">Me</span>
            </div>

            {[1, 2, 3].map((item) => (
              <div
                className="fk-dash-family-person"
                key={item}
              >
                <span className="fk-dash-family-top-label">
                  Relation
                </span>

                <button
                  type="button"
                  className="fk-dash-family-add"
                  aria-label={`Add family member ${item}`}
                  disabled
                >
                  <Plus size={27} />
                </button>

                <span className="fk-dash-family-name">
                  Name
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* SMART SUGGESTIONS */}
        <section className="fk-dash-section fk-dash-last-section">
          <SectionTitle title="Smart Suggestions" />

          <div className="fk-dash-suggestion-card">
            <div className="fk-dash-suggestion-icon">
              <Sparkles size={23} fill="currentColor" />
            </div>

            <div className="fk-dash-suggestion-text">
              <h3>Smart AI Suggestions for you</h3>
              <p>FamilyKit AI is Waiting for you</p>
            </div>

            <ChevronRight
              size={22}
              className="fk-dash-suggestion-arrow"
            />
          </div>
        </section>

        {/* LOGOUT */}
        <button
          type="button"
          className="fk-dash-logout"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>

      {/* FIXED BOTTOM NAVIGATION */}
      <nav
        className="fk-dash-bottom-nav"
        aria-label="Dashboard navigation"
      >
        <NavItem
          icon={House}
          label="Home"
          active
          onClick={() => navigate("/my-family")}
        />

        <NavItem
          icon={UsersRound}
          label="My Family"
        />

        <button
          type="button"
          className="fk-dash-center-add"
          aria-label="Add new"
          disabled
        >
          <Plus size={30} />
        </button>

        <NavItem
          icon={LayoutGrid}
          label="Category"
        />

        <NavItem
          icon={CreditCard}
          label="Pay & Renew"
        />
      </nav>
    </div>
  );
}
