import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStoredAccessToken } from "./auth/sessionManager.js";
import { connectionsEnabled, forgetInvitation, pendingInvitation, previewInvitation, rememberInvitation, updateInvitation } from "./api/familyConnectionsApi.js";
import "./FamilyMembersPage.css";

export default function FamilyInvitationPage() {
  const navigate = useNavigate();
  const [token] = useState(() => new URLSearchParams(location.hash.slice(1)).get("token") || pendingInvitation());
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState("");
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

  async function respond(action) {
    setBusy(true);
    setError("");
    try {
      await updateInvitation(action, token);
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
              <p>Connecting keeps document access separate.</p>
              {getStoredAccessToken() ? (
                <div className="fk-family-invitation-controls">
                  <button type="button" disabled={busy} onClick={() => respond("accept")}>Accept invitation</button>
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
