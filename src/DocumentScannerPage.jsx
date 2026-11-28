import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { getFamilyMembers } from "./api/familyMembersApi.js";
import { SELF_PROFILE_ID } from "./api/profilePicturesApi.js";
import { DOCUMENT_SAVED } from "./api/documentsApi.js";
import { completeScan, deleteScan, downloadScan, scannerAvailable, scannerRequest, scanFileMime, stageScan } from "./api/documentScannerApi.js";
import ScanProgress from "./components/ScanProgress.jsx";
import DocumentPreview from "./components/DocumentPreview.jsx";
import "./DocumentScannerPage.css";

export const statusLabels = { QUEUED: "Waiting to scan", SCANNING: "Scanning", READY: "Ready",
  FAILED: "Scan failed", STALLED: "Scan did not finish" };

function Fields({ fields }) {
  const entries = Object.entries(fields || {}).filter(([, value]) => value);
  if (!entries.length) return <p>No details extracted.</p>;
  return <dl>{entries.map(([field, value]) => (
    <div key={field}><dt>{field.replace(/([A-Z])/g, " $1")}</dt><dd>{value}</dd></div>
  ))}</dl>;
}

function AadhaarNumber({ documentId, lastFourDigits, canReveal }) {
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    if (number) {
      setNumber("");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await scannerRequest(`/${encodeURIComponent(documentId)}/aadhaar/reveal`, { method: "POST" });
      if (!/^[0-9]{12}$/.test(result.number)) throw new Error("The full Aadhaar number is unavailable.");
      setNumber(result.number);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return <dl><div>
    <dt>Aadhaar number</dt>
    <dd>
      {number ? number.replace(/([0-9]{4})(?=[0-9])/g, "$1 ") : `XXXX XXXX ${lastFourDigits}`}
      {canReveal && <button type="button" disabled={busy}
        aria-label={number ? "Hide Aadhaar number" : "Show Aadhaar number"} onClick={toggle}>
        {number ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
      </button>}
      {error && <span role="alert">{error}</span>}
    </dd>
  </div></dl>;
}

export function ScanDetails({ document, onClose }) {
  const data = document.extracted;
  const isAadhaar = /aadhaar|aadhar/i.test(data?.documentType || "");
  const hasInsuranceDetails = Object.values(data?.policy || {}).some(Boolean) ||
    Object.values(data?.advisorContact || {}).some(Boolean) ||
    data?.coveredMembers?.length || data?.nominees?.length;
  return <section className="fk-scanner-card" aria-label="Saved scan details">
    <h2>{data?.title || document.fileName}</h2>
    {data ? <>
      <p>Document type: {data.documentType}</p>
      <p>Check these extracted details against the original.</p>
      {isAadhaar ? <>
        <h3>Aadhaar details</h3>
        {data.aadhaar ? <Fields fields={{
          "Full name": data.aadhaar.fullName,
          "Date of birth": data.aadhaar.dateOfBirth,
          "Year of birth": data.aadhaar.yearOfBirth,
          "Gender": data.aadhaar.gender,
          "Address": data.aadhaar.address,
        }} /> : <p>This earlier scan saved only the document type and title.</p>}
        {data.aadhaar?.lastFourDigits && <AadhaarNumber key={document.documentId}
          documentId={document.documentId} lastFourDigits={data.aadhaar.lastFourDigits}
          canReveal={document.canRevealAadhaar} />}
      </> : hasInsuranceDetails ? <>
      <h3>Policy details</h3><Fields fields={data.policy} />
      <h3>Covered members</h3><p>{data.coveredMembers.join(", ") || "None extracted."}</p>
      <h3>Advisor Contact</h3><Fields fields={data.advisorContact} />
      <h3>Nominees</h3>
      {data.nominees.length ? data.nominees.map((nominee, index) => <Fields key={index} fields={nominee} />)
        : <p>None extracted.</p>}
      </> : data.details?.length ? <>
        <h3>Document details</h3>
        <dl>{data.details.map(({ label, value }, index) =>
          <div key={index}><dt>{label}</dt><dd>{value}</dd></div>
        )}</dl>
      </> : <p>No additional details were saved for this document.</p>}
    </> : <p>{statusLabels[document.scanStatus]}</p>}
    <button type="button" onClick={onClose}>Close details</button>
  </section>;
}

export default function DocumentScannerPage() {
  const [scan, setScan] = useState(null);
  const [selection, setSelection] = useState(null);
  const [stagedId, setStagedId] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [profileError, setProfileError] = useState("");
  const [memberId, setMemberId] = useState("");
  const [documents, setDocuments] = useState(null);
  const [deleting, setDeleting] = useState(false);
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
    if (!selection || !memberId || busy) return;
    const form = event.currentTarget;
    setBusy(true);
    setError("");
    try {
      const { file, mime } = selection;
      const id = stagedId || await stageScan(file, mime);
      setStagedId(id);
      setScan(await completeScan(id, file.name, mime, memberId));
      form.reset();
      setMemberId("");
      window.dispatchEvent(new Event(DOCUMENT_SAVED));
      setStagedId(null);
      setSelection(null);
      setRevision((value) => value + 1);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  function selectFile(event) {
    const file = event.target.files?.[0];
    setSelection(null);
    setStagedId(null);
    setError("");
    if (!file) return;
    try {
      setSelection({ file, mime: scanFileMime(file) });
    } catch (failure) {
      event.target.value = "";
      setError(failure.message);
    }
  }

  async function removeDocument({ documentId, fileName }) {
    if (deleting || !window.confirm(`Permanently delete "${fileName}" and its scanned details?`)) return;
    setDeleting(true);
    setError("");
    try {
      await deleteScan(documentId);
      setSelected((current) => current?.documentId === documentId ? null : current);
      setRevision((value) => value + 1);
      window.dispatchEvent(new Event(DOCUMENT_SAVED));
    } catch (error) {
      setError(error.message);
    } finally {
      setDeleting(false);
    }
  }

  async function openDocument(id, original = false) {
    setError("");
    try {
      if (original) window.location.assign(await downloadScan(id));
      else setSelected(await scannerRequest(`/${encodeURIComponent(id)}`));
    } catch (failure) {
      setError(failure.message);
    }
  }

  return <main className="fk-scanner-page">
    <header><Link to="/documents">Back to Documents</Link><h1>Document Scanner</h1></header>
    {!scannerAvailable ? <p>The scanner is unavailable in this environment.</p> : <>
      {scan ? <section className="fk-scanner-card">
        <h2>Review Details</h2>
        <ScanProgress scan={scan} onDone={() => { setScan(null); setRevision((value) => value + 1); }} />
      </section> : <form className="fk-scanner-card" onSubmit={submit}>
        <label>Who is this document for? (required)
          <select value={memberId} required disabled={busy || Boolean(stagedId)} onChange={(event) => setMemberId(event.target.value)}>
          <option value="">Select a profile</option>
          <option value={SELF_PROFILE_ID}>Me</option>
          {profiles.map((profile) => <option key={profile.memberId} value={profile.memberId}>{profile.name}</option>)}
        </select></label>
        {profileError && <p role="status">{profileError}</p>}
        <label>Document<input type="file" accept=".pdf,.jpg,.jpeg,.png" required disabled={!memberId || busy}
          onChange={selectFile} /></label>
        {selection && <DocumentPreview file={selection.file} contentType={selection.mime} />}
        <button type="submit" disabled={!memberId || !selection || busy}>
          {busy ? "Uploading..." : "Confirm and scan"}
        </button>
      </form>}
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
            <button type="button" disabled={deleting} onClick={() => removeDocument(document)}>Delete</button>
          </div>
        </article>)}
      </section>
      {selected && <ScanDetails document={selected} onClose={() => setSelected(null)} />}
    </>}
  </main>;
}
