
const API_BASE_URL =
  "https://09ngtow570.execute-api.ap-southeast-2.amazonaws.com";

function getAccessToken() {
  const token = sessionStorage.getItem(
    "familykit_access_token"
  );

  if (!token) {
    throw new Error(
      "Session expired. Please log in again."
    );
  }

  return token;
}

async function apiRequest(path, options = {}) {
  const token = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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

// GET: All contacts or category-filtered contacts
export async function getImportantContacts(
  category = "All"
) {
  const query =
    category === "All"
      ? ""
      : `?category=${encodeURIComponent(category)}`;

  const data = await apiRequest(
    `/contacts${query}`,
    { method: "GET" }
  );

  return data.contacts || [];
}

// GET: Categories and their available roles
export async function getContactCategories() {
  const data = await apiRequest(
    "/contacts/categories",
    { method: "GET" }
  );

  return data.categories || [];
}

// GET: Individual contact
export async function getImportantContact(contactId) {
  const data = await apiRequest(
    `/contacts/${encodeURIComponent(contactId)}`,
    { method: "GET" }
  );

  return data.contact;
}

// POST: Create contact
export async function addImportantContact(contactData) {
  const data = await apiRequest("/contacts", {
    method: "POST",
    body: JSON.stringify(contactData),
  });

  return data.contact;
}

// PUT: Update contact
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

// DELETE: Remove contact
export async function deleteImportantContact(contactId) {
  return apiRequest(
    `/contacts/${encodeURIComponent(contactId)}`,
    { method: "DELETE" }
  );
}
