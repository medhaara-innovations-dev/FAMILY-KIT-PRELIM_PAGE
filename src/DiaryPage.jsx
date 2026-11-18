
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, BookHeart, Plus, Pencil,
  Trash2, CalendarDays, RefreshCw
} from "lucide-react";
import {
  getDiaryEntries,
  deleteDiaryEntry
} from "./api/diaryApi";
import "./DiaryPage.css";

function formatDate(date) {
  if (!date) return "";
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
}

export default function DiaryPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  async function loadEntries() {
    setLoading(true);
    setError("");

    try {
      const result = await getDiaryEntries();
      setEntries(
        [...result].sort((a, b) =>
          (b.entryDate || "").localeCompare(a.entryDate || "") ||
          (b.createdAt || "").localeCompare(a.createdAt || "")
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntries();
  }, []);

  async function handleDelete(entry) {
    const confirmed = window.confirm(
      "Delete this diary entry permanently? This cannot be undone."
    );
    if (!confirmed) return;

    setDeletingId(entry.entryId);
    setError("");

    try {
      await deleteDiaryEntry(entry.entryId);
      setEntries((current) =>
        current.filter((item) => item.entryId !== entry.entryId)
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="diary-page">
      <div className="diary-container">
        <header className="diary-topbar">
          <button
            className="diary-back"
            onClick={() => navigate("/my-family")}
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={21} />
          </button>
          <span>My Diary</span>
        </header>

        <section className="diary-hero">
          <div className="diary-hero-icon">
            <BookHeart size={35} />
          </div>
          <h1>Dear Diary</h1>
          <p>
            Start writing your thoughts in Dear Diary and
            no one has access to your diary.
          </p>
          <button
            className="diary-primary-btn"
            onClick={() => navigate("/diary/new")}
          >
            <Plus size={19} />
            Write Today's Diary
          </button>
        </section>

        <section className="diary-list-section">
          <div className="diary-section-header">
            <div>
              <h2>All Entries</h2>
              <p>
                {loading
                  ? "Loading your diary..."
                  : `${entries.length} ${
                      entries.length === 1 ? "entry" : "entries"
                    }`}
              </p>
            </div>
            <button
              className="diary-refresh"
              onClick={loadEntries}
              disabled={loading}
              aria-label="Refresh entries"
            >
              <RefreshCw size={19} />
            </button>
          </div>

          {error && (
            <div className="diary-error" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <p className="diary-message">Loading entries...</p>
          ) : entries.length === 0 ? (
            <div className="diary-empty">
              <BookHeart size={43} />
              <h3>Your diary is waiting</h3>
              <p>
                Your thoughts, memories and special moments
                deserve a place of their own.
              </p>
              <button
                className="diary-primary-btn"
                onClick={() => navigate("/diary/new")}
              >
                Write Your First Entry
              </button>
            </div>
          ) : (
            <div className="diary-entry-grid">
              {entries.map((entry) => (
                <article
                  className="diary-entry-card"
                  key={entry.entryId}
                >
                  <div className="diary-entry-date">
                    <CalendarDays size={15} />
                    {formatDate(entry.entryDate)}
                    <span className="diary-entry-mood">
                      {entry.mood || ""}
                    </span>
                  </div>

                  <h3>{entry.title || "Untitled Entry"}</h3>
                  <p className="diary-entry-preview">
                    {entry.content}
                  </p>

                  <div className="diary-entry-actions">
                    <button
                      onClick={() =>
                        navigate(`/diary/${entry.entryId}`)
                      }
                    >
                      Read Entry
                    </button>
                    <button
                      aria-label="Edit entry"
                      onClick={() =>
                        navigate(`/diary/${entry.entryId}/edit`)
                      }
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      aria-label="Delete entry"
                      disabled={deletingId === entry.entryId}
                      onClick={() => handleDelete(entry)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
