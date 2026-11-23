import { BLOOD_GROUPS, RELATIONSHIPS, RELATIONSHIP_DETAIL_MAX_LENGTH } from "../familyMemberOptions.js";
import { socialProfileFields } from "../socialProfileLinks.js";

const labels = {
  name: "Full Name",
  familyName: "Family Name",
  relationship: "Relationship",
  relationshipDetail: "Specify relationship",
  mobile: "Mobile Number",
  email: "Email Address",
  bloodGroup: "Blood Group",
  dateOfBirth: "Date of Birth",
  height: "Height (cm)",
  weight: "Weight (kg)",
  address: "Address",
};

const optionsByField = { relationship: RELATIONSHIPS, bloodGroup: BLOOD_GROUPS };
const types = { dateOfBirth: "date", email: "email", mobile: "tel" };

export const ownerProfileFields = [
  "name", "familyName", "mobile", "email", "bloodGroup", "dateOfBirth", "height", "weight", "address",
];

export function SocialProfileFields({ values, onChange }) {
  return (
    <section className="fk-profile-social-fields">
      <h3>Social Links</h3>
      <div className="fk-profile-edit-form">
        {socialProfileFields.map(([field, label]) => (
          <label className="fk-profile-field" key={field}>
            <span>{label} profile URL</span>
            <input type="url" value={values[field] || ""} placeholder="https://"
              onChange={(event) => onChange(field, event.target.value)} />
          </label>
        ))}
      </div>
    </section>
  );
}

export default function ProfileFields({ fields, requiredFields, values, onChange }) {
  return (
    <div className="fk-profile-edit-form">
      {fields.map((field) => {
        const options = optionsByField[field];
        const value = values[field] || "";
        const update = (event) => onChange(field, event.target.value);
        const required = requiredFields.includes(field);
        return (
          <label className="fk-profile-field" key={field}>
            <span>{labels[field]}{required && " *"}</span>
            {options ? (
              <select value={value} onChange={update} required={required}>
                <option value="">Select {labels[field].toLowerCase()}</option>
                {value && !options.includes(value) && <option value={value}>{value}</option>}
                {options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            ) : field === "address" ? (
              <textarea rows={3} value={value} onChange={update} />
            ) : (
              <input type={types[field] || "text"} value={value} onChange={update}
                placeholder={field === "relationshipDetail" ? "e.g. Guardian, Aunt, Uncle" : undefined}
                maxLength={field === "relationshipDetail" ? RELATIONSHIP_DETAIL_MAX_LENGTH : undefined}
                required={required} autoFocus={field === "name"} />
            )}
          </label>
        );
      })}
    </div>
  );
}
