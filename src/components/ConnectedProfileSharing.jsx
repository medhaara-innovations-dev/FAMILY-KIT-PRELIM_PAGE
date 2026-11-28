import { useEffect, useState } from "react";
import { familyConnection, updateConnectionProfileSharing } from "../api/familyConnectionsApi.js";

const fields = [
  ["dateOfBirth", "Date of birth"], ["height", "Height"], ["weight", "Weight"],
  ["bloodGroup", "Blood group"], ["address", "Address"], ["mobile", "Mobile number"],
  ["instagramUrl", "Instagram"], ["facebookUrl", "Facebook"], ["linkedinUrl", "LinkedIn"],
];

export default function ConnectedProfileSharing({ onClose }) {
  const [connection, setConnection] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    familyConnection(controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setConnection(result.connection);
      setSelected(result.mySharedProfileFields || []);
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, []);

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await updateConnectionProfileSharing(selected);
      setSelected(result.mySharedProfileFields);
      setMessage("Sharing preferences saved.");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }

  return <section className="fk-profile-card" aria-labelledby="fk-profile-sharing-heading">
    <h2 id="fk-profile-sharing-heading">Share profile details</h2>
    {loading ? <p role="status">Checking family connection...</p>
      : connection ? <form onSubmit={save}>
        <p>Choose what {connection.name} can see. Edits to shared fields appear on your connected card.</p>
        <fieldset disabled={saving}>
          <legend>Profile details</legend>
          {fields.map(([id, label]) => <p key={id}><label>
            <input type="checkbox" checked={selected.includes(id)} onChange={(event) => {
              const checked = event.target.checked;
              setSelected((current) => checked ? [...current, id] : current.filter((field) => field !== id));
              setMessage("");
            }} /> {label}
          </label></p>)}
        </fieldset>
        <button type="submit" className="fk-document-primary" disabled={saving}>Save sharing preferences</button>
      </form> : !error && <p>Connect a family member to share profile details.</p>}
    {message && <p role="status">{message}</p>}
    {error && <p role="alert">{error}</p>}
    <button type="button" onClick={onClose} disabled={saving}>Close</button>
  </section>;
}
