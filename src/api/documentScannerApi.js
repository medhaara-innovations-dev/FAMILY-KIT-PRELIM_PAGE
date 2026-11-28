import { authenticatedFetch } from "../auth/sessionManager.js";

const base = import.meta.env.VITE_SCANNER_API_URL?.replace(/\/$/, "");
export const scannerAvailable = Boolean(base);

export async function scannerRequest(path, { data, signal, method = data ? "POST" : "GET" } = {}) {
  const response = await authenticatedFetch(`${base}/scans${path}`, {
    signal,
    method,
    cache: "no-store",
    ...(data && { headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
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

const scanFormats = {
  pdf: ["application/pdf", 10 * 1024 ** 2],
  jpg: ["image/jpeg", 3_750_000],
  jpeg: ["image/jpeg", 3_750_000],
  png: ["image/png", 3_750_000],
};

export function scanFileMime(file) {
  const format = scanFormats[file.name.split(".").pop()?.toLowerCase()];
  if (!format || !file.size || file.size > format[1]) {
    throw new Error("Choose a PDF up to 10 MiB, or a JPG or PNG up to 3.75 MB.");
  }
  return format[0];
}

export function completeScan(id, fileName, mime, memberId) {
  return scannerRequest(`/${encodeURIComponent(id)}/complete`, { data: { fileName, mime, memberId } });
}

export function deleteScan(documentId) {
  return scannerRequest(`/${encodeURIComponent(documentId)}`, { method: "DELETE" });
}

export async function downloadScan(documentId) {
  return (await scannerRequest(`/${encodeURIComponent(documentId)}/original`)).url;
}
