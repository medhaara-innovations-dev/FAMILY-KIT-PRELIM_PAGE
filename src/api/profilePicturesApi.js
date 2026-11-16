
/*
 * FamilyKit - Profile Pictures API
 *
 * Upload, confirm, retrieve and delete
 * profile pictures using AWS Lambda + S3.
 */

// Replace this URL only if the profile-picture
// routes are hosted in a different API Gateway.
const PROFILE_API_BASE_URL =
  "https://a8h5fl7bi0.execute-api.ap-southeast-2.amazonaws.com";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
];

function getAccessToken() {
  const token = sessionStorage.getItem(
    "familykit_access_token"
  );

  if (!token) {
    throw new Error(
      "Session expired. Please log in again."
    );
  }

  return token;
}

// Call authenticated Lambda endpoints
async function apiRequest(path, options = {}) {
  const token = getAccessToken();

  const response = await fetch(
    `${PROFILE_API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Invalid response from profile picture API."
    );
  }

  if (!response.ok || data.error) {
    throw new Error(
      data.error ||
      data.message ||
      `Request failed: ${response.status}`
    );
  }

  return data;
}

// Validate selected image
function validateImage(file) {
  if (!file) {
    throw new Error("Please select an image.");
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      "Only JPG and PNG images are allowed."
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      "Image size must not exceed 5 MB."
    );
  }
}

// STEP 1: Request S3 upload authorization
export async function requestProfilePictureUpload(
  memberId,
  file
) {
  validateImage(file);

  if (!memberId) {
    throw new Error("Member ID is required.");
  }

  return apiRequest("/profile-picture/upload", {
    method: "POST",
    body: JSON.stringify({
      memberId,
      contentType: file.type,
    }),
  });
}

// STEP 2: Upload image directly to S3
async function uploadFileToS3(upload, file) {
  if (!upload?.url || !upload?.fields) {
    throw new Error(
      "Invalid S3 upload authorization."
    );
  }

  const formData = new FormData();

  Object.entries(upload.fields).forEach(
    ([key, value]) => {
      formData.append(key, value);
    }
  );

  // The file must be appended last.
  formData.append("file", file, file.name);

  const response = await fetch(upload.url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      `S3 upload failed: ${response.status}`
    );
  }

  return true;
}

// STEP 3: Confirm image and save reference
export async function confirmProfilePicture(
  memberId,
  profilePictureKey
) {
  return apiRequest("/profile-picture/confirm", {
    method: "POST",
    body: JSON.stringify({
      memberId,
      profilePictureKey,
    }),
  });
}

// COMPLETE UPLOAD FLOW
export async function uploadProfilePicture(
  memberId,
  file
) {
  validateImage(file);

  // Request presigned S3 upload form
  const authorization =
    await requestProfilePictureUpload(
      memberId,
      file
    );

  if (
    !authorization.upload ||
    !authorization.profilePictureKey
  ) {
    throw new Error(
      "Upload authorization is incomplete."
    );
  }

  // Upload image to Amazon S3
  await uploadFileToS3(
    authorization.upload,
    file
  );

  // Save image reference in DynamoDB
  const confirmation =
    await confirmProfilePicture(
      memberId,
      authorization.profilePictureKey
    );

  return confirmation;
}

// GET: Retrieve profile picture
export async function getProfilePicture(
  memberId
) {
  if (!memberId) {
    throw new Error("Member ID is required.");
  }

  return apiRequest(
    `/profile-picture/photo?memberId=${encodeURIComponent(memberId)}`,
    {
      method: "GET",
    }
  );
}

// GET: Return photo URL or null
export async function getProfilePictureUrl(
  memberId
) {
  const result =
    await getProfilePicture(memberId);

  if (!result.hasPhoto) {
    return null;
  }

  return result.photoUrl || null;
}

// DELETE: Remove profile picture
export async function deleteProfilePicture(
  memberId
) {
  if (!memberId) {
    throw new Error("Member ID is required.");
  }

  return apiRequest("/profile-picture/photo", {
    method: "DELETE",
    body: JSON.stringify({
      memberId,
    }),
  });
}

// MAIN USER PROFILE
export const SELF_PROFILE_ID = "PROFILE#SELF";
