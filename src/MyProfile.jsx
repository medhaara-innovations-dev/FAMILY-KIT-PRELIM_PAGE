import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Trash2 } from "lucide-react";
import { getFamilyKitProfile } from "./auth/authService.js";
import { getValidAccessToken, clearFamilyKitSession } from "./auth/sessionManager.js";
import {
  SELF_PROFILE_ID,
  uploadProfilePicture,
  deleteProfilePicture,
} from "./api/profilePicturesApi.js";
import ProfileAvatar from "./components/ProfileAvatar.jsx";
import ProfilePhotoCropper from "./ProfilePhotoCropper.jsx";
import "./MyProfile.css";

export default function MyProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [name, setName] = useState("Me");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [photoToCrop, setPhotoToCrop] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    const hasSession = Boolean(
      sessionStorage.getItem("familykit_access_token") ||
      sessionStorage.getItem("familykit_refresh_token")
    );
    if (!hasSession) {
      navigate("/login", { replace: true });
      return () => { active = false; };
    }
    async function load() {
      try {
        const token = await getValidAccessToken();
        if (!active) return;
        const profile = await getFamilyKitProfile(token);
        if (active) setName(profile.yourName || "Me");
      } catch (err) {
        if (active) setError(err.message || "Unable to load profile.");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [navigate]);

  function handleUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busy) return;
    setError("");
    setSuccess("");
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Only JPG and PNG images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must not exceed 5 MB.");
      return;
    }
    setPhotoToCrop(file);
  }

  async function handleCropConfirm(croppedFile) {
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await uploadProfilePicture(SELF_PROFILE_ID, croppedFile);
      setRefreshKey((key) => key + 1);
      setSuccess("Profile photo updated successfully.");
      setPhotoToCrop(null);
    } catch (err) {
      setError(err.message || "Unable to upload photo. Please try confirming again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (busy || !window.confirm("Remove your profile photo?")) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await deleteProfilePicture(SELF_PROFILE_ID);
      setRefreshKey((key) => key + 1);
      setSuccess("Profile photo removed successfully.");
    } catch (err) {
      setError(err.message || "Unable to remove photo.");
    } finally {
      setBusy(false);
    }
  }

  function handleLogout() {
    if (busy || !window.confirm("Are you sure you want to log out?")) return;
    clearFamilyKitSession();
    navigate("/login", { replace: true });
  }

  return (
    <div className="fk-my-profile-page">
      <header className="fk-my-profile-header">
        <button type="button" aria-label="Back to dashboard" onClick={() => navigate("/my-family")}>
          <ArrowLeft size={22} />
        </button>
        <h1>My Profile</h1>
        <span />
      </header>
      <main className="fk-my-profile-main">
        <section className="fk-my-profile-card">
          <ProfileAvatar
            memberId={SELF_PROFILE_ID}
            name={name}
            refreshKey={refreshKey}
            className="fk-my-profile-avatar"
          />
          <h2>{loading ? "Loading..." : name}</h2>
          <p>Registered User</p>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" onChange={handleUpload} disabled={busy} hidden />
          <div className="fk-my-profile-actions">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={busy}>
              <Camera size={18} /> {busy ? "Processing..." : "Upload / Change Photo"}
            </button>
            <button type="button" onClick={handleRemove} disabled={busy}>
              <Trash2 size={18} /> Remove Photo
            </button>
          </div>
          <small>JPG or PNG · Maximum 5 MB</small>
          {error && <p className="fk-my-profile-error" role="alert">{error}</p>}
          {success && <p className="fk-my-profile-success" role="status">{success}</p>}
          <button type="button" className="profile-logout-btn" onClick={handleLogout} disabled={busy}>
            Log Out
          </button>
        </section>
      </main>
      {photoToCrop && (
        <ProfilePhotoCropper
          file={photoToCrop}
          onConfirm={handleCropConfirm}
          onCancel={() => { if (!busy) setPhotoToCrop(null); }}
        />
      )}
    </div>
  );
}
