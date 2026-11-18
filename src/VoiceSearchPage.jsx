
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

      <nav className="fk-voice-bottom-nav">
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
          className="fk-voice-bottom-add"
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
