
const API_BASE_URL =
  "https://xjjpa0ph1m.execute-api.ap-southeast-2.amazonaws.com";

function getAccessToken() {
  const token = sessionStorage.getItem("familykit_access_token");
  if (!token) {
    throw new Error("Session expired. Please log in again.");
  }
  return token;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getAccessToken()}`,
      ...options.headers,
    },
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Invalid server response (${response.status}).`);
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Session expired or unauthorized. Please log in again.");
    }
    throw new Error(data.message || `Request failed (${response.status}).`);
  }

  return data;
}

export async function getDiaryEntries() {
  const data = await apiRequest("/diary");
  return data.entries || [];
}

export async function getDiaryEntry(entryId) {
  const data = await apiRequest(
    `/diary/${encodeURIComponent(entryId)}`
  );
  return data.entry || data.item || data;
}

export async function createDiaryEntry(entry) {
  return apiRequest("/diary", {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

export async function updateDiaryEntry(entryId, entry) {
  return apiRequest(`/diary/${encodeURIComponent(entryId)}`, {
    method: "PUT",
    body: JSON.stringify(entry),
  });
}

export async function deleteDiaryEntry(entryId) {
  return apiRequest(`/diary/${encodeURIComponent(entryId)}`, {
    method: "DELETE",
  });
}
