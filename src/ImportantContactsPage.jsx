import FamilyBottomNav from "./components/FamilyBottomNav.jsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft, Plus, Search, Phone, Mail, Pencil, Trash2, X,
  AlertTriangle, ShieldCheck, HeartPulse, UsersRound,
  Scale, GraduationCap, Landmark, ChevronDown, Check, RefreshCw, EllipsisVertical, Eye,
} from "lucide-react";
import { CameraIcon, ImportantContactsIcon, WhatsAppLogo } from "./components/ReferenceIcons.jsx";
import { contactThumbnail } from "./contactPhoto.js";
import {
  getFamilyImportantContacts, getContactCategories, addImportantContact,
  updateImportantContact, deleteImportantContact,
} from "./api/importantContactsApi";
import "./ImportantContactsPage.css";

const CUSTOM_ROLE = "Other / Custom Role";
const LEGACY_CATEGORIES = { Emergency: "Emergency & Safety", Medical: "Medical & Healthcare",
  Finance: "Finance & Banking", Nominees: "Personal & Community" };
const CATEGORY_ICONS = {
  Emergency: AlertTriangle, Insurance: ShieldCheck, Medical: HeartPulse,
  Nominees: UsersRound, Legal: Scale, Education: GraduationCap, Finance: Landmark,
};
const EMPTY_FORM = { name: "", category: "", role: "", customRole: "", relation: "", mobileNumber: "", email: "", photo: "" };
const emergency = (category) => category === "Emergency" || category === "Emergency & Safety";

function ContactAvatar({ name, photo, card = false }) {
  const words = (name || "").trim().split(/\s+/).filter(Boolean);
  const initial = words[0]?.[0]?.toUpperCase() || "?";
  const lastInitial = words.length > 1 ? words.at(-1)[0].toUpperCase() : "";
  return <span className="fk-ic-avatar" aria-hidden="true">{photo
    ? <img src={`data:image/jpeg;base64,${photo}`} alt="" />
    : <span>{initial}{card && lastInitial && <span className="fk-ic-card-mobile">{lastInitial}</span>}</span>}</span>;
}

