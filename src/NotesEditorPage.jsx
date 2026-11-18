
import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  FileText,
  AlertCircle,
} from "lucide-react";

import "./NotesEditorPage.css";
import "./NotesDetailsPage.css";

export default function NotesEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [noteText, setNoteText] = useState(
    location.state?.noteText || ""
  );

  const [showUnsavedPopup, setShowUnsavedPopup] =
    useState(false);

  const noteTextRef = useRef(noteText);
  const leavingRef = useRef(false);

  noteTextRef.current = noteText;

  // Warn if the user closes or reloads the browser.
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (
        !leavingRef.current &&
        noteTextRef.current.trim()
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

  // Handle browser back and Android system back.
  useEffect(() => {
    const guardId = `notes-editor-${Date.now()}`;

    window.history.pushState(
      { familyKitNotesGuard: guardId },
      ""
    );

    const handlePopState = () => {
      if (leavingRef.current) return;

      if (noteTextRef.current.trim()) {
        window.history.pushState(
          { familyKitNotesGuard: guardId },
          ""
        );

        setShowUnsavedPopup(true);
      } else {
        leavingRef.current = true;
        navigate("/notes", { replace: true });
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

  const handleBack = () => {
    if (noteText.trim()) {
      setShowUnsavedPopup(true);
      return;
    }

    leavingRef.current = true;
    navigate("/notes", { replace: true });
  };

  const handleContinue = () => {
    if (!noteText.trim()) {
      alert("Please write your note before continuing.");
      return;
    }

    leavingRef.current = true;

    navigate("/notes/details", {
      state: { noteText },
    });
  };

  const handleDiscard = () => {
    leavingRef.current = true;
    setShowUnsavedPopup(false);

    navigate("/notes", { replace: true });
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
            <ArrowLeft size={22} />
          </button>

          <h1>Add Notes Today</h1>
        </header>

        <section className="fk-note-editor-card">
          <div className="fk-note-editor-label">
            <FileText size={20} />
            <h2>Write Your Notes</h2>
          </div>

          <textarea
            className="fk-note-editor-textarea"
            placeholder="Start writing your thoughts, important information, ideas or reminders here..."
            value={noteText}
            onChange={(event) =>
              setNoteText(event.target.value)
            }
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

        <button
          type="button"
          className="fk-note-editor-continue"
          onClick={handleContinue}
          disabled={!noteText.trim()}
        >
          <Sparkles size={19} />
          Summarise with AI
        </button>
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
