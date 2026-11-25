import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginWithFamilyKitPin } from "./authService";
import {
  clearFamilyKitSession,
  getAccessTokenSubject,
  getStoredRefreshToken,
  getStoredSessionIdentity,
  getStoredSessionSubject,
  getValidAccessToken,
  getVerifiedAccountContacts,
} from "./sessionManager";
import "./InactivityLock.css";

const IDLE_LIMIT_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const PUBLIC_PATHS = new Set(["/", "/login", "/signup", "/forgot-pin"]);
const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "scroll"];

export default function InactivityLock() {
  const { pathname, state } = useLocation();
  const path = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  const fromSettings = path === "/forgot-pin" && state?.fromProfileSettings === true;
  const identity = getStoredSessionIdentity();

  if (!identity || (PUBLIC_PATHS.has(path) && !fromSettings)) {
    return null;
  }

  return <SessionLock key={identity} storageKey={`familykit_idle:${identity}`} />;
}

function SessionLock({ storageKey }) {
  const navigate = useNavigate();
  const lastActivity = useRef(Number(sessionStorage.getItem(storageKey)) || Date.now());
  const failures = useRef(Number(sessionStorage.getItem(`${storageKey}:failures`)) || 0);
  const [locked, setLocked] = useState(() => Date.now() - lastActivity.current >= IDLE_LIMIT_MS);
  const [pin, setPin] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef(null);
  const email = getVerifiedAccountContacts().email;
  const canVerify = Boolean(email) && failures.current < MAX_ATTEMPTS;

  useLayoutEffect(() => {
    if (locked && !dialog.current.open) dialog.current.showModal();
  }, [locked]);

  useEffect(() => {
    if (locked) return;
    let timer;

    function checkIdle() {
      window.clearTimeout(timer);
      const remaining = IDLE_LIMIT_MS - (Date.now() - lastActivity.current);
      if (remaining <= 0) setLocked(true);
      else timer = window.setTimeout(checkIdle, remaining);
    }

    function recordActivity() {
      const now = Date.now();
      if (document.hidden || now - lastActivity.current >= IDLE_LIMIT_MS) {
        checkIdle();
        return;
      }
      if (now - lastActivity.current < 500) return;
      lastActivity.current = now;
      sessionStorage.setItem(storageKey, String(now));
    }

    sessionStorage.setItem(storageKey, String(lastActivity.current));
    checkIdle();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, recordActivity, { capture: true, passive: true });
    }
    document.addEventListener("visibilitychange", checkIdle);
    window.addEventListener("pageshow", checkIdle);
    return () => {
      window.clearTimeout(timer);
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, recordActivity, true);
      document.removeEventListener("visibilitychange", checkIdle);
      window.removeEventListener("pageshow", checkIdle);
    };
  }, [locked, storageKey]);

  function signInAgain() {
    sessionStorage.removeItem(storageKey);
    sessionStorage.removeItem(`${storageKey}:failures`);
    clearFamilyKitSession();
    navigate("/login", { replace: true });
  }

  async function unlock(event) {
    event.preventDefault();
    if (checking || !canVerify || !/^\d{4}$/.test(pin)) return;

    const identity = getStoredSessionIdentity();
    const subject = getStoredSessionSubject();
    const sessionMatches = () => dialog.current && identity && identity === getStoredSessionIdentity();
    setChecking(true);
    setError("");
    try {
      try {
        await getValidAccessToken();
      } catch (failure) {
        if (sessionMatches() && (failure.name === "SessionExpiredError" || !getStoredRefreshToken())) {
          signInAgain();
          return;
        }
        throw failure;
      }
      if (!sessionMatches()) return;

      const proof = await loginWithFamilyKitPin(email, pin);
      if (!sessionMatches()) return;
      if (getAccessTokenSubject(proof.accessToken) !== subject) {
        throw new Error("Authentication session changed.");
      }

      lastActivity.current = Date.now();
      sessionStorage.setItem(storageKey, String(lastActivity.current));
      sessionStorage.removeItem(`${storageKey}:failures`);
      failures.current = 0;
      dialog.current?.close();
      setLocked(false);
    } catch (failure) {
      if (!sessionMatches()) return;
      if (failure.message === "Incorrect email address or FamilyKit PIN.") {
        failures.current += 1;
        sessionStorage.setItem(`${storageKey}:failures`, String(failures.current));
        setError("That PIN didn’t match. Try again.");
      } else {
        setError("FamilyKit couldn’t verify your PIN. Please try again.");
      }
    } finally {
      setPin("");
      setChecking(false);
    }
  }

  if (!locked) return null;

  return (
    <dialog
      ref={dialog}
      className="fk-inactivity-lock"
      aria-labelledby="fk-lock-title"
      aria-describedby="fk-lock-description"
      onCancel={(event) => event.preventDefault()}
    >
      <form onSubmit={unlock}>
        <h1 id="fk-lock-title">FamilyKit is locked</h1>
        <p id="fk-lock-description">
          {canVerify ? "Enter your 4-digit PIN to continue."
            : failures.current >= MAX_ATTEMPTS ? "Too many attempts. Sign in again to continue."
            : "Sign in again to continue."}
        </p>
        {canVerify && (
          <>
            <label htmlFor="fk-unlock-pin">FamilyKit PIN</label>
            <input
              id="fk-unlock-pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              autoFocus
              disabled={checking}
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
            />
            {error && <p role="alert">{error}</p>}
            <button type="submit" disabled={checking || pin.length !== 4}>
              {checking ? "Checking PIN…" : "Unlock"}
            </button>
          </>
        )}
        {!canVerify && <button type="button" onClick={signInAgain}>Sign in again</button>}
      </form>
    </dialog>
  );
}
