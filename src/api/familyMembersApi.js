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
    throw new Error(
      data.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

// ======================================================
// GET: Retrieve all family members
// ======================================================

export async function getFamilyMembers() {
  const data = await apiRequest("/family/members", {
    method: "GET",
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
  const data = await apiRequest("/family/members", {
    method: "POST",
    body: JSON.stringify(memberData),
  });

  return data.member;
}

// ======================================================
// PUT: Update an existing family member
// ======================================================

export async function updateFamilyMember(
  memberId,
  memberData
) {
  const data = await apiRequest(
    `/family/members/${encodeURIComponent(memberId)}`,
    {
      method: "PUT",
      body: JSON.stringify(memberData),
    }
  );

  return data.member;
}