
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
import { getFamilyMembers } from "./api/familyMembersApi.js";
import { SELF_PROFILE_ID } from "./api/profilePicturesApi.js";
import ProfileAvatar from "./components/ProfileAvatar.jsx";
import FamilyCalendar from "./FamilyCalendar.jsx";

import "./MyFamilyPage.css";

// =====================================================
// SECTION HEADING
// =====================================================

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

// =====================================================
// QUICK ACTION
// =====================================================

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

// =====================================================
// BOTTOM NAVIGATION ITEM
// =====================================================

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

// =====================================================
// MY FAMILY PROFILE ITEM
// =====================================================

function FamilyMemberItem({ member, onOpen }) {
  const profileId =
    member.memberId || SELF_PROFILE_ID;

  return (
    <div className="fk-dash-family-person">
      <span className="fk-dash-family-top-label">
        {member.relationship || "\u00A0"}
      </span>

      <button
        type="button"
        className="fk-dash-family-avatar"
        aria-label={`View ${member.name} profile`}
        onClick={onOpen}
        style={{
          cursor: "pointer",
          padding: 0,
          overflow: "hidden",
        }}
      >
        <ProfileAvatar
          memberId={profileId}
          name={member.name}
          className="fk-dash-family-avatar-content"
        >
          {member.name?.charAt(0)?.toUpperCase() || "?"}
        </ProfileAvatar>
      </button>

      <span
        className="fk-dash-family-name"
        title={member.name}
      >
        {member.name}
      </span>
    </div>
  );
}

// =====================================================
// HOME DASHBOARD
// =====================================================

