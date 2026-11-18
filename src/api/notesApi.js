
const NOTES_API_URL =
  "https://kvi1br0fnl.execute-api.ap-southeast-2.amazonaws.com";

// Get the Cognito access token
function getAccessToken() {
  const token = sessionStorage.getItem("familykit_access_token");

  if (!token) {
    throw new Error("Session expired. Please log in again.");
  }

  return token;
}

// Common API request handler
async function notesRequest(endpoint, options = {}) {
  const token = getAccessToken();

  const response = await fetch(`${NOTES_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || `Notes API error: ${response.status}`
    );
  }

  return data;
}

// CREATE NOTE
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

// GET ALL NOTES
export async function getNotes() {
  return notesRequest("/notes", {
    method: "GET",
  });
}

// GET SINGLE NOTE
export async function getNote(noteId) {
  return notesRequest(`/notes/${encodeURIComponent(noteId)}`, {
    method: "GET",
  });
}

// UPDATE NOTE
export async function updateNote(noteId, updates) {
  return notesRequest(`/notes/${encodeURIComponent(noteId)}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

// DELETE NOTE
export async function deleteNote(noteId) {
  return notesRequest(`/notes/${encodeURIComponent(noteId)}`, {
    method: "DELETE",
  });
}
