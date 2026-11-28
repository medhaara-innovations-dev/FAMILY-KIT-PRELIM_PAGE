import firstDocumentFolder from "./assets/images/first-document-folder.svg";
import useDocuments from "./components/useDocuments.js";
import { OPEN_DOCUMENT_UPLOAD } from "./api/documentsApi.js";
import FamilyBottomNav from "./components/FamilyBottomNav.jsx";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Bell,
  Cake,
  CalendarDays,
  Search,
  Mic,
  AudioLines,
  Plus,
  ChevronRight,
  BookMarked,
  Sparkles,
  UserRound,
} from "lucide-react";

import { getFamilyKitProfile } from "./auth/authService.js";
import { getValidAccessToken } from "./auth/sessionManager.js";
import { getFamilyMembers } from "./api/familyMembersApi.js";
import { listEvents } from "./api/eventsApi.js";
import { getDueEventReminders, getReadReminderIds, useReminderClock } from "./eventReminders.js";
import { calendarHorizon, occurrenceList, formatEventDate } from "./eventDates.js";
import { SELF_PROFILE_ID } from "./api/profilePicturesApi.js";
import ProfileAvatar from "./components/ProfileAvatar.jsx";
import FamilyCalendar from "./FamilyCalendar.jsx";

import { ImportantContactsIcon, NotesIcon } from "./components/ReferenceIcons.jsx";
import "./MyFamilyPage.css";

const localDate = new Intl.DateTimeFormat("sv-SE");

function UpcomingEventCard({ event, today, onOpen }) {
  const Icon = event.category === "Birthday" ? Cake
    : event.kind === "reminder" || event.reminderTime ? Bell : CalendarDays;
  const daysUntil = (Date.parse(event.startDate) - Date.parse(today)) / 86_400_000;
  const timing = daysUntil > 1 ? `${daysUntil} days`
    : daysUntil === 1 ? "Tomorrow" : daysUntil === 0 ? "Today" : "Ongoing";

  return (
    <button type="button" className="fk-dash-events-card fk-dash-upcoming-event" onClick={onOpen}>
      <span className="fk-dash-upcoming-icon"><Icon size={22} aria-hidden="true" /></span>
      <span className="fk-dash-upcoming-copy">
        <strong>{event.title}</strong>
        <span className="fk-dash-upcoming-meta">
          <span className="fk-dash-upcoming-avatar"><UserRound size={14} aria-hidden="true" /></span>
          <span>
            <b>You (Self)</b>
            <small><time dateTime={event.startDate}>{formatEventDate(event.startDate)}</time> · {timing}</small>
          </span>
        </span>
      </span>
      <ChevronRight size={18} aria-hidden="true" />
    </button>
  );
}

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
        <Icon size={26} strokeWidth={1.8} />
      </span>

      <span>{label}</span>
    </button>
  );
}

