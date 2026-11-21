
import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  SquarePen,
  FileText,
  Sparkles,
  Bell,
  AlertCircle,
} from "lucide-react";

import { getNote } from "./api/notesApi";
import { getStoredAccessToken, getStoredRefreshToken } from "./auth/sessionManager.js";
import "./NotesViewPage.css";

export default function NotesViewPage() {
  const navigate = useNavigate();
  const { noteId } = useParams();

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getStoredAccessToken() && !getStoredRefreshToken()) {
      navigate("/login", { replace: true });
      return;
    }

    let active = true;

    async function loadNote() {
      setLoading(true);
      setError("");

      try {
        const result = await getNote(noteId);

        if (!active) return;

        const savedNote = result.note || result;

        if (!savedNote || !savedNote.noteId) {
          throw new Error("Note not found.");
        }

        setNote(savedNote);
      } catch (err) {
        if (active) {
          setError(
            err.message || "Unable to load your note."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (noteId) {
      loadNote();
    } else {
      setError("Invalid note ID.");
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [noteId, navigate]);

  const handleBack = () => {
    navigate("/notes");
  };

  const handleEdit = () => {
    navigate(
      `/notes/${encodeURIComponent(noteId)}/edit`
    );
  };

  return (
    <main className="fk-note-view-page">
      <div className="fk-note-view-container">

        {/* HEADER */}
        <header className="fk-note-view-header">
          <button
            type="button"
            className="fk-note-view-icon-button"
            onClick={handleBack}
            aria-label="Back to All Entries"
          >
            <ArrowLeft size={21} />
          </button>

          <h1>My Notes</h1>

          <button
            type="button"
            className="fk-note-view-icon-button"
            onClick={handleEdit}
            disabled={loading || !note}
            aria-label="Edit note"
            title="Edit note"
          >
            <SquarePen size={21} />
          </button>
        </header>

        {loading ? (
          <p className="fk-note-view-status">
            Loading your note...
          </p>
        ) : error ? (
          <div
            className="fk-note-view-error"
            role="alert"
          >
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        ) : note ? (
          <div className="fk-note-view-content">

            {/* SAVED NOTE */}
            <section className="fk-note-view-section">
              <p className="fk-note-view-label">
                {note.createdDate
                  ? `Created on ${note.createdDate}`
                  : "Your saved note"}
              </p>

              <div className="fk-note-view-note-box">
                {note.content || "No content available."}
              </div>
            </section>

            {/* AI EXTRACTED DETAILS */}
            <section className="fk-note-view-section">
              <div className="fk-note-view-section-title">
                <Sparkles size={19} />
                <h2>AI Extracted Details</h2>
              </div>

              <div className="fk-note-view-ai-box">
                <FileText size={28} />

                <p>
                  AI summarisation and information
                  extraction will be available soon.
                </p>
              </div>
            </section>

            {/* REMINDER */}
            {note.reminder === true && (
              <div className="fk-note-view-reminder">
                <Bell size={16} />
                <span>
                  Reminder added to this note
                </span>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}
