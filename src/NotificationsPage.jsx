import FamilyBottomNav from "./components/FamilyBottomNav.jsx";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ChevronLeft,
  ListFilter,
  CalendarClock,
  } from "lucide-react";

import { listEvents } from "./api/eventsApi.js";
import { formatEventDate } from "./eventDates.js";
import { getDueEventReminders, getReadReminderIds, markRemindersRead, useReminderClock } from "./eventReminders.js";
import "./NotificationsPage.css";

// =====================================================
// BOTTOM NAVIGATION ITEM
// =====================================================

// =====================================================
// NOTIFICATIONS PAGE
// =====================================================

export default function NotificationsPage() {
  const navigate = useNavigate();

  const hasSession = Boolean(sessionStorage.getItem("familykit_access_token") ||
    sessionStorage.getItem("familykit_refresh_token"));
  const [tab, setTab] = useState("all");
  const [events, setEvents] = useState([]);
  const [read, setRead] = useState(getReadReminderIds);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const now = useReminderClock();

  useEffect(() => {
    if (!hasSession) {
      navigate("/login", { replace: true });
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    listEvents(controller.signal).then((records) => {
      if (!controller.signal.aborted) {
        setEvents(records);
        setRead(getReadReminderIds());
      }
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [hasSession, navigate, retry]);

  const reminders = getDueEventReminders(events, now);
  const visible = reminders.filter(({ id }) => tab === "all" || (tab === "unread" && !read.has(id)));

  function openReminder({ id, event }) {
    setRead(markRemindersRead([id]));
    navigate("/events", { state: {
      eventDate: event.startDate, reminderEventId: event.eventId,
      reminderOccurrence: event.occurrenceDate,
    } });
  }

  if (!hasSession) return null;

  return (
    <div className="fk-notif-page">
      <div className="fk-notif-shell">

        {/* ==========================================
            FIXED TOP SECTION
            ========================================== */}

        <div className="fk-notif-fixed-top">

          {/* HEADER */}

          <header className="fk-notif-header">
            <button
              type="button"
              className="fk-notif-round"
              aria-label="Go back"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft size={18} />
            </button>

            <h1>Notifications</h1>

            <button
              type="button"
              className="fk-notif-round fk-notif-filter"
              aria-label="Show unread notifications"
              onClick={() => setTab("unread")}
            >
              <ListFilter size={15} />
            </button>
          </header>

          {/* ==========================================
              ALL / UNREAD / UPDATES TABS
              ========================================== */}

          <div
            className="fk-notif-tabs"
            role="tablist"
            aria-label="Notification filters"
          >
            {[
              ["all", "All"],
              ["unread", "Unread"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                className={`fk-notif-tab ${
                  tab === value ? "is-active" : ""
                }`}
                onClick={() => setTab(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ==========================================
              FIXED TODAY ROW
              ========================================== */}

          <div className="fk-notif-today-row">
            <span>Today</span>

            <button
              type="button"
              onClick={() => setRead(markRemindersRead(reminders.map(({ id }) => id)))}
            >
              Mark all as read
            </button>
          </div>
        </div>

        {/* ==========================================
            SCROLLABLE NOTIFICATIONS ONLY
            ========================================== */}

        <main
          className="fk-notif-scroll"
          aria-label="Notification cards"
          key={tab}
        >
          {/* TODAY NOTIFICATIONS */}

          {visible
            .filter((item) => item.group === "Today")
            .map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                unread={!read.has(item.id)} onOpen={() => openReminder(item)}
              />
            ))}

          {/* EARLIER SECTION */}

          {visible.some(
            (item) => item.group === "Earlier"
          ) && (
            <h2 className="fk-notif-earlier">
              Earlier
            </h2>
          )}

          {/* EARLIER NOTIFICATIONS */}

          {visible
            .filter((item) => item.group === "Earlier")
            .map((item) => (
              <NotificationCard
                key={item.id}
                item={item}
                unread={!read.has(item.id)} onOpen={() => openReminder(item)}
              />
            ))}

          {/* EMPTY STATE */}

          {loading && <p className="fk-notif-empty" role="status">Loading reminders…</p>}
          {error && <p className="fk-notif-empty" role="alert">{error}{" "}
            <button type="button" onClick={() => setRetry((count) => count + 1)}>Retry</button>
          </p>}
          {!loading && !error && visible.length === 0 && (
            <p className="fk-notif-empty">
              No notifications here yet.
            </p>
          )}
        </main>
      </div>

      {/* ==========================================
          FIXED BOTTOM NAVIGATION
          ========================================== */}

      <FamilyBottomNav active="home" />
    </div>
  );
}

// =====================================================
// NOTIFICATION CARD
// =====================================================

function NotificationCard({ item, unread, onOpen }) {
  return (
    <button type="button" className="fk-notif-card fk-notif-reminder-card" onClick={onOpen}>
      <span className="fk-notif-card-icon violet"><CalendarClock size={16} aria-hidden="true" /></span>
      <span className="fk-notif-card-copy">
        <strong>{item.event.title}</strong>
        <small>Event reminder · {formatEventDate(item.event.startDate)} · {item.event.reminderTime} IST</small>
      </span>
      {unread && <span className="fk-notif-unread-dot" aria-label="Unread" />}
    </button>
  );
}
