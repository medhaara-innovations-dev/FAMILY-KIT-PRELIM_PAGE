
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
} from "@aws-sdk/client-cognito-identity-provider";

// ======================================================
// CONFIGURATION
// ======================================================

const REGION = "ap-southeast-2";

const USER_POOL_ID = "ap-southeast-2_XKEDA5qep";

const CLIENT_ID = "3o16vpjbrc6kf5205pc3rtchm5";

// API Gateway

const PIN_API_URL =
  "https://gwy0jd7fs1.execute-api.ap-southeast-2.amazonaws.com/pin";

const RESOLVE_LOGIN_API_URL =
  "https://gwy0jd7fs1.execute-api.ap-southeast-2.amazonaws.com/resolve-login";

const REGISTRATION_STATUS_API_URL =
  "https://gwy0jd7fs1.execute-api.ap-southeast-2.amazonaws.com/registration-status";

// NEW: Authenticated user profile endpoint

const PROFILE_API_URL =
  "https://gwy0jd7fs1.execute-api.ap-southeast-2.amazonaws.com/profile";

// ======================================================
// GOOGLE SIGN-IN / COGNITO OAUTH + PKCE
// ======================================================

const COGNITO_DOMAIN =
  "https://ap-southeast-2xkeda5qep.auth.ap-southeast-2.amazoncognito.com";

const GOOGLE_OAUTH_SCOPES = "openid email profile";

const GOOGLE_PKCE_VERIFIER_KEY =
  "familykit_google_pkce_verifier";

const GOOGLE_OAUTH_STATE_KEY =
  "familykit_google_oauth_state";

// ======================================================
// GOOGLE REDIRECT URI
//
// Supports BOTH:
// /login
// /signup
// ======================================================

function getGoogleRedirectUri(
  redirectPath = "/login"
) {
  const safePath =
    redirectPath === "/signup"
      ? "/signup"
      : "/login";

  return `${window.location.origin}${safePath}`;
}

// ======================================================
// PKCE HELPERS
// ======================================================

function base64UrlEncode(bytes) {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createRandomUrlSafeString(
  byteLength = 64
) {
  const bytes = new Uint8Array(byteLength);

  crypto.getRandomValues(bytes);

  return base64UrlEncode(bytes);
}

async function createCodeChallenge(
  codeVerifier
) {
  const encoded =
    new TextEncoder().encode(codeVerifier);

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      encoded
    );

  return base64UrlEncode(
    new Uint8Array(digest)
  );
}

// ======================================================
// GOOGLE LOGIN / SIGNUP
// START OAUTH
//
// Login:
// startGoogleLogin("/login")
//
// Signup:
// startGoogleLogin("/signup")
// ======================================================

export async function startGoogleLogin(
  redirectPath = "/login"
) {
  const codeVerifier =
    createRandomUrlSafeString(64);

  const codeChallenge =
    await createCodeChallenge(
      codeVerifier
    );

  const state =
    createRandomUrlSafeString(32);

  // Store PKCE values temporarily.

  sessionStorage.setItem(
    GOOGLE_PKCE_VERIFIER_KEY,
    codeVerifier
  );

  sessionStorage.setItem(
    GOOGLE_OAUTH_STATE_KEY,
    state
  );

  const params =
    new URLSearchParams({
      response_type: "code",

      client_id: CLIENT_ID,

      redirect_uri:
        getGoogleRedirectUri(
          redirectPath
        ),

      identity_provider: "Google",

      scope: GOOGLE_OAUTH_SCOPES,

      state,

      code_challenge: codeChallenge,

      code_challenge_method: "S256",
    });

  window.location.assign(
    `${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`
  );
}

// ======================================================
// GOOGLE LOGIN / SIGNUP
// COMPLETE OAUTH CALLBACK
//
// Login:
// completeGoogleLogin("/login")
//
// Signup:
// completeGoogleLogin("/signup")
// ======================================================

