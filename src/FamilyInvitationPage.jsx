import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStoredAccessToken } from "./auth/sessionManager.js";
import { connectionsEnabled, forgetInvitation, pendingInvitation, previewInvitation, rememberInvitation, updateInvitation } from "./api/familyConnectionsApi.js";
import "./FamilyMembersPage.css";

const reviewFields = [
  ["yourName", "Full name"], ["dateOfBirth", "Date of birth", "date"], ["height", "Height (cm)"],
  ["weight", "Weight (kg)"], ["bloodGroup", "Blood group"], ["address", "Address"],
];

export default function FamilyInvitationPage() {
  const navigate = useNavigate();
  const [token] = useState(() => new URLSearchParams(location.hash.slice(1)).get("token") || pendingInvitation());
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState("");
  const signedIn = Boolean(getStoredAccessToken());
  const [review, setReview] = useState(null);
  const [reviewError, setReviewError] = useState("");
  const [values, setValues] = useState({});
  const [shared, setShared] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!connectionsEnabled || !token) return;
    let active = true;
    if (location.hash) history.replaceState(history.state, "", "/?invite=1");
    previewInvitation(token).then((result) => {
      if (active) {
        rememberInvitation(token);
        setInvitation(result);
      }
    }).catch((cause) => { if (active) { forgetInvitation(); setError(cause.message); } });
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (!invitation || !signedIn) return;
    let active = true;
    updateInvitation("review", token).then((result) => {
      if (!active) return;
      setReview(result);
      setValues(result.profile || {});
    }).catch((failure) => { if (active) setReviewError(failure.message); });
    return () => { active = false; };
  }, [invitation, signedIn, token]);

  async function respond(action) {
    setBusy(true);
    setError("");
    try {
      const profile = Object.fromEntries(reviewFields.filter(([field]) => shared[field] && values[field]?.trim())
        .map(([field]) => [field, values[field]]));
      await updateInvitation(action, token, action === "accept" && review?.reviewRequired
        ? { reviewed: true, profile } : undefined);
      forgetInvitation();
      navigate("/family", { replace: true });
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="fk-family-page">
      <section className="fk-family-main fk-family-invitation-page">
        <h1>FamilyKit invitation</h1>
        {!token || !connectionsEnabled ? <p>This invitation is unavailable.</p> :
          invitation ? (
            <>
              <p>{invitation.inviterName} invited you to connect on FamilyKit.</p>
              <p>They will appear in My Family as your <strong>{invitation.relationship}</strong>.</p>
              <p>Accepting lets the inviter see your current profile details and photo. Documents stay private unless shared separately.</p>
              {signedIn ? (
                <div className="fk-family-invitation-controls">
                  {reviewError ? <p role="alert">{reviewError}</p> : !review && <p role="status">Checking profile review...</p>}
                  {review?.reviewRequired && <>
                    <h2>Review your profile details</h2>
                    <p>Choose which suggested edits to save to your profile. You can also keep the details already in your account. Your verified sign-in details stay the same.</p>
                    {reviewFields.map(([field, label, type]) => <div key={field}>
                      <label>{label}
                        <input type={type || "text"} value={values[field] || ""}
                          onChange={(event) => setValues({ ...values, [field]: event.target.value })} />
                      </label>
                      <label>
                        <input type="checkbox" checked={Boolean(shared[field])}
                          onChange={(event) => setShared({ ...shared, [field]: event.target.checked })} />
                        Save {label.toLowerCase()}
                      </label>
                    </div>)}
                  </>}
                  <button type="button" disabled={busy || !review} onClick={() => respond("accept")}>Accept invitation</button>
                  <button type="button" disabled={busy} onClick={() => respond("decline")}>Decline</button>
                </div>
              ) : <div className="fk-family-invitation-controls"><Link to="/signup">Sign Up</Link><Link to="/login">Log In</Link></div>}
            </>
          ) : !error && <p role="status">Checking invitation...</p>}
        {error && <p role="alert">{error}</p>}
        <Link to="/">Back to FamilyKit</Link>
      </section>
    </main>
  );
}
