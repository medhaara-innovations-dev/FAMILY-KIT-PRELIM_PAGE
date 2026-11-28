import { authenticatedFetch } from "../auth/sessionManager.js";

const base = import.meta.env.VITE_FAMILY_CONNECTIONS_API_URL?.replace(/\/$/, "");
export const CONNECTED_PROFILE_ID = "connected";
export const connectionsEnabled = Boolean(base);
const inviteStorage = "familykit_pending_invite";

export function rememberInvitation(token) {
  if (/^[A-Za-z0-9_-]{43}$/.test(token || "")) sessionStorage.setItem(inviteStorage, token);
}

export function pendingInvitation() {
  return sessionStorage.getItem(inviteStorage);
}

export function forgetInvitation() {
  sessionStorage.removeItem(inviteStorage);
}

async function request(path, { data, publicRoute, token, signal } = {}) {
  const options = {
    cache: "no-store",
    signal,
    ...(data && { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } }),
  };
  if (token) options.headers = { ...options.headers, Authorization: `Bearer ${token}` };
  const response = await (publicRoute || token ? fetch : authenticatedFetch)(`${base}${path}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Family connections are unavailable. Try again.");
  return body;
}

export const foundingStatus = () => request("/founding", { publicRoute: true });
export const familyConnection = (signal) => request("/family-connection", { signal });
export const createInvitation = (data) => request("/invitations", { data });
export const previewInvitation = (token) => request("/invitations/preview", { data: { token }, publicRoute: true });
export const updateInvitation = (action, token, details) => request(`/invitations/${action}`, { data: { token, ...details } });
export const linkConnectionProfile = (memberId) => request("/family-connection/link-profile", { data: { memberId } });

export async function checkSignupAccess() {
  if (!connectionsEnabled) return null;
  const invitation = pendingInvitation();
  if (invitation) {
    await previewInvitation(invitation);
    return "invited";
  }
  const status = await foundingStatus();
  if (!status.newFamiliesOpen) throw new Error("New FamilyKit registration is currently closed.");
  return status.mode;
}

export function invitationReturnPath() {
  return connectionsEnabled && pendingInvitation() ? "/?invite=1" : "/my-family";
}
