
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Search,
  StickyNote,
  Plus,
  Bell,
  House,
  UsersRound,
  LayoutGrid,
  CreditCard,
} from "lucide-react";

import { getNotes } from "./api/notesApi";
import { getStoredAccessToken, getStoredRefreshToken } from "./auth/sessionManager.js";
import "./NotesPage.css";

// =====================================================
// IST DATE HANDLING
// =====================================================

function parseISTTimestamp(timestamp) {
  if (!timestamp) return null;

  const value = String(timestamp).trim();

  const normalized = value.replace(" ", "T");

  const hasTimezone =
    /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);

  const dateString = hasTimezone
    ? normalized
    : `${normalized}+05:30`;

  const date = new Date(dateString);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

// =====================================================
// FORMAT DATE AND TIME IN IST
// =====================================================

function formatISTDateTime(timestamp) {
  const date = parseISTTimestamp(timestamp);

  if (!date) return "";

  const datePart = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

  const timePart = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  return `${datePart}, ${timePart}`;
}

// =====================================================
// RELATIVE CREATION TIME
// =====================================================

function getRelativeTime(createdAt, now) {
  const date = parseISTTimestamp(createdAt);

  if (!date) return "";

  const elapsed = Math.max(
    0,
    now - date.getTime()
  );

  const minutes = Math.floor(elapsed / 60000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return minutes === 1
      ? "1 minute ago"
      : `${minutes} minutes ago`;
  }

  const hours = Math.floor(elapsed / 3600000);

  if (hours < 24) {
    return hours === 1
      ? "1 hour ago"
      : `${hours} hours ago`;
  }

  const days = Math.floor(elapsed / 86400000);

  return days === 1
    ? "1 day ago"
    : `${days} days ago`;
}

// =====================================================
// NOTES PAGE
// =====================================================

export default function NotesPage() {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [now, setNow] = useState(() => Date.now());

  // =====================================================
  // LOAD NOTES
  // =====================================================

  useEffect(() => {
    if (!getStoredAccessToken() && !getStoredRefreshToken()) {
      navigate("/login", { replace: true });
      return;
    }

    let active = true;

    async function loadNotes() {
      setLoading(true);
      setError("");

      try {
        const result = await getNotes();

        if (!active) return;

        const sortedNotes = [
          ...(result.notes || []),
        ].sort((a, b) => {
          const aTime =
            parseISTTimestamp(a.createdAt)?.getTime() || 0;

          const bTime =
            parseISTTimestamp(b.createdAt)?.getTime() || 0;

          return bTime - aTime;
        });

        setNotes(sortedNotes);
        setNow(Date.now());
      } catch (err) {
        if (active) {
          setError(
            err.message || "Unable to load notes."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadNotes();

    return () => {
      active = false;
    };
  }, [navigate]);

  // =====================================================
  // AUTOMATIC TIME UPDATE
  // =====================================================

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredNotes = notes.filter((note) =>
    `${note.title || ""} ${note.content || ""}`
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  // =====================================================
  // NAVIGATION
  // =====================================================

  const handleOpenNote = (note) => {
    if (!note.noteId) return;

    navigate(
      `/notes/${encodeURIComponent(note.noteId)}`
    );
  };

  const handleAddNote = () => {
    navigate("/notes/new");
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <main className="fk-notes-page">
      <div className="fk-notes-container">

        <header className="fk-notes-header">
          <button
            type="button"
            className="fk-notes-icon-button"
            onClick={() => navigate("/categories")}
            aria-label="Back to Categories"
          >
            <ArrowLeft size={20} />
          </button>

          <h1>My Notes</h1>

          <button
            type="button"
            className="fk-notes-icon-button fk-notes-search-button"
            onClick={() => {
              setSearchOpen((current) => !current);
              setSearchText("");
            }}
            aria-label="Search notes"
            aria-expanded={searchOpen}
          >
            <Search size={20} />
          </button>
        </header>

        {searchOpen && (
          <div className="fk-notes-search-panel">
            <Search size={18} />

            <input
              type="search"
              autoFocus
              placeholder="Search your notes"
              value={searchText}
              onChange={(event) =>
                setSearchText(event.target.value)
              }
            />
          </div>
        )}

        <section className="fk-notes-hero">
          <div className="fk-notes-hero-copy">
            <h2>
              Your thoughts, all in one place.
            </h2>

            <p>
              Capture important information, ideas and
              things you want to remember.
            </p>

            <button
              type="button"
              className="fk-notes-primary-button"
              onClick={handleAddNote}
            >
              <Plus size={17} />
              Add Notes Today
            </button>
          </div>

          <div className="fk-notes-hero-icon">
            <StickyNote
              size={53}
              strokeWidth={1.5}
            />
          </div>
        </section>

        <section className="fk-notes-entries">
          <div className="fk-notes-section-heading">
            <h2>All Entries</h2>

            <span className="fk-notes-count">
              {notes.length}{" "}
              {notes.length === 1
                ? "Entry"
                : "Entries"}
            </span>
          </div>

          <div className="fk-notes-scroll">
          {error && (
            <div
              className="fk-notes-error"
              role="alert"
            >
              {error}

              <button
                type="button"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <p className="fk-notes-status">
              Loading your notes...
            </p>
          ) : !error &&
            filteredNotes.length === 0 ? (
            <div className="fk-notes-empty">
              <StickyNote
                size={42}
                strokeWidth={1.4}
              />

              <h3>
                {searchText
                  ? "No matching notes"
                  : "No notes yet"}
              </h3>

              <p>
                {searchText
                  ? "Try searching for something else."
                  : "Start capturing your thoughts by adding your first note."}
              </p>
            </div>
          ) : (
            <div className="fk-notes-grid">
              {filteredNotes.map((note) => {
                const relativeTime = getRelativeTime(
                  note.createdAt,
                  now
                );

                const createdIST = formatISTDateTime(
                  note.createdAt
                );

                return (
                  <button
                    type="button"
                    className="fk-notes-card"
                    key={note.noteId}
                    onClick={() => handleOpenNote(note)}
                    aria-label={`Open ${
                      note.title || "Untitled Note"
                    } to view`}
                  >
                    <h3>
                      {note.title || "Untitled Note"}
                    </h3>

                    <p className="fk-notes-preview">
                      {note.content}
                    </p>

                    <div className="fk-notes-card-footer">
                      <div className="fk-notes-reminder-info">
                        {note.reminder === true && (
                          <span className="fk-notes-reminder-date">
                            <Bell size={13} />
                            <span>
                              {createdIST
                                ? `Reminder created on ${createdIST}`
                                : "Reminder"}
                            </span>
                          </span>
                        )}
                      </div>

                      <span className="fk-notes-relative-time">
                        {relativeTime}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          </div>
        </section>
      </div>

      <nav
        className="fk-notes-bottom-nav"
        aria-label="Main navigation"
      >
        <button
          type="button"
          onClick={() => navigate("/my-family")}
        >
          <House size={21} />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/family")}
        >
          <UsersRound size={21} />
          <span>My Family</span>
        </button>

        <button
          type="button"
          className="fk-notes-nav-active"
          onClick={() => navigate("/categories")}
        >
          <LayoutGrid size={21} />
          <span>Features</span>
        </button>

        <button type="button" disabled>
          <CreditCard size={21} />
          <span>Payments</span>
        </button>
      </nav>
    </main>
  );
}
