import { useState } from "react";
import { RELATIONSHIPS } from "../familyMemberOptions.js";
import { createInvitation, updateInvitation } from "../api/familyConnectionsApi.js";

const relationships = [...RELATIONSHIPS, "Parent", "Child", "Sibling", "Grandchild"];

export default function FamilyInvitationForm({ canInvite, existingInvitation, initialRelationship = "", memberId, onChange }) {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const link = token ? `${location.origin}/?invite=1#token=${token}` : "";

  async function run(action) {
    setBusy(true);
    setError("");
    try {
      await action();
      onChange();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="fk-family-invite-info" className="fk-family-invitation-controls">
      {!token ? canInvite ? (
        <form onSubmit={(event) => {
          event.preventDefault();
          const fields = Object.fromEntries(new FormData(event.currentTarget));
          run(async () => {
            setToken((await createInvitation({ ...fields, ...(memberId && { memberId }) })).token);
            setMessage("");
          });
        }}>
          <label>How is this person related to you?
            <select required name="relationship" defaultValue={relationships.includes(initialRelationship) ? initialRelationship : ""}><option value="">Choose a relationship</option>
              {relationships.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label>How should they see you?
            <select required name="reverseRelationship" defaultValue=""><option value="">Choose a relationship</option>
              {relationships.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          {memberId && <label>Recipient's FamilyKit sign-in email
            <input type="email" name="verifiedAccountEmail" required maxLength={254} />
            <small>Used to verify who can review this profile. Share the link yourself.</small>
          </label>}
          <button type="submit" disabled={busy}>Create invitation link</button>
          <p>Creating a new link replaces any previous unused link.</p>
        </form>
      ) : <p>There is no available invitation slot for this account.</p> : (
        <>
          <label>Invitation link<input readOnly value={link} onFocus={(event) => event.target.select()} /></label>
          {typeof navigator.share === "function" && <button type="button" disabled={busy} onClick={() => run(async () => {
            try { await navigator.share({ title: "Connect on FamilyKit", url: link }); }
            catch (cause) { if (cause.name === "AbortError") return; throw cause; }
            setMessage("Share the link with the intended person, then confirm below.");
          })}>Share link</button>}
          <button type="button" disabled={busy} onClick={() => run(async () => {
            await navigator.clipboard.writeText(link);
            setMessage("Link copied. Send it to the intended person before confirming.");
          })}>Copy link</button>
          <button type="button" disabled={busy} onClick={() => run(async () => {
            await updateInvitation("shared", token);
            setMessage("Invitation sent.");
          })}>I’ve shared the invitation</button>
          <button type="button" disabled={busy} onClick={() => run(async () => {
            await updateInvitation("cancel", token);
            setToken("");
            setMessage("Invitation cancelled.");
          })}>Cancel invitation</button>
        </>
      )}
      {!token && existingInvitation && <button type="button" disabled={busy} onClick={() => run(async () => {
        await updateInvitation("cancel");
        setMessage("Invitation cancelled.");
      })}>Cancel existing invitation</button>}
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
