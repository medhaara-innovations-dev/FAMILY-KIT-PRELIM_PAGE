import { CreditCard, Plus, UsersRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CategoriesIcon, HomeIcon } from "./ReferenceIcons.jsx";
import "../FamilyMembersPage.css";

export default function FamilyBottomNav({ active = "family", onAdd }) {
  const navigate = useNavigate();
  const addMember = onAdd || (() => navigate("/family/add"));

  return (
    <nav className="fk-family-bottom-nav" aria-label="Main navigation">
      <div className="fk-desktop-nav-header">
        <strong>FamilyKit</strong>
        <button type="button" onClick={addMember} aria-label="Add family member">
          <Plus size={20} aria-hidden="true" /> Add
        </button>
      </div>
      <button type="button" className={`fk-family-nav-item${active === "home" ? " active" : ""}`}
        onClick={() => navigate("/my-family")} aria-current={active === "home" ? "page" : undefined}>
        <span className="fk-family-nav-icon"><HomeIcon size={20} /></span><span>Home</span>
      </button>
      <button type="button" className={`fk-family-nav-item${active === "family" ? " active" : ""}`}
        onClick={() => navigate("/family")} aria-current={active === "family" ? "page" : undefined}>
        <span className="fk-family-nav-icon"><UsersRound size={20} strokeWidth={1.8} /></span><span>My Family</span>
      </button>
      <button type="button" className="fk-family-bottom-add"
        onClick={addMember} aria-label="Add family member">
        <Plus size={30} />
      </button>
      <button type="button" className={`fk-family-nav-item${active === "category" ? " active" : ""}`}
        onClick={() => navigate("/categories")} aria-current={active === "category" ? "page" : undefined}>
        <span className="fk-family-nav-icon"><CategoriesIcon size={20} /></span><span>Category</span>
      </button>
      <button type="button" className="fk-family-nav-item" disabled aria-label="Pay and Renew unavailable">
        <span className="fk-family-nav-icon"><CreditCard size={20} strokeWidth={1.8} /></span><span>Pay & Renew</span>
      </button>
    </nav>
  );
}