// =====================================================
// BOTTOM NAVIGATION ITEM
// =====================================================

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

  const hasSession = Boolean(
    sessionStorage.getItem("familykit_access_token") ||
    sessionStorage.getItem("familykit_refresh_token")
  );

  const { documents } = useDocuments(hasSession, true);
  const firstDocument = documents?.length === 0;
  const openUpload = () => window.dispatchEvent(new Event(OPEN_DOCUMENT_UPLOAD));

  const [yourName, setYourName] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [upcomingStatus, setUpcomingStatus] = useState("Loading events…");
  const reminderClock = useReminderClock();
  const readReminders = getReadReminderIds();
  const unreadReminders = getDueEventReminders(calendarEvents, reminderClock)
    .filter(({ id }) => !readReminders.has(id)).length;
  const today = localDate.format(reminderClock);
  const tomorrow = calendarHorizon(today, 1);
  const scheduledItems = occurrenceList(calendarEvents, today, "9999-12-31", calendarHorizon(today, 366))
    .filter((event) => !event.completed && event.startDate >= today);
  const attentionItems = scheduledItems.filter((event) => event.startDate <= tomorrow);
  const comingUpItems = scheduledItems.filter((event) => event.startDate > tomorrow).slice(0, 3);

  const renderEventCard = (event) => (
    <UpcomingEventCard
      key={`${event.eventId}-${event.occurrenceDate || ""}`}
      event={event}
      today={today}
      onOpen={() => navigate("/events", { state: {
        eventDate: event.startDate,
        reminderEventId: event.eventId,
        reminderOccurrence: event.occurrenceDate,
      } })}
    />
  );

  useEffect(() => {
    if (!hasSession) return;
    const controller = new AbortController();
    listEvents(controller.signal).then((events) => {
      if (controller.signal.aborted) return;
      setCalendarEvents(events);
      setUpcomingStatus("");
    }).catch(() => {
      if (!controller.signal.aborted) setUpcomingStatus("Unable to load events");
    });
    return () => controller.abort();
  }, [hasSession]);

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
    if (!hasSession) {
      navigate("/login", {
        replace: true,
      });
    }
  }, [hasSession, navigate]);

  // =====================================================
  // LOAD REGISTERED NAME FROM AWS
  // =====================================================

  useEffect(() => {
    if (!hasSession) return;

    let active = true;

    async function loadProfile() {
      try {
        const validToken = await getValidAccessToken();
        if (!active) return;
        const profile = await getFamilyKitProfile(validToken);

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
  }, [hasSession]);

  // =====================================================
  // LOAD FAMILY MEMBERS FROM DYNAMODB
  // =====================================================

  useEffect(() => {
    if (!hasSession) return;

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
  }, [hasSession]);

  // Prevent protected content appearing before redirect.
  if (!hasSession) {
    return null;
  }

  return (
    <div className="fk-dash-page">
      <div className="fk-dash-container">

        <div className="fk-dash-sticky-top fk-glass-header">
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
              aria-label={unreadReminders ? `Notifications, ${unreadReminders} unread reminders` : "Notifications"}
              onClick={() => navigate("/notifications")}
            >
              <Bell size={19} />

              {unreadReminders > 0 && <span className="fk-dash-notification-dot" aria-hidden="true">
                {unreadReminders > 99 ? "99+" : unreadReminders}
              </span>}
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

        {firstDocument && (
          <section className="fk-dash-first-document">
            <div>
              <h2>Your family's important information starts here</h2>
              <p>FamilyKit will identify, extract and organize the details for you.</p>
              <button type="button" className="fk-dash-event-button" onClick={openUpload}>
                <Plus size={16} aria-hidden="true" /> Add Your First Document
              </button>
            </div>
            <img className="fk-dash-first-document-art" src={firstDocumentFolder} alt="" />
          </section>
        )}

        {/* =========================================
            NEED ATTENTION
           ========================================= */}

        <section className="fk-dash-section fk-dash-attention-section">
          <SectionTitle title="Need Attention" />

          {attentionItems.length ? (
            <div className="fk-dash-upcoming-list">
              {attentionItems.map(renderEventCard)}
            </div>
          ) : (
            <div className="fk-dash-attention-card">
              <div className="fk-dash-attention-symbol">
                <Bell size={31} fill="currentColor" />
              </div>
              <h3>{upcomingStatus || "Nothing needs your attention today or tomorrow."}</h3>
            </div>
          )}
        </section>

        {/* =========================================
            UPCOMING EVENTS
           ========================================= */}

        <section className="fk-dash-section fk-dash-events-section">
          <SectionTitle title="Coming Up" onViewAll={() => navigate("/events")} />

          {comingUpItems.length ? (
            <div className="fk-dash-upcoming-list">
              {comingUpItems.map(renderEventCard)}
            </div>
          ) : (
            <div className="fk-dash-events-card">
              <div className="fk-dash-events-message">
                <CalendarDays size={20} aria-hidden="true" />
                {upcomingStatus || (
                  <div>
                    <strong>No upcoming items yet.</strong>
                    <div>Events, renewals and important dates will appear here.</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* =========================================
            QUICK ACTIONS
           ========================================= */}

        <section className="fk-dash-section fk-dash-actions-section">
          <SectionTitle title="Quick Actions" />

          <div className="fk-dash-actions-grid">
            <QuickAction
              icon={ImportantContactsIcon}
              label="Important Contacts"
              tone="coral"
              onClick={() => navigate("/important-contacts")}
            />

            <QuickAction
              icon={BookMarked}
              label="Diary"
              tone="purple"
              onClick={() => navigate("/diary")}
            />

            {/* MY NOTES — ENABLED */}
            <QuickAction
              icon={NotesIcon}
              label="Notes"
              tone="green"
              onClick={() => navigate("/notes")}
            />

            <QuickAction
              icon={CalendarDays}
              label="Events"
              tone="orange"
              onClick={() => navigate("/events")}
            />
          </div>
        </section>

        {/* =========================================
            MY FAMILY — DYNAMIC SCROLLABLE LAYOUT
           ========================================= */}

        <section className="fk-dash-section fk-dash-family-section">
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
              {familyMembers.slice(0, 4).map((member) => (
                <FamilyMemberItem
                  key={member.id}
                  member={member}
                  onOpen={() => member.id === "me"
                    ? navigate("/my-profile", { state: { readOnly: true } })
                    : navigate(`/family/${encodeURIComponent(member.id)}`, { state: { fromHome: true } })}
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
                    navigate("/family/add", { state: { returnToLauncher: true } })
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
          <SectionTitle
            title="Smart Suggestions"
            onViewAll={() => navigate("/smart-suggestions")}
          />

          <div className="fk-dash-suggestion-card">
            {firstDocument && <button type="button" className="fk-dash-suggestion-target" onClick={openUpload}
              aria-label="Upload a document to get started with AI organization" />}
            <div className="fk-dash-suggestion-icon">
              <Sparkles
                size={23}
                fill="currentColor"
              />
            </div>

            <div className="fk-dash-suggestion-text">
              <h3>
                {firstDocument ? "Upload a document to get started with AI organization." : "Smart AI Suggestions for you"}
              </h3>

              <p>
                {firstDocument ? "FamilyKit can identify documents, extract key details and suggest reminders." : "FamilyKit AI is Waiting for you"}
              </p>
            </div>

            <ChevronRight
              size={22}
              className="fk-dash-suggestion-arrow"
            />
          </div>
        </section>


      </div>

      {/* =========================================
          FIXED BOTTOM NAVIGATION
         ========================================= */}

      <FamilyBottomNav active="home" />

      {/* LIVE CALENDAR POPUP */}
      {calendarOpen && (
        <FamilyCalendar
          events={calendarEvents}
          onOpenDate={(eventDate) => {
            setCalendarOpen(false);
            navigate("/events", { state: { eventDate } });
          }}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </div>
  );
}
