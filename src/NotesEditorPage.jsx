
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Sparkles, FileText } from "lucide-react";
import "./NotesEditorPage.css";

export default function NotesEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [noteText, setNoteText] = useState(
    location.state?.noteText || ""
  );

  const handleContinue = () => {
    if (!noteText.trim()) {
      alert("Please write your note before continuing.");
      return;
    }

    navigate("/notes/details", {
      state: { noteText },
    });
  };

  return (
    <main className="fk-note-editor-page">
      <div className="fk-note-editor-container">
        <header className="fk-note-editor-header">
          <button
            type="button"
            className="fk-note-editor-back"
            onClick={() => navigate("/notes")}
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
    </main>
  );
}