export async function completeGoogleLogin(
  redirectPath = "/login"
) {
  const params =
    new URLSearchParams(
      window.location.search
    );

  // Check OAuth error.

  const oauthError =
    params.get("error");

  if (oauthError) {
    throw new Error(
      params.get("error_description") ||
        `Google sign-in failed: ${oauthError}`
    );
  }

  // Get authorization code.

  const code =
    params.get("code");

  const returnedState =
    params.get("state");

  if (!code) {
    throw new Error(
      "Google sign-in did not return an authorization code."
    );
  }

  // Load saved PKCE values.

  const expectedState =
    sessionStorage.getItem(
      GOOGLE_OAUTH_STATE_KEY
    );

  const codeVerifier =
    sessionStorage.getItem(
      GOOGLE_PKCE_VERIFIER_KEY
    );

  // Validate state.

  if (
    !returnedState ||
    !expectedState ||
    returnedState !== expectedState
  ) {
    throw new Error(
      "Google sign-in security validation failed."
    );
  }

  if (!codeVerifier) {
    throw new Error(
      "Google sign-in session expired. Please try again."
    );
  }

  // Exchange authorization code for Cognito tokens.

  const body =
    new URLSearchParams({
      grant_type: "authorization_code",

      client_id: CLIENT_ID,

      code,

      redirect_uri:
        getGoogleRedirectUri(
          redirectPath
        ),

      code_verifier: codeVerifier,
    });

  const response =
    await fetch(
      `${COGNITO_DOMAIN}/oauth2/token`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body: body.toString(),
      }
    );

  let result = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    throw new Error(
      result?.error_description ||
        result?.error ||
        `Unable to complete Google sign-in. Server returned ${response.status}.`
    );
  }

  if (!result?.access_token) {
    throw new Error(
      "Cognito did not return an access token."
    );
  }

  // Remove temporary PKCE data.

  sessionStorage.removeItem(
    GOOGLE_PKCE_VERIFIER_KEY
  );

  sessionStorage.removeItem(
    GOOGLE_OAUTH_STATE_KEY
  );

  // Get Google / Cognito user information.

  let userInfo = null;

  try {
    const userInfoResponse =
      await fetch(
        `${COGNITO_DOMAIN}/oauth2/userInfo`,
        {
          headers: {
            Authorization:
              `Bearer ${result.access_token}`,
          },
        }
      );

    if (userInfoResponse.ok) {
      userInfo =
        await userInfoResponse.json();
    }
  } catch {
    userInfo = null;
  }

  // Return Cognito tokens + profile.

  return {
    accessToken:
      result.access_token,

    idToken:
      result.id_token || null,

    refreshToken:
      result.refresh_token || null,

    expiresIn:
      result.expires_in || null,

    tokenType:
      result.token_type || null,

    email:
      userInfo?.email || "",

    name:
      userInfo?.name ||
      userInfo?.given_name ||
      "",
  };
}

// ======================================================
// COGNITO CLIENT
// ======================================================

const cognitoClient =
  new CognitoIdentityProviderClient({
    region: REGION,
  });

// ======================================================
// STEP 1
// SIGN UP WITH EMAIL
// ======================================================

export async function signUpWithEmail(
  email
) {
  const normalizedEmail =
    email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error(
      "Email address is required."
    );
  }

  const command =
    new SignUpCommand({
      ClientId: CLIENT_ID,

      Username: normalizedEmail,

      UserAttributes: [
        {
          Name: "email",

          Value: normalizedEmail,
        },
      ],
    });

  const response =
    await cognitoClient.send(
      command
    );

  return {
    userSub:
      response.UserSub || null,

    userConfirmed:
      response.UserConfirmed || false,

    session:
      response.Session || null,
  };
}

// ======================================================
// STEP 2
// CONFIRM 6-DIGIT EMAIL OTP
// ======================================================

