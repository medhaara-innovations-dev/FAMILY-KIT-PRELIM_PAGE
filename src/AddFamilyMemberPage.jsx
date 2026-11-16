
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  UserRound,
} from "lucide-react";

import { addFamilyMember } from "./api/familyMembersApi.js";
import "./AddFamilyMemberPage.css";

const RELATIONSHIPS = [
  "Father",
  "Mother",
  "Spouse",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Grandfather",
  "Grandmother",
  "Other",
];

const BLOOD_GROUPS = [
  "A+", "A-", "B+", "B-",
  "AB+", "AB-", "O+", "O-",
];

const INITIAL_FORM = {
  name: "",
  relationship: "",
  mobile: "",
  email: "",
  bloodGroup: "",
  dateOfBirth: "",
  height: "",
  weight: "",
  address: "",
  photoKey: "",
};

const STEP_TITLES = [
  "Add Person Details",
  "Basic Details",
  "Verification",
  "More Important Details & Address",
  "Review Details",
];

export default function AddFamilyMemberPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [createdMember, setCreatedMember] = useState(null);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
  };

  const validateBasicDetails = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Full name is required.";
    }

    if (!form.relationship) {
      nextErrors.relationship = "Select a relationship.";
    }

    if (!/^\+?[0-9]{10,15}$/.test(form.mobile.trim())) {
      nextErrors.mobile =
        "Enter a valid mobile number (10–15 digits).";
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      nextErrors.email = "Enter a valid email address.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const nextStep = () => {
    if (step === 2 && !validateBasicDetails()) {
      return;
    }

    setSaveError("");
    setStep((previous) => Math.min(previous + 1, 5));
  };

  const previousStep = () => {
    setSaveError("");
    setStep((previous) => Math.max(previous - 1, 1));
  };

  const discard = () => {
    navigate("/family");
  };

  const saveMember = async () => {
    if (!validateBasicDetails()) {
      setStep(2);
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const member = await addFamilyMember(form);
      setCreatedMember(member);
    } catch (error) {
      setSaveError(
        error.message || "Unable to add family member."
      );
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (
    label,
    field,
    {
      type = "text",
      placeholder = "",
      required = false,
    } = {}
  ) => (
    <label className="fk-add-field" key={field}>
      <span>
        {label}
        {required && <b> *</b>}
      </span>

      <input
        type={type}
        value={form[field]}
        placeholder={placeholder}
        onChange={(event) =>
          updateField(field, event.target.value)
        }
        aria-invalid={Boolean(errors[field])}
      />

      {errors[field] && (
        <small className="fk-add-error">
          {errors[field]}
        </small>
      )}
    </label>
  );

  if (createdMember) {
    return (
      <div className="fk-add-page">
        <main className="fk-add-success">
          <CheckCircle2 size={82} />

          <h1>Member Added Successfully!</h1>

          <p>
            {createdMember.name} has been added
            to your family.
          </p>

          <button
            type="button"
            className="fk-add-primary"
            onClick={() =>
              navigate(
                `/family/${encodeURIComponent(
                  createdMember.memberId
                )}`
              )
            }
          >
            View Profile
            <ArrowRight size={19} />
          </button>

          <button
            type="button"
            className="fk-add-secondary"
            onClick={() => navigate("/family")}
          >
            Back to My Family
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="fk-add-page">
      <header className="fk-add-header">
        <button
          type="button"
          className="fk-add-back"
          onClick={step === 1 ? discard : previousStep}
          aria-label="Go back"
        >
          <ArrowLeft size={22} />
        </button>

        <h1>Add Family Member</h1>

        <button
          type="button"
          className="fk-add-skip"
          onClick={step === 1 ? nextStep : discard}
        >
          {step === 1 ? "Skip" : "Discard"}
        </button>
      </header>

      <main className="fk-add-main">
        <div className="fk-add-progress-heading">
          <span>Step {step} of 5</span>
          <span>{Math.round((step / 5) * 100)}%</span>
        </div>

        <div className="fk-add-progress">
          <div style={{ width: `${(step / 5) * 100}%` }} />
        </div>

        <h2>{STEP_TITLES[step - 1]}</h2>

        {step === 1 && (
          <section className="fk-add-section">
            <div className="fk-add-photo">
              <UserRound size={64} />
            </div>

            <h3>Add a profile picture</h3>

            <p>
              You can add a profile picture later.
              Photo uploads will be connected when
              the family-member image storage is ready.
            </p>

            <div className="fk-add-photo-note">
              <Camera size={19} />
              Photo upload is not enabled yet.
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="fk-add-section">
            <p className="fk-add-intro">
              Enter the basic information of your
              family member.
            </p>

            {renderInput("Full Name", "name", {
              placeholder: "Enter full name",
              required: true,
            })}

            <label className="fk-add-field">
              <span>
                Relationship <b>*</b>
              </span>

              <select
                value={form.relationship}
                onChange={(event) =>
                  updateField(
                    "relationship",
                    event.target.value
                  )
                }
              >
                <option value="">
                  Select relationship
                </option>

                {RELATIONSHIPS.map((relation) => (
                  <option
                    value={relation}
                    key={relation}
                  >
                    {relation}
                  </option>
                ))}
              </select>

              {errors.relationship && (
                <small className="fk-add-error">
                  {errors.relationship}
                </small>
              )}
            </label>

            {renderInput("Mobile Number", "mobile", {
              type: "tel",
              placeholder: "9876543210",
              required: true,
            })}

            {renderInput("Email Address", "email", {
              type: "email",
              placeholder: "Optional",
            })}
          </section>
        )}

        {step === 3 && (
          <section className="fk-add-section fk-add-verify">
            <div className="fk-add-verify-icon">
              <Check size={42} />
            </div>

            <h3>Mobile Verification</h3>

            <p>
              OTP verification will be enabled
              when your SMS or WhatsApp verification
              service is integrated.
            </p>

            <div className="fk-add-demo-label">
              Demo mode — no OTP is sent
            </div>

            <p>
              Select Continue to proceed with
              the family-member registration.
            </p>
          </section>
        )}

        {step === 4 && (
          <section className="fk-add-section">
            <p className="fk-add-intro">
              Add more details about your family member.
              These fields are optional.
            </p>

            <label className="fk-add-field">
              <span>Blood Group</span>

              <select
                value={form.bloodGroup}
                onChange={(event) =>
                  updateField(
                    "bloodGroup",
                    event.target.value
                  )
                }
              >
                <option value="">
                  Select blood group
                </option>

                {BLOOD_GROUPS.map((group) => (
                  <option value={group} key={group}>
                    {group}
                  </option>
                ))}
              </select>
            </label>

            {renderInput(
              "Date of Birth",
              "dateOfBirth",
              { type: "date" }
            )}

            {renderInput("Height (cm)", "height", {
              placeholder: "Optional",
            })}

            {renderInput("Weight (kg)", "weight", {
              placeholder: "Optional",
            })}

            <label className="fk-add-field">
              <span>Address</span>

              <textarea
                rows={4}
                placeholder="Enter family member's address"
                value={form.address}
                onChange={(event) =>
                  updateField(
                    "address",
                    event.target.value
                  )
                }
              />
            </label>
          </section>
        )}

        {step === 5 && (
          <section className="fk-add-section">
            <p className="fk-add-intro">
              Review the details before adding
              this member to your family.
            </p>

            <div className="fk-add-review">
              {[
                ["Full Name", form.name],
                ["Relationship", form.relationship],
                ["Mobile", form.mobile],
                ["Email", form.email],
                ["Blood Group", form.bloodGroup],
                ["Date of Birth", form.dateOfBirth],
                ["Height", form.height],
                ["Weight", form.weight],
                ["Address", form.address],
              ].map(([label, value]) => (
                <div
                  className="fk-add-review-row"
                  key={label}
                >
                  <span>{label}</span>
                  <strong>{value || "Not provided"}</strong>
                </div>
              ))}
            </div>

            {saveError && (
              <p className="fk-add-save-error" role="alert">
                {saveError}
              </p>
            )}
          </section>
        )}

        <div className="fk-add-actions">
          {step > 1 && (
            <button
              type="button"
              className="fk-add-secondary"
              onClick={previousStep}
              disabled={saving}
            >
              <ChevronLeft size={19} />
              Back
            </button>
          )}

          {step < 5 ? (
            <button
              type="button"
              className="fk-add-primary"
              onClick={nextStep}
            >
              {step === 2
                ? "Continue (Demo — No OTP)"
                : "Next"}
              <ArrowRight size={19} />
            </button>
          ) : (
            <button
              type="button"
              className="fk-add-primary"
              onClick={saveMember}
              disabled={saving}
            >
              {saving ? "Adding Member..." : "Add Member"}
              {!saving && <Check size={19} />}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
