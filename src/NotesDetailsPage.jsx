
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  ChevronLeft,
  Sparkles,
  FileText,
  Bell,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import {
  createNote,
  updateNote,
} from "./api/notesApi";

import "./NotesDetailsPage.css";

export default function NotesDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromCategories = location.state?.fromCategories === true;

  // =====================================================
  // NOTE DATA FROM EDITOR
  // =====================================================

  const noteText = location.state?.noteText || "";

  const noteId = location.state?.noteId || null;

  const noteTitle =
    location.state?.noteTitle || "Untitled Note";

  const hasReminder =
    location.state?.hasReminder === true;

  const originalText =
    location.state?.originalText ?? "";

  const isEditing = Boolean(noteId);

  // A new note is unsaved if it contains text.
  // An existing note is unsaved only if modified.
  const hasUnsavedChanges = isEditing
    ? noteText !== originalText
    : noteText.trim().length > 0;

  // =====================================================
  // STATE
  // =====================================================

  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const leavingRef = useRef(false);
  const savedRef = useRef(false);
  const savingRef = useRef(false);

  // =====================================================
  // RETURN TO THE CORRECT EDITOR
  // =====================================================

  const editorPath = isEditing
    ? `/notes/${encodeURIComponent(noteId)}/edit`
    : "/notes/new";

  const returnToEditor = () => {
    leavingRef.current = true;
    setModal(null);

    navigate(editorPath, {
      replace: true,
      state: {
        fromCategories,
        noteText,
        noteTitle,
        hasReminder,
        originalText,
      },
    });
  };

  // =====================================================
  // WARN BEFORE REFRESH / CLOSE
  // =====================================================

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (
        hasUnsavedChanges &&
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
  }, [hasUnsavedChanges]);

  // =====================================================
  // BROWSER / ANDROID BACK
  // =====================================================

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

      if (
        hasUnsavedChanges &&
        !savedRef.current
      ) {
        window.history.pushState(
          { familyKitNotesGuard: guardId },
          ""
        );

        setModal("unsaved");
      } else {
        returnToEditor();
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
  }, [hasUnsavedChanges, navigate, editorPath]);

  // =====================================================
  // APP BACK BUTTON
  // =====================================================

  const handleBack = () => {
    if (savingRef.current) return;

    if (
      hasUnsavedChanges &&
      !savedRef.current
    ) {
      setModal("unsaved");
      return;
    }

    returnToEditor();
  };

  // =====================================================
  // SAVE NEW NOTE OR UPDATE EXISTING NOTE
  // =====================================================

  const handleSave = async (withReminder) => {
    if (savingRef.current || savedRef.current) {
      return;
    }

    if (!noteText.trim()) {
      setError("Please enter a note before saving.");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError("");
    setModal(null);

    try {
      let result;

      if (isEditing) {
        // Update the SAME DynamoDB note.
        result = await updateNote(noteId, {
          title: noteTitle,
          content: noteText.trim(),
          reminder: withReminder,
        });
      } else {
        // Create a new DynamoDB note.
        result = await createNote({
          title: noteTitle,
          content: noteText.trim(),
          reminder: withReminder,
        });
      }

      if (!result.success) {
        throw new Error(
          isEditing
            ? "Unable to update your note."
            : "Unable to save your note."
        );
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

  // =====================================================
  // SUCCESS → MY NOTES
  // =====================================================

  const closeSuccess = () => {
    leavingRef.current = true;
    setModal(null);

    navigate("/notes", {
      replace: true,
      state: { fromCategories },
    });
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <main className="fk-note-details-page">
      <div className="fk-note-details-container">

        {/* HEADER */}
        <header className="fk-note-details-header">
          <button
            type="button"
            className="fk-note-details-back"
            onClick={handleBack}
            disabled={saving}
            aria-label="Back to note editor"
          >
            <ChevronLeft size={22} />
          </button>

          <h1>AI Extracted Details</h1>
        </header>

        {/* NOTE PREVIEW */}
        <section className="fk-note-details-card">
          <div className="fk-note-details-title">
            <FileText size={20} />

            <h2>Your Notes</h2>
          </div>

          <div className="fk-note-details-preview">
            {noteText.trim() || "No note entered."}
          </div>
        </section>

        {/* AI PLACEHOLDER */}
        <section className="fk-note-details-ai-card">
          <div className="fk-note-details-title">
            <Sparkles size={21} />

            <h2>AI Extracted Details</h2>
          </div>

          <div className="fk-note-details-extraction-box">
            <Sparkles
              size={30}
              strokeWidth={1.5}
            />

            <p>
              AI summarisation and information extraction
              will be available soon.
            </p>

            <span>
              You can save your original note now.
            </span>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div
            className="fk-note-details-error"
            role="alert"
          >
            <AlertCircle size={19} />
            <span>{error}</span>
          </div>
        )}

        {/* SAVE BUTTONS */}
        <div className="fk-note-details-actions">
          <button
            type="button"
            className="fk-note-details-reminder-btn"
            onClick={() => handleSave(true)}
            disabled={
              saving ||
              savedRef.current ||
              !noteText.trim()
            }
          >
            <Bell size={19} />

            {saving
              ? "Saving..."
              : isEditing
              ? "Update Notes & Add Reminder"
              : "Save Notes & Add Reminder"}
          </button>

          <button
            type="button"
            className="fk-note-details-save-btn"
            onClick={() =>
              handleSave(
                isEditing ? hasReminder : false
              )
            }
            disabled={
              saving ||
              savedRef.current ||
              !noteText.trim()
            }
          >
            <Save size={19} />

            {saving
              ? "Saving..."
              : isEditing
              ? "Save Changes"
              : "Save Notes Only"}
          </button>
        </div>

        <p className="fk-note-details-disclaimer">
          Reminder scheduling and notifications are not
          available yet. Selecting the reminder option
          saves a reminder flag with your note.
        </p>
      </div>

      {/* MODALS */}
      {modal && (
        <div className="fk-note-details-modal-overlay">
          <div
            className="fk-note-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fk-note-modal-title"
          >
            {/* UNSAVED WARNING */}
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
                    onClick={returnToEditor}
                  >
                    Yes
                  </button>
                </div>
              </>
            )}

            {/* SAVE SUCCESS */}
            {modal === "saveSuccess" && (
              <>
                <div className="fk-note-details-modal-icon success">
                  <CheckCircle2 size={40} />
                </div>

                <h2 id="fk-note-modal-title">
                  {isEditing
                    ? "Notes Updated!"
                    : "Notes Saved!"}
                </h2>

                <p>
                  {isEditing
                    ? "Your note has been updated successfully."
                    : "Your note has been saved successfully."}
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

            {/* REMINDER SUCCESS */}
            {modal === "reminderSuccess" && (
              <>
                <div className="fk-note-details-modal-icon success">
                  <CheckCircle2 size={40} />
                </div>

                <h2 id="fk-note-modal-title">
                  {isEditing
                    ? "Note Updated!"
                    : "Note Saved!"}
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
