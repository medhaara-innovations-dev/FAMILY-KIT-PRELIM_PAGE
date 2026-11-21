/*
 * FamilyKit - Notes API
 *
 * Includes automatic Cognito token refresh
 * through the centralized session manager.
 */

import { authenticatedFetch } from "../auth/sessionManager.js";

// ======================================================
// API CONFIGURATION
// ======================================================

const NOTES_API_URL =
  "https://kvi1br0fnl.execute-api.ap-southeast-2.amazonaws.com";

// ======================================================
// SHARED AUTHENTICATED API REQUEST
// ======================================================

async function notesRequest(endpoint, options = {}) {
  const response = await authenticatedFetch(
    `${NOTES_API_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      `Notes API error: ${response.status}`
    );
  }

  return data;
}

// ======================================================
// CREATE NOTE
// ======================================================

export async function createNote({
  title = "Untitled Note",
  content,
  reminder = false,
}) {
  return notesRequest("/notes", {
    method: "POST",
    body: JSON.stringify({
      title,
      content,
      reminder,
    }),
  });
}

// ======================================================
// GET ALL NOTES
// ======================================================

export async function getNotes() {
  return notesRequest("/notes", {
    method: "GET",
  });
}

// ======================================================
// GET SINGLE NOTE
// ======================================================

export async function getNote(noteId) {
  return notesRequest(
    `/notes/${encodeURIComponent(noteId)}`,
    {
      method: "GET",
    }
  );
}

// ======================================================
// UPDATE NOTE
// ======================================================

export async function updateNote(noteId, updates) {
  return notesRequest(
    `/notes/${encodeURIComponent(noteId)}`,
    {
      method: "PUT",
      body: JSON.stringify(updates),
    }
  );
}

// ======================================================
// DELETE NOTE
// ======================================================

export async function deleteNote(noteId) {
  return notesRequest(
    `/notes/${encodeURIComponent(noteId)}`,
    {
      method: "DELETE",
    }
  );
}