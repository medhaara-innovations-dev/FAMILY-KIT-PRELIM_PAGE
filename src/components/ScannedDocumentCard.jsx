import { useState } from "react";
import { DOCUMENT_SAVED } from "../api/documentsApi.js";
import { deleteScan, downloadScan, scannerRequest } from "../api/documentScannerApi.js";
import { ScanDetails, statusLabels } from "../DocumentScannerPage.jsx";

export default function ScannedDocumentCard({ item, profileName }) {
  const [details, setDetails] = useState(null);
  const [loadingView, setLoadingView] = useState(false);
  const [viewError, setViewError] = useState("");

  async function view(documentId, action = "view") {
    setViewError("");
    setLoadingView(true);
    try {
      if (action === "delete") {
        await deleteScan(documentId);
        setDetails(null);
        window.dispatchEvent(new Event(DOCUMENT_SAVED));
      } else if (action === "download") window.location.assign(await downloadScan(documentId));
      else setDetails(await scannerRequest(`/${encodeURIComponent(documentId)}`));
    } catch (error) {
      setViewError(error.message);
    } finally {
      setLoadingView(false);
    }
  }

  return <>
    <article className="fk-cat-document-group fk-cat-scan-card" key={item.documentId}>
      <div>
        <h4>{item.fileName}</h4>
        <p>{profileName && `${profileName} · `}{statusLabels[item.scanStatus] || item.scanStatus}</p>
      </div>
      <div className="fk-scanner-actions">
        {item.scanStatus === "READY" && <button type="button" disabled={loadingView} onClick={() => view(item.documentId)}>View</button>}
        <button type="button" disabled={loadingView} onClick={() => view(item.documentId, "download")}>Download original</button>
        <button type="button" disabled={loadingView} onClick={() => {
          if (window.confirm(`Permanently delete "${item.fileName}" and its scanned details?`)) view(item.documentId, "delete");
        }}>Delete</button>
      </div>
    </article>
    {viewError && <p role="alert">{viewError}</p>}
    {details && <ScanDetails document={details} onClose={() => setDetails(null)} />}
  </>;
}
