import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { DOCUMENT_SAVED } from "../api/documentsApi.js";
import { scannerRequest } from "../api/documentScannerApi.js";
import "./ScanProgress.css";

export default function ScanProgress({ scan, onDone }) {
  const [status, setStatus] = useState(scan.scanStatus);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const pending = status === "QUEUED" || status === "SCANNING";
  const ready = status === "READY";
  const percent = { QUEUED: 33, SCANNING: 66, READY: 100 }[status];

  useEffect(() => {
    if (!pending) return;
    const controller = new AbortController();
    let timer;
    async function refresh() {
      try {
        const { scanStatus } = await scannerRequest(`/${encodeURIComponent(scan.documentId)}`, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setStatus(scanStatus);
        if (scanStatus === "QUEUED" || scanStatus === "SCANNING") {
          timer = window.setTimeout(refresh, 2500);
        } else {
          window.dispatchEvent(new Event(DOCUMENT_SAVED));
        }
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message);
      }
    }
    timer = window.setTimeout(refresh, 1500);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [pending, retry, scan.documentId]);

  return <section className="fk-scan-progress" aria-label="Scan progress">
    <ol className="fk-scan-progress-steps" aria-label="Document steps">
      <li><span>1</span>Capture</li>
      <li aria-current={pending ? "step" : undefined}><span>2</span>Review</li>
      <li aria-current={ready ? "step" : undefined}><span>3</span>Save</li>
    </ol>
    {percent && <div className="fk-scan-progress-ring" role="progressbar" aria-label="Document scan progress"
      aria-valuenow={percent} style={{ "--fk-scan-percent": `${percent}%` }}>
      <span>{percent}%</span>
    </div>}
    <div aria-live="polite">
      <h3>{ready ? "Scan complete" : pending ? "Reading your document" : "Scan did not finish"}</h3>
      <p>{ready ? "Your scanned details are ready to view."
        : pending ? "FamilyKit is finding important details in your document."
        : "Your original file is still available in Documents."}</p>
    </div>
    <ul className="fk-scan-progress-tasks">
      <li><CheckCircle2 size={18} /><div><strong>Reading the document</strong><small>Pages received</small></div></li>
      <li>{ready ? <CheckCircle2 size={18} /> : <span aria-hidden="true" className="fk-scan-task-dot" />}
        <div><strong>Extracting important details</strong><small>{ready ? "Details saved" : status === "QUEUED"
          ? "Waiting for the scanner" : status === "SCANNING" ? "Identifying the document" : "Scan incomplete"}</small></div>
      </li>
    </ul>
    {error && <><p role="alert">{error}</p><button className="fk-document-primary" type="button"
      onClick={() => { setError(""); setRetry((value) => value + 1); }}>Retry status check</button></>}
    {(!pending || error) && <button className="fk-document-primary" type="button" onClick={onDone}>Done</button>}
  </section>;
}