export default function MyFamilyPage() {
  const navigate = useNavigate();

  const accessToken = sessionStorage.getItem(
    "familykit_access_token"
  );

  const [yourName, setYourName] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [savedMembers, setSavedMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState("");

  // The account owner appears first;
  // additional members come from DynamoDB.
  const familyMembers = [
    {
      id: "me",
      memberId: SELF_PROFILE_ID,
      name: yourName || "Me",
      relationship: "Me",
    },
    ...savedMembers.map((member) => ({
      ...member,
      id: member.memberId,
    })),
  ];

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
  // LOAD REGISTERED NAME FROM AWS
  // =====================================================

  useEffect(() => {
    if (!accessToken) return;

    let active = true;

    async function loadProfile() {
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

    loadProfile();

    return () => {
      active = false;
    };
  }, [accessToken]);

  // =====================================================
  // LOAD FAMILY MEMBERS FROM DYNAMODB
  // =====================================================

  useEffect(() => {
    if (!accessToken) return;

    let active = true;

    async function loadMembers() {
      try {
        const members = await getFamilyMembers();

        if (!active) return;

        setSavedMembers(members);
        setMembersError("");
      } catch (error) {
        if (!active) return;

        setMembersError(
          error.message ||
            "Unable to load family members."
        );
      } finally {
        if (active) {
          setMembersLoading(false);
        }
      }
    }

    loadMembers();

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

  // Prevent protected content appearing before redirect.
  if (!accessToken) {
    return null;
  }

  return (
    <div className="fk-dash-page">
      <div className="fk-dash-container">

        <div className="fk-dash-sticky-top">
        {/* =========================================
            PROFILE HEADER
           ========================================= */}

        <header className="fk-dash-header">
          <div className="fk-dash-user">
            <button
              type="button"
              className="fk-dash-avatar"
              onClick={() => navigate("/my-profile")}
              aria-label="Open My Profile"
              style={{
                overflow: "hidden",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <ProfileAvatar
                memberId={SELF_PROFILE_ID}
                name={yourName || "Me"}
                className="fk-dash-family-avatar-content"
              />
            </button>

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
              aria-label="Open calendar"
              onClick={() => setCalendarOpen(true)}
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
          <p
            className="fk-dash-profile-error"
            role="alert"
          >
            {profileError}
          </p>
        )}

        {/* =========================================
            SEARCH
           ========================================= */}

        <div className="fk-dash-search">
          <Search
            size={21}
            className="fk-dash-search-icon"
          />

          <input
            type="search"
            placeholder="Search Aadhaar Card"
            aria-label="Open document search"
            readOnly
            onFocus={() => navigate("/search")}
            onClick={() => navigate("/search")}
            style={{ cursor: "pointer" }}
          />

          <button
            type="button"
            className="fk-dash-mic"
            aria-label="Voice search"
            onClick={() => navigate("/search/voice")}
          >
            <Mic size={20} />
          </button>

          <button
            type="button"
            className="fk-dash-voice"
            aria-label="AI voice assistant"
            onClick={() => navigate("/search/voice")}
          >
            <AudioLines size={19} />
          </button>
        </div>

        </div>

        {/* =========================================
            NEED ATTENTION
           ========================================= */}

        <section className="fk-dash-section">
          <SectionTitle title="Need Attention" />

          <div className="fk-dash-attention-card">
            <div className="fk-dash-attention-symbol">
              <Bell
                size={31}
                fill="currentColor"
              />
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

        {/* =========================================
            UPCOMING EVENTS
           ========================================= */}

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
              onClick={() => navigate("/events")}
            >
              Add Event
              <ChevronRight size={15} />
            </button>
          </div>
        </section>

        {/* =========================================
            QUICK ACTIONS
           ========================================= */}

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
              onClick={() => navigate("/diary")}
            />

            {/* MY NOTES — ENABLED */}
            <QuickAction
              icon={StickyNote}
              label="Notes"
              tone="green"
              onClick={() => navigate("/notes")}
            />

            <QuickAction
              icon={CalendarPlus}
              label="Events"
              tone="orange"
              onClick={() => navigate("/events")}
            />
          </div>
        </section>

        {/* =========================================
            MY FAMILY — DYNAMIC SCROLLABLE LAYOUT
           ========================================= */}

        <section className="fk-dash-section">
          <SectionTitle
            title="My Family"
            onViewAll={() => navigate("/family")}
          />

          {membersLoading && (
            <p role="status">
              Loading family members...
            </p>
          )}

          {membersError && (
            <p
              role="alert"
              className="fk-dash-profile-error"
            >
              {membersError}
            </p>
          )}

          <div className="fk-dash-family-card">
            <div className="fk-dash-family-scroll">

              {/* EXISTING FAMILY MEMBERS */}
              {familyMembers.map((member) => (
                <FamilyMemberItem
                  key={member.id}
                  member={member}
                  onOpen={() =>
                    navigate(
                      member.id === "me"
                        ? "/my-profile"
                        : `/family/${encodeURIComponent(
                            member.id
                          )}`
                    )
                  }
                />
              ))}

              {/* ONLY ONE ADD BUTTON */}
              <div className="fk-dash-family-person">
                <span className="fk-dash-family-top-label">
                  Add Member
                </span>

                <button
                  type="button"
                  className="fk-dash-family-add"
                  aria-label="Add family member"
                  onClick={() =>
                    navigate("/family/add")
                  }
                >
                  <Plus size={27} />
                </button>

                <span className="fk-dash-family-name">
                  Add
                </span>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================
            SMART SUGGESTIONS
           ========================================= */}

        <section className="fk-dash-section fk-dash-last-section">
          <SectionTitle title="Smart Suggestions" />

          <div className="fk-dash-suggestion-card">
            <div className="fk-dash-suggestion-icon">
              <Sparkles
                size={23}
                fill="currentColor"
              />
            </div>

            <div className="fk-dash-suggestion-text">
              <h3>
                Smart AI Suggestions for you
              </h3>

              <p>
                FamilyKit AI is Waiting for you
              </p>
            </div>

            <ChevronRight
              size={22}
              className="fk-dash-suggestion-arrow"
            />
          </div>
        </section>

        {/* =========================================
            LOGOUT
           ========================================= */}

        <button
          type="button"
          className="fk-dash-logout"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Log out
        </button>

      </div>

      {/* =========================================
          FIXED BOTTOM NAVIGATION
         ========================================= */}

      <nav
        className="fk-dash-bottom-nav"
        aria-label="Dashboard navigation"
      >
        <NavItem
          icon={House}
          label="Home"
          active
          onClick={() =>
            navigate("/my-family")
          }
        />

        <NavItem
          icon={UsersRound}
          label="My Family"
          onClick={() =>
            navigate("/family")
          }
        />

        <button
          type="button"
          className="fk-dash-center-add"
          aria-label="Add new family member"
          onClick={() =>
            navigate("/family/add")
          }
        >
          <Plus size={30} />
        </button>

        <NavItem
          icon={LayoutGrid}
          label="Category"
          onClick={() => navigate("/categories")}
        />

        <NavItem
          icon={CreditCard}
          label="Pay & Renew"
        />
      </nav>

      {/* LIVE CALENDAR POPUP */}
      {calendarOpen && (
        <FamilyCalendar
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </div>
  );
}
