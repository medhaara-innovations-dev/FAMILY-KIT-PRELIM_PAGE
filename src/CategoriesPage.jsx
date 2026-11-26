import FamilyBottomNav from "./components/FamilyBottomNav.jsx";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ChevronLeft,
  Search,
  Plus,
  CalendarDays,
  Landmark,
  ReceiptText,
  BookMarked,
  FileText,
  GraduationCap,
  HeartPulse,
  HandHeart,
  Houses,
  Scale,
  UserRoundCheck,
  BadgeCheck,
  } from "lucide-react";

import { ImportantContactsIcon, NotesIcon } from "./components/ReferenceIcons.jsx";
import ProfileAvatar from "./components/ProfileAvatar.jsx";

import { getFamilyMembers } from "./api/familyMembersApi.js";
import { getDiaryEntries } from "./api/diaryApi.js";
import { listEvents } from "./api/eventsApi.js";
import { countEventEntries } from "./eventDates.js";
import { getImportantContacts } from "./api/importantContactsApi.js";
import { getNotes } from "./api/notesApi.js";
import { SELF_PROFILE_ID } from "./api/profilePicturesApi.js";
import "./CategoriesPage.css";

// ==========================================
// CATEGORY DATA
// ==========================================

const categories = [
  {
    name: "Bills & Renewals",
    Icon: ReceiptText,
    background: "#FAF7F0",
    color: "#B89C10",
  },
  {
    name: "Diary",
    Icon: BookMarked,
    background: "#F1ECFB",
    color: "#6528C6",
    route: "/diary",
    loadRecords: () => getDiaryEntries(),
  },
  {
    name: "Documents",
    Icon: FileText,
    background: "#F0F6FB",
    color: "#2882C6",
  },
  {
    name: "Education",
    Icon: GraduationCap,
    background: "#effbef",
    color: "#29c329",
  },
  {
    name: "Events",
    Icon: CalendarDays,
    background: "#FAF3F0",
    color: "#C66728",
    route: "/events",
    loadRecords: (signal) => listEvents(signal),
    countRecords: (events) => countEventEntries(events,
      new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Kolkata" }).format(new Date())),
  },
  {
    name: "Finance",
    Icon: Landmark,
    background: "#EFF0FB",
    color: "#283DC6",
  },
  {
    name: "Health & Reports",
    Icon: HeartPulse,
    background: "#FAEFF6",
    color: "#C62882",
  },
  {
    name: "Important Contacts",
    Icon: ImportantContactsIcon,
    route: "/important-contacts",
    loadRecords: () => getImportantContacts(),
    background: "#FAEFF0",
    color: "#C62828",
  },
  {
    name: "Insurance",
    Icon: HandHeart,
    background: "#EFF9FA",
    color: "#13A699",
  },
  {
    name: "Legal",
    Icon: Scale,
    background: "#F5F1ED",
    color: "#844B06",
  },
  {
    name: "Nominees",
    Icon: UserRoundCheck,
    background: "#FAEFFB",
    color: "#C628C1",
  },
  {
    name: "Notes",
    Icon: NotesIcon,
    background: "#F5F9F0",
    color: "#78B219",
    route: "/notes",
    loadRecords: async () => (await getNotes()).notes || [],
  },
  {
    name: "Property",
    Icon: Houses,
    background: "#F7EFFB",
    color: "#9E28C6",
  },
  {
    name: "Warranties",
    Icon: BadgeCheck,
    background: "#F9EDF3",
    color: "#B31351",
  },
];

function categoryCountLabel(category, count) {
  if (!category.loadRecords || count === 0) return "None";
  if (count === null) return "Unavailable";
  return count ?? "Loading…";
}

// ==========================================
// FAMILY FILTERS
// ==========================================

const DEFAULT_FAMILY_FILTERS = [
  { id: "all-family", label: "All Family" },
  { id: SELF_PROFILE_ID, label: "Me" },
];

function buildFamilyFilters(members) {
  const valid = (Array.isArray(members) ? members : []).filter(
    (member) => member?.memberId && member.memberId !== SELF_PROFILE_ID
  );
  const relationshipOf = (member) =>
    String(member.relationship || "Family Member").trim() || "Family Member";
  const counts = new Map();
  valid.forEach((member) => {
    const key = relationshipOf(member).toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...DEFAULT_FAMILY_FILTERS, ...valid.map((member) => {
    const relationship = relationshipOf(member);
    return {
      id: member.memberId,
      label: counts.get(relationship.toLowerCase()) > 1 && member.name
        ? `${relationship} (${member.name})`
        : relationship,
    };
  })];
}

// ==========================================
// CATEGORIES PAGE
// ==========================================

export default function CategoriesPage() {
  const navigate = useNavigate();

  const [selectedFamily, setSelectedFamily] =
    useState("all-family");
  const [familyFilters, setFamilyFilters] = useState(DEFAULT_FAMILY_FILTERS);
  const [familyError, setFamilyError] = useState("");
  const [familyRetry, setFamilyRetry] = useState(0);
  const [recordCounts, setRecordCounts] = useState({});

  useEffect(() => {
    const controller = new AbortController();

    categories.forEach(({ route, loadRecords, countRecords }) => {
      if (!loadRecords) return;
      loadRecords(controller.signal).then((records) => {
        if (!controller.signal.aborted) {
          const count = countRecords ? countRecords(records) : records.length;
          setRecordCounts((previous) => ({ ...previous, [route]: count }));
        }
      }).catch(() => {
        if (!controller.signal.aborted) {
          setRecordCounts((previous) => ({ ...previous, [route]: null }));
        }
      });
    });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setFamilyError("");
    getFamilyMembers().then((members) => {
      if (cancelled) return;
      const filters = buildFamilyFilters(members);
      setFamilyFilters(filters);
      setSelectedFamily((previous) =>
        filters.some((filter) => filter.id === previous) ? previous : "all-family"
      );
    }).catch(() => {
      if (!cancelled) setFamilyError("Unable to load family members.");
    });
    return () => { cancelled = true; };
  }, [familyRetry]);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [searchText, setSearchText] =
    useState("");

  const [showAddMessage, setShowAddMessage] =
    useState(false);

  // ==========================================
  // SEARCH FILTER
  // ==========================================

  const filteredCategories = categories.filter(
    (category) =>
      category.name
        .toLowerCase()
        .includes(searchText.toLowerCase())
  );

  // ==========================================
  // CATEGORY NAVIGATION
  // ==========================================

  const handleCategoryClick = (category) => {
    if (category.route) {
      const state = ["/important-contacts", "/diary", "/notes", "/events"].includes(category.route)
        ? { fromCategories: true } : undefined;
      navigate(category.route, { state });
    }

    // Remaining category pages will be connected
    // when their respective screens are created.
  };

  return (
    <main className="fk-cat-page">
      <div className="fk-cat-container">
        <div className="fk-cat-top fk-glass-header">

          {/* ==========================================
              HEADER
              ========================================== */}

          <header className="fk-cat-header">
            <button
              type="button"
              className="fk-cat-back"
              onClick={() => navigate("/my-family")}
              aria-label="Back to dashboard"
            >
              <ChevronLeft size={19} />
            </button>

            <h1>Categories</h1>

            <div className="fk-cat-header-actions">
              <button
                type="button"
                className="fk-cat-search-btn"
                onClick={() => {
                  setSearchOpen((previous) => !previous);
                  setSearchText("");
                }}
                aria-label="Search categories"
              >
                <Search size={17} />
              </button>

              <button
                type="button"
                className="fk-cat-add-btn"
                onClick={() => setShowAddMessage(true)}
                aria-label="Add category"
              >
                <Plus size={20} />
              </button>
            </div>
          </header>

          {/* ==========================================
              SEARCH
              ========================================== */}

          {searchOpen && (
            <div className="fk-cat-search-panel">
              <Search size={17} />

              <input
                type="search"
                placeholder="Search categories..."
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
                autoFocus
              />
            </div>
          )}

          {/* ==========================================
              FAMILY FILTERS
              ========================================== */}

          <section className="fk-cat-filter-section">
            <p className="fk-cat-filter-label">
              View Records of
            </p>

            <div className="fk-cat-filter-scroll">
              {familyFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`fk-cat-filter ${
                    selectedFamily === filter.id
                      ? "fk-cat-filter-active"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedFamily(filter.id)
                  }
                  aria-pressed={
                    selectedFamily === filter.id
                  }
                >
                  {/*
                    All Family: Never display circle.

                    All other filters:
                    Always display circle,
                    even when selected.
                  */}

                  {filter.id !== "all-family" && (
                    <span className="fk-cat-radio" aria-hidden="true">
                      <ProfileAvatar memberId={filter.id} className="fk-cat-filter-avatar">
                        <span />
                      </ProfileAvatar>
                    </span>
                  )}

                  <span>{filter.label}</span>
                </button>
              ))}
            </div>
            {familyError && (
              <p className="fk-cat-filter-label" role="alert">
                {familyError}{" "}
                <button type="button" onClick={() => setFamilyRetry((n) => n + 1)}>Retry</button>
              </p>
            )}
          </section>

          <h2 id="all-categories-heading" className="fk-cat-grid-heading">
            All Categories
          </h2>
        </div>

        {/* ==========================================
            CATEGORY GRID
            ========================================== */}

        <section className="fk-cat-content" aria-labelledby="all-categories-heading">
          <div className="fk-cat-grid">
            {filteredCategories.map((category) => {
              const Icon = category.Icon;

              return (
                <button
                  key={category.name}
                  type="button"
                  className="fk-cat-card"
                  onClick={() =>
                    handleCategoryClick(category)
                  }
                >
                  <span
                    className="fk-cat-icon-box"
                    style={{
                      background: category.background,
                      color: category.color,
                    }}
                  >
                    <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
                  </span>

                  <span className="fk-cat-card-name">
                    {category.name}
                  </span>

                  <span className="fk-cat-card-count">
                    {categoryCountLabel(category, recordCounts[category.route])}
                  </span>
                </button>
              );
            })}
          </div>

          {filteredCategories.length === 0 && (
            <p className="fk-cat-no-results">
              No matching categories found.
            </p>
          )}
        </section>
      </div>

      {/* ==========================================
          BOTTOM NAVIGATION
          ========================================== */}

      <FamilyBottomNav active="category" />

      {/* ==========================================
          ADD PLACEHOLDER MODAL
          ========================================== */}

      {showAddMessage && (
        <div
          className="fk-cat-modal-overlay"
          onClick={() =>
            setShowAddMessage(false)
          }
        >
          <div
            className="fk-cat-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h2>Add New Item</h2>

            <p>
              Category creation will be connected
              in the next development step.
            </p>

            <button
              type="button"
              onClick={() =>
                setShowAddMessage(false)
              }
            >
              OK
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
