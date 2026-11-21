import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Search, Phone, Mail, Pencil, Trash2, X,
  ContactRound, AlertTriangle, ShieldCheck, HeartPulse, UsersRound,
  Scale, GraduationCap, Landmark, CreditCard, House, LayoutGrid,
  ChevronDown, MessageCircle, Check, RefreshCw,
} from "lucide-react";
import {
  getImportantContacts, getContactCategories, addImportantContact,
  updateImportantContact, deleteImportantContact,
} from "./api/importantContactsApi";
import "./ImportantContactsPage.css";

const CATEGORY_ORDER = ["Emergency", "Insurance", "Medical", "Nominees", "Legal", "Education", "Finance"];
const CATEGORY_ICONS = {
  Emergency: AlertTriangle, Insurance: ShieldCheck, Medical: HeartPulse,
  Nominees: UsersRound, Legal: Scale, Education: GraduationCap, Finance: Landmark,
};
const EMPTY_FORM = { name: "", category: "", role: "", mobileNumber: "", email: "" };

function localMobile(value = "") {
  const digits = String(value).replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.slice(0, 10);
}
function whatsAppUrl(number) {
  return `https://wa.me/${String(number || "").replace(/\D/g, "")}`;
}

export default function ImportantContactsPage() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [items, available] = await Promise.all([getImportantContacts(), getContactCategories()]);
      setContacts(Array.isArray(items) ? items : []);
      setCategories(Array.isArray(available) ? available.filter((c) => CATEGORY_ORDER.includes(c.name)) : []);
    } catch (err) {
      setError(err.message || "Unable to load contacts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const categoryNames = useMemo(() => CATEGORY_ORDER.filter((name) => categories.some((c) => c.name === name)), [categories]);
  const availableRoles = categories.find((c) => c.name === form.category)?.roles || [];
  const emergencyCount = contacts.filter((c) => c.category === "Emergency").length;
  const visibleContacts = contacts.filter((c) => {
    const categoryMatch = selectedCategory === "All" || c.category === selectedCategory;
    const q = search.trim().toLowerCase();
    return categoryMatch && (!q || [c.name, c.role, c.category, c.email, c.mobileNumber].join(" ").toLowerCase().includes(q));
  });

  function openAdd() {
    setEditingId(null);
    // The reference design starts with an explicit category selection.
    setForm({ ...EMPTY_FORM, category: selectedCategory === "All" ? "" : selectedCategory });
    setFormError("");
    setModalOpen(true);
  }
  function openEdit(contact) {
    setEditingId(contact.contactId);
    setForm({ name: contact.name || "", category: contact.category || "", role: contact.role || "", mobileNumber: localMobile(contact.mobileNumber), email: contact.email || "" });
    setFormError("");
    setModalOpen(true);
  }
  function changeField(field, value) {
    setForm((old) => field === "category" ? { ...old, category: value, role: "" } : { ...old, [field]: value });
  }
  function closeForm() {
    if (saving) return;
    setModalOpen(false);
    setFormError("");
  }

  async function handleSave(event) {
    event.preventDefault();
    if (saving) return;
    setFormError("");
    const name = form.name.trim();
    const category = form.category;
    const role = form.role;
    const mobileNumber = localMobile(form.mobileNumber);
    const email = form.email.trim();
    if (!name || name.length > 100) return setFormError("Enter a name (up to 100 characters).");
    if (!categoryNames.includes(category)) return setFormError("Select a category.");
    if (!availableRoles.includes(role)) return setFormError("Select a role.");
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) return setFormError("Enter a valid 10-digit Indian mobile number.");
    const previous = contacts.find((c) => c.contactId === editingId);
    if (category === "Emergency" && previous?.category !== "Emergency" && emergencyCount >= 2) {
      return setFormError("Only two Emergency contacts are allowed.");
    }
    setSaving(true);
    try {
      const payload = { name, category, role, mobileNumber: `+91${mobileNumber}`, email };
      if (editingId) await updateImportantContact(editingId, payload);
      else await addImportantContact(payload);
      setModalOpen(false);
      setEditingId(null);
      setSelectedCategory("All");
      setSearch("");
      setSearchOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || "Unable to save contact.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(contact) {
    if (!window.confirm(`Delete ${contact.name} from Important Contacts?`)) return;
    try {
      await deleteImportantContact(contact.contactId);
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to delete contact.");
    }
  }

  return (
    <main className="fk-ic-page">
      <div className="fk-ic-container">
        <header className="fk-ic-header">
          <button type="button" className="fk-ic-round fk-ic-back" onClick={() => navigate("/my-family")} aria-label="Back to dashboard"><ArrowLeft size={19} /></button>
          <h1>Important Contacts</h1>
          <button type="button" className="fk-ic-round fk-ic-search-toggle" onClick={() => { setSearchOpen((v) => !v); setSearch(""); }} aria-label="Search contacts"><Search size={19} /></button>
          <button type="button" className="fk-ic-round fk-ic-plus" onClick={openAdd} disabled={loading || categories.length === 0} aria-label="Add contact"><Plus size={19} /></button>
        </header>

        <div className="fk-ic-filter-label">Contacts Categories</div>
        <nav className="fk-ic-filters" aria-label="Contact categories">
          {["All", ...categoryNames].map((category) => {
            const Icon = CATEGORY_ICONS[category];
            return (
              <button key={category} type="button" className={`fk-ic-filter ${selectedCategory === category ? "active" : ""} ${category === "Emergency" ? "emergency" : ""}`} onClick={() => setSelectedCategory(category)} aria-pressed={selectedCategory === category}>
                {Icon && <Icon size={16} strokeWidth={1.9} />}<span>{category}</span>
              </button>
            );
          })}
        </nav>

        {searchOpen && (
          <div className="fk-ic-search"><Search size={17} /><input type="search" autoFocus placeholder="Search contacts" value={search} onChange={(e) => setSearch(e.target.value)} /><button type="button" onClick={() => { setSearch(""); setSearchOpen(false); }} aria-label="Close search"><X size={16} /></button></div>
        )}

        {error && <div className="fk-ic-error" role="alert">{error}<button type="button" onClick={loadData}><RefreshCw size={15} /> Retry</button></div>}

        {loading ? (
          <div className="fk-ic-loading">Loading contacts...</div>
        ) : visibleContacts.length === 0 ? (
          <section className="fk-ic-empty">
            <div className="fk-ic-empty-inner">
              <span className="fk-ic-empty-icon"><ContactRound size={29} /></span>
              <h2>{contacts.length === 0 ? "No Important Contacts yet" : "No contacts found"}</h2>
              <p>{contacts.length === 0 ? "Add someone you may need to reach quickly." : "Try another category or search."}</p>
              <button type="button" className="fk-ic-empty-add" onClick={openAdd} disabled={categories.length === 0}><Plus size={16} /> Add Contact</button>
            </div>
          </section>
        ) : (
          <section className="fk-ic-results">
            <div className="fk-ic-list-heading"><h2>{selectedCategory === "All" ? "All Contacts" : `${selectedCategory} Contacts`}</h2><span>{visibleContacts.length} {visibleContacts.length === 1 ? "contact" : "contacts"}</span></div>
            <div className="fk-ic-list">
              {visibleContacts.map((contact) => (
                <article className="fk-ic-card" key={contact.contactId}>
                  <div className="fk-ic-card-main">
                    <div className="fk-ic-avatar" aria-hidden="true">{(contact.name || "?").slice(0, 1).toUpperCase()}</div>
                    <div className="fk-ic-card-info">
                      <div className="fk-ic-name-row"><h3>{contact.name}</h3><span className="fk-ic-role">{contact.role}</span></div>
                      {contact.email && <p className="fk-ic-email">Mail: {contact.email}</p>}
                      <span className={`fk-ic-category ${contact.category === "Emergency" ? "is-emergency" : ""}`}>{contact.category}</span>
                    </div>
                    <div className="fk-ic-card-actions"><button type="button" onClick={() => openEdit(contact)} aria-label={`Edit ${contact.name}`}><Pencil size={15} /></button><button type="button" onClick={() => handleDelete(contact)} aria-label={`Delete ${contact.name}`}><Trash2 size={15} /></button></div>
                  </div>
                  <div className="fk-ic-card-links">
                    <a className="fk-ic-whatsapp" href={whatsAppUrl(contact.mobileNumber)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${contact.name}`}><MessageCircle size={17} /> WhatsApp</a>
                    <a className="fk-ic-call" href={`tel:${contact.mobileNumber}`} aria-label={`Call ${contact.name}`}><Phone size={16} /> Call</a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      <nav className="fk-ic-bottom-nav" aria-label="Main navigation">
        <button type="button" className="fk-ic-nav-item" onClick={() => navigate("/my-family")}>
          <span className="fk-ic-nav-icon"><House size={20} strokeWidth={1.8} /></span>
          <span>Home</span>
        </button>
        <button type="button" className="fk-ic-nav-item" onClick={() => navigate("/family")}>
          <span className="fk-ic-nav-icon"><UsersRound size={20} strokeWidth={1.8} /></span>
          <span>My Family</span>
        </button>
        <button type="button" className="fk-ic-bottom-plus" onClick={() => navigate("/family/add")} aria-label="Add family member">
          <Plus size={30} />
        </button>
        <button type="button" className="fk-ic-nav-item" onClick={() => navigate("/categories")}>
          <span className="fk-ic-nav-icon"><LayoutGrid size={20} strokeWidth={1.8} /></span>
          <span>Category</span>
        </button>
        <button type="button" className="fk-ic-nav-item" disabled title="Pay & Renew route is not connected yet">
          <span className="fk-ic-nav-icon"><CreditCard size={20} strokeWidth={1.8} /></span>
          <span>Pay &amp; Renew</span>
        </button>
      </nav>

      {modalOpen && (
        <div className="fk-ic-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeForm(); }}>
          <div className="fk-ic-modal" role="dialog" aria-modal="true" aria-labelledby="fk-ic-modal-title">
            <div className="fk-ic-modal-header"><h2 id="fk-ic-modal-title">{editingId ? "Edit Contact" : "Add Contact"}</h2><button type="button" onClick={closeForm} disabled={saving} aria-label="Close form"><X size={19} /></button></div>
            <form onSubmit={handleSave}>
              <label htmlFor="fk-ic-name">Name<span className="fk-ic-required">*</span></label>
              <input id="fk-ic-name" required maxLength={100} placeholder="Enter contact name" value={form.name} onChange={(e) => changeField("name", e.target.value)} />

              <label htmlFor="fk-ic-category">Category<span className="fk-ic-required">*</span></label>
              <div className="fk-ic-select-wrap"><select id="fk-ic-category" required value={form.category} onChange={(e) => changeField("category", e.target.value)}><option value="">Select Category</option>{categoryNames.map((name) => <option key={name} value={name}>{name}</option>)}</select><ChevronDown size={17} /></div>

              <label htmlFor="fk-ic-role">Role<span className="fk-ic-required">*</span></label>
              <div className="fk-ic-select-wrap"><select id="fk-ic-role" required value={form.role} disabled={!form.category} onChange={(e) => changeField("role", e.target.value)}><option value="">Select Role</option>{availableRoles.map((role) => <option key={role} value={role}>{role}</option>)}</select><ChevronDown size={17} /></div>

              <label htmlFor="fk-ic-mobile">Mobile Number<span className="fk-ic-required">*</span></label>
              <div className="fk-ic-phone-field"><span>+91</span><input id="fk-ic-mobile" required type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} pattern="[6-9][0-9]{9}" title="Enter a valid 10-digit Indian mobile number" placeholder="10-digit mobile number" value={form.mobileNumber} onChange={(e) => changeField("mobileNumber", e.target.value.replace(/\D/g, "").slice(0, 10))} /></div>

              <label htmlFor="fk-ic-email">Email Address <span className="fk-ic-optional">(Optional)</span></label>
              <input id="fk-ic-email" type="email" maxLength={254} placeholder="personname@gmail.com" value={form.email} onChange={(e) => changeField("email", e.target.value)} />

              {formError && <p className="fk-ic-form-error" role="alert">{formError}</p>}
              <button className="fk-ic-save" type="submit" disabled={saving}><Check size={17} /> {saving ? "Saving..." : editingId ? "Update Contact" : "Save"}</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
