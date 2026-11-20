import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, Sparkles, FileText, CarFront, Landmark,
  UserRoundCheck, ChevronRight, House, UsersRound, Plus,
  LayoutGrid, CreditCard,
} from "lucide-react";
import "./SmartSuggestionsPage.css";

// Design-preview content based on the supplied screenshot.
// Replace with real API suggestions when that endpoint is available.
const suggestions = [
  { id: 1, Icon: Sparkles, title: "5 Suggestion Found in your policy", description: "Renewal date have not been recorded yet.", source: "Suggested by FamilyKit AI", action: "View Policy" },
  { id: 2, Icon: FileText, title: "2 Policies need more information.", description: "Renewal date have not been recorded yet.", source: "Suggested by FamilyKit AI", action: "View Policy" },
  { id: 3, Icon: CarFront, title: "3 issues Found in car document", description: "Renewal date have not been recorded yet.", source: "Suggested by FamilyKit AI", action: "View RC" },
  { id: 4, Icon: Landmark, title: "Credit card details are not updated", description: "Credit card details have not been updated yet.", source: "Suggested by FamilyKit AI", action: "View Card" },
  { id: 5, Icon: UserRoundCheck, title: "Nominee Details Missing", description: "Complete 2 Finance Records in your document.", source: "For: You (Self)", action: "View Record" },
  { id: 6, Icon: FileText, title: "2 Policies need more information.", description: "Renewal date have not been recorded yet.", source: "Suggested by FamilyKit AI", action: "View Policy" },
];

function BottomItem({ Icon, label, active, onClick }) {
  return (
    <button type="button" className={`fk-ss-nav-item ${active ? "fk-ss-nav-active" : ""}`} onClick={onClick} disabled={!onClick} aria-current={active ? "page" : undefined}>
      <span className="fk-ss-nav-icon"><Icon size={20} strokeWidth={1.8} /></span>
      <span>{label}</span>
    </button>
  );
}

export default function SmartSuggestionsPage() {
  const navigate = useNavigate();
  const accessToken = sessionStorage.getItem("familykit_access_token");

  useEffect(() => {
    if (!accessToken) navigate("/login", { replace: true });
  }, [accessToken, navigate]);

  if (!accessToken) return null;

  return (
    <div className="fk-ss-page">
      <div className="fk-ss-shell">
        <header className="fk-ss-header">
          <button type="button" className="fk-ss-header-button" aria-label="Go back" onClick={() => navigate(-1)}><ArrowLeft size={19} /></button>
          <h1>Smart Suggestions</h1>
          <button type="button" className="fk-ss-search-button" aria-label="Search" onClick={() => navigate("/search")}><Search size={17} /></button>
        </header>

        <main className="fk-ss-list" aria-label="Smart suggestions">
          {suggestions.map(({ id, Icon, title, description, source, action }) => (
            <article className="fk-ss-card" key={id}>
              <div className="fk-ss-card-main">
                <div className="fk-ss-card-icon"><Icon size={21} strokeWidth={2.1} /></div>
                <div className="fk-ss-card-copy"><h2>{title}</h2><p>{description}</p></div>
              </div>
              <div className="fk-ss-card-footer">
                <span>{source}</span>
                <button type="button" onClick={() => { /* Design preview: destination requires real record IDs. */ }} aria-label={`${action}: ${title}`}>
                  {action}<ChevronRight size={17} strokeWidth={2.5} />
                </button>
              </div>
            </article>
          ))}
        </main>
      </div>

      <nav className="fk-ss-bottom-nav" aria-label="FamilyKit navigation">
        <BottomItem Icon={House} label="Home" active onClick={() => navigate("/my-family")} />
        <BottomItem Icon={UsersRound} label="My Family" onClick={() => navigate("/family")} />
        <button type="button" className="fk-ss-center-add" aria-label="Add family member" onClick={() => navigate("/family/add")}><Plus size={28} /></button>
        <BottomItem Icon={LayoutGrid} label="Category" onClick={() => navigate("/categories")} />
        <BottomItem Icon={CreditCard} label="Pay & Renew" />
      </nav>
    </div>
  );
}