export async function confirmEmail(
  email,
  verificationCode,
  signUpSession
) {
  const normalizedEmail =
    email.trim().toLowerCase();

  const normalizedCode =
    verificationCode.trim();

  if (!normalizedEmail) {
    throw new Error(
      "Email address is required."
    );
  }

  if (
    !/^\d{6}$/.test(
      normalizedCode
    )
  ) {
    throw new Error(
      "Verification code must contain exactly 6 digits."
    );
  }

  const command =
    new ConfirmSignUpCommand({
      ClientId: CLIENT_ID,

      Username: normalizedEmail,

      ConfirmationCode:
        normalizedCode,

      ...(signUpSession
        ? {
            Session: signUpSession,
          }
        : {}),
    });

  const response =
    await cognitoClient.send(
      command
    );

  return {
    session:
      response.Session || null,
  };
}

// ======================================================
// STEP 3
// AUTOMATIC AUTHENTICATION AFTER OTP
// ======================================================

export async function completeSignupAuthentication(
  email,
  confirmationSession
) {
  const normalizedEmail =
    email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error(
      "Email address is required."
    );
  }

  if (!confirmationSession) {
    throw new Error(
      "Cognito did not return a confirmation session."
    );
  }

  const command =
    new InitiateAuthCommand({
      ClientId: CLIENT_ID,

      AuthFlow: "USER_AUTH",

      AuthParameters: {
        USERNAME: normalizedEmail,
      },

      Session: confirmationSession,
    });

  const response =
    await cognitoClient.send(
      command
    );

  if (
    !response.AuthenticationResult
  ) {
    throw new Error(
      "Cognito did not complete authentication."
    );
  }

  const authenticationResult =
    response.AuthenticationResult;

  const accessToken =
    authenticationResult.AccessToken ||
    null;

  const idToken =
    authenticationResult.IdToken ||
    null;

  const refreshToken =
    authenticationResult.RefreshToken ||
    null;

  if (!accessToken) {
    throw new Error(
      "Cognito did not return an access token."
    );
  }

  return {
    accessToken,

    idToken,

    refreshToken,

    expiresIn:
      authenticationResult.ExpiresIn ||
      null,

    tokenType:
      authenticationResult.TokenType ||
      null,
  };
}

// ======================================================
// RESEND 6-DIGIT EMAIL OTP
// ======================================================

export async function resendVerificationCode(
  email
) {
  const normalizedEmail =
    email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error(
      "Email address is required."
    );
  }

  const command =
    new ResendConfirmationCodeCommand({
      ClientId: CLIENT_ID,

      Username: normalizedEmail,
    });

  return await cognitoClient.send(
    command
  );
}

// ======================================================
// STORE FAMILYKIT 4-DIGIT PIN
//
// UPDATED:
// Store the personal name entered under "Your Name".
//
// Existing authentication and PIN validation preserved.
// ======================================================

