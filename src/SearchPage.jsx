
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Mic,
  AudioLines,
  House,
  UsersRound,
  Plus,
  LayoutGrid,
  CreditCard,
} from "lucide-react";

import "./SearchPage.css";

const categories = [
  { name: "Insurance", color: "#20b6b0", icon: "♧" },
  { name: "Finance", color: "#5559e8", icon: "♙" },
  { name: "Bills & Renewals", color: "#c9a31c", icon: "▤" },
];

const people = ["Spouse", "Mother", "Father"];

const suggestions = [
  "My Aadhaar Card",
  "Mom Bank account",
  "Dad",
  "My driving License",
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPerson, setSelectedPerson] = useState("");

  const filteredSuggestions = suggestions.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="fk-search-page">
      <div className="fk-search-content">
        <div className="fk-search-bar">
          <Search size={22} strokeWidth={2} />

          <input
            type="search"
            placeholder="Search Aadhaar Card"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search FamilyKit"
          />

          <button
            type="button"
            className="fk-search-mic-button"
            onClick={() => navigate("/search/voice")}
            aria-label="Voice search"
          >
            <Mic size={18} />
          </button>

          <button
            type="button"
            className="fk-search-voice-button"
            onClick={() => navigate("/search/voice")}
            aria-label="Open voice search"
          >
            <AudioLines size={19} />
          </button>
        </div>

        <section className="fk-search-section">
          <h2>Categories</h2>

          <div className="fk-search-chip-row">
            {categories.map((category) => (
              <button
                type="button"
                key={category.name}
                className={`fk-search-chip ${
                  selectedCategory === category.name ? "selected" : ""
                }`}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.name
                      ? ""
                      : category.name
                  )
                }
              >
                <span style={{ color: category.color }}>
                  {category.icon}
                </span>
                <span style={{ color: category.color }}>
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="fk-search-section">
          <h2>People</h2>

          <div className="fk-search-chip-row">
            {people.map((person) => (
              <button
                type="button"
                key={person}
                className={`fk-search-chip ${
                  selectedPerson === person ? "selected" : ""
                }`}
                onClick={() =>
                  setSelectedPerson(
                    selectedPerson === person ? "" : person
                  )
                }
              >
                <span className="fk-search-radio" />
                {person}
              </button>
            ))}
          </div>
        </section>

        <section className="fk-search-section fk-search-suggestions">
          <h2>Try Asking</h2>

          {filteredSuggestions.map((suggestion) => (
            <button
              type="button"
              key={suggestion}
              className="fk-search-suggestion"
              onClick={() => setQuery(suggestion)}
            >
              <Search size={14} />
              {suggestion}
            </button>
          ))}
        </section>
      </div>

      <nav className="fk-search-bottom-nav">
        <button
          type="button"
          className="active"
          onClick={() => navigate("/my-family")}
        >
          <House size={22} />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/family")}
        >
          <UsersRound size={22} />
          <span>My Family</span>
        </button>

        <button
          type="button"
          className="fk-search-bottom-add"
          onClick={() => navigate("/categories")}
          aria-label="Categories"
        >
          <Plus size={26} />
        </button>

        <button
          type="button"
          onClick={() => navigate("/categories")}
        >
          <LayoutGrid size={22} />
          <span>Category</span>
        </button>

        <button type="button" disabled>
          <CreditCard size={22} />
          <span>Pay & Renew</span>
        </button>
      </nav>
    </main>
  );
}
