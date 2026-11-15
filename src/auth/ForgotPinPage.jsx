
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  requestPinReset,
  verifyPinResetOtp,
  resetFamilyKitPin,
} from "./authService";

import "./ForgotPinPage.css";

const RESEND_SECONDS = 60;

export default function ForgotPinPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;

    const timer = window.setInterval(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendSeconds > 0]);

  const cleanEmail = email.trim().toLowerCase();

  const clearFeedback = () => {
    setError("");
    setMessage("");
  };

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    clearFeedback();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      await requestPinReset(cleanEmail);

      setOtp("");
      setResetToken("");
      setNewPin("");
      setConfirmPin("");
      setResendSeconds(RESEND_SECONDS);

      setStep(2);
      setMessage(
        "If this email has a FamilyKit account, a verification code will be sent."
      );
    } catch (err) {
      setError(
        err?.message || "Unable to send verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (loading || resendSeconds > 0) return;

    clearFeedback();

    try {
      setLoading(true);

      await requestPinReset(cleanEmail);

      setOtp("");
      setResetToken("");
      setResendSeconds(RESEND_SECONDS);

      setMessage(
        "If this email has a FamilyKit account, a new verification code will be sent."
      );
    } catch (err) {
      setError(
        err?.message || "Unable to resend verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    clearFeedback();

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    try {
      setLoading(true);

      const result = await verifyPinResetOtp(
        cleanEmail,
        otp
      );

      setResetToken(result.resetToken);
      setOtp("");
      setStep(3);
    } catch (err) {
      setError(
        err?.message ||
          "Verification failed. Please check your code."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async (event) => {
    event.preventDefault();
    clearFeedback();

    if (!/^\d{4}$/.test(newPin)) {
      setError("Your new PIN must contain exactly 4 digits.");
      return;
    }

    if (newPin !== confirmPin) {
      setError("New PIN and Confirm PIN do not match.");
      return;
    }

    if (!resetToken) {
      setError("Verification expired. Please request a new OTP.");
      return;
    }

    try {
      setLoading(true);

      await resetFamilyKitPin(
        cleanEmail,
        newPin,
        confirmPin,
        resetToken
      );

      setNewPin("");
      setConfirmPin("");
      setResetToken("");
      setOtp("");
      setStep(4);
    } catch (err) {
      setError(
        err?.message || "Unable to reset your PIN."
      );
    } finally {
      setLoading(false);
    }
  };

  const restartRecovery = () => {
    clearFeedback();
    setStep(1);
    setOtp("");
    setResetToken("");
    setNewPin("");
    setConfirmPin("");
  };

  const steps = [
    { number: 1, label: "Email" },
    { number: 2, label: "Verify" },
    { number: 3, label: "New PIN" },
  ];

  return (
    <main className="forgot-pin-page">
      <section className="forgot-pin-visual">
        <div className="forgot-pin-visual-inner">
          <div className="forgot-pin-visual-brand">
            <span className="forgot-pin-brand-symbol">F</span>
            FamilyKit
          </div>

          <div className="forgot-pin-visual-art">
            <div className="forgot-pin-orbit forgot-pin-orbit-one" />
            <div className="forgot-pin-orbit forgot-pin-orbit-two" />

            <div className="forgot-pin-visual-lock">
              <svg
                viewBox="0 0 80 80"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="17"
                  y="34"
                  width="46"
                  height="35"
                  rx="9"
                  fill="white"
                />
                <path
                  d="M27 34V24a13 13 0 0 1 26 0v10"
                  stroke="white"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <circle cx="40" cy="50" r="5" fill="#2D0B84" />
                <path
                  d="M40 54v6"
                  stroke="#2D0B84"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="forgot-pin-floating-card forgot-pin-floating-card-one">
              <span>✓</span> Identity verified
            </div>

            <div className="forgot-pin-floating-card forgot-pin-floating-card-two">
              <span>✦</span> Protected access
            </div>
          </div>

          <h2>Your family information, protected.</h2>
          <p>
            Securely recover access to your FamilyKit
            account in a few simple steps.
          </p>
        </div>
      </section>

      <section className="forgot-pin-content">
        <div className="forgot-pin-shell">
          <header className="forgot-pin-header">
            <button
              type="button"
              className="forgot-pin-back"
              onClick={() => navigate("/login")}
              aria-label="Back to login"
            >
              <span aria-hidden="true">←</span>
            </button>

            <span className="forgot-pin-mobile-brand">
              FamilyKit
            </span>
          </header>

          <div className="forgot-pin-form-container">
            {step !== 4 && (
              <div className="forgot-pin-progress">
                {steps.map((item, index) => (
                  <div
                    key={item.number}
                    className={
                      "forgot-pin-progress-item" +
                      (step === item.number ? " is-active" : "") +
                      (step > item.number ? " is-complete" : "")
                    }
                  >
                    <div className="forgot-pin-progress-circle">
                      {step > item.number ? "✓" : item.number}
                    </div>
                    <span>{item.label}</span>

                    {index < steps.length - 1 && (
                      <div className="forgot-pin-progress-line" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {step === 1 && (
              <>
                <div className="forgot-pin-icon-wrap">
                  <span aria-hidden="true">✉</span>
                </div>

                <h1>Forgot your PIN?</h1>
                <p className="forgot-pin-description">
                  Enter your registered email address.
                  We'll send you a verification code to
                  reset your FamilyKit PIN.
                </p>

                <form onSubmit={handleRequestOtp}>
                  <div className="forgot-pin-field">
                    <label htmlFor="forgot-pin-email">
                      Email address
                    </label>

                    <input
                      id="forgot-pin-email"
                      type="email"
                      placeholder="Enter your email address"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        clearFeedback();
                      }}
                      disabled={loading}
                      required
                    />
                  </div>

                  {error && (
                    <div className="forgot-pin-error" role="alert">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="forgot-pin-primary"
                    disabled={loading}
                  >
                    {loading ? "Sending code..." : "Send verification code"}
                  </button>
                </form>
              </>
            )}

            {step === 2 && (
              <>
                <div className="forgot-pin-icon-wrap">
                  <span aria-hidden="true">✉</span>
                </div>

                <h1>Verify your email</h1>
                <p className="forgot-pin-description">
                  Enter the 6-digit code sent to
                  <strong> {cleanEmail}</strong>
                </p>

                <form onSubmit={handleVerifyOtp}>
                  <div className="forgot-pin-field">
                    <label htmlFor="forgot-pin-otp">
                      Verification code
                    </label>

                    <input
                      id="forgot-pin-otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      value={otp}
                      onChange={(event) => {
                        setOtp(
                          event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6)
                        );
                        clearFeedback();
                      }}
                      disabled={loading}
                      required
                    />
                  </div>

                  {message && (
                    <div className="forgot-pin-message" role="status">
                      {message}
                    </div>
                  )}

                  {error && (
                    <div className="forgot-pin-error" role="alert">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="forgot-pin-primary"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? "Verifying..." : "Verify code"}
                  </button>

                  <div className="forgot-pin-resend">
                    Didn't receive the code?{" "}
                    <button
                      type="button"
                      disabled={loading || resendSeconds > 0}
                      onClick={handleResendOtp}
                    >
                      {resendSeconds > 0
                        ? `Resend in ${resendSeconds}s`
                        : "Resend code"}
                    </button>
                  </div>

                  <button
                    type="button"
                    className="forgot-pin-text-button"
                    onClick={restartRecovery}
                    disabled={loading}
                  >
                    Change email address
                  </button>
                </form>
              </>
            )}

            {step === 3 && (
              <>
                <div className="forgot-pin-icon-wrap">
                  <span aria-hidden="true">♢</span>
                </div>

                <h1>Create a new PIN</h1>
                <p className="forgot-pin-description">
                  Choose a new 4-digit PIN to secure your
                  FamilyKit account.
                </p>

                <form onSubmit={handleResetPin}>
                  <div className="forgot-pin-field">
                    <label htmlFor="forgot-pin-new">
                      New PIN
                    </label>

                    <input
                      id="forgot-pin-new"
                      type={showPin ? "text" : "password"}
                      inputMode="numeric"
                      autoComplete="new-password"
                      maxLength={4}
                      placeholder="Enter 4-digit PIN"
                      value={newPin}
                      onChange={(event) => {
                        setNewPin(
                          event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 4)
                        );
                        clearFeedback();
                      }}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="forgot-pin-field">
                    <label htmlFor="forgot-pin-confirm">
                      Confirm new PIN
                    </label>

                    <input
                      id="forgot-pin-confirm"
                      type={showPin ? "text" : "password"}
                      inputMode="numeric"
                      autoComplete="new-password"
                      maxLength={4}
                      placeholder="Confirm 4-digit PIN"
                      value={confirmPin}
                      onChange={(event) => {
                        setConfirmPin(
                          event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 4)
                        );
                        clearFeedback();
                      }}
                      disabled={loading}
                      required
                    />
                  </div>

                  <label className="forgot-pin-show">
                    <input
                      type="checkbox"
                      checked={showPin}
                      onChange={(event) =>
                        setShowPin(event.target.checked)
                      }
                    />
                    Show PIN
                  </label>

                  {error && (
                    <div className="forgot-pin-error" role="alert">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="forgot-pin-primary"
                    disabled={loading}
                  >
                    {loading ? "Resetting PIN..." : "Reset PIN"}
                  </button>
                </form>
              </>
            )}

            {step === 4 && (
              <div className="forgot-pin-success">
                <div className="forgot-pin-success-icon">
                  ✓
                </div>

                <h1>PIN reset successful!</h1>
                <p className="forgot-pin-description">
                  Your FamilyKit PIN has been updated.
                  You can now log in using your new PIN.
                </p>

                <button
                  type="button"
                  className="forgot-pin-primary"
                  onClick={() =>
                    navigate("/login", { replace: true })
                  }
                >
                  Back to login
                </button>
              </div>
            )}

            {step !== 4 && (
              <div className="forgot-pin-bottom">
                Remember your PIN?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                >
                  Log in
                </button>
              </div>
            )}
          </div>

          <footer className="forgot-pin-footer">
            Your family, organised in one place.
          </footer>
        </div>
      </section>
    </main>
  );
}