export async function storeFamilyKitPin(
  accessToken,
  pin,
  yourName
) {
  if (!accessToken) {
    throw new Error(
      "Authentication session is missing."
    );
  }

  if (
    !/^\d{4}$/.test(pin)
  ) {
    throw new Error(
      "PIN must contain exactly 4 digits."
    );
  }

  // NEW: Validate the registered personal name.

  const cleanYourName =
    typeof yourName === "string"
      ? yourName.trim()
      : "";

  if (!cleanYourName) {
    throw new Error(
      "Please enter your name."
    );
  }

  const response =
    await fetch(
      PIN_API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${accessToken}`,
        },

        // UPDATED: Send PIN and personal name.
        // The userId is still obtained from the JWT.

        body:
          JSON.stringify({
            pin,
            yourName: cleanYourName,
          }),
      }
    );

  let result = null;

  try {
    result =
      await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    throw new Error(
      result?.message ||
        `Unable to save PIN. Server returned ${response.status}.`
    );
  }

  if (!result?.success) {
    throw new Error(
      result?.message ||
        "Unable to save PIN."
    );
  }

  return result;
}

// ======================================================
// CHECK FAMILYKIT REGISTRATION STATUS
//
// Used after Google authentication on the Signup page.
//
// The access token identifies the authenticated Cognito
// user. API Gateway validates the JWT and Lambda checks
// whether that Cognito "sub" already has a FamilyKit PIN
// record in DynamoDB.
//
// true  -> registration already completed
// false -> first-time Google signup
// ======================================================

export async function getRegistrationStatus(
  accessToken
) {
  if (!accessToken) {
    throw new Error(
      "Authentication session is missing."
    );
  }

  const response =
    await fetch(
      REGISTRATION_STATUS_API_URL,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      }
    );

  let result = null;

  try {
    result =
      await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    throw new Error(
      result?.message ||
        `Unable to check registration status. Server returned ${response.status}.`
    );
  }

  if (
    !result?.success ||
    typeof result.registrationComplete !==
      "boolean"
  ) {
    throw new Error(
      "Invalid registration status response."
    );
  }

  return {
    registrationComplete:
      result.registrationComplete,
  };
}

// ======================================================
// LOGIN USERNAME RESOLVER
//
// Converts the email entered on the login page into
// the actual Cognito username.
//
// Native email account:
// email -> Cognito username
//
// Google federated account:
// email -> google_xxxxxxxxx
// ======================================================

async function resolveLoginUsername(
  email
) {
  const normalizedEmail =
    email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error(
      "Email address is required."
    );
  }

  const response =
    await fetch(
      RESOLVE_LOGIN_API_URL,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            email:
              normalizedEmail,
          }),
      }
    );

  let result = null;

  try {
    result =
      await response.json();
  } catch {
    result = null;
  }

  if (
    !response.ok ||
    !result?.success ||
    !result?.username
  ) {
    throw new Error(
      "Incorrect email address or FamilyKit PIN."
    );
  }

  return result.username;
}

// ======================================================
// LOGIN STEP 1
// START FAMILYKIT CUSTOM PIN AUTHENTICATION
//
// IMPORTANT:
// This receives the ACTUAL Cognito username,
// not necessarily the email address.
// ======================================================

export async function startPinLogin(
  username
) {
  const cognitoUsername =
    username.trim();

  if (!cognitoUsername) {
    throw new Error(
      "Cognito username is required."
    );
  }

  const command =
    new InitiateAuthCommand({
      ClientId: CLIENT_ID,

      AuthFlow: "CUSTOM_AUTH",

      AuthParameters: {
        USERNAME:
          cognitoUsername,

        // Start directly with our
        // FamilyKit custom challenge.

        CHALLENGE_NAME:
          "CUSTOM_CHALLENGE",
      },
    });

  const response =
    await cognitoClient.send(
      command
    );

  if (
    response.ChallengeName !==
    "CUSTOM_CHALLENGE"
  ) {
    throw new Error(
      "FamilyKit PIN authentication could not be started."
    );
  }

  if (!response.Session) {
    throw new Error(
      "Cognito did not return an authentication session."
    );
  }

  return {
    challengeName:
      response.ChallengeName,

    session:
      response.Session,

    challengeParameters:
      response.ChallengeParameters ||
      {},
  };
}

// ======================================================
// LOGIN STEP 2
// SEND 4-DIGIT PIN TO COGNITO CUSTOM CHALLENGE
//
// IMPORTANT:
// Uses the same resolved Cognito username that was
// used to start the CUSTOM_AUTH session.
// ======================================================

export async function respondToPinChallenge(
  username,
  pin,
  session
) {
  const cognitoUsername =
    username.trim();

  if (!cognitoUsername) {
    throw new Error(
      "Cognito username is required."
    );
  }

  if (
    !/^\d{4}$/.test(pin)
  ) {
    throw new Error(
      "PIN must contain exactly 4 digits."
    );
  }

  if (!session) {
    throw new Error(
      "Authentication session is missing."
    );
  }

  const command =
    new RespondToAuthChallengeCommand({
      ClientId: CLIENT_ID,

      ChallengeName:
        "CUSTOM_CHALLENGE",

      Session:
        session,

      ChallengeResponses: {
        USERNAME:
          cognitoUsername,

        ANSWER:
          pin,
      },
    });

  const response =
    await cognitoClient.send(
      command
    );

  // ====================================================
  // SUCCESS
  // ====================================================

  if (
    response.AuthenticationResult
  ) {
    const authenticationResult =
      response.AuthenticationResult;

    const accessToken =
      authenticationResult.AccessToken ||
      null;

    const idToken =
      authenticationResult.IdToken ||
      null;

    const refreshToken =
      authenticationResult.RefreshToken ||
      null;

    if (!accessToken) {
      throw new Error(
        "Cognito did not return an access token."
      );
    }

    return {
      success:
        true,

      accessToken,

      idToken,

      refreshToken,

      expiresIn:
        authenticationResult.ExpiresIn ||
        null,

      tokenType:
        authenticationResult.TokenType ||
        null,

      session:
        null,
    };
  }

  // ====================================================
  // WRONG PIN
  // COGNITO GIVES ANOTHER CUSTOM CHALLENGE
  // ====================================================

  if (
    response.ChallengeName ===
    "CUSTOM_CHALLENGE"
  ) {
    return {
      success:
        false,

      wrongPin:
        true,

      session:
        response.Session ||
        null,

      challengeName:
        response.ChallengeName,
    };
  }

  throw new Error(
    "Unable to complete FamilyKit PIN authentication."
  );
}

// ======================================================
// COMPLETE FAMILYKIT PIN LOGIN
//
// Login flow:
//
// Email entered by user
//       ↓
// POST /resolve-login
//       ↓
// Actual Cognito username
//       ↓
// CUSTOM_AUTH
//       ↓
// FamilyKit 4-digit PIN
//       ↓
// Cognito tokens
// ======================================================

export async function loginWithFamilyKitPin(
  email,
  pin
) {
  const normalizedEmail =
    email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error(
      "Please enter your email address."
    );
  }

  if (
    !/^\d{4}$/.test(pin)
  ) {
    throw new Error(
      "Please enter your 4-digit FamilyKit PIN."
    );
  }

  // Resolve email to the actual Cognito username.

  const cognitoUsername =
    await resolveLoginUsername(
      normalizedEmail
    );

  // Start Cognito CUSTOM_AUTH with actual username.

  const loginStart =
    await startPinLogin(
      cognitoUsername
    );

  // Answer custom challenge using same Cognito username.

  const loginResult =
    await respondToPinChallenge(
      cognitoUsername,
      pin,
      loginStart.session
    );

  if (!loginResult.success) {
    throw new Error(
      "Incorrect email address or FamilyKit PIN."
    );
  }

  return loginResult;
}

// ======================================================
// NEW: GET FAMILYKIT PROFILE FROM AWS
//
// Returns the name entered in "Your Name" during signup.
//
// Uses the Cognito access token.
// The backend identifies the user from the validated JWT.
//
// This is required for cross-device name retrieval.
// ======================================================

export async function getFamilyKitProfile(
  accessToken
) {
  if (!accessToken) {
    throw new Error(
      "Authentication session is missing."
    );
  }

  const response =
    await fetch(
      PROFILE_API_URL,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      }
    );

  let result = null;

  try {
    result =
      await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    throw new Error(
      result?.message ||
        `Unable to retrieve profile. Server returned ${response.status}.`
    );
  }

  if (!result?.success) {
    throw new Error(
      result?.message ||
        "Unable to retrieve FamilyKit profile."
    );
  }

  return {
    yourName:
      typeof result.yourName === "string"
        ? result.yourName.trim()
        : "",
  };
}

// ======================================================
// CONFIG
// ======================================================

export const cognitoConfig = {
  region:
    REGION,

  userPoolId:
    USER_POOL_ID,

  clientId:
    CLIENT_ID,
};

export const apiConfig = {
  pinApiUrl:
    PIN_API_URL,

  resolveLoginApiUrl:
    RESOLVE_LOGIN_API_URL,

  registrationStatusApiUrl:
    REGISTRATION_STATUS_API_URL,

  // NEW
  profileApiUrl:
    PROFILE_API_URL,
};