function localMobile(value = "") {
  const digits = String(value).replace(/\D/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.slice(0, 10);
}
function whatsAppUrl(number) {
  return `https://wa.me/${String(number || "").replace(/\D/g, "")}`;
}

export default function ImportantContactsPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const fromCategories = state?.fromCategories === true;
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
  const [categorySearch, setCategorySearch] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [viewedContact, setViewedContact] = useState(null);
  const contactDetails = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [items, available] = await Promise.all([getFamilyImportantContacts(), getContactCategories()]);
      setContacts(Array.isArray(items) ? items : []);
      setCategories(Array.isArray(available) ? available : []);
    } catch (err) {
      setError(err.message || "Unable to load contacts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const categoryNames = useMemo(() => categories.map(({ name }) => name), [categories]);
  const displayCategory = (name) => categoryNames.includes(LEGACY_CATEGORIES[name]) ? LEGACY_CATEGORIES[name] : name;
  const populatedCategories = new Set(contacts.map(({ category }) => displayCategory(category)));
  const filterCategories = categoryNames.filter((name) => populatedCategories.has(name));
  const activeCategory = filterCategories.includes(selectedCategory) ? selectedCategory : "All";
  const availableRoles = categories.find((c) => c.name === form.category)?.roles || [];
  const emergencyCount = contacts.filter((c) => !c.shared && emergency(c.category)).length;
  const visibleContacts = contacts.filter((c) => {
    const categoryMatch = activeCategory === "All" || displayCategory(c.category) === activeCategory;
    const q = search.trim().toLowerCase();
    return categoryMatch && (!q || [c.name, c.customRole || c.role, displayCategory(c.category), c.relation, c.email, c.mobileNumber].join(" ").toLowerCase().includes(q));
  });

  function openAdd() {
    setEditingId(null);
    // The reference design starts with an explicit category selection.
    setForm({ ...EMPTY_FORM, category: activeCategory === "All" ? "" : activeCategory });
    setCategorySearch("");
    setFormError("");
    setModalOpen(true);
  }
  function openEdit(contact) {
    setEditingId(contact.contactId);
    const category = displayCategory(contact.category);
    const roles = categories.find((item) => item.name === category)?.roles || [];
    const custom = roles.includes(CUSTOM_ROLE) && !roles.includes(contact.role);
    setForm({ ...EMPTY_FORM, name: contact.name || "", category, role: custom ? CUSTOM_ROLE : contact.role,
      customRole: contact.customRole || (custom ? contact.role : ""), relation: contact.relation || "",
      mobileNumber: localMobile(contact.mobileNumber), email: contact.email || "", photo: contact.photo || "" });
    setCategorySearch("");
    setFormError("");
    setModalOpen(true);
  }
  function changeField(field, value) {
    setForm((old) => field === "category" ? { ...old, category: value, role: "", customRole: "" } : { ...old, [field]: value });
  }
  async function selectPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPhotoBusy(true);
    setFormError("");
    try { changeField("photo", await contactThumbnail(file)); }
    catch (failure) { setFormError(failure.message); }
    finally { setPhotoBusy(false); }
  }
  function closeForm() {
    if (saving || photoBusy) return;
    setModalOpen(false);
    setFormError("");
  }

  async function handleSave(event) {
    event.preventDefault();
    if (saving || photoBusy) return;
    setFormError("");
    const name = form.name.trim();
    const category = form.category;
    const role = form.role;
    const mobileNumber = localMobile(form.mobileNumber);
    const email = form.email.trim();
    if (!name || name.length > 100) return setFormError("Enter a name (up to 100 characters).");
    if (!categoryNames.includes(category)) return setFormError("Select a category.");
    if (!availableRoles.includes(role)) return setFormError("Select a role.");
    if (role === CUSTOM_ROLE && !form.customRole.trim()) return setFormError("Enter a custom role.");
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) return setFormError("Enter a valid 10-digit Indian mobile number.");
    const previous = contacts.find((c) => c.contactId === editingId);
    if (emergency(category) && !emergency(previous?.category) && emergencyCount >= 2) {
      return setFormError("Only two Emergency contacts are allowed.");
    }
    setSaving(true);
    try {
      const payload = { name, category, role, mobileNumber: `+91${mobileNumber}`, email,
        ...(role === CUSTOM_ROLE && { customRole: form.customRole.trim() }),
        ...(form.relation.trim() || previous?.relation ? { relation: form.relation.trim() } : {}),
        ...(form.photo || previous?.photo ? { photo: form.photo } : {}),
      };
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
          <button type="button" className="fk-ic-round fk-ic-back"
            onClick={() => fromCategories ? navigate(-1) : navigate("/my-family")}
            aria-label={fromCategories ? "Back to Categories" : "Back to dashboard"}><ChevronLeft size={19} /></button>
          <h1>Important Contacts</h1>
          <button type="button" className="fk-ic-round fk-ic-search-toggle" onClick={() => { setSearchOpen((v) => !v); setSearch(""); }} aria-label="Search contacts"><Search size={19} /></button>
          <button type="button" className="fk-ic-round fk-ic-plus" onClick={openAdd} disabled={loading || categories.length === 0} aria-label="Add contact"><Plus size={19} /></button>
        </header>

        <div className="fk-ic-filter-label">Contacts Categories</div>
        <nav className="fk-ic-filters" aria-label="Contact categories">
          {["All", ...filterCategories].map((category) => {
            const Icon = CATEGORY_ICONS[category] || CATEGORY_ICONS[Object.keys(LEGACY_CATEGORIES).find((name) => LEGACY_CATEGORIES[name] === category)];
            return (
              <button key={category} type="button" className={`fk-ic-filter ${activeCategory === category ? "active" : ""} ${emergency(category) ? "emergency" : ""}`} onClick={() => setSelectedCategory(category)} aria-pressed={activeCategory === category}>
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
              <span className="fk-ic-empty-icon"><ImportantContactsIcon size={29} /></span>
              <h2>{contacts.length === 0 ? "No Important Contacts yet" : "No contacts found"}</h2>
              <p>{contacts.length === 0 ? "Add someone you may need to reach quickly." : "Try another category or search."}</p>
              <button type="button" className="fk-ic-empty-add" onClick={openAdd} disabled={categories.length === 0}><Plus size={16} /> Add Contact</button>
            </div>
          </section>
        ) : (
          <section className="fk-ic-results">
            <div className="fk-ic-list-heading"><h2>{activeCategory === "All" ? "All Contacts" : `${activeCategory} Contacts`}</h2><span>{visibleContacts.length} {visibleContacts.length === 1 ? "contact" : "contacts"}</span></div>
            <div className="fk-ic-list">
              {visibleContacts.map((contact) => (
                <article className="fk-ic-card" key={contact.contactId}>
                  <div className="fk-ic-card-main">
                    <ContactAvatar name={contact.name} photo={contact.photo} card />
                    <div className="fk-ic-card-info">
                      <div className="fk-ic-name-row"><h3>{contact.name}</h3></div>
                      <div className="fk-ic-badges">
                        <span className="fk-ic-category">{displayCategory(contact.category)}</span>
                        <span className="fk-ic-role">{contact.customRole || contact.role}</span>
                        {contact.relation && <span className="fk-ic-role fk-ic-relation fk-ic-card-mobile">{contact.relation}</span>}
                      </div>
                      {contact.relation && <p className="fk-ic-card-detail"><UsersRound size={14} aria-hidden="true" />{contact.relation}</p>}
                      {contact.email?.trim() && (
                        <a className="fk-ic-card-detail fk-ic-card-email"
                          href={`mailto:${encodeURIComponent(contact.email.trim()).replace("%40", "@")}`}>
                          <Mail size={14} aria-hidden="true" />
                          {contact.email.trim()}
                        </a>
                      )}
                      <a className="fk-ic-card-detail" href={`tel:${contact.mobileNumber}`}><Phone size={14} aria-hidden="true" />{contact.mobileNumber}</a>
                    </div>
                    <details className="fk-ic-card-menu">
                      <summary aria-label={`Actions for ${contact.name}`}><EllipsisVertical size={20} aria-hidden="true" /></summary>
                      <div>
                        <button type="button" onClick={(event) => {
                          const menu = event.currentTarget.closest("details");
                          menu.open = false;
                          menu.querySelector("summary").focus();
                          setViewedContact(contact);
                          contactDetails.current?.showModal();
                        }}><Eye size={15} aria-hidden="true" /> View Details</button>
                        {!contact.shared && <><button type="button" onClick={(event) => { event.currentTarget.closest("details").open = false; openEdit(contact); }}><Pencil size={15} /> Edit</button>
                        <button type="button" onClick={(event) => { event.currentTarget.closest("details").open = false; handleDelete(contact); }}><Trash2 size={15} /> Delete</button></>}
                      </div>
                    </details>
                  </div>
                  <div className="fk-ic-card-links">
                    <a className="fk-ic-whatsapp" href={whatsAppUrl(contact.mobileNumber)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${contact.name}`}><WhatsAppLogo size={30} aria-hidden="true" /> WhatsApp</a>
                    <a className="fk-ic-call" href={`tel:${contact.mobileNumber}`} aria-label={`Call ${contact.name}`}><Phone size={18} aria-hidden="true" /> Call</a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      <FamilyBottomNav active="category" />

      <dialog ref={contactDetails} className="fk-ic-modal fk-ic-view-details"
        aria-labelledby="fk-ic-details-title" onClose={() => setViewedContact(null)}>
        <div className="fk-ic-modal-header">
          <h2 id="fk-ic-details-title">Contact Details</h2>
          <button type="button" onClick={() => contactDetails.current?.close()} aria-label="Close contact details"><X size={19} /></button>
        </div>
        {viewedContact && <>
          <h3>{viewedContact.name}</h3>
          <dl>
            <dt>Category</dt><dd>{displayCategory(viewedContact.category)}</dd>
            <dt>Role</dt><dd>{viewedContact.customRole || viewedContact.role}</dd>
            <dt>Relationship</dt><dd>{viewedContact.relation || "Not provided"}</dd>
            <dt>Mobile number</dt><dd>{viewedContact.mobileNumber || "Not provided"}</dd>
            <dt>Email address</dt><dd>{viewedContact.email || "Not provided"}</dd>
          </dl>
        </>}
      </dialog>

      {modalOpen && (
        <div className="fk-ic-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeForm(); }}>
          <div className="fk-ic-modal" role="dialog" aria-modal="true" aria-labelledby="fk-ic-modal-title">
            <div className="fk-ic-modal-header"><h2 id="fk-ic-modal-title">{editingId ? "Edit Contact" : "Add Contact"}</h2><button type="button" onClick={closeForm} disabled={saving} aria-label="Close form"><X size={19} /></button></div>
            <form onSubmit={handleSave}>
              <div className="fk-ic-photo-field">
                <ContactAvatar name={form.name} photo={form.photo} />
                <div>
                  <span>Photo <small>(Optional)</small></span>
                  <label className="fk-ic-photo-picker">
                    <CameraIcon size={16} aria-hidden="true" /> {photoBusy ? "Preparing photo..." : form.photo ? "Change photo" : "Upload or take a photo"}
                    <input type="file" accept="image/*" disabled={saving || photoBusy} onChange={selectPhoto} />
                  </label>
                  {form.photo && <button type="button" disabled={saving || photoBusy} onClick={() => changeField("photo", "")}>Remove photo</button>}
                </div>
              </div>
              <label htmlFor="fk-ic-name">Name<span className="fk-ic-required">*</span></label>
              <input id="fk-ic-name" required maxLength={100} placeholder="Enter contact name" value={form.name} onChange={(e) => changeField("name", e.target.value)} />

              <label htmlFor="fk-ic-category">Category<span className="fk-ic-required">*</span></label>
              <input type="search" aria-label="Search available categories" placeholder="Search categories"
                value={categorySearch} onChange={(event) => setCategorySearch(event.target.value)} />
              <div className="fk-ic-select-wrap"><select id="fk-ic-category" required value={form.category} onChange={(e) => changeField("category", e.target.value)}><option value="">Select Category</option>{categoryNames.filter((name) => name === form.category || name.toLowerCase().includes(categorySearch.trim().toLowerCase())).map((name) => <option key={name} value={name}>{name}</option>)}</select><ChevronDown size={17} /></div>

              <label htmlFor="fk-ic-role">Role<span className="fk-ic-required">*</span></label>
              <div className="fk-ic-select-wrap"><select id="fk-ic-role" required value={form.role} disabled={!form.category} onChange={(e) => changeField("role", e.target.value)}><option value="">Select Role</option>{availableRoles.map((role) => <option key={role} value={role}>{role}</option>)}</select><ChevronDown size={17} /></div>
              {form.role === CUSTOM_ROLE && <>
                <label htmlFor="fk-ic-custom-role">Custom role<span className="fk-ic-required">*</span></label>
                <input id="fk-ic-custom-role" required maxLength={100} value={form.customRole} onChange={(event) => changeField("customRole", event.target.value)} />
              </>}

              <label htmlFor="fk-ic-relation">Relation <span className="fk-ic-optional">(Optional)</span></label>
              <input id="fk-ic-relation" maxLength={100} placeholder="e.g. Cousin, Uncle, Friend, Neighbour"
                value={form.relation} onChange={(event) => changeField("relation", event.target.value)} />

              <label htmlFor="fk-ic-mobile">Mobile Number<span className="fk-ic-required">*</span></label>
              <div className="fk-ic-phone-field"><span>+91</span><input id="fk-ic-mobile" required type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} pattern="[6-9][0-9]{9}" title="Enter a valid 10-digit Indian mobile number" placeholder="10-digit mobile number" value={form.mobileNumber} onChange={(e) => changeField("mobileNumber", e.target.value.replace(/\D/g, "").slice(0, 10))} /></div>

              <label htmlFor="fk-ic-email">Email Address <span className="fk-ic-optional">(Optional)</span></label>
              <input id="fk-ic-email" type="email" maxLength={254} placeholder="personname@gmail.com" value={form.email} onChange={(e) => changeField("email", e.target.value)} />

              {formError && <p className="fk-ic-form-error" role="alert">{formError}</p>}
              <button className="fk-ic-save" type="submit" disabled={saving || photoBusy}><Check size={17} /> {saving ? "Saving..." : editingId ? "Update Contact" : "Save"}</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
