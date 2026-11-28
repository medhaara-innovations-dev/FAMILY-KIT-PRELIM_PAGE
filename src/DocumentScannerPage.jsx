import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFamilyMembers } from "./api/familyMembersApi.js";
import { SELF_PROFILE_ID } from "./api/profilePicturesApi.js";
import { scannerAvailable, scannerRequest, stageScan } from "./api/documentScannerApi.js";
import "./DocumentScannerPage.css";

const formats = {
  pdf: ["application/pdf", 10 * 1024 ** 2],
  jpg: ["image/jpeg", 3_750_000],
  jpeg: ["image/jpeg", 3_750_000],
  png: ["image/png", 3_750_000],
};

const statusLabels = { QUEUED: "Waiting to scan", SCANNING: "Scanning", READY: "Ready",
  FAILED: "Scan failed", STALLED: "Scan did not finish" };

function Fields({ fields }) {
  const entries = Object.entries(fields || {}).filter(([, value]) => value);
  if (!entries.length) return <p>No details extracted.</p>;
  return <dl>{entries.map(([field, value]) => (
    <div key={field}><dt>{field.replace(/([A-Z])/g, " $1")}</dt><dd>{value}</dd></div>
  ))}</dl>;
}

function ScanDetails({ document, onClose }) {
  const data = document.extracted;
  return <section className="fk-scanner-card" aria-label="Saved scan details">
    <h2>{data?.title || document.fileName}</h2>
    {data ? <>
      <p>Document type: {data.documentType}</p>
      <p>Check these extracted details against the original.</p>
      <h3>Policy details</h3><Fields fields={data.policy} />
      <h3>Covered members</h3><p>{data.coveredMembers.join(", ") || "None extracted."}</p>
      <h3>Advisor Contact</h3><Fields fields={data.advisorContact} />
      <h3>Nominees</h3>
      {data.nominees.length ? data.nominees.map((nominee, index) => <Fields key={index} fields={nominee} />)
        : <p>None extracted.</p>}
    </> : <p>{statusLabels[document.scanStatus]}</p>}
    <button type="button" onClick={onClose}>Close details</button>
  </section>;
}

export default function DocumentScannerPage() {
  const [file, setFile] = useState(null);
  const [stagedId, setStagedId] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [profileError, setProfileError] = useState("");
  const [memberId, setMemberId] = useState(SELF_PROFILE_ID);
  const [documents, setDocuments] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!scannerAvailable) return;
    const controller = new AbortController();
    getFamilyMembers(controller.signal).then(setProfiles).catch(() => {
      if (!controller.signal.aborted) setProfileError("Other family profiles could not be loaded.");
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!scannerAvailable) return;
    const controller = new AbortController();
    let timer;
    async function load() {
      try {
        const { documents: saved } = await scannerRequest("", { signal: controller.signal });
        if (controller.signal.aborted) return;
        setDocuments(saved);
        setListError("");
        if (saved.some(({ scanStatus }) => scanStatus === "QUEUED" || scanStatus === "SCANNING")) {
          timer = window.setTimeout(load, 3000);
        }
      } catch (failure) {
        if (!controller.signal.aborted) setListError(failure.message);
      }
    }
    load();
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [revision]);

  async function submit(event) {
    event.preventDefault();
    if (!file || busy) return;
    const format = formats[file.name.split(".").pop()?.toLowerCase()];
    if (!format || file.size === 0 || file.size > format[1]) {
      setError("Choose a PDF up to 10 MiB, or a JPG or PNG up to 3.75 MB.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const id = stagedId || await stageScan(file, format[0]);
      setStagedId(id);
      await scannerRequest(`/${id}/complete`, { data: { fileName: file.name, mime: format[0], memberId } });
      form.reset();
      setStagedId(null);
      setFile(null);
      setRevision((value) => value + 1);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  async function openDocument(id, original = false) {
    setError("");
    try {
      const data = await scannerRequest(`/${id}${original ? "/original" : ""}`);
      if (original) window.location.assign(data.url);
      else setSelected(data);
    } catch (failure) {
      setError(failure.message);
    }
  }

  return <main className="fk-scanner-page">
    <header><Link to="/documents">Back to Documents</Link><h1>Document Scanner</h1></header>
    {!scannerAvailable ? <p>The scanner is unavailable in this environment.</p> : <>
      <form className="fk-scanner-card" onSubmit={submit}>
        <label>Document<input type="file" accept=".pdf,.jpg,.jpeg,.png" required disabled={busy}
          onChange={(event) => { setFile(event.target.files?.[0] || null); setStagedId(null); }} /></label>
        <label>Family profile<select value={memberId} disabled={busy} onChange={(event) => setMemberId(event.target.value)}>
          <option value={SELF_PROFILE_ID}>Me</option>
          {profiles.map((profile) => <option key={profile.memberId} value={profile.memberId}>{profile.name}</option>)}
        </select></label>
        {profileError && <p role="status">{profileError}</p>}
        <button type="submit" disabled={busy}>{busy ? "Uploading..." : "Upload and scan"}</button>
      </form>
      {error && <p role="alert">{error}</p>}
      <section aria-label="Uploaded scans">
        <h2>Saved documents</h2>
        {listError ? <p role="alert">{listError} <button type="button" onClick={() => setRevision((value) => value + 1)}>Retry</button></p>
          : documents ? (!documents.length && <p>No scanned documents yet.</p>) : <p role="status">Loading documents...</p>}
        {documents?.map((document) => <article key={document.documentId} className="fk-scanner-card">
          <h3>{document.fileName}</h3>
          <p>{document.memberId === SELF_PROFILE_ID ? "Me" : profiles.find(({ memberId }) => memberId === document.memberId)?.name || "Family profile"}</p>
          <p>{statusLabels[document.scanStatus]}</p>
          <div className="fk-scanner-actions">
            {document.scanStatus === "READY" && <button type="button" onClick={() => openDocument(document.documentId)}>View</button>}
            <button type="button" onClick={() => openDocument(document.documentId, true)}>Download original</button>
          </div>
        </article>)}
      </section>
      {selected && <ScanDetails document={selected} onClose={() => setSelected(null)} />}
    </>}
  </main>;
}
