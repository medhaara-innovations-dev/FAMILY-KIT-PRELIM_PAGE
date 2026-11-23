export const RELATIONSHIPS = [
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


export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

function isUnder18(dateOfBirth, today = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth || "")) return false;
  const birth = new Date(`${dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(birth.getTime()) || birth.toISOString().slice(0, 10) !== dateOfBirth || birth > today) return false;
  const birthdayThisYear = (birth.getUTCMonth() + 1) * 100 + birth.getUTCDate();
  const todayMonthAndDay = (today.getUTCMonth() + 1) * 100 + today.getUTCDate();
  const age = today.getUTCFullYear() - birth.getUTCFullYear() - (todayMonthAndDay < birthdayThisYear ? 1 : 0);
  return age < 18;
}

export function canShareFamilyMobile(relationship, dateOfBirth) {
  const relation = String(relationship ?? "").trim().toLowerCase();
  return ["son", "daughter"].includes(relation) && isUnder18(dateOfBirth);
}

export const RELATIONSHIP_DETAIL_MAX_LENGTH = 80;

export function familyRelationshipLabel({ relationship, relationshipDetail }) {
  return relationship === "Other" && relationshipDetail?.trim()
    ? relationshipDetail.trim()
    : relationship;
}

export function normalizeFamilyMobile(value) {
  const phone = String(value ?? "").normalize("NFKC").trim();
  const digits = phone.replace(/[^0-9]/g, "");
  if (!phone.startsWith("+") && digits.startsWith("00")) return digits.slice(2);
  if (!phone.startsWith("+") && digits.length === 10) return `91${digits}`;
  return digits;
}
