import { authenticatedFetch } from "../auth/sessionManager.js";

const base = import.meta.env.VITE_DOCUMENTS_API_URL || "https://qdks44cu0f.execute-api.ap-southeast-2.amazonaws.com";
export const OPEN_DOCUMENT_UPLOAD = "familykit:open-document-upload";
export const DOCUMENT_SAVED = "familykit:document-saved";

async function request(path, { data, signal, method = data ? "POST" : "GET" } = {}) {
  const result = await authenticatedFetch(`${base}/documents${path}`, {
    signal,
    method,
    cache: "no-store",
    ...(data && { headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  });
  const payload = await result.json().catch(() => ({}));
  if (!result.ok) throw new Error(payload.message || "Could not access documents. Try again.");
  return payload;
}

export async function listDocuments(signal) {
  return (await request("", { signal })).documents;
}

export async function uploadDocument(file, contentType) {
  const { documentId, upload } = await request("/upload", { data: { contentType } });
  const form = new FormData();
  Object.entries(upload.fields).forEach(([key, value]) => form.append(key, value));
  form.append("file", file);
  const result = await fetch(upload.url, { method: "POST", body: form });
  if (!result.ok) throw new Error("The upload failed. Please try again.");
  return documentId;
}

export function saveDocument(documentId, fileName, memberId) {
  return request(`/${encodeURIComponent(documentId)}/complete`, { data: { fileName, memberId } });
}

export async function downloadDocument(documentId) {
  return (await request(`/${encodeURIComponent(documentId)}/download`)).url;
}


export async function deleteDocument(documentId) {
  await request(`/${encodeURIComponent(documentId)}`, { method: "DELETE" });
  window.dispatchEvent(new Event(DOCUMENT_SAVED));
}
