
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Search,
  Plus,
  CalendarDays,
  Landmark,
  ContactRound,
  Scale,
  UserRoundCheck,
  BadgeCheck,
  House,
  UsersRound,
  LayoutGrid,
  CreditCard,
} from "lucide-react";

import billsIcon from "./assets/images/Household & Bills.png";
import diaryIcon from "./assets/images/Diary.png";
import documentsIcon from "./assets/images/File.png";
import educationIcon from "./assets/images/Education.png";
import healthIcon from "./assets/images/health.png";
import insuranceIcon from "./assets/images/Insurance.png";
import notesIcon from "./assets/images/Notes.png";
import propertyIcon from "./assets/images/Housing.png";

import { getFamilyMembers } from "./api/familyMembersApi.js";
import { SELF_PROFILE_ID } from "./api/profilePicturesApi.js";
import "./CategoriesPage.css";

// ==========================================
// CATEGORY DATA
// ==========================================

const categories = [
  {
    name: "Bills & Renewals",
    image: billsIcon,
    background: "#fbf8ef",
    color: "#c7a20b",
  },
  {
    name: "Diary",
    image: diaryIcon,
    background: "#f3efff",
    color: "#8146e7",
    route: "/diary",
  },
  {
    name: "Documents",
    image: documentsIcon,
    background: "#eef7ff",
    color: "#318bd5",
  },
  {
    name: "Education",
    image: educationIcon,
    background: "#effbef",
    color: "#29c329",
  },
  {
    name: "Events",
    Icon: CalendarDays,
    background: "#fff3e9",
    color: "#f07828",
    route: "/events",
  },
  {
    name: "Finance",
    Icon: Landmark,
    background: "#eef0ff",
    color: "#5559e8",
  },
  {
    name: "Health & Reports",
    image: healthIcon,
    background: "#fff0f7",
    color: "#e642a0",
  },
  {
    name: "Important Contacts",
    Icon: ContactRound,
    background: "#fff0f0",
    color: "#ef4747",
  },
  {
    name: "Insurance",
    image: insuranceIcon,
    background: "#eafafa",
    color: "#28b9b0",
  },
  {
    name: "Legal",
    Icon: Scale,
    background: "#f7f2ed",
    color: "#a66a2a",
  },
  {
    name: "Nominees",
    Icon: UserRoundCheck,
    background: "#fff0fc",
    color: "#e32ed4",
  },
  {
    name: "Notes",
    image: notesIcon,
    background: "#f4faed",
    color: "#83c62a",
    route: "/notes",
  },
  {
    name: "Property",
    image: propertyIcon,
    background: "#f5eaff",
    color: "#a532e4",
  },
  {
    name: "Warranties",
    Icon: BadgeCheck,
    background: "#fff0f7",
    color: "#e84b91",
  },
];

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
      navigate(category.route);
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
              <ArrowLeft size={19} />
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
                    <span className="fk-cat-radio" />
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
        </div>

        {/* ==========================================
            CATEGORY GRID
            ========================================== */}

        <section className="fk-cat-content">
          <h2>All Categories</h2>

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
                    {category.image ? (
                      <img
                        src={category.image}
                        alt=""
                        className="fk-cat-image-icon"
                      />
                    ) : (
                      <Icon
                        size={24}
                        strokeWidth={1.8}
                      />
                    )}
                  </span>

                  <span className="fk-cat-card-name">
                    {category.name}
                  </span>

                  <span className="fk-cat-card-count">
                    None
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

      <nav className="fk-cat-bottom-nav" aria-label="Main navigation">
        <button type="button" className="fk-cat-nav-item" onClick={() => navigate("/my-family")}>
          <span className="fk-cat-nav-icon"><House size={20} strokeWidth={1.8} /></span>
          <span>Home</span>
        </button>
        <button type="button" className="fk-cat-nav-item" onClick={() => navigate("/family")}>
          <span className="fk-cat-nav-icon"><UsersRound size={20} strokeWidth={1.8} /></span>
          <span>My Family</span>
        </button>
        <button type="button" className="fk-cat-center-add" onClick={() => navigate("/family/add")} aria-label="Add family member">
          <Plus size={30} />
        </button>
        <button type="button" className="fk-cat-nav-item active" aria-current="page">
          <span className="fk-cat-nav-icon"><LayoutGrid size={20} strokeWidth={1.8} /></span>
          <span>Category</span>
        </button>
        <button type="button" className="fk-cat-nav-item" disabled>
          <span className="fk-cat-nav-icon"><CreditCard size={20} strokeWidth={1.8} /></span>
          <span>Pay &amp; Renew</span>
        </button>
      </nav>

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
