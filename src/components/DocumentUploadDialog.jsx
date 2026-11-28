import { useEffect, useRef, useState } from "react";
import { Camera, FileText, Image, X } from "lucide-react";
import { getFamilyMembers } from "../api/familyMembersApi.js";
import { SELF_PROFILE_ID } from "../api/profilePicturesApi.js";
import { DOCUMENT_SAVED, saveDocument, uploadDocument } from "../api/documentsApi.js";
import { completeScan, scannerAvailable, scanFileMime, stageScan } from "../api/documentScannerApi.js";
import ScanProgress from "./ScanProgress.jsx";
import DocumentPreview from "./DocumentPreview.jsx";
import "./DocumentUploadDialog.css";

const types = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };

export default function DocumentUploadDialog({ onClose }) {
  const dialog = useRef(null);
  const [scan, setScan] = useState(null);
  const [pending, setPending] = useState(null);
  const [members, setMembers] = useState(null);
  const [member, setMember] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getFamilyMembers(controller.signal).then((profiles) => {
      if (!controller.signal.aborted) setMembers(profiles);
    }).catch(() => {
      if (!controller.signal.aborted) setError("Could not load family profiles.");
    });
    return () => controller.abort();
  }, [retry]);

  function selectFile(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file || !member || busy) return;
    setError("");
    try {
      const contentType = scannerAvailable ? scanFileMime(file) : types[file.name.split(".").pop()?.toLowerCase()];
      if (!contentType || !file.size || file.size > 10 * 1024 * 1024) {
        throw new Error("Choose a PDF, JPEG, JPG or PNG up to 10 MB.");
      }
      setPending({ file, contentType });
    } catch (cause) {
      setError(cause.message);
    }
  }

  async function save(event) {
    event.preventDefault();
    if (!pending || !member || busy) return;
    setError("");
    setBusy(true);
    try {
      const { file, contentType } = pending;
      const id = pending.id ?? await (scannerAvailable ? stageScan(file, contentType) : uploadDocument(file, contentType));
      setPending({ file, contentType, id });
      if (scannerAvailable) setScan(await completeScan(id, file.name, contentType, member));
      else await saveDocument(id, file.name, member);
      window.dispatchEvent(new Event(DOCUMENT_SAVED));
      if (!scannerAvailable) onClose();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog ref={dialog} className="fk-document-dialog" aria-labelledby="fk-document-dialog-title"
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
      <button className="fk-document-close" type="button" aria-label="Close document upload" disabled={busy} onClick={onClose}>
        <X size={20} aria-hidden="true" />
      </button>
      <h2 id="fk-document-dialog-title">{scan ? "Review Details" : "Add a document"}</h2>
      {scan ? <ScanProgress scan={scan} onDone={onClose} /> : <form onSubmit={save}>
          <label htmlFor="fk-document-member">Who is this document for? (required)</label>
          <select id="fk-document-member" required disabled={busy || Boolean(pending?.id)} value={member} onChange={(event) => setMember(event.target.value)}>
            <option value="">Select a profile</option>
            <option value={SELF_PROFILE_ID}>Me</option>
            {members?.map((profile) => <option key={profile.memberId} value={profile.memberId}>{profile.name}</option>)}
          </select>
          {!members && (error ? <button type="button" onClick={() => { setError(""); setRetry(retry + 1); }}>Retry loading profiles</button>
            : <p role="status">Loading family profiles...</p>)}
          {pending ? <>
            <DocumentPreview file={pending.file} contentType={pending.contentType} />
            <button type="button" disabled={busy} onClick={() => { setPending(null); setError(""); }}>
              Choose another file
            </button>
          </> : <>
          <p>Scan a paper document or upload a file.</p>
          <label className="fk-document-file fk-document-primary">
            <Camera size={20} aria-hidden="true" /> Scan Document
            <input type="file" accept="image/jpeg,image/png" capture="environment" disabled={!member || busy} onChange={selectFile} />
          </label>
          <div className="fk-document-options">
            <label className="fk-document-file"><FileText size={20} aria-hidden="true" /> Upload PDF
              <input type="file" accept=".pdf,application/pdf" disabled={!member || busy} onChange={selectFile} />
            </label>
            <label className="fk-document-file"><Image size={20} aria-hidden="true" /> Upload Image
              <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" disabled={!member || busy} onChange={selectFile} />
            </label>
          </div>
          </>}
          {pending && <button type="submit" className="fk-document-primary" disabled={!member || busy}>
            {busy ? "Uploading..." : scannerAvailable ? "Confirm and scan" : "Confirm and save"}
          </button>}
      </form>}
      {error && <p role="alert">{error}</p>}
    </dialog>
  );
}
