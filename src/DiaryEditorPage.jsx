import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Search, Trash2, ChevronDown
} from "lucide-react";
import {
  createDiaryEntry,
  getDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry
} from "./api/diaryApi";
import "./DiaryEditorPage.css";

const MOODS = ["😊", "🥰", "😌", "😢", "😠", "😴", "🤩", "❤️"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function todayIST() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function parseDate(value) {
  const [year, month, day] = (value || todayIST()).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateValue(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function CalendarPopup({ value, onSelect, onClose }) {
  const selected = parseDate(value);
  const [view, setView] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const year = view.getFullYear();
  const month = view.getMonth();
  const offset = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  function changeMonth(amount) {
    setView(new Date(year, month + amount, 1));
  }

  return (
    <div className="diary-calendar-overlay" onClick={onClose}>
      <div className="diary-calendar-popup" role="dialog" aria-modal="true" aria-label="Choose diary date" onClick={(event) => event.stopPropagation()}>
        <div className="diary-calendar-heading">
          <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)}><ChevronLeft size={19} /></button>
          <span>{view.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
          <button type="button" aria-label="Next month" onClick={() => changeMonth(1)}><ChevronRight size={19} /></button>
        </div>
        <div className="diary-calendar-grid">
          {WEEKDAYS.map((day) => <div className="diary-calendar-weekday" key={day}>{day}</div>)}
          {cells.map((day, index) => {
            const dateValue = day ? toDateValue(year, month, day) : "";
            return day ? (
              <button
                type="button"
                key={dateValue}
                className={`diary-calendar-day ${dateValue === value ? "selected" : ""} ${dateValue === todayIST() ? "today" : ""}`}
                aria-label={new Date(year, month, day).toDateString()}
                aria-pressed={dateValue === value}
                onClick={() => { onSelect(dateValue); onClose(); }}
              >{day}</button>
            ) : <span key={`empty-${index}`} />;
          })}
        </div>
      </div>
    </div>
  );
}

export default function DiaryEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromCategories = location.state?.fromCategories === true;
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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [moodsOpen, setMoodsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      const payload = { entryDate, title: title.trim(), content: content.trim(), mood };
      if (isNew) await createDiaryEntry(payload);
      else await updateDiaryEntry(entryId, payload);
      navigate("/diary", { state: { fromCategories } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!entryId || isNew || deleting) return;
    setDeleting(true);
    setError("");
    try {
      await deleteDiaryEntry(entryId);
      setConfirmDelete(false);
      navigate("/diary", { replace: true, state: { fromCategories } });
    } catch (err) {
      setError(err?.message || "Unable to delete diary entry.");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  const date = parseDate(entryDate);

  return (
    <main className="diary-editor-page">
      <div className="diary-editor-container">
        <header className="diary-editor-topbar">
          <button type="button" className="diary-editor-back" onClick={() => navigate("/diary", { state: { fromCategories } })} aria-label="Back to diary">
            <ChevronLeft size={19} />
          </button>
          <span>Dear Diary</span>
          {isEditing ? (
            <button type="button" className="diary-editor-search diary-editor-delete" aria-label="Delete diary entry" onClick={() => setConfirmDelete(true)} disabled={loading || saving || deleting}>
              <Trash2 size={18} />
            </button>
          ) : (
            <button type="button" className="diary-editor-search" aria-label="Search diary entries" onClick={() => navigate("/diary", { state: { fromCategories } })}>
              <Search size={16} />
            </button>
          )}
        </header>

        {loading ? (
          <p className="diary-editor-status">Loading diary entry...</p>
        ) : (
          <form className="diary-editor-form" onSubmit={handleSave}>
            <div className="diary-editor-toolbar">
              <button
                type="button"
                className="diary-date-badge"
                onClick={() => !readOnly && setCalendarOpen(true)}
                disabled={readOnly}
                aria-label="Choose diary date"
              >
                <strong>{String(date.getDate()).padStart(2, "0")}</strong>
                <span className="diary-date-description">
                  <span>{date.toLocaleDateString("en-IN", { month: "short", year: "numeric" }).toUpperCase()} <ChevronDown size={12} /></span>
                  <small>{date.toLocaleDateString("en-IN", { weekday: "long" })}</small>
                </span>
              </button>
              <div className="diary-mood-container">
                <button type="button" className="diary-current-mood" aria-label="Choose mood" disabled={readOnly} onClick={() => setMoodsOpen((open) => !open)}>{mood}</button>
                {moodsOpen && !readOnly && (
                  <div className="diary-mood-picker">
                    {MOODS.map((emoji) => (
                      <button type="button" key={emoji} className={mood === emoji ? "selected" : ""} onClick={() => { setMood(emoji); setMoodsOpen(false); }} aria-label={`Mood ${emoji}`}>{emoji}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <label className="diary-visually-hidden" htmlFor="diary-title">Diary title</label>
            <input id="diary-title" className="diary-editor-title" type="text" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={150} readOnly={readOnly} />
            <label className="diary-visually-hidden" htmlFor="diary-content">Diary content</label>
            <textarea id="diary-content" className="diary-editor-content" placeholder="Write your diary here..." value={content} onChange={(event) => setContent(event.target.value)} readOnly={readOnly} required rows={12} />

            {error && <div className="diary-editor-error" role="alert">{error}</div>}

            <div className="diary-editor-save-area">
              {readOnly ? (
                <button type="button" className="diary-save-btn" onClick={() => navigate(`/diary/${entryId}/edit`, { state: { fromCategories } })}>Edit Entry</button>
              ) : (
                <button type="submit" className="diary-save-btn" disabled={saving}>{saving ? "Saving..." : "Save Entry"}</button>
              )}
            </div>
          </form>
        )}
      </div>

      {confirmDelete && isEditing && (
        <div className="diary-delete-overlay" onClick={() => { if (!deleting) setConfirmDelete(false); }}>
          <div className="diary-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="diary-delete-title" aria-describedby="diary-delete-description" onClick={(event) => event.stopPropagation()}>
            <div className="diary-delete-icon"><Trash2 size={23} /></div>
            <h2 id="diary-delete-title">Delete Diary Entry?</h2>
            <p id="diary-delete-description">Are you sure you want to delete this diary entry? This action cannot be undone.</p>
            <div className="diary-delete-actions">
              <button type="button" className="diary-delete-cancel" disabled={deleting} onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button type="button" className="diary-delete-confirm" disabled={deleting} onClick={handleDelete}>{deleting ? "Deleting..." : "Delete Entry"}</button>
            </div>
          </div>
        </div>
      )}

      {calendarOpen && !readOnly && (
        <CalendarPopup value={entryDate} onSelect={setEntryDate} onClose={() => setCalendarOpen(false)} />
      )}
    </main>
  );
}
