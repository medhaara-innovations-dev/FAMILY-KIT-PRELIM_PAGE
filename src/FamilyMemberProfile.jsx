
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  UserRound,
  Pencil,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  HeartPulse,
  FolderOpen,
} from "lucide-react";

import {
  getFamilyMember,
  updateFamilyMember,
} from "./api/familyMembersApi.js";

import "./FamilyMemberProfile.css";

const EDITABLE_FIELDS = [
  "name",
  "relationship",
  "mobile",
  "email",
  "bloodGroup",
  "dateOfBirth",
  "height",
  "weight",
  "address",
];

const FIELD_LABELS = {
  name: "Full Name",
  relationship: "Relationship",
  mobile: "Mobile Number",
  email: "Email Address",
  bloodGroup: "Blood Group",
  dateOfBirth: "Date of Birth",
  height: "Height (cm)",
  weight: "Weight (kg)",
  address: "Address",
};

export default function FamilyMemberProfile() {
  const navigate = useNavigate();
  const { memberId } = useParams();

  const [member, setMember] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMember() {
      setLoading(true);
      setError("");

      try {
        const result = await getFamilyMember(memberId);

        if (!active) return;

        setMember(result);

        const initialForm = {};
        EDITABLE_FIELDS.forEach((field) => {
          initialForm[field] = result?.[field] || "";
        });

        setForm(initialForm);
      } catch (err) {
        if (active) {
          setError(err.message || "Unable to load member.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMember();

    return () => {
      active = false;
    };
  }, [memberId]);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
    setError("");
    setSuccess("");
  };

  const cancelEdit = () => {
    const original = {};

    EDITABLE_FIELDS.forEach((field) => {
      original[field] = member?.[field] || "";
    });

    setForm(original);
    setEditing(false);
    setError("");
  };

  const saveChanges = async () => {
    if (!form.name.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!form.relationship.trim()) {
      setError("Relationship is required.");
      return;
    }

    if (!/^\+?[0-9]{10,15}$/.test(form.mobile.trim())) {
      setError("Enter a valid mobile number.");
      return;
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      setError("Enter a valid email address.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updated = await updateFamilyMember(
        memberId,
        form
      );

      setMember(updated);
      setEditing(false);
      setSuccess("Member details updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update member.");
    } finally {
      setSaving(false);
    }
  };

  const detail = (label, value, Icon) => (
    <div className="fk-profile-detail" key={label}>
      <div className="fk-profile-detail-icon">
        <Icon size={19} />
      </div>

      <div className="fk-profile-detail-text">
        <span>{label}</span>
        <strong>{value || "Not provided"}</strong>
      </div>
    </div>
  );

  return (
    <div className="fk-profile-page">
      <header className="fk-profile-header">
        <button
          type="button"
          onClick={() => navigate("/family")}
          aria-label="Back to My Family"
        >
          <ArrowLeft size={22} />
        </button>

        <h1>Member Profile</h1>

        <span className="fk-profile-header-space" />
      </header>

      {loading ? (
        <main className="fk-profile-state" role="status">
          Loading member profile...
        </main>
      ) : !member ? (
        <main className="fk-profile-state">
          <p>{error || "Member not found."}</p>

          <button
            type="button"
            onClick={() => navigate("/family")}
          >
            Back to My Family
          </button>
        </main>
      ) : (
        <main className="fk-profile-main">
          <section className="fk-profile-hero">
            <div className="fk-profile-avatar">
              <UserRound size={48} />
            </div>

            <h2>{member.name}</h2>
            <p>{member.relationship}</p>

            {!editing && (
              <button
                type="button"
                className="fk-profile-edit-button"
                onClick={() => {
                  setEditing(true);
                  setSuccess("");
                }}
              >
                <Pencil size={17} />
                Edit Profile
              </button>
            )}
          </section>

          {error && (
            <p className="fk-profile-error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="fk-profile-success" role="status">
              {success}
            </p>
          )}

          {editing ? (
            <section className="fk-profile-card">
              <h3>Edit Personal Details</h3>

              <div className="fk-profile-edit-form">
                {EDITABLE_FIELDS.map((field) => (
                  <label
                    className="fk-profile-field"
                    key={field}
                  >
                    <span>{FIELD_LABELS[field]}</span>

                    {field === "address" ? (
                      <textarea
                        rows={3}
                        value={form[field] || ""}
                        onChange={(event) =>
                          updateField(
                            field,
                            event.target.value
                          )
                        }
                      />
                    ) : (
                      <input
                        type={
                          field === "dateOfBirth"
                            ? "date"
                            : field === "email"
                            ? "email"
                            : field === "mobile"
                            ? "tel"
                            : "text"
                        }
                        value={form[field] || ""}
                        onChange={(event) =>
                          updateField(
                            field,
                            event.target.value
                          )
                        }
                      />
                    )}
                  </label>
                ))}
              </div>

              <div className="fk-profile-actions">
                <button
                  type="button"
                  className="fk-profile-cancel"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  <X size={17} />
                  Cancel
                </button>

                <button
                  type="button"
                  className="fk-profile-save"
                  onClick={saveChanges}
                  disabled={saving}
                >
                  <Save size={17} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </section>
          ) : (
            <>
              <section className="fk-profile-card">
                <h3>Personal Details</h3>

                <div className="fk-profile-details">
                  {detail(
                    "Full Name",
                    member.name,
                    UserRound
                  )}

                  {detail(
                    "Relationship",
                    member.relationship,
                    UserRound
                  )}

                  {detail(
                    "Mobile Number",
                    member.mobile,
                    Phone
                  )}

                  {detail(
                    "Email Address",
                    member.email,
                    Mail
                  )}

                  {detail(
                    "Date of Birth",
                    member.dateOfBirth,
                    CalendarDays
                  )}

                  {detail(
                    "Blood Group",
                    member.bloodGroup,
                    HeartPulse
                  )}

                  {detail(
                    "Height",
                    member.height
                      ? `${member.height} cm`
                      : "",
                    UserRound
                  )}

                  {detail(
                    "Weight",
                    member.weight
                      ? `${member.weight} kg`
                      : "",
                    UserRound
                  )}

                  {detail(
                    "Address",
                    member.address,
                    MapPin
                  )}
                </div>
              </section>

              <section className="fk-profile-card">
                <h3>Documents</h3>

                <div className="fk-profile-documents">
                  <FolderOpen size={40} />
                  <p>No documents available yet.</p>
                </div>
              </section>
            </>
          )}
        </main>
      )}
    </div>
  );
}
