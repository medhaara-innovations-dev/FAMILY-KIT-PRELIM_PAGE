import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ListFilter, ShieldCheck, UsersRound, FileCheck2,
  UserRoundCheck, House, Plus, LayoutGrid, CreditCard,
} from "lucide-react";
import "./NotificationsPage.css";

// Preview notifications until the FamilyKit notifications API is connected.
const initialNotifications = [
  { id: 1, title: "Insurance renewal", message: "Your vehicle policy is due tomorrow.", time: "9:15 AM", group: "Today", Icon: ShieldCheck, tone: "blue", unread: true, type: "reminder" },
  { id: 2, title: "Family invitation", message: "Meera accepted your FamilyKit invitation.", time: "8:30 AM", group: "Today", Icon: UsersRound, tone: "violet", unread: true, type: "update" },
  { id: 3, title: "Meera ID Document saved", message: "Your property document was saved successfully.", time: "Yesterday", group: "Earlier", Icon: FileCheck2, tone: "orange", unread: true, type: "update" },
  { id: 4, title: "Document saved", message: "Your property document was saved successfully.", time: "Yesterday", group: "Earlier", Icon: FileCheck2, tone: "orange", unread: true, type: "update" },
  { id: 5, title: "Nominee Updated", message: "Your property document was saved successfully.", time: "Yesterday", group: "Earlier", Icon: UserRoundCheck, tone: "pink", unread: true, type: "update" },
];

function NavItem({ Icon, label, active, onClick }) {
  return (
    <button type="button" className={`fk-notif-nav-item ${active ? "fk-notif-nav-active" : ""}`} onClick={onClick} disabled={!onClick} aria-current={active ? "page" : undefined}>
      <span className="fk-notif-nav-icon"><Icon size={19} strokeWidth={1.8} /></span>
      <span>{label}</span>
    </button>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const accessToken = sessionStorage.getItem("familykit_access_token");
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState(initialNotifications);

  useEffect(() => {
    if (!accessToken) navigate("/login", { replace: true });
  }, [accessToken, navigate]);

  const visible = useMemo(() => items.filter((item) =>
    tab === "all" || (tab === "unread" && item.unread) || (tab === "updates" && item.type === "update")
  ), [items, tab]);

  if (!accessToken) return null;

  return (
    <div className="fk-notif-page">
      <div className="fk-notif-shell">
        <div className="fk-notif-fixed-top">
          <header className="fk-notif-header">
            <button type="button" className="fk-notif-round" aria-label="Go back" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button>
            <h1>Notifications</h1>
            <button type="button" className="fk-notif-round fk-notif-filter" aria-label="Show unread notifications" onClick={() => setTab("unread")}><ListFilter size={15} /></button>
          </header>
          <div className="fk-notif-tabs" role="tablist" aria-label="Notification filters">
            {[["all", "All"], ["unread", "Unread"], ["updates", "Updates"]].map(([value, label]) => (
              <button key={value} type="button" role="tab" aria-selected={tab === value} className={`fk-notif-tab ${tab === value ? "is-active" : ""}`} onClick={() => setTab(value)}>{label}</button>
            ))}
          </div>
          <div className="fk-notif-today-row">
            <span>Today</span>
            <button type="button" onClick={() => setItems((current) => current.map((item) => ({ ...item, unread: false })))}>Mark all as read</button>
          </div>
        </div>

        <main className="fk-notif-scroll" aria-label="Notification cards" key={tab}>
          {visible.filter((item) => item.group === "Today").map((item) => <NotificationCard key={item.id} item={item} />)}
          {visible.some((item) => item.group === "Earlier") && <h2 className="fk-notif-earlier">Earlier</h2>}
          {visible.filter((item) => item.group === "Earlier").map((item) => <NotificationCard key={item.id} item={item} />)}
          {visible.length === 0 && <p className="fk-notif-empty">No notifications here yet.</p>}
        </main>
      </div>
      <nav className="fk-notif-bottom-nav" aria-label="FamilyKit navigation">
        <NavItem Icon={House} label="Home" active onClick={() => navigate("/my-family")} />
        <NavItem Icon={UsersRound} label="My Family" onClick={() => navigate("/family")} />
        <button type="button" className="fk-notif-center-add" aria-label="Add family member" onClick={() => navigate("/family/add")}><Plus size={28} /></button>
        <NavItem Icon={LayoutGrid} label="Category" onClick={() => navigate("/categories")} />
        <NavItem Icon={CreditCard} label="Pay & Renew" />
      </nav>
    </div>
  );
}

function NotificationCard({ item }) {
  const Icon = item.Icon;
  return (
    <article className="fk-notif-card">
      <span className={`fk-notif-card-icon ${item.tone}`}><Icon size={16} strokeWidth={1.9} /></span>
      <div className="fk-notif-card-copy">
        <h3>{item.title}</h3>
        <p>{item.message}</p>
        <time>{item.time}</time>
      </div>
      {item.unread && <span className="fk-notif-unread-dot" aria-label="Unread" />}
    </article>
  );
}
