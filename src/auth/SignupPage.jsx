import { useEffect, useRef, useState } from "react";

import {
  signUpWithEmail,
  confirmEmail,
  resendVerificationCode,
  completeSignupAuthentication,
  storeFamilyKitPin,
  startGoogleLogin,
  completeGoogleLogin,
  getRegistrationStatus,
} from "./authService";

import "./SignupPage.css";

export default function SignupPage() {
  const googleCallbackStarted = useRef(false);

  // =====================================================
  // STATE
  // =====================================================

  const [step, setStep] = useState(1);

  // Screen 1 + 2
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] =
    useState("");

  // Cognito authentication
  const [signUpSession, setSignUpSession] =
    useState(null);

  const [accessToken, setAccessToken] =
    useState(null);

  // Screen 3
  const [familyName, setFamilyName] =
    useState("");

  const [yourName, setYourName] =
    useState("");

  const [gender, setGender] =
    useState("");

  // Screen 5 + 6 - FamilyKit PIN
  const [pin, setPin] =
    useState("");

  const [confirmPin, setConfirmPin] =
    useState("");

  const [showPin, setShowPin] =
    useState(false);

  const [
    showConfirmPin,
    setShowConfirmPin,
  ] = useState(false);

  // Common
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // =====================================================
  // GOOGLE SIGNUP
  //
  // FIRST-TIME GOOGLE USER:
  //
  // Google
  //   ↓
  // Cognito authentication
  //   ↓
  // GET /registration-status
  //   ↓
  // registrationComplete = false
  //   ↓
  // Family Details
  //
  //
  // EXISTING FAMILYKIT GOOGLE USER:
  //
  // Google
  //   ↓
  // Cognito authentication
  //   ↓
  // GET /registration-status
  //   ↓
  // registrationComplete = true
  //   ↓
  // /login
  // =====================================================

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const hasGoogleCallback =
      params.has("code") ||
      params.has("error");

    if (
      !hasGoogleCallback ||
      googleCallbackStarted.current
    ) {
      return;
    }

    googleCallbackStarted.current =
      true;

    const finishGoogleSignup =
      async () => {
        try {
          setError("");
          setLoading(true);

          // ---------------------------------------------
          // Complete Cognito / Google OAuth.
          // ---------------------------------------------

          const result =
            await completeGoogleLogin(
              "/signup"
            );

          if (!result?.accessToken) {
            throw new Error(
              "Cognito did not return an access token."
            );
          }

          // ---------------------------------------------
          // IMPORTANT:
          // Check whether this authenticated Cognito
          // user's sub already has a FamilyKit PIN.
          // ---------------------------------------------

          const registrationStatus =
            await getRegistrationStatus(
              result.accessToken
            );

          // ---------------------------------------------
          // Remove OAuth code/state from browser URL.
          // ---------------------------------------------

          window.history.replaceState(
            {},
            document.title,
            "/signup"
          );

          // ---------------------------------------------
          // EXISTING FAMILYKIT USER
          //
          // PIN already exists in DynamoDB.
          //
          // Do NOT ask:
          // - Family Name
          // - Your Name
          // - Gender
          // - Review
          // - Create PIN
          //
          // Send directly to normal FamilyKit login.
          // ---------------------------------------------

          if (
            registrationStatus
              .registrationComplete
          ) {
            window.location.replace(
              "/login"
            );

            return;
          }

          // ---------------------------------------------
          // FIRST-TIME GOOGLE USER
          //
          // Registration is not complete yet.
          // Keep the Google Cognito access token so
          // POST /pin can later securely create the PIN.
          // ---------------------------------------------

          setAccessToken(
            result.accessToken
          );

          if (result.email) {
            setEmail(
              result.email
            );
          }

          // Google may already know the user's name.
          // Pre-fill it, but the user can edit it.
          if (result.name) {
            setYourName(
              result.name
            );
          }

          // Continue with Family Details.
          setStep(3);
        } catch (err) {
          console.error(
            "Google signup error:",
            err
          );

          setError(
            err?.message ||
              "Unable to sign up with Google."
          );

          window.history.replaceState(
            {},
            document.title,
            "/signup"
          );
        } finally {
          setLoading(false);
        }
      };

    finishGoogleSignup();
  }, []);

  const handleGoogleSignup =
    async () => {
      try {
        setError("");
        setLoading(true);

        await startGoogleLogin(
          "/signup"
        );
      } catch (err) {
        console.error(
          "Google signup start error:",
          err
        );

        setError(
          err?.message ||
            "Unable to start Google sign-up."
        );

        setLoading(false);
      }
    };


  // =====================================================
  // SCREEN 1
  // EMAIL SIGNUP
  // =====================================================

  const handleEmailContinue =
    async () => {
      setError("");

      const cleanEmail =
        email.trim().toLowerCase();

      if (!cleanEmail) {
        setError(
          "Please enter your email address."
        );

        return;
      }

      try {
        setLoading(true);

        const signupResult =
          await signUpWithEmail(
            cleanEmail
          );

        setEmail(cleanEmail);

        // Save Cognito signup session.
        setSignUpSession(
          signupResult.session ||
            null
        );

        // Go to 6-digit OTP verification.
        setStep(2);
      } catch (err) {
        console.error(
          "Signup error:",
          err
        );

        if (
          err?.name ===
          "UsernameExistsException"
        ) {
          setError(
            "An account already exists with this email address."
          );
        } else {
          setError(
            err?.message ||
              "Unable to create your account. Please try again."
          );
        }
      } finally {
        setLoading(false);
      }
    };


  // =====================================================
  // SCREEN 2
  // VERIFY 6-DIGIT EMAIL OTP
  // =====================================================

  const handleVerifyEmail =
    async () => {
      setError("");

      if (
        !/^\d{6}$/.test(
          verificationCode
        )
      ) {
        setError(
          "Please enter the 6-digit verification code."
        );

        return;
      }

      try {
        setLoading(true);

        // Confirm the email OTP.
        const confirmationResult =
          await confirmEmail(
            email,
            verificationCode,
            signUpSession
          );

        if (
          !confirmationResult.session
        ) {
          throw new Error(
            "Cognito did not return a confirmation session."
          );
        }

        // Automatically authenticate the newly
        // confirmed Cognito user.
        const authResult =
          await completeSignupAuthentication(
            email,
            confirmationResult.session
          );

        if (
          !authResult.accessToken
        ) {
          throw new Error(
            "Cognito did not return an access token."
          );
        }

        // Keep access token in React memory.
        // This authorizes POST /pin.
        setAccessToken(
          authResult.accessToken
        );

        // Email verified + authenticated.
        setStep(3);
      } catch (err) {
        console.error(
          "Verification/authentication error:",
          err
        );

        if (
          err?.name ===
          "CodeMismatchException"
        ) {
          setError(
            "The verification code is incorrect."
          );
        } else if (
          err?.name ===
          "ExpiredCodeException"
        ) {
          setError(
            "The verification code has expired. Please request a new code."
          );
        } else {
          setError(
            err?.message ||
              "Unable to verify your email. Please try again."
          );
        }
      } finally {
        setLoading(false);
      }
    };


  // =====================================================
  // RESEND EMAIL OTP
  // =====================================================

  const handleResendCode =
    async () => {
      setError("");

      try {
        setLoading(true);

        await resendVerificationCode(
          email
        );

        alert(
          "A new verification code has been sent to your email."
        );
      } catch (err) {
        console.error(
          "Resend error:",
          err
        );

        setError(
          err?.message ||
            "Unable to resend the verification code."
        );
      } finally {
        setLoading(false);
      }
    };


  // =====================================================
  // SCREEN 3
  // FAMILY DETAILS
  // =====================================================

  const handleFamilyDetailsContinue =
    () => {
      setError("");

      const cleanFamilyName =
        familyName.trim();

      const cleanYourName =
        yourName.trim();

      if (!cleanFamilyName) {
        setError(
          "Please enter your family name."
        );

        return;
      }

      if (!cleanYourName) {
        setError(
          "Please enter your name."
        );

        return;
      }

      setFamilyName(
        cleanFamilyName
      );

      setYourName(
        cleanYourName
      );

      setStep(4);
    };


  // =====================================================
  // SCREEN 5
  // CREATE PIN
  // =====================================================

  const handleCreatePinContinue =
    () => {
      setError("");

      if (
        !/^\d{4}$/.test(pin)
      ) {
        setError(
          "Please enter a 4-digit PIN."
        );

        return;
      }

      setConfirmPin("");

      setShowConfirmPin(false);

      setStep(6);
    };


  // =====================================================
  // SCREEN 6
  // CONFIRM PIN + STORE IN DYNAMODB
  // =====================================================

  const handleConfirmPin =
    async () => {
      setError("");

      if (
        !/^\d{4}$/.test(
          confirmPin
        )
      ) {
        setError(
          "Please enter your 4-digit PIN again."
        );

        return;
      }

      if (
        pin !== confirmPin
      ) {
        setError(
          "PINs do not match. Please try again."
        );

        return;
      }

      if (!accessToken) {
        setError(
          "Your authentication session has expired. Please restart registration."
        );

        return;
      }

      try {
        setLoading(true);

        // =================================================
        // REAL BACKEND PIN STORAGE
        // =================================================
        //
        // Authorization:
        // Bearer <Cognito Access Token>
        //
        // Body:
        // {
        //   "pin": "1234"
        // }
        //
        // React does NOT send userId.
        //
        // API Gateway validates JWT.
        //
        // Lambda gets Cognito sub.
        //
        // PIN is PBKDF2 hashed and salted.
        // =================================================

        await storeFamilyKitPin(
          accessToken,
          pin
        );

        // Registration success is shown only
        // after backend confirms PIN storage.
        setStep(7);
      } catch (err) {
        console.error(
          "PIN registration error:",
          err
        );

        setError(
          err?.message ||
            "Unable to save your PIN. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };


  // =====================================================
  // HELPER
  // CREATE PIN INPUT
  // =====================================================

  const handleCreatePinChange = (
    index,
    value
  ) => {
    const digit =
      value
        .replace(/\D/g, "")
        .slice(-1);

    const digits =
      pin.split("");

    while (
      digits.length < 4
    ) {
      digits.push("");
    }

    digits[index] =
      digit;

    setPin(
      digits.join("")
    );

    if (
      digit &&
      index < 3
    ) {
      document
        .getElementById(
          `create-pin-${index + 1}`
        )
        ?.focus();
    }
  };


  // =====================================================
  // HELPER
  // CONFIRM PIN INPUT
  // =====================================================

  const handleConfirmPinChange = (
    index,
    value
  ) => {
    const digit =
      value
        .replace(/\D/g, "")
        .slice(-1);

    const digits =
      confirmPin.split("");

    while (
      digits.length < 4
    ) {
      digits.push("");
    }

    digits[index] =
      digit;

    setConfirmPin(
      digits.join("")
    );

    if (
      digit &&
      index < 3
    ) {
      document
        .getElementById(
          `confirm-pin-${index + 1}`
        )
        ?.focus();
    }
  };


  // =====================================================
  // SCREEN 1
  // EMAIL
  // =====================================================

  if (step === 1) {
    return (
      <div className="signup-page signup-page--welcome">
        <div className="signup-welcome-layout">
          <section className="signup-illustration-panel" aria-label="FamilyKit family illustration">
            <div className="signup-illustration-curve" />
            <div className="signup-illustration-content">
              <div className="signup-family-art">
                <img className="signup-family-photo" src={new URL("../assets/images/Smiling Family with Purple Tablet.png", import.meta.url).href} alt="Family using FamilyKit together" />
                <img className="signup-float-icon signup-float-icon--health" src={new URL("../assets/images/health.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--vector" src={new URL("../assets/images/Vector.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--bills" src={new URL("../assets/images/Household & Bills.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--extra" src={new URL("../assets/images/4db75485-c10a-4574-b017-11775affeb6e.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--insurance" src={new URL("../assets/images/Insurance.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--file" src={new URL("../assets/images/File.png", import.meta.url).href} alt="" />
                <span className="signup-float-icon signup-float-icon--bell" aria-hidden="true">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#F2994A" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                    <path d="M10 21h4" />
                  </svg>
                </span>
              </div>
              <p className="signup-illustration-caption">Everything your family needs, in one place</p>
            </div>
          </section>

          <section className="signup-welcome-panel">
            <div className="signup-card signup-welcome-card">
              <div className="signup-brand-mark" aria-hidden="true">
                <img
                  className="signup-brand-image"
                  src={new URL("../assets/images/WhatsApp Image 2026-10-19 at 21.39.33 1.png", import.meta.url).href}
                  alt=""
                />
              </div>
              <h1>Welcome to FamilyKit</h1>
              <p className="signup-welcome-subtitle">Log in or sign up with your email address.</p>

              <label className="signup-welcome-label" htmlFor="signup-email">Email address</label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(event) => { setEmail(event.target.value); setError(""); }}
                onKeyDown={(event) => { if (event.key === "Enter" && !loading) handleEmailContinue(); }}
              />
              <p className="verification-note">We'll send a verification code to your email.</p>
              {error && <div className="signup-error" role="alert">{error}</div>}
              <button type="button" className="signup-primary-continue" onClick={handleEmailContinue} disabled={loading}>
                {loading ? "Please wait..." : "Continue"}
              </button>
              <div className="signup-divider" aria-hidden="true"><span>or</span></div>
              <button type="button" className="signup-google-button" onClick={handleGoogleSignup} disabled={loading}>
                <svg className="signup-google-icon" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.28 5.48-4.81 7.18l7.73 6C44.36 38.03 46.98 31.88 46.98 24.55z" />
                  <path fill="#FBBC05" d="M10.53 28.59A14.41 14.41 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.86 23.86 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.92-2.13 15.89-5.8l-7.73-6C30.01 37.64 27.26 38.5 24 38.5c-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }


  // =====================================================
  // SCREEN 2
  // 6-DIGIT EMAIL OTP
  // =====================================================

  if (step === 2) {
    return (
      <div className="signup-page signup-page--otp">
        <div className="signup-welcome-layout">
          <section className="signup-illustration-panel" aria-label="FamilyKit family illustration">
            <div className="signup-illustration-curve" />
            <div className="signup-illustration-content">
              <div className="signup-family-art">
                <img className="signup-family-photo" src={new URL("../assets/images/Smiling Family with Purple Tablet.png", import.meta.url).href} alt="Family using FamilyKit together" />
                <img className="signup-float-icon signup-float-icon--health" src={new URL("../assets/images/health.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--vector" src={new URL("../assets/images/Vector.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--bills" src={new URL("../assets/images/Household & Bills.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--extra" src={new URL("../assets/images/4db75485-c10a-4574-b017-11775affeb6e.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--insurance" src={new URL("../assets/images/Insurance.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--file" src={new URL("../assets/images/File.png", import.meta.url).href} alt="" />
                <span className="signup-float-icon signup-float-icon--bell" aria-hidden="true">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#F2994A" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                    <path d="M10 21h4" />
                  </svg>
                </span>
              </div>
              <p className="signup-illustration-caption">Everything your family needs, in one place</p>
            </div>
          </section>

          <section className="signup-welcome-panel">
            <div className="signup-card signup-otp-card">
              <h1>Enter your Verification code</h1>
              <p className="signup-otp-subtitle">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
              <label className="signup-otp-label" htmlFor="verification-code-0">
                Verification code
              </label>
              <div className="signup-otp-boxes" role="group" aria-label="6-digit verification code">
                {Array.from({ length: 6 }, (_, index) => (
                  <input
                    key={index}
                    id={`verification-code-${index}`}
                    className="signup-otp-digit"
                    type="text"
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    aria-label={`Digit ${index + 1} of 6`}
                    maxLength={6}
                    value={verificationCode[index] || ""}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, "");
                      if (!digits) {
                        setVerificationCode((current) => current.slice(0, index) + current.slice(index + 1));
                        setError("");
                        return;
                      }
                      // Accept full OTP pasted/autofilled into any box.
                      if (digits.length > 1) {
                        const next = (verificationCode.slice(0, index) + digits + verificationCode.slice(index + digits.length)).slice(0, 6);
                        setVerificationCode(next);
                        document.getElementById(`verification-code-${Math.min(index + digits.length, 5)}`)?.focus();
                      } else {
                        const next = verificationCode.split("");
                        next[index] = digits;
                        setVerificationCode(next.join("").slice(0, 6));
                        if (index < 5) document.getElementById(`verification-code-${index + 1}`)?.focus();
                      }
                      setError("");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleVerifyEmail();
                      if (event.key === "Backspace" && !verificationCode[index] && index > 0) {
                        document.getElementById(`verification-code-${index - 1}`)?.focus();
                      }
                      if (event.key === "ArrowLeft" && index > 0) document.getElementById(`verification-code-${index - 1}`)?.focus();
                      if (event.key === "ArrowRight" && index < 5) document.getElementById(`verification-code-${index + 1}`)?.focus();
                    }}
                    onPaste={(event) => {
                      const digits = event.clipboardData.getData("text").replace(/\D/g, "");
                      if (!digits) return;
                      event.preventDefault();
                      const next = (verificationCode.slice(0, index) + digits + verificationCode.slice(index + digits.length)).slice(0, 6);
                      setVerificationCode(next);
                      setError("");
                      document.getElementById(`verification-code-${Math.min(index + digits.length, 5)}`)?.focus();
                    }}
                  />
                ))}
              </div>
              <p className="signup-otp-hint">Enter the code from your email.</p>
              <p className="signup-otp-resend">
                Didn't get a code?{" "}
                <button type="button" className="resend-button" onClick={handleResendCode} disabled={loading}>
                  Resend code
                </button>
              </p>
              {error && <div className="signup-error" role="alert">{error}</div>}
              <button type="button" className="signup-otp-verify" onClick={handleVerifyEmail} disabled={loading}>
                {loading ? "Verifying..." : "Verify"}
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }


  // =====================================================
  // SCREEN 3
  // FAMILY DETAILS
  // =====================================================

  if (step === 3) {
    return (
      <div className="signup-page signup-page--otp signup-page--family-details">
        <div className="signup-welcome-layout">
          <section className="signup-illustration-panel" aria-label="FamilyKit family illustration">
            <div className="signup-illustration-curve" />
            <div className="signup-illustration-content">
              <div className="signup-family-art">
                <img className="signup-family-photo" src={new URL("../assets/images/Smiling Family with Purple Tablet.png", import.meta.url).href} alt="Family using FamilyKit together" />
                <img className="signup-float-icon signup-float-icon--health" src={new URL("../assets/images/health.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--vector" src={new URL("../assets/images/Vector.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--bills" src={new URL("../assets/images/Household & Bills.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--extra" src={new URL("../assets/images/4db75485-c10a-4574-b017-11775affeb6e.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--insurance" src={new URL("../assets/images/Insurance.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--file" src={new URL("../assets/images/File.png", import.meta.url).href} alt="" />
                <span className="signup-float-icon signup-float-icon--bell" aria-hidden="true">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#F2994A" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                    <path d="M10 21h4" />
                  </svg>
                </span>
              </div>
              <p className="signup-illustration-caption">Everything your family needs, in one place</p>
            </div>
          </section>

          <section className="signup-welcome-panel">
            <div className="signup-card family-details-card">
              <h1>Give your family name</h1>
              <p className="signup-subtitle">A shared space for your family's important details.</p>

              <div className="signup-field">
                <label htmlFor="family-name">Family Name <span className="required">*</span></label>
                <input
                  id="family-name"
                  type="text"
                  placeholder="e.g. The Sharmas"
                  value={familyName}
                  onChange={(event) => { setFamilyName(event.target.value); setError(""); }}
                />
                <span className="field-helper">Choose a name everyone will recognise.</span>
              </div>

              <div className="signup-field">
                <label htmlFor="your-name">Your Name <span className="required">*</span></label>
                <input
                  id="your-name"
                  type="text"
                  placeholder="Enter your name as per Records"
                  value={yourName}
                  onChange={(event) => { setYourName(event.target.value); setError(""); }}
                />
              </div>

              <fieldset className="signup-gender-fieldset">
                <legend>Gender <span className="optional">(optional)</span></legend>
                <div className="gender-options">
                  {["Female", "Male", "Other", "Prefer not to say"].map((option) => (
                    <label key={option} className={`gender-option ${gender === option ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="gender"
                        value={option}
                        checked={gender === option}
                        onChange={(event) => setGender(event.target.value)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {error && <div className="signup-error" role="alert">{error}</div>}
              <button type="button" className="signup-family-continue" onClick={handleFamilyDetailsContinue} disabled={loading}>
                Continue
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }


  // =====================================================
  // SCREEN 4
  // REVIEW DETAILS
  // =====================================================

  if (step === 4) {
    return (
      <div className="signup-page signup-page--otp signup-page--review">
        <div className="signup-welcome-layout">
          <section className="signup-illustration-panel" aria-label="FamilyKit family illustration">
            <div className="signup-illustration-curve" />
            <div className="signup-illustration-content">
              <div className="signup-family-art">
                <img className="signup-family-photo" src={new URL("../assets/images/Smiling Family with Purple Tablet.png", import.meta.url).href} alt="Family using FamilyKit together" />
                <img className="signup-float-icon signup-float-icon--health" src={new URL("../assets/images/health.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--vector" src={new URL("../assets/images/Vector.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--bills" src={new URL("../assets/images/Household & Bills.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--extra" src={new URL("../assets/images/4db75485-c10a-4574-b017-11775affeb6e.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--insurance" src={new URL("../assets/images/Insurance.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--file" src={new URL("../assets/images/File.png", import.meta.url).href} alt="" />
                <span className="signup-float-icon signup-float-icon--bell" aria-hidden="true">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#F2994A" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                    <path d="M10 21h4" />
                  </svg>
                </span>
              </div>
              <p className="signup-illustration-caption">Everything your family needs, in one place</p>
            </div>
          </section>

          <section className="signup-welcome-panel">
            <div className="signup-card signup-review-card">
              <h1>The {familyName.trim().replace(/^the\s+/i, "").replace(/['’]s$/i, "")}'s Family</h1>
              <p className="signup-review-subtitle">A shared space for the family's important details.</p>
              <p className="signup-review-description">Family details</p>
              <div className="signup-review-field">
                <label htmlFor="review-family-name">Family name</label>
                <input id="review-family-name" type="text" value={familyName} readOnly />
              </div>
              <div className="signup-review-field">
                <label htmlFor="review-your-name">Your name</label>
                <input id="review-your-name" type="text" value={yourName} readOnly />
              </div>
              <div className="signup-review-actions">
                <button type="button" className="signup-review-edit" onClick={() => { setError(""); setStep(3); }}>Edit</button>
                <button type="button" className="signup-review-save" onClick={() => { setError(""); setStep(5); }}>Save</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }


  // =====================================================
  // SCREEN 5
  // CREATE 4-DIGIT PIN
  // =====================================================

  if (step === 5) {
    return (
      <div className="signup-page signup-page--otp signup-page--pin-step">
        <div className="signup-welcome-layout">
          <section className="signup-illustration-panel" aria-label="FamilyKit family illustration">
            <div className="signup-illustration-curve" />
            <div className="signup-illustration-content">
              <div className="signup-family-art">
                <img className="signup-family-photo" src={new URL("../assets/images/Smiling Family with Purple Tablet.png", import.meta.url).href} alt="Family using FamilyKit together" />
                <img className="signup-float-icon signup-float-icon--health" src={new URL("../assets/images/health.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--vector" src={new URL("../assets/images/Vector.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--bills" src={new URL("../assets/images/Household & Bills.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--extra" src={new URL("../assets/images/4db75485-c10a-4574-b017-11775affeb6e.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--insurance" src={new URL("../assets/images/Insurance.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--file" src={new URL("../assets/images/File.png", import.meta.url).href} alt="" />
                <span className="signup-float-icon signup-float-icon--bell" aria-hidden="true">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#F2994A" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                    <path d="M10 21h4" />
                  </svg>
                </span>
              </div>
              <p className="signup-illustration-caption">Everything your family needs, in one place</p>
            </div>
          </section>

          <section className="signup-welcome-panel">
            <div className="signup-card signup-pin-card">
              <h1>Create your PIN</h1>
              <p className="signup-pin-subtitle">Use this 4-digit PIN to unlock FamilyKit.</p>
              <div className="signup-pin-header">
                <label htmlFor="create-pin-0">Your PIN</label>
                <label className="signup-pin-toggle">
                  <input type="checkbox" checked={showPin} onChange={(event) => setShowPin(event.target.checked)} />
                  <span aria-hidden="true">{showPin ? "◉" : "◎"}</span>
                  Show PIN
                </label>
              </div>
              <div className="signup-pin-digits" role="group" aria-label="4-digit PIN">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    id={`create-pin-${index}`}
                    className="signup-pin-digit"
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={1}
                    autoComplete="off"
                    aria-label={`PIN digit ${index + 1}`}
                    value={pin[index] || ""}
                    onChange={(event) => { handleCreatePinChange(index, event.target.value); setError(""); }}
                    onKeyDown={(event) => {
                      if (event.key === "Backspace" && !pin[index] && index > 0) {
                        document.getElementById(`create-pin-${index - 1}`)?.focus();
                      }
                      if (event.key === "ArrowLeft" && index > 0) document.getElementById(`create-pin-${index - 1}`)?.focus();
                      if (event.key === "ArrowRight" && index < 3) document.getElementById(`create-pin-${index + 1}`)?.focus();
                      if (event.key === "Enter" && !loading) handleCreatePinContinue();
                    }}
                  />
                ))}
              </div>
              <p className="signup-pin-hint">Choose a PIN that’s hard to guess.</p>
              {error && <div className="signup-error" role="alert">{error}</div>}
              <button type="button" className="signup-pin-continue" onClick={handleCreatePinContinue} disabled={loading}>
                {loading ? "Please wait..." : "Continue"}
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }


  if (step === 6) {
    return (
      <div className="signup-page signup-page--otp signup-page--pin-step">
        <div className="signup-welcome-layout">
          <section className="signup-illustration-panel" aria-label="FamilyKit family illustration">
            <div className="signup-illustration-curve" />
            <div className="signup-illustration-content">
              <div className="signup-family-art">
                <img className="signup-family-photo" src={new URL("../assets/images/Smiling Family with Purple Tablet.png", import.meta.url).href} alt="Family using FamilyKit together" />
                <img className="signup-float-icon signup-float-icon--health" src={new URL("../assets/images/health.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--vector" src={new URL("../assets/images/Vector.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--bills" src={new URL("../assets/images/Household & Bills.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--extra" src={new URL("../assets/images/4db75485-c10a-4574-b017-11775affeb6e.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--insurance" src={new URL("../assets/images/Insurance.png", import.meta.url).href} alt="" />
                <img className="signup-float-icon signup-float-icon--file" src={new URL("../assets/images/File.png", import.meta.url).href} alt="" />
                <span className="signup-float-icon signup-float-icon--bell" aria-hidden="true">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#F2994A" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                    <path d="M10 21h4" />
                  </svg>
                </span>
              </div>
              <p className="signup-illustration-caption">Everything your family needs, in one place</p>
            </div>
          </section>

          <section className="signup-welcome-panel">
            <div className="signup-card signup-pin-card">
              <h1>Confirm your PIN</h1>
              <p className="signup-pin-subtitle">Enter your 4-digit PIN again.</p>
              <div className="signup-pin-header">
                <label htmlFor="confirm-pin-0">Your PIN</label>
                <label className="signup-pin-toggle">
                  <input type="checkbox" checked={showConfirmPin} onChange={(event) => setShowConfirmPin(event.target.checked)} />
                  <span aria-hidden="true">{showConfirmPin ? "◉" : "◎"}</span>
                  Show PIN
                </label>
              </div>
              <div className="signup-pin-digits" role="group" aria-label="4-digit PIN">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    id={`confirm-pin-${index}`}
                    className="signup-pin-digit"
                    type={showConfirmPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={1}
                    autoComplete="off"
                    aria-label={`PIN digit ${index + 1}`}
                    value={confirmPin[index] || ""}
                    onChange={(event) => { handleConfirmPinChange(index, event.target.value); setError(""); }}
                    onKeyDown={(event) => {
                      if (event.key === "Backspace" && !confirmPin[index] && index > 0) {
                        document.getElementById(`confirm-pin-${index - 1}`)?.focus();
                      }
                      if (event.key === "ArrowLeft" && index > 0) document.getElementById(`confirm-pin-${index - 1}`)?.focus();
                      if (event.key === "ArrowRight" && index < 3) document.getElementById(`confirm-pin-${index + 1}`)?.focus();
                      if (event.key === "Enter" && !loading) handleConfirmPin();
                    }}
                  />
                ))}
              </div>
              <p className="signup-pin-hint">Re-enter your PIN to confirm it.</p>
              {error && <div className="signup-error" role="alert">{error}</div>}
              <button type="button" className="signup-pin-continue" onClick={handleConfirmPin} disabled={loading}>
                {loading ? "Please wait..." : "Continue"}
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }


  // =====================================================
  // SCREEN 7
  // REGISTRATION SUCCESS
  // =====================================================

  if (step === 7) {
    return (
      <div className="signup-page">
        <div className="signup-card success-card">
          <h1>
            Registration successful
          </h1>

          <p>
            Your FamilyKit account setup is complete.
          </p>

          <button
            type="button"
            onClick={() => {
              window.location.href =
                "/login";
            }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return null;
}