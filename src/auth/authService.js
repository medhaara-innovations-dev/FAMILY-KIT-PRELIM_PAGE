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

const USER_POOL_ID =
  "ap-southeast-2_XKEDA5qep";

const CLIENT_ID =
  "3o16vpjbrc6kf5205pc3rtchm5";


// API Gateway
const PIN_API_URL =
  "https://gwy0jd7fs1.execute-api.ap-southeast-2.amazonaws.com/pin";


const cognitoClient =
  new CognitoIdentityProviderClient({
    region: REGION,
  });


// ======================================================
// STEP 1
// SIGN UP WITH EMAIL
// ======================================================

export async function signUpWithEmail(email) {
  const normalizedEmail =
    email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error(
      "Email address is required."
    );
  }

  const command = new SignUpCommand({
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
    await cognitoClient.send(command);

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

  if (!/^\d{6}$/.test(normalizedCode)) {
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
    await cognitoClient.send(command);

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
    await cognitoClient.send(command);

  if (!response.AuthenticationResult) {
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
// ======================================================

export async function storeFamilyKitPin(
  accessToken,
  pin
) {
  if (!accessToken) {
    throw new Error(
      "Authentication session is missing."
    );
  }

  if (!/^\d{4}$/.test(pin)) {
    throw new Error(
      "PIN must contain exactly 4 digits."
    );
  }

  const response = await fetch(
    PIN_API_URL,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${accessToken}`,
      },

      body: JSON.stringify({
        pin,
      }),
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
// LOGIN STEP 1
// START FAMILYKIT CUSTOM PIN AUTHENTICATION
// ======================================================

export async function startPinLogin(email) {
  const normalizedEmail =
    email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error(
      "Email address is required."
    );
  }

  const command =
    new InitiateAuthCommand({
      ClientId: CLIENT_ID,

      AuthFlow: "CUSTOM_AUTH",

      AuthParameters: {
        USERNAME: normalizedEmail,

        // Start directly with our FamilyKit custom challenge.
        CHALLENGE_NAME:
          "CUSTOM_CHALLENGE",
      },
    });

  const response =
    await cognitoClient.send(command);

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
      response.ChallengeParameters || {},
  };
}


// ======================================================
// LOGIN STEP 2
// SEND 4-DIGIT PIN TO COGNITO CUSTOM CHALLENGE
// ======================================================

export async function respondToPinChallenge(
  email,
  pin,
  session
) {
  const normalizedEmail =
    email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error(
      "Email address is required."
    );
  }

  if (!/^\d{4}$/.test(pin)) {
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

      Session: session,

      ChallengeResponses: {
        USERNAME: normalizedEmail,

        ANSWER: pin,
      },
    });

  const response =
    await cognitoClient.send(command);


  // ====================================================
  // SUCCESS
  // ====================================================

  if (response.AuthenticationResult) {
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
      success: true,

      accessToken,

      idToken,

      refreshToken,

      expiresIn:
        authenticationResult.ExpiresIn ||
        null,

      tokenType:
        authenticationResult.TokenType ||
        null,

      session: null,
    };
  }


  // ====================================================
  // WRONG PIN - COGNITO GIVES ANOTHER CUSTOM CHALLENGE
  // ====================================================

  if (
    response.ChallengeName ===
    "CUSTOM_CHALLENGE"
  ) {
    return {
      success: false,

      wrongPin: true,

      session:
        response.Session || null,

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

  if (!/^\d{4}$/.test(pin)) {
    throw new Error(
      "Please enter your 4-digit FamilyKit PIN."
    );
  }


  // Start Cognito CUSTOM_AUTH.
  const loginStart =
    await startPinLogin(
      normalizedEmail
    );


  // Answer the custom challenge with the PIN.
  const loginResult =
    await respondToPinChallenge(
      normalizedEmail,
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
// CONFIG
// ======================================================

export const cognitoConfig = {
  region: REGION,

  userPoolId: USER_POOL_ID,

  clientId: CLIENT_ID,
};


export const apiConfig = {
  pinApiUrl: PIN_API_URL,
};