
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Search,
  Phone,
  Mail,
  Pencil,
  Trash2,
  X,
  ContactRound,
} from "lucide-react";

import {
  getImportantContacts,
  getContactCategories,
  addImportantContact,
  updateImportantContact,
  deleteImportantContact,
} from "./api/importantContactsApi";

import "./ImportantContactsPage.css";

const EMPTY_FORM = {
  name: "",
  category: "Emergency",
  role: "Emergency Contact",
  mobileNumber: "",
  email: "",
};

export default function ImportantContactsPage() {
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] =
    useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [contactData, categoryData] =
        await Promise.all([
          getImportantContacts(),
          getContactCategories(),
        ]);

      setContacts(contactData);
      setCategories(categoryData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const emergencyCount = contacts.filter(
    (contact) => contact.category === "Emergency"
  ).length;

  const filteredContacts = contacts.filter((contact) => {
    const matchesCategory =
      selectedCategory === "All" ||
      contact.category === selectedCategory;

    const text = [
      contact.name,
      contact.role,
      contact.mobileNumber,
      contact.email,
    ]
      .join(" ")
      .toLowerCase();

    return (
      matchesCategory &&
      text.includes(search.toLowerCase().trim())
    );
  });

  const availableRoles =
    categories.find(
      (category) => category.name === form.category
    )?.roles || [];

  const openAdd = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      category:
        selectedCategory === "All"
          ? "Emergency"
          : selectedCategory,
      role: "",
    });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (contact) => {
    setEditingId(contact.contactId);
    setForm({
      name: contact.name,
      category: contact.category,
      role: contact.role,
      mobileNumber: contact.mobileNumber,
      email: contact.email || "",
    });
    setError("");
    setModalOpen(true);
  };

  const changeField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
      ...(field === "category" ? { role: "" } : {}),
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (saving) return;

    const wasEmergency = editingId
      ? contacts.some(
          (contact) =>
            contact.contactId === editingId &&
            contact.category === "Emergency"
        )
      : false;

    if (
      form.category === "Emergency" &&
      !wasEmergency &&
      emergencyCount >= 2
    ) {
      setError("Only two Emergency contacts are allowed.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingId) {
        await updateImportantContact(editingId, form);
      } else {
        await addImportantContact(form);
      }

      setModalOpen(false);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contact) => {
    const confirmed = window.confirm(
      `Delete ${contact.name} from Important Contacts?`
    );

    if (!confirmed) return;

    setError("");

    try {
      await deleteImportantContact(contact.contactId);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="fk-ic-page">
      <div className="fk-ic-container">
        <header className="fk-ic-header">
          <button
            type="button"
            className="fk-ic-icon-btn"
            onClick={() => navigate("/categories")}
            aria-label="Back to categories"
          >
            <ArrowLeft size={20} />
          </button>

          <h1>Important Contacts</h1>

          <button
            type="button"
            className="fk-ic-add-btn"
            onClick={openAdd}
            disabled={loading || categories.length === 0}
            aria-label="Add contact"
          >
            <Plus size={20} />
          </button>
        </header>

        <section className="fk-ic-summary">
          <div className="fk-ic-summary-icon">
            <ContactRound size={26} />
          </div>
          <div>
            <h2>Your Important Contacts</h2>
            <p>
              Keep essential people and services
              within reach.
            </p>
          </div>
          <span className="fk-ic-total">
            {contacts.length}
          </span>
        </section>

        <div className="fk-ic-search">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search contacts..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <nav
          className="fk-ic-filters"
          aria-label="Contact categories"
        >
          {["All", ...categories.map((c) => c.name)].map(
            (category) => (
              <button
                key={category}
                type="button"
                className={
                  selectedCategory === category
                    ? "fk-ic-filter active"
                    : "fk-ic-filter"
                }
                onClick={() =>
                  setSelectedCategory(category)
                }
              >
                {category}
              </button>
            )
          )}
        </nav>

        {error && !modalOpen && (
          <div className="fk-ic-error" role="alert">
            {error}
          </div>
        )}

        <section className="fk-ic-list">
          {loading ? (
            <p className="fk-ic-empty">
              Loading contacts...
            </p>
          ) : filteredContacts.length === 0 ? (
            <div className="fk-ic-empty">
              <ContactRound size={36} />
              <h3>No contacts found</h3>
              <p>
                Add a contact to keep important
                information in one place.
              </p>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <article
                className="fk-ic-card"
                key={contact.contactId}
              >
                <div className="fk-ic-card-top">
                  <div className="fk-ic-avatar">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="fk-ic-card-info">
                    <h3>{contact.name}</h3>
                    <p>{contact.role}</p>
                    <span className="fk-ic-category">
                      {contact.category}
                    </span>
                  </div>

                  <div className="fk-ic-card-actions">
                    <button
                      type="button"
                      onClick={() => openEdit(contact)}
                      aria-label={`Edit ${contact.name}`}
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(contact)}
                      aria-label={`Delete ${contact.name}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>

                <div className="fk-ic-card-links">
                  <a href={`tel:${contact.mobileNumber}`}>
                    <Phone size={16} />
                    {contact.mobileNumber}
                  </a>

                  {contact.email && (
                    <a href={`mailto:${contact.email}`}>
                      <Mail size={16} />
                      {contact.email}
                    </a>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </div>

      {modalOpen && (
        <div
          className="fk-ic-overlay"
          role="presentation"
        >
          <div
            className="fk-ic-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fk-ic-modal-title"
          >
            <div className="fk-ic-modal-header">
              <h2 id="fk-ic-modal-title">
                {editingId ? "Edit Contact" : "Add Contact"}
              </h2>

              <button
                type="button"
                onClick={() => {
                  if (!saving) {
                    setModalOpen(false);
                    setError("");
                  }
                }}
                disabled={saving}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <label>
                Name
                <input
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(event) =>
                    changeField("name", event.target.value)
                  }
                  placeholder="Contact name"
                />
              </label>

              <label>
                Category
                <select
                  required
                  value={form.category}
                  onChange={(event) =>
                    changeField(
                      "category",
                      event.target.value
                    )
                  }
                >
                  {categories.map((category) => (
                    <option
                      key={category.name}
                      value={category.name}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Role
                <select
                  required
                  value={form.role}
                  onChange={(event) =>
                    changeField("role", event.target.value)
                  }
                >
                  <option value="">Select role</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Mobile Number
                <input
                  required
                  type="tel"
                  value={form.mobileNumber}
                  onChange={(event) =>
                    changeField(
                      "mobileNumber",
                      event.target.value
                    )
                  }
                  placeholder="+919876543210"
                  pattern="\+[1-9][0-9]{7,14}"
                  title="Enter international format, e.g. +919876543210"
                />
              </label>

              <label>
                Email (Optional)
                <input
                  type="email"
                  maxLength={254}
                  value={form.email}
                  onChange={(event) =>
                    changeField("email", event.target.value)
                  }
                  placeholder="name@example.com"
                />
              </label>

              {error && (
                <p className="fk-ic-form-error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="fk-ic-save"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Contact"
                    : "Save Contact"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
