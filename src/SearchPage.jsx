import FamilyBottomNav from "./components/FamilyBottomNav.jsx";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Search,
  Mic,
  AudioLines,
  } from "lucide-react";

// Actual FamilyKit category icons
import insuranceIcon from "./assets/images/Insurance.png";
import financeIcon from "./assets/images/Vector.png";
import billsIcon from "./assets/images/Household & Bills.png";

import "./SearchPage.css";

// =====================================================
// CATEGORIES
// =====================================================

const categories = [
  {
    name: "Insurance",
    color: "#20b6b0",
    image: insuranceIcon,
  },
  {
    name: "Finance",
    color: "#5559e8",
    image: financeIcon,
  },
  {
    name: "Bills & Renewals",
    color: "#c9a31c",
    image: billsIcon,
  },
];

// =====================================================
// PEOPLE
// =====================================================

const people = [
  "Spouse",
  "Mother",
  "Father",
];

// =====================================================
// SEARCH SUGGESTIONS
// =====================================================

const suggestions = [
  "My Aadhaar Card",
  "Mom Bank account",
  "Dad",
  "My driving License",
];

// =====================================================
// SEARCH PAGE
// =====================================================

export default function SearchPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("");

  const [selectedPerson, setSelectedPerson] =
    useState("");

  // =====================================================
  // FILTER SEARCH SUGGESTIONS
  // =====================================================

  const filteredSuggestions = suggestions.filter(
    (item) =>
      item
        .toLowerCase()
        .includes(query.toLowerCase())
  );

  // =====================================================
  // CATEGORY SELECTION
  // =====================================================

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory((previous) =>
      previous === categoryName
        ? ""
        : categoryName
    );
  };

  // =====================================================
  // PEOPLE SELECTION
  // =====================================================

  const handlePersonClick = (personName) => {
    setSelectedPerson((previous) =>
      previous === personName
        ? ""
        : personName
    );
  };

  // =====================================================
  // VOICE SEARCH
  // =====================================================

  const openVoiceSearch = () => {
    navigate("/search/voice");
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <main className="fk-search-page">
      <div className="fk-search-content">

        {/* =========================================
            SEARCH BAR
           ========================================= */}

        <div className="fk-search-bar">
          <Search
            size={22}
            strokeWidth={2}
          />

          <input
            type="search"
            placeholder="Search Aadhaar Card"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            aria-label="Search FamilyKit"
          />

          {/* MICROPHONE */}

          <button
            type="button"
            className="fk-search-mic-button"
            onClick={openVoiceSearch}
            aria-label="Voice search"
          >
            <Mic size={18} />
          </button>

          {/* PURPLE VOICE BUTTON */}

          <button
            type="button"
            className="fk-search-voice-button"
            onClick={openVoiceSearch}
            aria-label="Open voice search"
          >
            <AudioLines size={19} />
          </button>
        </div>

        {/* =========================================
            CATEGORIES
           ========================================= */}

        <section className="fk-search-section">
          <h2>Categories</h2>

          <div className="fk-search-chip-row">
            {categories.map((category) => (
              <button
                type="button"
                key={category.name}
                className={`fk-search-chip ${
                  selectedCategory === category.name
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  handleCategoryClick(category.name)
                }
                aria-pressed={
                  selectedCategory === category.name
                }
              >
                {/* ACTUAL CATEGORY IMAGE */}

                <img
                  src={category.image}
                  alt=""
                  aria-hidden="true"
                  style={{
                    width: "15px",
                    height: "15px",
                    objectFit: "contain",
                    display: "block",
                    flexShrink: 0,
                  }}
                />

                {/* CATEGORY NAME */}

                <span
                  style={{
                    color: category.color,
                  }}
                >
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* =========================================
            PEOPLE
           ========================================= */}

        <section className="fk-search-section">
          <h2>People</h2>

          <div className="fk-search-chip-row">
            {people.map((person) => (
              <button
                type="button"
                key={person}
                className={`fk-search-chip ${
                  selectedPerson === person
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  handlePersonClick(person)
                }
                aria-pressed={
                  selectedPerson === person
                }
              >
                <span
                  className="fk-search-radio"
                />

                <span>{person}</span>
              </button>
            ))}
          </div>
        </section>

        {/* =========================================
            TRY ASKING
           ========================================= */}

        <section className="fk-search-section fk-search-suggestions">
          <h2>Try Asking</h2>

          {filteredSuggestions.map(
            (suggestion) => (
              <button
                type="button"
                key={suggestion}
                className="fk-search-suggestion"
                onClick={() =>
                  setQuery(suggestion)
                }
              >
                <Search size={14} />

                <span>{suggestion}</span>
              </button>
            )
          )}
        </section>
      </div>

      {/* =========================================
          BOTTOM NAVIGATION
         ========================================= */}

      <FamilyBottomNav active="home" />
    </main>
  );
}
