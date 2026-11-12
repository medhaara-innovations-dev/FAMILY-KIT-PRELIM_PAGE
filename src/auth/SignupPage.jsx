import { useState } from "react";

import {
  signUpWithEmail,
  confirmEmail,
  resendVerificationCode,
  completeSignupAuthentication,
  storeFamilyKitPin,
} from "./authService";

import "./SignupPage.css";

export default function SignupPage() {
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
  // SCREEN 1
  // EMAIL SIGNUP
  // =====================================================

  const handleEmailContinue = async () => {
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
        signupResult.session || null
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

  const handleVerifyEmail = async () => {
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

      if (!authResult.accessToken) {
        throw new Error(
          "Cognito did not return an access token."
        );
      }

      // Keep the access token in React memory.
      // This will later authorize POST /pin.
      setAccessToken(
        authResult.accessToken
      );

      // Email verified + user authenticated.
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

  const handleResendCode = async () => {
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

  const handleConfirmPin = async () => {
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

    if (pin !== confirmPin) {
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
      // Sends:
      //
      // Authorization:
      // Bearer <Cognito Access Token>
      //
      // Body:
      // {
      //   "pin": "1234"
      // }
      //
      // React DOES NOT send userId.
      //
      // API Gateway verifies the Cognito JWT.
      //
      // Lambda gets the authenticated user's
      // Cognito "sub".
      //
      // Lambda hashes the PIN with PBKDF2 + salt.
      //
      // DynamoDB stores only:
      // userId
      // pinHash
      // salt
      // iterations
      // timestamps
      //
      // =================================================

      await storeFamilyKitPin(
        accessToken,
        pin
      );

      // IMPORTANT:
      // Registration success is shown only
      // after the backend confirms PIN storage.
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
      <div className="signup-page">
        <div className="signup-card">
          <h1>
            Welcome to FamilyKit
          </h1>

          <p>
            Log in or sign up with your email address.
          </p>

          <label
            htmlFor="signup-email"
          >
            Email address
          </label>

          <input
            id="signup-email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(
              event
            ) => {
              setEmail(
                event.target.value
              );

              setError("");
            }}
            onKeyDown={(
              event
            ) => {
              if (
                event.key ===
                "Enter"
              ) {
                handleEmailContinue();
              }
            }}
          />

          {error && (
            <div className="signup-error">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={
              handleEmailContinue
            }
            disabled={
              loading
            }
          >
            {loading
              ? "Please wait..."
              : "Continue"}
          </button>

          <p className="verification-note">
            We'll send a verification code to your email.
          </p>
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
      <div className="signup-page">
        <div className="signup-card">
          <h1>
            Enter your Verification code
          </h1>

          <p>
            We sent a 6-digit verification code to
          </p>

          <strong>
            {email}
          </strong>

          <label
            htmlFor="verification-code"
          >
            Verification code
          </label>

          <input
            id="verification-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter 6-digit verification code"
            value={
              verificationCode
            }
            maxLength={6}
            onChange={(
              event
            ) => {
              const value =
                event.target.value
                  .replace(
                    /\D/g,
                    ""
                  )
                  .slice(
                    0,
                    6
                  );

              setVerificationCode(
                value
              );

              setError("");
            }}
            onKeyDown={(
              event
            ) => {
              if (
                event.key ===
                "Enter"
              ) {
                handleVerifyEmail();
              }
            }}
          />

          {error && (
            <div className="signup-error">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={
              handleVerifyEmail
            }
            disabled={
              loading
            }
          >
            {loading
              ? "Verifying..."
              : "Verify"}
          </button>

          <p>
            Didn't get a code?{" "}

            <button
              type="button"
              className="resend-button"
              onClick={
                handleResendCode
              }
              disabled={
                loading
              }
            >
              Resend code
            </button>
          </p>
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
      <div className="signup-page">
        <div className="signup-card family-details-card">
          <h1>
            Give your family name
          </h1>

          <p className="signup-subtitle">
            A shared space for your family's important details.
          </p>

          {/* FAMILY NAME */}

          <div className="signup-field">
            <label
              htmlFor="family-name"
            >
              Family Name{" "}

              <span className="required">
                *
              </span>
            </label>

            <input
              id="family-name"
              type="text"
              placeholder="e.g. The Sharmas"
              value={
                familyName
              }
              onChange={(
                event
              ) => {
                setFamilyName(
                  event.target.value
                );

                setError("");
              }}
            />

            <span className="field-helper">
              Choose a name everyone will recognise.
            </span>
          </div>

          {/* YOUR NAME */}

          <div className="signup-field">
            <label
              htmlFor="your-name"
            >
              Your Name{" "}

              <span className="required">
                *
              </span>
            </label>

            <input
              id="your-name"
              type="text"
              placeholder="Enter your name as per Records"
              value={
                yourName
              }
              onChange={(
                event
              ) => {
                setYourName(
                  event.target.value
                );

                setError("");
              }}
            />
          </div>

          {/* GENDER */}

          <div className="signup-field">
            <label>
              Gender{" "}

              <span className="optional">
                (optional)
              </span>
            </label>

            <div className="gender-options">
              {[
                "Female",
                "Male",
                "Other",
                "Prefer not to say",
              ].map(
                (option) => (
                  <label
                    key={
                      option
                    }
                    className={`gender-option ${
                      gender ===
                      option
                        ? "selected"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={
                        option
                      }
                      checked={
                        gender ===
                        option
                      }
                      onChange={(
                        event
                      ) => {
                        setGender(
                          event
                            .target
                            .value
                        );
                      }}
                    />

                    <span>
                      {option}
                    </span>
                  </label>
                )
              )}
            </div>
          </div>

          {error && (
            <div className="signup-error">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={
              handleFamilyDetailsContinue
            }
          >
            Continue
          </button>
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
      <div className="signup-page">
        <div className="signup-card review-card">
          <h1>
            {familyName}
          </h1>

          <p className="signup-subtitle">
            Review your details before continuing.
          </p>

          <div className="review-details">
            <div className="review-item">
              <span>
                Family Name
              </span>

              <strong>
                {familyName}
              </strong>
            </div>

            <div className="review-item">
              <span>
                Your Name
              </span>

              <strong>
                {yourName}
              </strong>
            </div>

            <div className="review-item">
              <span>
                Email
              </span>

              <strong>
                {email}
              </strong>
            </div>

            {gender && (
              <div className="review-item">
                <span>
                  Gender
                </span>

                <strong>
                  {gender}
                </strong>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setError("");

              setStep(3);
            }}
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => {
              setError("");

              setStep(5);
            }}
          >
            Save
          </button>
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
      <div className="signup-page">
        <div className="signup-card pin-card">
          <h1>
            Create your PIN
          </h1>

          <p className="signup-subtitle">
            Use this 4-digit PIN to unlock FamilyKit.
          </p>

          <div className="pin-boxes">
            {[0, 1, 2, 3].map(
              (index) => (
                <input
                  key={
                    index
                  }
                  id={`create-pin-${index}`}
                  className="pin-box"
                  type={
                    showPin
                      ? "text"
                      : "password"
                  }
                  inputMode="numeric"
                  maxLength={1}
                  autoComplete="off"
                  value={
                    pin[index] ||
                    ""
                  }
                  onChange={(
                    event
                  ) => {
                    handleCreatePinChange(
                      index,
                      event
                        .target
                        .value
                    );

                    setError("");
                  }}
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                        "Backspace" &&
                      !pin[index] &&
                      index > 0
                    ) {
                      document
                        .getElementById(
                          `create-pin-${
                            index -
                            1
                          }`
                        )
                        ?.focus();
                    }
                  }}
                />
              )
            )}
          </div>

          <label className="show-pin-option">
            <input
              type="checkbox"
              checked={
                showPin
              }
              onChange={(
                event
              ) =>
                setShowPin(
                  event
                    .target
                    .checked
                )
              }
            />

            <span>
              Show PIN
            </span>
          </label>

          <p className="field-helper">
            Choose a 4-digit PIN that you can remember.
          </p>

          {error && (
            <div className="signup-error">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={
              handleCreatePinContinue
            }
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // SCREEN 6
  // CONFIRM 4-DIGIT PIN
  // =====================================================

  if (step === 6) {
    return (
      <div className="signup-page">
        <div className="signup-card pin-card">
          <h1>
            Confirm your PIN
          </h1>

          <p className="signup-subtitle">
            Enter your 4-digit PIN again.
          </p>

          <div className="pin-boxes">
            {[0, 1, 2, 3].map(
              (index) => (
                <input
                  key={
                    index
                  }
                  id={`confirm-pin-${index}`}
                  className="pin-box"
                  type={
                    showConfirmPin
                      ? "text"
                      : "password"
                  }
                  inputMode="numeric"
                  maxLength={1}
                  autoComplete="off"
                  value={
                    confirmPin[
                      index
                    ] || ""
                  }
                  onChange={(
                    event
                  ) => {
                    handleConfirmPinChange(
                      index,
                      event
                        .target
                        .value
                    );

                    setError("");
                  }}
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                        "Backspace" &&
                      !confirmPin[
                        index
                      ] &&
                      index > 0
                    ) {
                      document
                        .getElementById(
                          `confirm-pin-${
                            index -
                            1
                          }`
                        )
                        ?.focus();
                    }

                    if (
                      event.key ===
                        "Enter" &&
                      confirmPin.length ===
                        4 &&
                      !loading
                    ) {
                      handleConfirmPin();
                    }
                  }}
                />
              )
            )}
          </div>

          <label className="show-pin-option">
            <input
              type="checkbox"
              checked={
                showConfirmPin
              }
              onChange={(
                event
              ) =>
                setShowConfirmPin(
                  event
                    .target
                    .checked
                )
              }
            />

            <span>
              Show PIN
            </span>
          </label>

          {error && (
            <div className="signup-error">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={
              handleConfirmPin
            }
            disabled={
              loading
            }
          >
            {loading
              ? "Creating account..."
              : "Continue"}
          </button>
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