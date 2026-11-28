import { useEffect, useState } from "react";
import { ChevronLeft, UserRound } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { dependentProfileAction } from "./api/familyConnectionsApi.js";
import ProfileAvatar from "./components/ProfileAvatar.jsx";
import MobileProfileDetails, { MobileProfileActions } from "./components/MobileProfileDetails.jsx";
import { DependentActivity } from "./components/DependentPermissions.jsx";
import FamilyBottomNav from "./components/FamilyBottomNav.jsx";
import "./FamilyMemberProfile.css";

const editFields = [
  ["name", "Name"], ["dateOfBirth", "Date of birth", "date"], ["height", "Height (cm)"],
  ["weight", "Weight (kg)"], ["bloodGroup", "Blood group"], ["mobile", "Mobile number"],
  ["email", "Email", "email"], ["address", "Address"],
];

export default function SharedDependentProfile() {
  const { memberId } = useParams();
  const fromHome = useLocation().state?.fromHome === true;
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError("");
    dependentProfileAction("open", { memberId }, controller.signal).then((result) => {
      if (!controller.signal.aborted) setData(result);
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message);
    });
    return () => controller.abort();
  }, [memberId, revision]);

  async function save(event) {
    event.preventDefault();
    if (!form || busy) return;
    setBusy(true);
    setError("");
    try {
      await dependentProfileAction("edit", { memberId, profile: form, updatedAt: data.member.updatedAt });
      setForm(null);
      setRevision((value) => value + 1);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function changePhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busy) return;
    if (file.size > 1_048_576 || !["image/jpeg", "image/png"].includes(file.type)) {
      setError("Choose a JPEG or PNG up to 1 MB.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      await dependentProfileAction("photo", { memberId, base64: btoa(binary), mime: file.type, updatedAt: data.member.updatedAt });
      setForm(null);
      setRevision((value) => value + 1);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function viewDocument(documentId) {
    setError("");
    try {
      const { url } = await dependentProfileAction("document", { memberId, documentId });
      window.location.assign(url);
    } catch (failure) {
      setError(failure.message);
    }
  }

  const member = data?.member;
  return <div className="fk-profile-page">
    <header className="fk-profile-header fk-glass-header">
      <Link to={fromHome ? "/my-family" : "/family"} aria-label={fromHome ? "Back to Home" : "Back to My Family"}><ChevronLeft /></Link>
      <h1>Family Member Profile</h1><span className="fk-profile-header-space" />
    </header>
    <main className="fk-profile-main">
      {error && <p role="alert">{error}</p>}
      {!member ? !error && <p role="status">Loading shared profile...</p> : <>
        <section className="fk-profile-hero fk-profile-compact-view">
          <div className="fk-profile-view-content fk-mobile-profile-card">
            <div className="fk-profile-avatar">
              <ProfileAvatar connectedPhotoUrl={member.photoUrl || null} name={member.name}><UserRound size={48} /></ProfileAvatar>
            </div>
            <div className="fk-mobile-profile-identity">
              <h2>{member.name}</h2>
              <div className="fk-profile-relation-row"><p>{member.relationship}</p></div>
            </div>
            <MobileProfileDetails member={member} />
            <MobileProfileActions member={member} mobile={member.mobile} canShare={false} />
          </div>
        </section>
        {member.profileAccess === "edit" && !form && <button type="button" className="fk-document-primary"
          onClick={() => setForm(Object.fromEntries(editFields.map(([key]) => [key, member[key] || ""])))}>
          Edit shared profile
        </button>}
        {form && <form onSubmit={save} className="fk-profile-card fk-family-invitation-controls">
          {editFields.map(([key, label, type]) => <label key={key}>{label}
            <input type={type || "text"} value={form[key]} required={key === "name"} disabled={busy}
              onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
          </label>)}
          <label>Change photo
            <input type="file" accept="image/jpeg,image/png" onChange={changePhoto} disabled={busy} />
          </label>
          <button type="submit" disabled={busy}>{busy ? "Saving..." : "Save changes"}</button>
          <button type="button" disabled={busy} onClick={() => setForm(null)}>Cancel</button>
        </form>}
        <section className="fk-profile-card">
          <h3>Connected Documents</h3>
          {data.documents.length ? <ul>{data.documents.map(({ id, fileName }) => <li key={id}>
            <button type="button" onClick={() => viewDocument(id)}>View {fileName}</button>
          </li>)}</ul> : <p>No documents shared.</p>}
        </section>
        <section className="fk-profile-card"><DependentActivity entries={data.activity} /></section>
      </>}
    </main>
    <FamilyBottomNav active={fromHome ? "home" : "family"} />
  </div>;
}
