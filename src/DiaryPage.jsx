import FamilyBottomNav from "./components/FamilyBottomNav.jsx";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, BookHeart, Pencil, Search
} from "lucide-react";
import { getDiaryEntries } from "./api/diaryApi";
import "./DiaryPage.css";

function getDateParts(value) {
  if (!value) return { day: "--", monthYear: "", weekday: "" };
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return { day: "--", monthYear: value, weekday: "" };
  }
  return {
    day: new Intl.DateTimeFormat("en-IN", { day: "2-digit" }).format(parsed),
    monthYear: new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(parsed).toUpperCase(),
    weekday: new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(parsed),
  };
}

export default function DiaryPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

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

  const filteredEntries = entries.filter((entry) =>
    `${entry.title || ""} ${entry.content || ""} ${entry.entryDate || ""}`
      .toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <main className="diary-page">
      <div className="diary-container">
        {/* This area stays visible while the diary cards scroll. */}
        <div className="diary-fixed-content">
          <header className="diary-topbar">
            <button type="button" className="diary-back" onClick={() => navigate("/categories")} aria-label="Back to Categories">
              <ChevronLeft size={18} />
            </button>
            <h1>Dear Diary</h1>
            <button type="button" className="diary-search-button" aria-label="Search diary entries" aria-expanded={searchOpen} onClick={() => { setSearchOpen((current) => !current); setSearchText(""); }}>
              <Search size={17} />
            </button>
          </header>

          {searchOpen && (
            <div className="diary-search-panel">
              <Search size={17} />
              <input type="search" autoFocus placeholder="Search your diary entries" aria-label="Search diary entries" value={searchText} onChange={(event) => setSearchText(event.target.value)} />
            </div>
          )}

          <section className="diary-hero">
            <div className="diary-hero-copy">
              <p>Start writing your thoughts in Dear Diary and no one has access to your diary.</p>
              <button type="button" className="diary-primary-btn" onClick={() => navigate("/diary/new")}>
                <Pencil size={13} /> Write Today's Diary
              </button>
            </div>
            <div className="diary-hero-art" aria-hidden="true">
              <span className="diary-art-sparkle">✦</span>
              <BookHeart size={49} strokeWidth={1.8} />
              <span className="diary-art-leaf">✿</span>
            </div>
          </section>

          <div className="diary-section-header">
            <h2>All Entries</h2>
            <span className="diary-entry-count">{loading ? "Loading..." : `${entries.length} ${entries.length === 1 ? "Entry" : "Entries"}`}</span>
          </div>
        </div>

        {/* Only this list area scrolls. */}
        <section className="diary-list-section" aria-label="Diary entries">
          {error && <div className="diary-error" role="alert">{error} <button type="button" onClick={loadEntries}>Retry</button></div>}

          {loading ? (
            <p className="diary-message">Loading your diary...</p>
          ) : filteredEntries.length === 0 ? (
            <div className="diary-empty">
              <BookHeart size={34} />
              <h3>{searchText ? "No matching entries" : "Your diary is waiting"}</h3>
              <p>{searchText ? "Try a different search." : "Your thoughts, memories and special moments deserve a place of their own."}</p>
              {!searchText && <button type="button" className="diary-primary-btn" onClick={() => navigate("/diary/new")}>Write Your First Entry</button>}
            </div>
          ) : (
            <div className="diary-entry-grid">
              {filteredEntries.map((entry) => {
                const date = getDateParts(entry.entryDate);
                return (
                  <article className="diary-entry-card" key={entry.entryId}>
                    <button type="button" className="diary-entry-main" onClick={() => navigate(`/diary/${encodeURIComponent(entry.entryId)}`)} aria-label={`Read ${entry.title || "Untitled Entry"}`}>
                      <div className="diary-entry-topline">
                        <div className="diary-date-badge">
                          <strong>{date.day}</strong>
                          <span><b>{date.monthYear}</b><small>{date.weekday}</small></span>
                        </div>
                        {entry.mood && <span className="diary-entry-mood">{entry.mood}</span>}
                      </div>
                      <h3>{entry.title || "Untitled Entry"}</h3>
                      <p className="diary-entry-preview">{entry.content}</p>
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <FamilyBottomNav active="category" />
    </main>
  );
}
