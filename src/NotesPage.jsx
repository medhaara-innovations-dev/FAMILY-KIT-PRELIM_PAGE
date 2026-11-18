
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
import "./NotesPage.css";

export default function NotesPage() {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  // =====================================================
  // LOAD ALL NOTES FROM DYNAMODB
  // =====================================================

  useEffect(() => {
    if (!sessionStorage.getItem("familykit_access_token")) {
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
        ].sort((a, b) =>
          (b.createdAt || "").localeCompare(
            a.createdAt || ""
          )
        );

        setNotes(sortedNotes);
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
  // SEARCH NOTES
  // =====================================================

  const filteredNotes = notes.filter((note) =>
    `${note.title || ""} ${note.content || ""}`
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  // =====================================================
  // OPEN READ-ONLY NOTES VIEW
  // =====================================================

  const handleOpenNote = (note) => {
    if (!note.noteId) return;

    navigate(
      `/notes/${encodeURIComponent(note.noteId)}`
    );
  };

  // =====================================================
  // CREATE NEW NOTE
  // =====================================================

  const handleAddNote = () => {
    navigate("/notes/new");
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <main className="fk-notes-page">
      <div className="fk-notes-container">

        {/* HEADER */}
        <header className="fk-notes-header">
          <button
            type="button"
            className="fk-notes-icon-button"
            onClick={() =>
              navigate("/my-family")
            }
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={20} />
          </button>

          <h1>My Notes</h1>

          <button
            type="button"
            className="fk-notes-icon-button fk-notes-search-button"
            onClick={() => {
              setSearchOpen(
                (current) => !current
              );
              setSearchText("");
            }}
            aria-label="Search notes"
            aria-expanded={searchOpen}
          >
            <Search size={20} />
          </button>
        </header>

        {/* SEARCH */}
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

        {/* HERO SECTION */}
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

        {/* ALL ENTRIES */}
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

          {/* ERROR */}
          {error && (
            <div
              className="fk-notes-error"
              role="alert"
            >
              {error}

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
              >
                Retry
              </button>
            </div>
          )}

          {/* LOADING */}
          {loading ? (
            <p className="fk-notes-status">
              Loading your notes...
            </p>
          ) : !error &&
            filteredNotes.length === 0 ? (

            /* EMPTY STATE */
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

            /* NOTES GRID */
            <div className="fk-notes-grid">
              {filteredNotes.map((note) => (
                <button
                  type="button"
                  className="fk-notes-card"
                  key={note.noteId}
                  onClick={() =>
                    handleOpenNote(note)
                  }
                  aria-label={`Open ${
                    note.title || "Untitled Note"
                  } to view`}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    font: "inherit",
                    color: "inherit",
                    cursor: "pointer",
                  }}
                >
                  <h3>
                    {note.title ||
                      "Untitled Note"}
                  </h3>

                  <p className="fk-notes-preview">
                    {note.content}
                  </p>

                  {/* REMINDER INFORMATION */}
                  {note.reminder === true && (
                    <div className="fk-notes-reminder-info">
                      <span className="fk-notes-reminder-badge">
                        <Bell size={13} />
                        Reminder
                      </span>

                      {note.createdDate && (
                        <span className="fk-notes-created-date">
                          Created on:{" "}
                          {note.createdDate}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* BOTTOM NAVIGATION */}
      <nav
        className="fk-notes-bottom-nav"
        aria-label="Main navigation"
      >
        <button
          type="button"
          onClick={() =>
            navigate("/my-family")
          }
        >
          <House size={21} />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() =>
            navigate("/family")
          }
        >
          <UsersRound size={21} />
          <span>My Family</span>
        </button>

        <button
          type="button"
          className="fk-notes-nav-active"
          aria-current="page"
        >
          <LayoutGrid size={21} />
          <span>Features</span>
        </button>

        <button
          type="button"
          disabled
        >
          <CreditCard size={21} />
          <span>Payments</span>
        </button>
      </nav>
    </main>
  );
}
