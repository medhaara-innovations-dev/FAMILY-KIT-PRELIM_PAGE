import FamilyBottomNav from "./components/FamilyBottomNav.jsx";

import { useNavigate } from "react-router-dom";
import {
  Search,
  Mic,
  AudioLines,
  } from "lucide-react";

import "./VoiceSearchPage.css";

export default function VoiceSearchPage() {
  const navigate = useNavigate();

  return (
    <main className="fk-voice-page">
      <div className="fk-voice-container">
        <button
          type="button"
          className="fk-voice-search-bar"
          onClick={() => navigate("/search")}
          aria-label="Return to search"
        >
          <Search size={22} />

          <span>Search Aadhaar Card</span>

          <span className="fk-voice-audio">
            <AudioLines size={20} />
          </span>
        </button>

        <div className="fk-voice-listening">
          <Mic size={65} strokeWidth={1.4} />
          <p>Listening...</p>
        </div>
      </div>

      <FamilyBottomNav active="home" />
    </main>
  );
}
