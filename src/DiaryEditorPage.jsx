
import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Save, CalendarDays } from "lucide-react";
import {
  createDiaryEntry,
  getDiaryEntry,
  updateDiaryEntry
} from "./api/diaryApi";
import "./DiaryEditorPage.css";

const MOODS = ["😊", "🥰", "😌", "😢", "😠", "😴", "🤩", "❤️"];

function todayIST() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const part = (type) =>
    parts.find((item) => item.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}`;
}

export default function DiaryEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { entryId } = useParams();

  const isNew = !entryId;
  const isEditing = location.pathname.endsWith("/edit");
  const readOnly = !isNew && !isEditing;

  const [entryDate, setEntryDate] = useState(todayIST());
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("😊");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!entryId) return;

    let active = true;

    async function loadEntry() {
      setLoading(true);
      setError("");

      try {
        const entry = await getDiaryEntry(entryId);

        if (!active) return;

        setEntryDate(entry.entryDate || todayIST());
        setTitle(entry.title || "");
        setContent(entry.content || "");
        setMood(entry.mood || "😊");
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadEntry();
    return () => { active = false; };
  }, [entryId]);

  async function handleSave(event) {
    event.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("Please write something before saving.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        entryDate,
        title: title.trim(),
        content: content.trim(),
        mood
      };

      if (isNew) {
        await createDiaryEntry(payload);
      } else {
        await updateDiaryEntry(entryId, payload);
      }

      navigate("/diary");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="diary-editor-page">
        <p className="diary-editor-status">Loading diary entry...</p>
      </main>
    );
  }

  return (
    <main className="diary-editor-page">
      <div className="diary-editor-container">
        <header className="diary-editor-topbar">
          <button
            type="button"
            className="diary-editor-back"
            onClick={() => navigate("/diary")}
            aria-label="Back to diary"
          >
            <ArrowLeft size={21} />
          </button>
          <span>
            {isNew
              ? "Write Today's Diary"
              : readOnly
                ? "My Diary Entry"
                : "Edit Diary Entry"}
          </span>
        </header>

        <div className="diary-editor-card">
          <div className="diary-editor-heading">
            <h1>
              {isNew
                ? "Dear Diary..."
                : readOnly
                  ? "My Memories"
                  : "Edit Your Thoughts"}
            </h1>
            <p>
              {readOnly
                ? "A moment from your personal diary."
                : "A little space just for your thoughts."}
            </p>
          </div>

          <form onSubmit={handleSave}>
            <label className="diary-field-label" htmlFor="diary-date">
              <CalendarDays size={17} /> Entry Date
            </label>
            <input
              id="diary-date"
              type="date"
              className="diary-input"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              required
              disabled={readOnly}
            />

            <label className="diary-field-label" htmlFor="diary-title">
              Title (Optional)
            </label>
            <input
              id="diary-title"
              type="text"
              className="diary-input"
              placeholder="Give today a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={150}
              readOnly={readOnly}
            />

            <label className="diary-field-label" htmlFor="diary-content">
              Your Thoughts
            </label>
            <textarea
              id="diary-content"
              className="diary-textarea"
              placeholder="Dear Diary, today..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              readOnly={readOnly}
              required
              rows={12}
            />

            <label className="diary-field-label">
              How are you feeling?
            </label>
            <div className="diary-mood-row">
              {MOODS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  disabled={readOnly}
                  className={`diary-mood-btn ${
                    mood === emoji ? "selected" : ""
                  }`}
                  onClick={() => setMood(emoji)}
                  aria-label={`Mood ${emoji}`}
                  aria-pressed={mood === emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {error && (
              <div className="diary-editor-error" role="alert">
                {error}
              </div>
            )}

            <div className="diary-editor-actions">
              <button
                type="button"
                className="diary-cancel-btn"
                onClick={() => navigate("/diary")}
              >
                {readOnly ? "Back to Entries" : "Cancel"}
              </button>

              {readOnly ? (
                <button
                  type="button"
                  className="diary-save-btn"
                  onClick={() => navigate(`/diary/${entryId}/edit`)}
                >
                  Edit Entry
                </button>
              ) : (
                <button
                  type="submit"
                  className="diary-save-btn"
                  disabled={saving}
                >
                  <Save size={18} />
                  {saving ? "Saving..." : "Save Diary"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
