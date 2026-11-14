import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import { loginWithFamilyKitPin, getFamilyKitProfile } from "./authService";

import "./LoginPage.css";

export default function LoginPage() {

  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [pin, setPin] = useState("");

  const [showPin, setShowPin] = useState(false);

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const [mobileStage, setMobileStage] = useState("login");

  const [profileName, setProfileName] = useState("");

  const [verifiedEmail, setVerifiedEmail] = useState("");

  useEffect(() => {

    if (mobileStage === "syncing") {

      const successTimer = window.setTimeout(() => {

        setMobileStage("synced");

      }, 1100);

      return () => window.clearTimeout(successTimer);

    }

    if (mobileStage === "synced") {

      const redirectTimer = window.setTimeout(() => {

        navigate("/my-family", { replace: true });

      }, 1200);

      return () => window.clearTimeout(redirectTimer);

    }

    return undefined;

  }, [mobileStage, navigate]);

  const getProfileName = (result, cleanEmail) => {

    const directName = result?.yourName || result?.profile?.yourName || result?.name || result?.profile?.name;

    if (typeof directName === "string" && directName.trim()) return directName.trim();

    try {

      const jwt = result?.idToken;

      if (jwt) {

        const part = jwt.split(".")[1];

        const normalized = part.replace(/-/g, "+").replace(/_/g, "/");

        const payload = JSON.parse(atob(normalized));

        if (typeof payload.name === "string" && payload.name.trim()) return payload.name.trim();

        if (typeof payload.given_name === "string" && payload.given_name.trim()) return payload.given_name.trim();

      }

    } catch { /* Name is optional in the ID token. */ }

    try { return JSON.parse(localStorage.getItem(`familykit_profile_${cleanEmail}`) || "null")?.yourName || ""; }

    catch { return ""; }

  };

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const ready = validEmail && /^\d{4}$/.test(pin);

  const storeAuthenticationTokens = (result) => {

    if (!result?.accessToken) {

      throw new Error("Authentication completed without an access token.");

    }

    sessionStorage.setItem("familykit_access_token", result.accessToken);

    if (result.idToken) sessionStorage.setItem("familykit_id_token", result.idToken);

    if (result.refreshToken) sessionStorage.setItem("familykit_refresh_token", result.refreshToken);

  };

  // Preserve the original four-digit input behavior.

  const handlePinChange = (index, value) => {

    const digit = value.replace(/\D/g, "").slice(-1);

    const digits = pin.split("");

    while (digits.length < 4) digits.push("");

    digits[index] = digit;

    setPin(digits.join(""));

    setError("");

    if (digit && index < 3) document.getElementById(`login-pin-${index + 1}`)?.focus();

  };

  // Mobile keypad updates the SAME PIN state used by the backend.

  const handleKeypad = (key) => {

    if (loading) return;

    setError("");

    if (key === "Clear") {

      setPin("");

    } else if (key === "Delete") {

      setPin((current) => current.slice(0, -1));

    } else if (/^\d$/.test(key)) {

      setPin((current) => (current.length < 4 ? current + key : current));

    }

  };

  const handleLogin = async () => {

    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {

      setError("Please enter your email address.");

      return;

    }

    if (!/^\d{4}$/.test(pin)) {

      setError("Please enter your 4-digit FamilyKit PIN.");

      return;

    }

    try {

      setLoading(true);

      const result = await loginWithFamilyKitPin(cleanEmail, pin);

      storeAuthenticationTokens(result);

      console.log("FamilyKit login successful.");

    // Prefer the name saved in DynamoDB, but never block login if the
    // profile endpoint is unavailable or this older account has no name.
    let savedName = getProfileName(result, cleanEmail);
    try {
      const profile = await getFamilyKitProfile(result.accessToken);
      if (typeof profile?.yourName === "string" && profile.yourName.trim()) {
        savedName = profile.yourName.trim();
      }
    } catch (profileError) {
      console.warn("Unable to retrieve FamilyKit profile:", profileError);
    }

    if (window.matchMedia("(max-width: 768px)").matches) {
      setVerifiedEmail(cleanEmail);
      setProfileName(savedName);
      setMobileStage("account");
    } else {
      navigate("/my-family");
    }

    } catch (err) {

      console.error("Login error:", err);

      if (err?.name === "UserNotFoundException" || err?.name === "NotAuthorizedException") {

        setError("Incorrect email address or FamilyKit PIN.");

        return;

      }

      if (err?.name === "UserNotConfirmedException") {

        setError("Please verify your email address before logging in.");

        return;

      }

      setError(err?.message || "Unable to log in. Please check your email and PIN.");

    } finally {

      setLoading(false);

    }

  };

  if (mobileStage !== "login") {

    const syncing = mobileStage === "syncing";

    const synced = mobileStage === "synced";

    return (

      <div className="login-account-page">

        <div className="login-account-shell">

          <div className="login-account-brand">FamilyKit</div>

          {synced ? (

            <div className="login-account-success" aria-hidden="true">✓</div>

          ) : null}

          <h1>{syncing ? "Getting things ready" : synced ? "Profile synced" : "Welcome back"}</h1>

          <p className="login-account-subtitle">

            {syncing ? "We're syncing your latest information." : synced ? "Continue with your saved account." : "Continue with your saved account."}

          </p>

          <div className="login-account-profile">

            <div className="login-account-avatar" aria-hidden="true">

              <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7.5" r="4"/><path d="M4.5 21c0-4.2 3.2-7 7.5-7s7.5 2.8 7.5 7"/></svg>

            </div>

            <strong>{profileName || "Your account"}</strong>

            <span className="login-account-email">{verifiedEmail}</span>

            <small>{syncing ? "Previously signed in on this device" : synced ? "Welcome back!" : "Previously signed in on this device"}</small>

            {!synced && (

              <div className="login-account-sync-info">

                <svg className={syncing ? "login-account-spinning" : ""} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.8 9a7 7 0 0 1 12-2L20 12M4 12l2.2 5a7 7 0 0 0 12-2"/></svg>

                <p>{syncing ? "Keep FamilyKit open while your account syncs." : "Sync your latest documents, family details and reminders."}</p>

              </div>

            )}

          </div>

          {mobileStage === "account" && (

            <div className="login-account-actions">

              <button type="button" className="login-account-primary" onClick={() => setMobileStage("syncing")}>Continue</button>

              <button type="button" className="login-account-secondary" onClick={() => {

                sessionStorage.removeItem("familykit_access_token");

                sessionStorage.removeItem("familykit_id_token");

                sessionStorage.removeItem("familykit_refresh_token");

                setPin(""); setEmail(""); setProfileName(""); setVerifiedEmail(""); setMobileStage("login");

              }}>Use Another Account</button>

            </div>

          )}

          {syncing && <div className="login-account-sync-button" role="status">Syncing...</div>}

          <p className="login-account-footer">Your family, organised in one place.</p>

        </div>

      </div>

    );

  }

  return (

    <div className="login-page">

      <div className="login-card">

        <header className="login-mobile-header">

          <button type="button" className="login-mobile-back" onClick={() => navigate(-1)} aria-label="Go back">‹</button>

          <span>FamilyKit</span>

        </header>

        <div className="login-mobile-icon" aria-hidden="true">

          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">

            <rect x="5" y="10" width="14" height="11" rx="2" />

            <path d="M8 10V7a4 4 0 0 1 8 0v3" />

            <circle cx="12" cy="15" r="1" />

          </svg>

        </div>

        <h1>Welcome back</h1>

        <p className="login-subtitle">Log in to your FamilyKit.</p>

        <div className="login-field">

          <label htmlFor="login-email">Email address</label>

          <input

            id="login-email"

            type="email"

            placeholder="Enter your email address"

            value={email}

            autoComplete="email"

            disabled={loading}

            onChange={(event) => { setEmail(event.target.value); setError(""); }}

          />

        </div>

        <div className="login-field login-pin-field">

          <div className="login-pin-label-row">

            <label>FamilyKit PIN</label>

            <label className="login-show-pin login-show-pin--mobile">

              <input type="checkbox" checked={showPin} disabled={loading} onChange={(event) => setShowPin(event.target.checked)} />

              <span>Show PIN</span>

            </label>

          </div>

          <div className="login-pin-boxes">

            {[0, 1, 2, 3].map((index) => (

              <input

                key={index}

                id={`login-pin-${index}`}

                className="login-pin-box"

                type={showPin ? "text" : "password"}

                inputMode="numeric"

                maxLength={1}

                autoComplete="off"

                aria-label={`PIN digit ${index + 1}`}

                disabled={loading}

                value={pin[index] || ""}

                onChange={(event) => handlePinChange(index, event.target.value)}

                onKeyDown={(event) => {

                  if (event.key === "Backspace" && !pin[index] && index > 0) {

                    document.getElementById(`login-pin-${index - 1}`)?.focus();

                  }

                  if (event.key === "Enter" && pin.length === 4) handleLogin();

                }}

              />

            ))}

          </div>

          <label className="login-show-pin login-show-pin--desktop">

            <input type="checkbox" checked={showPin} disabled={loading} onChange={(event) => setShowPin(event.target.checked)} />

            <span>Show PIN</span>

          </label>

          <p className="login-mobile-pin-hint">Enter your 4-digit PIN to unlock FamilyKit.</p>

        </div>

        {error && <div className="login-error" role="alert">{error}</div>}

        <div className="login-mobile-keypad" role="group" aria-label="PIN keypad">

          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "Clear", "0", "Delete"].map((key) => (

            <button key={key} type="button" onClick={() => handleKeypad(key)} disabled={loading} className={key.length > 1 ? "login-keypad-action" : ""}>

              {key}

            </button>

          ))}

        </div>

        <button

          type="button"

          className="login-button"

          data-ready={ready}

          onClick={() => {

            if (window.matchMedia("(max-width: 768px)").matches && !ready) return;

            handleLogin();

          }}

          disabled={loading}

          aria-disabled={!ready || loading}

        >

          {loading ? "Logging in..." : "Login"}

        </button>

        <button

          type="button"

          className="login-link-button"

          disabled={loading}

          onClick={() => alert("Forgot PIN functionality will be added later.")}

        >

          Forgot your PIN?

        </button>

        <p className="login-signup-text">

          Don't have an account?{" "}

          <button type="button" className="login-link-button inline" disabled={loading} onClick={() => navigate("/signup")}>

            Sign up

          </button>

        </p>

      </div>

    </div>

  );

}
