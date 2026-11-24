
import { refreshCognitoSession } from "./authService.js";

// ======================================================
// FAMILYKIT SESSION MANAGER
// ======================================================

const ACCESS_TOKEN_KEY = "familykit_access_token";
const ID_TOKEN_KEY = "familykit_id_token";
const REFRESH_TOKEN_KEY = "familykit_refresh_token";

// Refresh 2 minutes before token expiration.
const REFRESH_BUFFER_MS = 2 * 60 * 1000;

// Prevent multiple simultaneous refresh requests.
let refreshPromise = null;

// ======================================================
// DECODE JWT PAYLOAD
// This reads expiry information; it does not verify JWT.
// Cognito/API Gateway performs server-side validation.
// ======================================================

function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];

    if (!payload) return null;

    const normalized = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded = normalized.padEnd(
      Math.ceil(normalized.length / 4) * 4,
      "="
    );

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

// ======================================================
// CHECK TOKEN EXPIRATION
// ======================================================

export function isAccessTokenExpired(
  token,
  bufferMs = REFRESH_BUFFER_MS
) {
  if (!token) return true;

  const payload = decodeJwtPayload(token);

  if (!payload || typeof payload.exp !== "number") {
    return true;
  }

  return Date.now() + bufferMs >= payload.exp * 1000;
}

// ======================================================
// READ STORED TOKENS
// ======================================================

export function getStoredAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredSessionSubject() {
  return decodeJwtPayload(getStoredAccessToken())?.sub;
}

export function getStoredRefreshToken() {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

// ======================================================
// SAVE UPDATED TOKENS
// ======================================================

export function saveSessionTokens(tokens) {
  if (!tokens?.accessToken) {
    throw new Error("Missing access token.");
  }

  sessionStorage.setItem(
    ACCESS_TOKEN_KEY,
    tokens.accessToken
  );

  if (tokens.idToken) {
    sessionStorage.setItem(
      ID_TOKEN_KEY,
      tokens.idToken
    );
  }

  if (tokens.refreshToken) {
    sessionStorage.setItem(
      REFRESH_TOKEN_KEY,
      tokens.refreshToken
    );
  }
}

// ======================================================
// CLEAR SESSION
// Call this only for explicit logout or a confirmed
// unrecoverable authentication failure.
// ======================================================

export function clearFamilyKitSession() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(ID_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

// ======================================================
// REFRESH SESSION
// ======================================================

export async function refreshFamilyKitSession() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getStoredRefreshToken();

  if (!refreshToken) {
    throw new Error(
      "Your session has expired. Please log in again."
    );
  }

  const refreshOperation = async () => {
    const tokens = await refreshCognitoSession(refreshToken);

    // Do not restore a session that was logged out
    // while the refresh request was in progress.
    if (getStoredRefreshToken() !== refreshToken) {
      throw new Error("Authentication session changed.");
    }

    saveSessionTokens(tokens);

    return tokens.accessToken;
  };

  refreshPromise = refreshOperation();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

// ======================================================
// GET VALID ACCESS TOKEN
// ======================================================

export async function getValidAccessToken() {
  // If another request is already refreshing,
  // wait for it rather than using an older token.
  if (refreshPromise) {
    return refreshPromise;
  }

  const accessToken = getStoredAccessToken();

  if (
    accessToken &&
    !isAccessTokenExpired(accessToken)
  ) {
    return accessToken;
  }

  return refreshFamilyKitSession();
}

// ======================================================
// AUTHENTICATED FETCH
//
// - Refreshes before sending an expired token
// - Retries once on HTTP 401
// - Does not retry other HTTP errors
// ======================================================

export async function authenticatedFetch(
  url,
  options = {}
) {
  const sendRequest = async (token) => {
    const headers = new Headers(options.headers || {});

    // Always use the current token.
    headers.set("Authorization", `Bearer ${token}`);

    return fetch(url, {
      ...options,
      headers,
    });
  };

  let token = await getValidAccessToken();
  let response = await sendRequest(token);

  if (response.status === 401) {
    // Another request may already have renewed the token.
    const latestToken = getStoredAccessToken();

    if (
      latestToken &&
      latestToken !== token &&
      !isAccessTokenExpired(latestToken, 0)
    ) {
      token = latestToken;
    } else {
      token = await refreshFamilyKitSession();
    }

    response = await sendRequest(token);
  }

  return response;
}
