import { authenticatedFetch } from "../auth/sessionManager.js";

const API_BASE_URL =
  "https://qi5ggu1olj.execute-api.ap-southeast-2.amazonaws.com";

// ======================================================
// SHARED AUTHENTICATED API REQUEST
// Automatically checks and refreshes expired Cognito tokens
// ======================================================

async function apiRequest(path, options = {}) {
  const response = await authenticatedFetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid response from server.");
  }

  if (!response.ok) {
    const error = new Error(
      data.message ||
        `Request failed with status ${response.status}`
    );
    error.status = response.status;
    error.code = data.code;
    error.matches = Array.isArray(data.matches) ? data.matches : [];
    throw error;
  }

  return data;
}

async function saveWithDuplicateConfirmation(save, details) {
  try {
    return await save(details);
  } catch (error) {
    if (error.code !== "POSSIBLE_DUPLICATE" || !error.matches.length) throw error;

    const names = error.matches.slice(0, 5).map(({ name }) => name).join(", ");
    const more = error.matches.length > 5 ? ` and ${error.matches.length - 5} more` : "";
    if (!window.confirm(
      `Possible match in My Family: ${names}${more}.\n\nContinue only if you are saving a different person, such as a twin or a family member who shares a mobile number.`
    )) return null;

    return save({ ...details, acknowledgedDuplicateMemberIds: error.matches.map(({ memberId }) => memberId) });
  }
}

// ======================================================
// GET: Retrieve all family members
// ======================================================

export async function getFamilyMembers(signal) {
  const data = await apiRequest("/family/members", {
    method: "GET",
    signal,
  });

  return data.members || [];
}

// ======================================================
// GET: Retrieve one family member
// ======================================================

export async function getFamilyMember(memberId) {
  const data = await apiRequest(
    `/family/members/${encodeURIComponent(memberId)}`,
    {
      method: "GET",
    }
  );

  return data.member;
}

// ======================================================
// POST: Add a new family member
// ======================================================

export async function addFamilyMember(memberData) {
  const data = await saveWithDuplicateConfirmation((details) => apiRequest("/family/members", {
    method: "POST",
    body: JSON.stringify(details),
  }), memberData);

  return data === null ? null : data.member;
}

// ======================================================
// PUT: Update an existing family member
// ======================================================

export async function updateFamilyMember(
  memberId,
  memberData
) {
  const data = await saveWithDuplicateConfirmation((details) => apiRequest(
    `/family/members/${encodeURIComponent(memberId)}`,
    {
      method: "PUT",
      body: JSON.stringify(details),
    }
  ), memberData);

  return data === null ? null : data.member;
}

export async function deleteFamilyMember(memberId) {
  return apiRequest(`/family/members/${encodeURIComponent(memberId)}`, {
    method: "DELETE",
  });
}
