
import { useEffect, useRef, useState } from "react";
import {
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";

import {
  ChevronLeft,
  Sparkles,
  FileText,
  AlertCircle,
} from "lucide-react";

import { getNote } from "./api/notesApi";

import "./NotesEditorPage.css";
import "./NotesDetailsPage.css";

export default function NotesEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { noteId } = useParams();

  const isEditing = Boolean(noteId);

  // Data returned when navigating back from details.
  const returnedDraft = location.state || {};

  const [noteText, setNoteText] = useState(
    returnedDraft.noteText || ""
  );

  const [originalText, setOriginalText] = useState("");
  const [noteTitle, setNoteTitle] = useState(
    returnedDraft.noteTitle || "Untitled Note"
  );
  const [hasReminder, setHasReminder] = useState(
    returnedDraft.hasReminder ?? false
  );

  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState("");
  const [showUnsavedPopup, setShowUnsavedPopup] =
    useState(false);

  const leavingRef = useRef(false);
  const dirtyRef = useRef(false);

  const isDirty = isEditing
    ? noteText !== originalText
    : noteText.trim().length > 0;

  dirtyRef.current = isDirty;

  // =====================================================
  // LOAD EXISTING NOTE FROM DYNAMODB
  // =====================================================

  useEffect(() => {
    if (!isEditing) return;

    let active = true;

    async function loadExistingNote() {
      setLoading(true);
      setError("");

      try {
        const result = await getNote(noteId);

        if (!active) return;

        const savedNote = result.note || result;

        if (!savedNote || !savedNote.noteId) {
          throw new Error("Note not found.");
        }

        const savedContent = savedNote.content || "";

        // If returning from details, preserve the draft.
        const draft =
          returnedDraft.noteText !== undefined
            ? returnedDraft.noteText
            : savedContent;

        setNoteText(draft);
        setOriginalText(savedContent);

        setNoteTitle(
          savedNote.title || "Untitled Note"
        );

        setHasReminder(savedNote.reminder === true);
      } catch (err) {
        if (!active) return;

        setError(
          err.message || "Unable to load this note."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadExistingNote();

    return () => {
      active = false;
    };
  }, [isEditing, noteId]);

  // =====================================================
  // WARN BEFORE REFRESH OR TAB CLOSE
  // =====================================================

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (
        dirtyRef.current &&
        !leavingRef.current
      ) {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, []);

  // =====================================================
  // HANDLE BROWSER / ANDROID BACK
  // =====================================================

  useEffect(() => {
    const guardId = `notes-editor-${Date.now()}`;

    window.history.pushState(
      { familyKitNotesGuard: guardId },
      ""
    );

    const handlePopState = () => {
      if (leavingRef.current) return;

      if (dirtyRef.current) {
        window.history.pushState(
          { familyKitNotesGuard: guardId },
          ""
        );

        setShowUnsavedPopup(true);
      } else {
        leavingRef.current = true;

        navigate("/notes", {
          replace: true,
        });
      }
    };

    window.addEventListener(
      "popstate",
      handlePopState
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      );
    };
  }, [navigate]);

  // =====================================================
  // APP BACK BUTTON
  // =====================================================

  const handleBack = () => {
    if (isDirty) {
      setShowUnsavedPopup(true);
      return;
    }

    leavingRef.current = true;

    navigate("/notes", {
      replace: true,
    });
  };

  // =====================================================
  // CONTINUE TO DETAILS
  // =====================================================

  const handleContinue = () => {
    if (!noteText.trim()) {
      setError("Please write your note before continuing.");
      return;
    }

    leavingRef.current = true;

    navigate("/notes/details", {
      state: {
        noteText,
        noteId: isEditing ? noteId : null,
        noteTitle,
        hasReminder,
        originalText,
      },
    });
  };

  // =====================================================
  // DISCARD UNSAVED CHANGES
  // =====================================================

  const handleDiscard = () => {
    leavingRef.current = true;
    setShowUnsavedPopup(false);

    navigate("/notes", {
      replace: true,
    });
  };

  return (
    <main className="fk-note-editor-page">
      <div className="fk-note-editor-container">

        <header className="fk-note-editor-header">
          <button
            type="button"
            className="fk-note-editor-back"
            onClick={handleBack}
            aria-label="Back to My Notes"
          >
            <ChevronLeft size={22} />
          </button>

          <h1>
            {isEditing ? "Edit Notes" : "Add Notes Today"}
          </h1>
        </header>

        {loading ? (
          <section className="fk-note-editor-card">
            <p>Loading your saved note...</p>
          </section>
        ) : error && !noteText ? (
          <section className="fk-note-editor-card">
            <p role="alert">{error}</p>

            <button
              type="button"
              onClick={() => navigate("/notes")}
            >
              Back to My Notes
            </button>
          </section>
        ) : (
          <>
            <section className="fk-note-editor-card">
              <div className="fk-note-editor-label">
                <FileText size={20} />
                <h2>
                  {isEditing
                    ? "Edit Your Notes"
                    : "Write Your Notes"}
                </h2>
              </div>

              <textarea
                className="fk-note-editor-textarea"
                placeholder="Start writing your thoughts, important information, ideas or reminders here..."
                value={noteText}
                onChange={(event) => {
                  setNoteText(event.target.value);
                  setError("");
                }}
                maxLength={10000}
              />

              <div className="fk-note-editor-character-count">
                {noteText.length} / 10000 characters
              </div>
            </section>

            <div className="fk-note-editor-ai-message">
              <Sparkles size={20} />

              <p>
                AI will summarise your data in the next page.
              </p>
            </div>

            {error && (
              <p role="alert" style={{ color: "#b42323" }}>
                {error}
              </p>
            )}

            <button
              type="button"
              className="fk-note-editor-continue"
              onClick={handleContinue}
              disabled={!noteText.trim()}
            >
              <Sparkles size={19} />

              {isEditing
                ? "Continue to Save Changes"
                : "Summarise with AI"}
            </button>
          </>
        )}
      </div>

      {showUnsavedPopup && (
        <div className="fk-note-details-modal-overlay">
          <div
            className="fk-note-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-unsaved-title"
          >
            <div className="fk-note-details-modal-icon warning">
              <AlertCircle size={34} />
            </div>

            <h2 id="editor-unsaved-title">
              Note unsaved!
            </h2>

            <p>Do you want to go back?</p>

            <div className="fk-note-details-modal-actions">
              <button
                type="button"
                className="fk-note-details-modal-secondary"
                onClick={() =>
                  setShowUnsavedPopup(false)
                }
              >
                No
              </button>

              <button
                type="button"
                className="fk-note-details-modal-primary"
                onClick={handleDiscard}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
