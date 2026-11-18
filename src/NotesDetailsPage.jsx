
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Sparkles,
  FileText,
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { createNote } from "./api/notesApi";
import "./NotesDetailsPage.css";

export default function NotesDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const noteText = location.state?.noteText || "";

  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const leavingRef = useRef(false);
  const savedRef = useRef(false);
  const savingRef = useRef(false);

  // Warn before closing or refreshing the browser.
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (
        noteText.trim() &&
        !savedRef.current &&
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
  }, [noteText]);

  // Handle Android and browser back navigation.
  useEffect(() => {
    const guardId = `notes-details-${Date.now()}`;

    window.history.pushState(
      { familyKitNotesGuard: guardId },
      ""
    );

    const handlePopState = () => {
      if (leavingRef.current) return;

      if (savingRef.current) {
        window.history.pushState(
          { familyKitNotesGuard: guardId },
          ""
        );
        return;
      }

      if (savedRef.current) {
        leavingRef.current = true;
        navigate("/notes", { replace: true });
        return;
      }

      if (noteText.trim()) {
        window.history.pushState(
          { familyKitNotesGuard: guardId },
          ""
        );

        setModal("unsaved");
      } else {
        leavingRef.current = true;
        navigate("/notes/new", {
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
  }, [navigate, noteText]);

  const handleBack = () => {
    if (savingRef.current) return;

    if (noteText.trim() && !savedRef.current) {
      setModal("unsaved");
      return;
    }

    leavingRef.current = true;

    navigate("/notes/new", {
      replace: true,
      state: { noteText },
    });
  };

  const handleConfirmBack = () => {
    leavingRef.current = true;
    setModal(null);

    navigate("/notes/new", {
      replace: true,
      state: { noteText },
    });
  };

  const handleSave = async (withReminder) => {
    if (savingRef.current) return;

    if (!noteText.trim()) {
      setError("Please enter a note before saving.");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError("");
    setModal(null);

    try {
      const result = await createNote({
        title: "Untitled Note",
        content: noteText.trim(),
        reminder: withReminder,
      });

      if (!result.success) {
        throw new Error("Unable to save your note.");
      }

      savedRef.current = true;

      setModal(
        withReminder
          ? "reminderSuccess"
          : "saveSuccess"
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to save your note. Please try again."
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const closeSuccess = () => {
    leavingRef.current = true;
    setModal(null);

    navigate("/notes", {
      replace: true,
    });
  };

  return (
    <main className="fk-note-details-page">
      <div className="fk-note-details-container">
        <header className="fk-note-details-header">
          <button
            type="button"
            className="fk-note-details-back"
            onClick={handleBack}
            disabled={saving}
            aria-label="Back to note editor"
          >
            <ArrowLeft size={22} />
          </button>

          <h1>AI Extracted Details</h1>
        </header>

        <section className="fk-note-details-card">
          <div className="fk-note-details-title">
            <FileText size={20} />
            <h2>Your Notes</h2>
          </div>

          <div className="fk-note-details-preview">
            {noteText.trim() || "No note entered."}
          </div>
        </section>

        <section className="fk-note-details-ai-card">
          <div className="fk-note-details-title">
            <Sparkles size={21} />
            <h2>AI Extracted Details</h2>
          </div>

          <div className="fk-note-details-extraction-box">
            <Sparkles size={30} strokeWidth={1.5} />

            <p>
              AI summarisation and information extraction
              will be available soon.
            </p>

            <span>
              You can save your original note now.
            </span>
          </div>
        </section>

        {error && (
          <div
            className="fk-note-details-error"
            role="alert"
          >
            <AlertCircle size={19} />
            <span>{error}</span>
          </div>
        )}

        <div className="fk-note-details-actions">
          <button
            type="button"
            className="fk-note-details-reminder-btn"
            onClick={() => handleSave(true)}
            disabled={saving || !noteText.trim()}
          >
            <Bell size={19} />

            {saving
              ? "Saving..."
              : "Save Notes & Add Reminder"}
          </button>

          <button
            type="button"
            className="fk-note-details-save-btn"
            onClick={() => handleSave(false)}
            disabled={saving || !noteText.trim()}
          >
            <Save size={19} />

            {saving ? "Saving..." : "Save Notes Only"}
          </button>
        </div>

        <p className="fk-note-details-disclaimer">
          Reminder scheduling and notifications are not
          available yet. Selecting the reminder option
          saves a reminder flag with your note.
        </p>
      </div>

      {modal && (
        <div className="fk-note-details-modal-overlay">
          <div
            className="fk-note-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fk-note-modal-title"
          >
            {modal === "unsaved" && (
              <>
                <div className="fk-note-details-modal-icon warning">
                  <AlertCircle size={34} />
                </div>

                <h2 id="fk-note-modal-title">
                  Note unsaved!
                </h2>

                <p>Do you want to go back?</p>

                <div className="fk-note-details-modal-actions">
                  <button
                    type="button"
                    className="fk-note-details-modal-secondary"
                    onClick={() => setModal(null)}
                  >
                    No
                  </button>

                  <button
                    type="button"
                    className="fk-note-details-modal-primary"
                    onClick={handleConfirmBack}
                  >
                    Yes
                  </button>
                </div>
              </>
            )}

            {modal === "saveSuccess" && (
              <>
                <div className="fk-note-details-modal-icon success">
                  <CheckCircle2 size={40} />
                </div>

                <h2 id="fk-note-modal-title">
                  Notes Saved!
                </h2>

                <p>
                  Your note has been saved successfully.
                </p>

                <button
                  type="button"
                  className="fk-note-details-modal-done"
                  onClick={closeSuccess}
                >
                  Done
                </button>
              </>
            )}

            {modal === "reminderSuccess" && (
              <>
                <div className="fk-note-details-modal-icon success">
                  <CheckCircle2 size={40} />
                </div>

                <h2 id="fk-note-modal-title">
                  Note Saved!
                </h2>

                <p>
                  Your note has been saved with a reminder
                  flag. Reminder notifications will be
                  available in a future update.
                </p>

                <button
                  type="button"
                  className="fk-note-details-modal-done"
                  onClick={closeSuccess}
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
