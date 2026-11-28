import { useEffect, useState } from "react";
import { dependentProfileAction } from "../api/familyConnectionsApi.js";

const accessLabels = { none: "No access", view: "View only", edit: "Can edit" };
const documentModes = [
  ["none", "No documents"], ["selected", "View selected documents"],
  ["existing", "View all current documents"], ["future", "View all current and future documents"],
];

export function DependentActivity({ entries }) {
  return <section aria-label="Recent profile activity">
    <h4>Recent profile activity</h4>
    {entries.length ? (<ul>{entries.map(({ by, at }, index) => <li key={`${at}-${index}`}>
      {by} updated the profile / <time dateTime={at}>{new Date(at).toLocaleString()}</time>
    </li>)}</ul>) : <p>No profile edits recorded yet.</p>}
  </section>;
}

export default function DependentPermissions({ memberId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    dependentProfileAction("permissions", { memberId }, controller.signal).then((result) => {
      if (!controller.signal.aborted) setData(result);
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message);
    });
    return () => controller.abort();
  }, [memberId]);

  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p role="status">Loading access and permissions...</p>;
  return <div className="fk-family-invitation-controls">
    <p>Choose who can view or edit this profile and which documents they can view.</p>
    {data.recipients.map((recipient) => <RecipientPermissions key={recipient.id} recipient={recipient}
      documents={data.documents} memberId={memberId} />)}
    <DependentActivity entries={data.activity} />
  </div>;
}

function RecipientPermissions({ recipient, documents, memberId }) {
  const [access, setAccess] = useState(recipient.profileAccess || "none");
  const [mode, setMode] = useState(recipient.documentAccess || "none");
  const [relation, setRelation] = useState(recipient.relationship || "");
  const [selected, setSelected] = useState(recipient.documentIds || []);
  const [refreshSnapshot, setRefreshSnapshot] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(recipient);

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await dependentProfileAction("grant", {
        memberId, recipient: recipient.id, relationship: relation, profileAccess: access,
        documentAccess: mode, documentIds: selected, refreshSnapshot,
      });
      setSummary(result.permissions);
      setRefreshSnapshot(false);
      setMessage("Permissions saved.");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={save}>
    <fieldset disabled={busy}>
      <legend>{recipient.name}</legend>
      <p>{accessLabels[summary.profileAccess || "none"]} / {summary.documentAccess === "future"
        ? "Can view all current and future documents" : `Can view ${summary.documentIds?.length || 0} documents`}</p>
      <label>Profile access<select value={access} onChange={(event) => setAccess(event.target.value)}>
        {Object.entries(accessLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select></label>
      {access !== "none" && <>
        <label>Relationship as seen by {recipient.name}<input value={relation} maxLength={80}
          placeholder="Use the current relationship" onChange={(event) => setRelation(event.target.value)} /></label>
        <label>Document access<select value={mode} onChange={(event) => setMode(event.target.value)}>
          {documentModes.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select></label>
        {mode === "selected" && (documents.length ? documents.map(({ id, fileName }) => <label key={id}>
          <input type="checkbox" checked={selected.includes(id)} onChange={(event) => {
            const checked = event.target.checked;
            setSelected((current) => checked ? [...current, id] : current.filter((value) => value !== id));
          }} /> {fileName}
        </label>) : <p>No documents available.</p>)}
        {mode === "existing" && summary.documentAccess === "existing" && <label>
          <input type="checkbox" checked={refreshSnapshot} onChange={(event) => setRefreshSnapshot(event.target.checked)} />
          Include documents added since this access was last granted
        </label>}
        {mode === "future" && <p>New documents under this profile will be shared automatically.</p>}
      </>}
      <button type="submit">{busy ? "Saving..." : "Save permissions"}</button>
    </fieldset>
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{error}</p>}
  </form>;
}
