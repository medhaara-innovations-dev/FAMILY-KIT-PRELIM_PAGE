import { authenticatedFetch } from "../auth/sessionManager.js";

const base = import.meta.env.VITE_SCANNER_API_URL?.replace(/\/$/, "");
export const scannerAvailable = Boolean(base);

export async function scannerRequest(path, { data, signal } = {}) {
  const response = await authenticatedFetch(`${base}/scans${path}`, {
    signal,
    cache: "no-store",
    ...(data && { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "The document scanner is unavailable.");
  return payload;
}

export async function stageScan(file, mime) {
  const { documentId, upload } = await scannerRequest("/upload", { data: { mime } });
  const form = new FormData();
  Object.entries(upload.fields).forEach(([key, value]) => form.append(key, value));
  form.append("file", file);
  const response = await fetch(upload.url, { method: "POST", body: form });
  if (!response.ok) throw new Error("The document upload failed. Please try again.");
  return documentId;
}
