export const socialProfileFields = [
  ["instagramUrl", "Instagram"],
  ["facebookUrl", "Facebook"],
  ["linkedinUrl", "LinkedIn"],
];

export function normalizeSocialProfileUrl(field, value) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return "";
  if (!/^https:\/\//i.test(text) || /[\s\\]/.test(text)) return null;

  let url;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;

  const host = url.hostname;
  const path = url.pathname.replace(/\/$/, "");
  const handle = /^\/[a-z0-9_.-]+$/i;

  if (field === "instagramUrl" && ["instagram.com", "www.instagram.com"].includes(host) && handle.test(path)) {
    return `https://www.instagram.com${path}`;
  }
  if (field === "facebookUrl" && ["facebook.com", "www.facebook.com", "m.facebook.com"].includes(host)) {
    const id = url.searchParams.get("id");
    if (path === "/profile.php" && /^\d+$/.test(id || "")) return `https://www.facebook.com/profile.php?id=${id}`;
    if (handle.test(path) && !/\.php$/i.test(path) && !path.includes("..")) return `https://www.facebook.com${path}`;
  }
  if (field === "linkedinUrl" && ["linkedin.com", "www.linkedin.com"].includes(host) &&
      /^\/in\/[a-z0-9_-]+$/i.test(path)) {
    return `https://www.linkedin.com${path}`;
  }
  return null;
}

export function getChangedSocialLinks(draft, profile) {
  const links = {};
  for (const [field, label] of socialProfileFields) {
    const previous = profile[field] || "";
    const entered = draft[field] ?? previous;
    if (entered === previous) continue;
    const url = normalizeSocialProfileUrl(field, entered);
    if (url === null || url.length > 256) throw new Error(`Enter a valid HTTPS ${label} profile link.`);
    links[field] = url;
  }
  return links;
}

export function verifySavedSocialLinks(updated, links) {
  if (Object.entries(links).some(([field, url]) => (updated?.[field] || "") !== url)) {
    throw new Error("The profile service did not save your social links. Your entries are still in the form.");
  }
}
