/*
 * FamilyKit - Important Contacts API
 *
 * Includes automatic Cognito token refresh
 * through the centralized session manager.
 */

import { authenticatedFetch } from "../auth/sessionManager.js";

// ======================================================
// API CONFIGURATION
// ======================================================

const API_BASE_URL =
  "https://09ngtow570.execute-api.ap-southeast-2.amazonaws.com";

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
      "Invalid response from server."
    );
  }

  if (!response.ok) {
    const error = new Error(
      data.error ||
      data.message ||
      `Request failed (${response.status})`
    );

    error.status = response.status;
    throw error;
  }

  return data;
}

// ======================================================
// GET: ALL CONTACTS OR CATEGORY-FILTERED CONTACTS
// ======================================================

export async function getImportantContacts(
  category = "All"
) {
  const query = new URLSearchParams({ schema: "2", category });
  const contacts = [];
  let cursor;
  do {
    if (cursor) query.set("cursor", cursor);
    const page = await apiRequest(`/contacts?${query}`, { method: "GET" });
    contacts.push(...(page.contacts || []));
    cursor = page.cursor;
  } while (cursor);
  return contacts.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

// ======================================================
// GET: CATEGORIES AND THEIR AVAILABLE ROLES
// ======================================================

export async function getContactCategories() {
  const data = await apiRequest(
    "/contacts/categories?schema=2",
    { method: "GET" }
  );

  return data.categories || [];
}

// ======================================================
// GET: INDIVIDUAL CONTACT
// ======================================================

export async function getImportantContact(contactId) {
  const data = await apiRequest(
    `/contacts/${encodeURIComponent(contactId)}`,
    { method: "GET" }
  );

  return data.contact;
}

// ======================================================
// POST: CREATE CONTACT
// ======================================================

export async function addImportantContact(contactData) {
  const data = await apiRequest("/contacts", {
    method: "POST",
    body: JSON.stringify(contactData),
  });

  return data.contact;
}

// ======================================================
// PUT: UPDATE CONTACT
// ======================================================

export async function updateImportantContact(
  contactId,
  contactData
) {
  const data = await apiRequest(
    `/contacts/${encodeURIComponent(contactId)}`,
    {
      method: "PUT",
      body: JSON.stringify(contactData),
    }
  );

  return data.contact;
}

// ======================================================
// DELETE: REMOVE CONTACT
// ======================================================

export async function deleteImportantContact(contactId) {
  return apiRequest(
    `/contacts/${encodeURIComponent(contactId)}`,
    { method: "DELETE" }
  );
}
