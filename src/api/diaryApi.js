/*
 * FamilyKit - Diary API
 *
 * Includes automatic Cognito token refresh
 * through the centralized session manager.
 */

import { authenticatedFetch } from "../auth/sessionManager.js";

// ======================================================
// API CONFIGURATION
// ======================================================

const API_BASE_URL =
  "https://xjjpa0ph1m.execute-api.ap-southeast-2.amazonaws.com";

// ======================================================
// SHARED AUTHENTICATED API REQUEST
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
    throw new Error(
      `Invalid server response (${response.status}).`
    );
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "Session expired or unauthorized. Please log in again."
      );
    }

    throw new Error(
      data.message ||
      `Request failed (${response.status}).`
    );
  }

  return data;
}

// ======================================================
// GET: RETRIEVE ALL DIARY ENTRIES
// ======================================================

export async function getDiaryEntries() {
  const data = await apiRequest("/diary");

  return data.entries || [];
}

// ======================================================
// GET: RETRIEVE INDIVIDUAL DIARY ENTRY
// ======================================================

export async function getDiaryEntry(entryId) {
  const data = await apiRequest(
    `/diary/${encodeURIComponent(entryId)}`
  );

  return data.entry || data.item || data;
}

// ======================================================
// POST: CREATE DIARY ENTRY
// ======================================================

export async function createDiaryEntry(entry) {
  return apiRequest("/diary", {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

// ======================================================
// PUT: UPDATE DIARY ENTRY
// ======================================================

export async function updateDiaryEntry(entryId, entry) {
  return apiRequest(
    `/diary/${encodeURIComponent(entryId)}`,
    {
      method: "PUT",
      body: JSON.stringify(entry),
    }
  );
}

// ======================================================
// DELETE: REMOVE DIARY ENTRY
// ======================================================

export async function deleteDiaryEntry(entryId) {
  return apiRequest(
    `/diary/${encodeURIComponent(entryId)}`,
    {
      method: "DELETE",
    }
  );
}