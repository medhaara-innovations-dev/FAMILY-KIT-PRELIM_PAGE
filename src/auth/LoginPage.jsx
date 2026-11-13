import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  loginWithFamilyKitPin,
} from "./authService";

import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const storeAuthenticationTokens = (result) => {
    if (!result?.accessToken) {
      throw new Error(
        "Authentication completed without an access token."
      );
    }

    sessionStorage.setItem(
      "familykit_access_token",
      result.accessToken
    );

    if (result.idToken) {
      sessionStorage.setItem(
        "familykit_id_token",
        result.idToken
      );
    }

    if (result.refreshToken) {
      sessionStorage.setItem(
        "familykit_refresh_token",
        result.refreshToken
      );
    }
  };

  // =====================================================
  // PIN INPUT
  // =====================================================

  const handlePinChange = (index, value) => {
    const digit = value
      .replace(/\D/g, "")
      .slice(-1);

    const digits = pin.split("");

    while (digits.length < 4) {
      digits.push("");
    }

    digits[index] = digit;
    const newPin = digits.join("");

    setPin(newPin);
    setError("");

    if (digit && index < 3) {
      document
        .getElementById(
          `login-pin-${index + 1}`
        )
        ?.focus();
    }
  };

  // =====================================================
  // FAMILYKIT PIN LOGIN
  // =====================================================

  const handleLogin = async () => {
    setError("");

    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setError(
        "Please enter your 4-digit FamilyKit PIN."
      );
      return;
    }

    try {
      setLoading(true);

      const result =
        await loginWithFamilyKitPin(
          cleanEmail,
          pin
        );

      storeAuthenticationTokens(result);

      console.log(
        "FamilyKit login successful."
      );

      navigate("/my-family");
    } catch (err) {
      console.error("Login error:", err);

      if (
        err?.name === "UserNotFoundException" ||
        err?.name === "NotAuthorizedException"
      ) {
        setError(
          "Incorrect email address or FamilyKit PIN."
        );
        return;
      }

      if (
        err?.name ===
        "UserNotConfirmedException"
      ) {
        setError(
          "Please verify your email address before logging in."
        );
        return;
      }

      setError(
        err?.message ||
          "Unable to log in. Please check your email and PIN."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Welcome back</h1>

        <p className="login-subtitle">
          Log in to your FamilyKit.
        </p>

        <div className="login-field">
          <label htmlFor="login-email">
            Email address
          </label>

          <input
            id="login-email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            autoComplete="email"
            disabled={loading}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
          />
        </div>

        <div className="login-field">
          <label>FamilyKit PIN</label>

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
                disabled={loading}
                value={pin[index] || ""}
                onChange={(event) =>
                  handlePinChange(
                    index,
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Backspace" &&
                    !pin[index] &&
                    index > 0
                  ) {
                    document
                      .getElementById(
                        `login-pin-${index - 1}`
                      )
                      ?.focus();
                  }

                  if (
                    event.key === "Enter" &&
                    pin.length === 4
                  ) {
                    handleLogin();
                  }
                }}
              />
            ))}
          </div>

          <label className="login-show-pin">
            <input
              type="checkbox"
              checked={showPin}
              disabled={loading}
              onChange={(event) =>
                setShowPin(event.target.checked)
              }
            />

            <span>Show PIN</span>
          </label>
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <button
          type="button"
          className="login-button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <button
          type="button"
          className="login-link-button"
          disabled={loading}
          onClick={() => {
            alert(
              "Forgot PIN functionality will be added later."
            );
          }}
        >
          Forgot your PIN?
        </button>

        <p className="login-signup-text">
          Don't have an account?{" "}

          <button
            type="button"
            className="login-link-button inline"
            disabled={loading}
            onClick={() => navigate("/signup")}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}