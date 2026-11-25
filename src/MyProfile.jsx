import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BadgeCheck, Bell, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Fingerprint, HeartHandshake, HeartPulse, KeyRound, Link2, LockKeyhole, Mail, MapPin, Pencil, Phone, Settings, Shield, Trash2 } from "lucide-react";
import { CameraIcon } from "./components/ReferenceIcons.jsx";
import { getFamilyKitProfile, loginWithFamilyKitPin, updateFamilyKitProfile } from "./auth/authService.js";
import { getValidAccessToken, clearFamilyKitSession, getVerifiedAccountContacts, getStoredSessionSubject, getAccessTokenSubject } from "./auth/sessionManager.js";
import {
  SELF_PROFILE_ID,
  uploadProfilePicture,
  deleteProfilePicture,
} from "./api/profilePicturesApi.js";
import ProfileAvatar from "./components/ProfileAvatar.jsx";
import FamilyBottomNav from "./components/FamilyBottomNav.jsx";
import MobileProfileDetails, { MobileConnectedDocuments, MobileProfileActions } from "./components/MobileProfileDetails.jsx";
import ProfileFields, { ownerProfileFields } from "./components/ProfileFields.jsx";
import { getChangedSocialLinks, verifySavedSocialLinks } from "./socialProfileLinks.js";
import ProfilePhotoCropper from "./ProfilePhotoCropper.jsx";
import "./MyProfile.css";

function SettingsRow({ icon: Icon, label, value, verified, onClick, toggle = false }) {
  const content = <>
    <span className="fk-settings-row-icon"><Icon size={17} aria-hidden="true" /></span>
    <span className="fk-settings-row-copy"><strong>{label}</strong>{value && <small>{value}</small>}</span>
    {verified && <BadgeCheck className="fk-settings-verified" size={20} aria-label="Verified" />}
    {toggle ? <span className="fk-settings-toggle" aria-hidden="true" /> : <ChevronRight size={17} aria-hidden="true" />}
  </>;
  return <button type="button" className="fk-settings-row" disabled={!onClick} onClick={onClick}>{content}</button>;
}

function ProfileDisclosure({ icon: Icon, title, children }) {
  return <details className="fk-settings-disclosure" name="fk-settings-edit-sections">
    <summary><span className="fk-settings-row-icon"><Icon size={16} aria-hidden="true" /></span>{title}
      <ChevronDown size={16} aria-hidden="true" />
    </summary>
    <div className="fk-settings-disclosure-content">{children}</div>
  </details>;
}

function readProfileAddress(address = "") {
  const match = address.match(/^([\s\S]*?)\nState: ?([^\n]*)\nCity: ?([^\n]*)\nPIN code: ?([^\n]*)$/);
  return match
    ? { street: match[1], state: match[2], city: match[3], pinCode: match[4] }
    : { street: address, state: "", city: "", pinCode: "" };
}

function formatProfileAddress({ street, state, city, pinCode }) {
  if (!state && !city && !pinCode) return street.trim();
  return `${street.trim()}\nState: ${state.trim()}\nCity: ${city.trim()}\nPIN code: ${pinCode.trim()}`;
}

