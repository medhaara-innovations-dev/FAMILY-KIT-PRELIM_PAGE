import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, Camera, Pencil, Trash2 } from "lucide-react";
import { getFamilyKitProfile, updateFamilyKitProfile } from "./auth/authService.js";
import { getValidAccessToken, clearFamilyKitSession } from "./auth/sessionManager.js";
import {
  SELF_PROFILE_ID,
  uploadProfilePicture,
  deleteProfilePicture,
} from "./api/profilePicturesApi.js";
import ProfileAvatar from "./components/ProfileAvatar.jsx";
import FamilyBottomNav from "./components/FamilyBottomNav.jsx";
import MobileProfileDetails, { MobileConnectedDocuments, MobileProfileActions } from "./components/MobileProfileDetails.jsx";
import ProfileFields, { ownerProfileFields, SocialProfileFields } from "./components/ProfileFields.jsx";
import { getChangedSocialLinks, verifySavedSocialLinks } from "./socialProfileLinks.js";
import ProfilePhotoCropper from "./ProfilePhotoCropper.jsx";
import "./MyProfile.css";

export default function MyProfile() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const fromFamily = state?.fromFamily === true;
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [photoToCrop, setPhotoToCrop] = useState(null);
  const [profileForm, setProfileForm] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const name = profile.yourName || "Me";

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
        if (active) setProfile(profile);
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
    if (!["image/jpeg", "image/png", "image/svg+xml"].includes(file.type)) {
      setError("Only JPG, PNG and SVG images are allowed.");
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

  function openProfileEditor() {
    setProfileError("");
    setSuccess("");
    const { yourName, ...details } = profile;
    setProfileForm({ ...details, name: yourName || "" });
  }

  function updateProfileField(field, value) {
    setProfileForm((previous) => ({ ...previous, [field]: value }));
    setProfileError("");
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!profileForm || savingProfile || busy) return;
    const yourName = profileForm.name.trim();
    const details = Object.fromEntries(ownerProfileFields.filter((field) => field !== "name")
      .map((field) => [field, profileForm[field] || ""]));
    if (!yourName || !details.familyName?.trim()) {
      setProfileError("Full name and family name are required.");
      return;
    }
    setProfileError("");
    setSavingProfile(true);
    try {
      const links = getChangedSocialLinks(profileForm, profile);
      const updated = await updateFamilyKitProfile({ ...details, yourName, ...links });
      verifySavedSocialLinks(updated, links);
      setProfile(updated);
      setProfileForm(null);
      setSuccess("Profile updated.");
    } catch (err) {
      setProfileError(err.message || "Unable to save profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <div className="fk-my-profile-page">
      <header className="fk-my-profile-header fk-glass-header">
        <button type="button" aria-label={fromFamily ? "Back to My Family" : "Back to dashboard"} onClick={() => navigate(fromFamily ? "/family" : "/my-family")}>
          <ChevronLeft size={22} />
        </button>
        <h1>
          <span className="fk-profile-desktop-only">My Profile</span>
          <span className="fk-profile-mobile-only">User Profile</span>
        </h1>
        <span />
      </header>
      <main className="fk-my-profile-main">
        <section className="fk-my-profile-card fk-mobile-profile-card">
          <div className="fk-my-profile-avatar-slot">
            <ProfileAvatar
              memberId={SELF_PROFILE_ID}
              name={name}
              refreshKey={refreshKey}
              className="fk-my-profile-avatar"
            />
            <button type="button" className="fk-profile-camera-button fk-my-profile-mobile-camera"
              onClick={() => fileInputRef.current?.click()} disabled={busy || loading || savingProfile}
              aria-label="Upload or change profile photo">
              <Camera size={16} aria-hidden="true" />
            </button>
          </div>
          <div className="fk-mobile-profile-identity">
            <h2><span className="fk-profile-mobile-only">Name: </span>{loading ? "Loading..." : name}</h2>
            <div className="fk-profile-relation-row">
              <p>
                <span className="fk-profile-desktop-only">Registered User</span>
                <span className="fk-profile-mobile-only">Self</span>
              </p>
              <button type="button" className="fk-profile-inline-edit" disabled={busy || loading || Boolean(profileForm)}
                aria-label="Edit profile" aria-expanded={Boolean(profileForm)}
                aria-controls={profileForm ? "fk-self-profile-edit" : undefined}
                onClick={openProfileEditor}>
                <Pencil size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
          {!loading && <MobileProfileDetails member={profile} />}
          {!loading && <MobileProfileActions mobile={profile.mobile} profile={profile} canShare={false} />}
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/svg+xml,.svg" onChange={handleUpload} disabled={busy} hidden />
          <div className="fk-my-profile-actions fk-profile-desktop-only">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={busy}>
              <Camera size={18} /> {busy ? "Processing..." : "Upload / Change Photo"}
            </button>
            <button type="button" onClick={handleRemove} disabled={busy}>
              <Trash2 size={18} /> Remove Photo
            </button>
          </div>
          <small className="fk-profile-desktop-only">JPG, PNG or SVG · Maximum 5 MB</small>
          {error && <p className="fk-my-profile-error" role="alert">{error}</p>}
          {success && <p className="fk-my-profile-success" role="status">{success}</p>}
          {!fromFamily && (
            <button type="button" className="profile-logout-btn fk-profile-desktop-only" onClick={handleLogout} disabled={busy}>
              Log Out
            </button>
          )}
        </section>
        {profileForm && (
          <form className="fk-profile-card fk-self-profile-edit" id="fk-self-profile-edit" onSubmit={saveProfile}>
            <h3>Edit Profile</h3>
            <fieldset className="fk-self-profile-fields" disabled={savingProfile}>
              <ProfileFields fields={ownerProfileFields} requiredFields={["name", "familyName"]}
                values={profileForm} onChange={updateProfileField} />
              <SocialProfileFields values={profileForm} onChange={updateProfileField} />
            </fieldset>
            {profileError && <p className="fk-my-profile-error" role="alert">{profileError}</p>}
            <div className="fk-profile-actions">
              <button type="button" className="fk-profile-cancel" disabled={savingProfile || busy}
                onClick={() => setProfileForm(null)}>Cancel</button>
              <button type="submit" className="fk-profile-save" disabled={savingProfile || busy}>
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
        <MobileConnectedDocuments />
        {!fromFamily && (
          <div className="fk-self-mobile-account-actions fk-profile-mobile-only">
            <button type="button" onClick={handleLogout} disabled={busy}>Log Out</button>
          </div>
        )}
      </main>
      <FamilyBottomNav active={fromFamily ? "family" : "home"} mobileOnly />
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
