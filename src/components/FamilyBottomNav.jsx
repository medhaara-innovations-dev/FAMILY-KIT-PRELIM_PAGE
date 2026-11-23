import { CreditCard, House, LayoutGrid, Plus, UsersRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../FamilyMembersPage.css";

export default function FamilyBottomNav({ active = "family", onAdd, mobileOnly = false }) {
  const navigate = useNavigate();

  return (
    <nav className={`fk-family-bottom-nav${mobileOnly ? " fk-profile-mobile-nav" : ""}`} aria-label="Main navigation">
      <button type="button" className={`fk-family-nav-item${active === "home" ? " active" : ""}`}
        onClick={() => navigate("/my-family")} aria-current={active === "home" ? "page" : undefined}>
        <span className="fk-family-nav-icon"><House size={20} strokeWidth={1.8} /></span><span>Home</span>
      </button>
      <button type="button" className={`fk-family-nav-item${active === "family" ? " active" : ""}`}
        onClick={() => navigate("/family")} aria-current={active === "family" ? "page" : undefined}>
        <span className="fk-family-nav-icon"><UsersRound size={20} strokeWidth={1.8} /></span><span>My Family</span>
      </button>
      <button type="button" className="fk-family-bottom-add"
        onClick={onAdd || (() => navigate("/family/add"))} aria-label="Add family member">
        <Plus size={30} />
      </button>
      <button type="button" className="fk-family-nav-item" onClick={() => navigate("/categories")}>
        <span className="fk-family-nav-icon"><LayoutGrid size={20} strokeWidth={1.8} /></span><span>Category</span>
      </button>
      <button type="button" className="fk-family-nav-item" disabled aria-label="Pay and Renew unavailable">
        <span className="fk-family-nav-icon"><CreditCard size={20} strokeWidth={1.8} /></span><span>Pay & Renew</span>
      </button>
    </nav>
  );
}