export default function MyProfile() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const fromFamily = state?.fromFamily === true;
  const readOnly = fromFamily || state?.readOnly === true;
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [photoToCrop, setPhotoToCrop] = useState(null);
  const [profileForm, setProfileForm] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasCustomPhoto, setHasCustomPhoto] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmingPin, setConfirmingPin] = useState(false);
  const [pin, setPin] = useState("");
  const [checkingPin, setCheckingPin] = useState(false);
  const pinDialog = useRef(null);
  const name = profile.yourName || "Me";
  const contacts = getVerifiedAccountContacts();

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
    if (!file || busy || !profileForm || readOnly) return;
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
    if (busy || !profileForm || readOnly) return;
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
    if (busy || !profileForm || readOnly || !window.confirm("Remove your profile photo?")) return;
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
    navigate("/", { replace: true });
  }

  function openProfileEditor() {
    if (readOnly || !contacts.email) return;
    setProfileError("");
    setSuccess("");
    setPin("");
    setConfirmingPin(true);
    pinDialog.current?.showModal();
  }

  function closePinDialog() {
    if (checkingPin) return;
    setPin("");
    setConfirmingPin(false);
    setProfileError("");
    pinDialog.current?.close();
  }

  async function verifyProfilePin(event) {
    event.preventDefault();
    if (readOnly || checkingPin || !confirmingPin || !/^\d{4}$/.test(pin) || !contacts.email) return;
    const subject = getStoredSessionSubject();
    setCheckingPin(true);
    setProfileError("");
    try {
      await getValidAccessToken();
      if (!subject || subject !== getStoredSessionSubject()) throw new Error("Authentication session changed.");
      const proof = await loginWithFamilyKitPin(contacts.email, pin);
      if (subject !== getStoredSessionSubject() || getAccessTokenSubject(proof.accessToken) !== subject) {
        throw new Error("Authentication session changed.");
      }
      const { yourName, ...details } = profile;
      setProfileForm({ ...details, name: yourName || "", ...readProfileAddress(details.address) });
      setConfirmingPin(false);
      pinDialog.current?.close();
    } catch {
      setProfileError("Couldn’t confirm your PIN. Check it and try again.");
    } finally {
      setCheckingPin(false);
      setPin("");
    }
  }

  function updateProfileField(field, value) {
    setProfileForm((previous) => ({ ...previous, [field]: value }));
    setProfileError("");
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!profileForm || readOnly || savingProfile || busy) return;
    const yourName = profileForm.name.trim();
    const details = Object.fromEntries(ownerProfileFields.filter((field) => !["name", "mobile", "email"].includes(field))
      .map((field) => [field, profileForm[field] || ""]));
    details.address = formatProfileAddress(profileForm);
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
    <div className={`fk-my-profile-page${readOnly ? "" : " fk-profile-settings-page"}`}>
      <header className="fk-my-profile-header fk-glass-header">
        <button type="button" aria-label={profileForm && !readOnly ? "Back to Profile & Settings" : fromFamily ? "Back to My Family" : "Back to dashboard"}
          disabled={savingProfile || busy} onClick={() => {
            if (profileForm && !readOnly) setProfileForm(null);
            else navigate(fromFamily ? "/family" : "/my-family");
          }}>
          <ChevronLeft size={22} />
        </button>
        <h1>{readOnly ? "My Profile" : profileForm ? "Edit Profile" : "Profile & Settings"}</h1>
        <span />
      </header>
      <main className="fk-my-profile-main">
        {readOnly ? <section className="fk-my-profile-card fk-mobile-profile-card">
          <div className="fk-my-profile-avatar-slot">
            <ProfileAvatar
              memberId={SELF_PROFILE_ID}
              name={name}
              refreshKey={refreshKey}
              className="fk-my-profile-avatar"
            />
          </div>
          <div className="fk-mobile-profile-identity">
            <h2>{loading ? "Loading..." : name}</h2>
            <div className="fk-profile-relation-row">
              <p>
                Self
              </p>
            </div>
          </div>
          {!loading && <MobileProfileDetails member={profile} />}
          {!loading && <MobileProfileActions mobile={profile.mobile} profile={profile} canShare={false} />}
        </section> : !profileForm && (
          <>
            <section className="fk-settings-card">
              <div className="fk-settings-identity">
                <ProfileAvatar memberId={SELF_PROFILE_ID} name={name} refreshKey={refreshKey} className="fk-settings-avatar" />
                <div>
                  <div className="fk-settings-name"><h2>{loading ? "Loading…" : name}</h2><span>Self</span></div>
                  <p>Personal FamilyKit account</p>
                </div>
                <button type="button" className="fk-settings-edit" aria-label="Edit profile" aria-haspopup="dialog"
                  disabled={loading || Boolean(error) || !contacts.email} onClick={openProfileEditor}>
                  <Pencil size={17} aria-hidden="true" />
                </button>
              </div>
              {!loading && <div className="fk-settings-details">
                <SettingsRow icon={Mail} label="Email" value={contacts.email || "Verified email unavailable"} verified={Boolean(contacts.email)} />
                <SettingsRow icon={Phone} label="Mobile Number" value={contacts.mobile || "No verified mobile number"} verified={Boolean(contacts.mobile)} />
                <SettingsRow icon={MapPin} label="Current Address" value={profile.address || "Not added"}
                  onClick={!error && contacts.email ? openProfileEditor : undefined} />
              </div>}
              {!loading && !contacts.email && <p>Sign in again with your verified email to edit your profile.</p>}
            </section>
            <section className="fk-settings-card fk-settings-actions" aria-label="Account actions">
              <SettingsRow icon={KeyRound} label="Reset PIN" onClick={() => navigate("/forgot-pin", { state: { fromProfileSettings: true } })} />
              <SettingsRow icon={Fingerprint} label="Biometric Password" toggle />
            </section>
            <section className="fk-settings-card" aria-label="Referral">
              <SettingsRow icon={HeartHandshake} label="Refer a Family" />
            </section>
            <section className="fk-settings-card" aria-label="Settings">
              <SettingsRow icon={Shield} label="Account & Security" />
              <SettingsRow icon={LockKeyhole} label="Access & Permissions" />
              <SettingsRow icon={Bell} label="Manage Notifications" />
              <SettingsRow icon={Settings} label="App Preferences" />
              <SettingsRow icon={CircleHelp} label="Help & Support" />
            </section>
            <button type="button" className="fk-settings-signout" onClick={handleLogout} disabled={busy}>Sign Out</button>
          </>
        )}
        {error && <p className="fk-my-profile-error" role="alert">{error}</p>}
        {success && <p className="fk-my-profile-success" role="status">{success}</p>}
        {!readOnly && profileForm && (
          <form className="fk-profile-card fk-self-profile-edit" id="fk-self-profile-edit" onSubmit={saveProfile}>
            <div className="fk-settings-editor-card">
            <div className="fk-settings-editor-photo">
              <div className="fk-settings-avatar-wrap">
                <ProfileAvatar memberId={SELF_PROFILE_ID} name={name} refreshKey={refreshKey}
                  className="fk-settings-avatar" onPhotoChange={setHasCustomPhoto} />
                <button type="button" className="fk-settings-editor-camera" onClick={() => fileInputRef.current?.click()}
                  disabled={busy || savingProfile} aria-label={hasCustomPhoto ? "Change profile photo" : "Add profile photo"}>
                  <CameraIcon size={16} />
                </button>
                {hasCustomPhoto && (
                  <button type="button" className="fk-settings-editor-trash" onClick={handleRemove}
                    disabled={busy || savingProfile} aria-label="Remove profile photo">
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/svg+xml,.svg" onChange={handleUpload} hidden />
            </div>
            <fieldset className="fk-self-profile-fields" disabled={savingProfile || busy}>
              <ProfileFields fields={profile.familyName ? ["name"] : ["name", "familyName"]} requiredFields={["name", "familyName"]}
                values={profileForm} onChange={updateProfileField} />
              <label className="fk-profile-field"><span>Mobile number</span>
                <input type="tel" value={contacts.mobile || ""} placeholder="No verified mobile number" readOnly />
              </label>
              <label className="fk-profile-field"><span>Email</span>
                <input type="email" value={contacts.email || ""} placeholder="Verified email unavailable" readOnly />
              </label>
              <ProfileDisclosure icon={MapPin} title="Address">
                <div className="fk-settings-address-fields">
                  <label className="fk-profile-field"><span>Current address</span>
                    <textarea rows={2} value={profileForm.street} onChange={(event) => updateProfileField("street", event.target.value)} />
                  </label>
                  <label className="fk-profile-field"><span>State</span>
                    <input value={profileForm.state} onChange={(event) => updateProfileField("state", event.target.value)} />
                  </label>
                  <div className="fk-settings-field-pair">
                    <label className="fk-profile-field"><span>City</span>
                      <input value={profileForm.city} onChange={(event) => updateProfileField("city", event.target.value)} />
                    </label>
                    <label className="fk-profile-field"><span>PIN code</span>
                      <input value={profileForm.pinCode} inputMode="numeric" onChange={(event) => updateProfileField("pinCode", event.target.value)} />
                    </label>
                  </div>
                </div>
              </ProfileDisclosure>
              <ProfileDisclosure icon={HeartPulse} title="Additional Details">
                <ProfileFields fields={["bloodGroup", "dateOfBirth", "height", "weight"]} requiredFields={[]}
                  values={profileForm} onChange={updateProfileField} />
              </ProfileDisclosure>
              <ProfileDisclosure icon={Link2} title="Social Links">
                {[["instagramUrl", "Instagram link"], ["facebookUrl", "Facebook"], ["linkedinUrl", "LinkedIn"]].map(([field, label]) => (
                  <label key={field} className="fk-profile-field"><span>{label}</span>
                    <input type="url" value={profileForm[field] || ""} onChange={(event) => updateProfileField(field, event.target.value)} />
                  </label>
                ))}
                <label className="fk-profile-field"><span>WhatsApp</span>
                  <input type="tel" value={contacts.mobile || ""} placeholder="Uses your verified mobile number" readOnly />
                </label>
              </ProfileDisclosure>
            </fieldset>
            </div>
            {profileError && <p className="fk-my-profile-error" role="alert">{profileError}</p>}
            <div className="fk-profile-actions">
              <button type="button" className="fk-profile-cancel" disabled={savingProfile || busy}
                onClick={() => setProfileForm(null)}>Discard</button>
              <button type="submit" className="fk-profile-save" disabled={savingProfile || busy}>
                {savingProfile ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        )}
        {readOnly && <MobileConnectedDocuments />}
      </main>
      {!readOnly && <dialog ref={pinDialog} className="fk-family-actions-dialog" aria-labelledby="fk-settings-pin-title"
        onCancel={(event) => { event.preventDefault(); closePinDialog(); }}>
        <h2 id="fk-settings-pin-title">Confirm your PIN</h2>
        <form className="fk-settings-pin" onSubmit={verifyProfilePin}>
          <label htmlFor="fk-settings-pin">4-digit FamilyKit PIN</label>
          <input id="fk-settings-pin" type="password" inputMode="numeric" autoComplete="off" maxLength={4}
            value={pin} disabled={checkingPin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} required />
          {profileError && <p role="alert">{profileError}</p>}
          <div className="fk-profile-actions">
            <button type="button" className="fk-profile-cancel" disabled={checkingPin} onClick={closePinDialog}>Cancel</button>
            <button type="submit" className="fk-profile-save" disabled={checkingPin || pin.length !== 4}>{checkingPin ? "Checking…" : "Confirm"}</button>
          </div>
        </form>
      </dialog>}
      {readOnly && <FamilyBottomNav active={fromFamily ? "family" : "home"} />}
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
