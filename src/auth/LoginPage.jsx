import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithFamilyKitPin } from "./authService";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
      navigate("/my-family");
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
