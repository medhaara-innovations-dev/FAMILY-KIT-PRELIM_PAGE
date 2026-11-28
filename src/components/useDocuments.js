import { useEffect, useState } from "react";
import { DOCUMENT_SAVED, listDocuments } from "../api/documentsApi.js";

import { scannerAvailable, scannerRequest } from "../api/documentScannerApi.js";

export default function useDocuments(enabled = true, includeScans = false, pollScans = false) {
  const [state, setState] = useState({ documents: null, error: "" });
  useEffect(() => {
    if (!enabled) return;
    let controller;
    let timer;
    function refresh() {
      window.clearTimeout(timer);
      controller?.abort();
      const request = new AbortController();
      controller = request;
      const scannerDocuments = includeScans && scannerAvailable
        ? scannerRequest("", { signal: request.signal }).then(({ documents }) => documents)
        : Promise.resolve([]);
      Promise.all([listDocuments(request.signal), scannerDocuments]).then(([originals, scans]) => {
        const documents = [...originals, ...scans];
        if (request.signal.aborted) return;
        setState({ documents, error: "" });
        if (pollScans && scans.some(({ scanStatus }) => scanStatus === "QUEUED" || scanStatus === "SCANNING")) {
          timer = window.setTimeout(refresh, 3000);
        }
      }).catch((error) => {
        if (!request.signal.aborted) setState((previous) => ({ ...previous, error: error.message }));
      });
    }
    refresh();
    window.addEventListener(DOCUMENT_SAVED, refresh);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
      window.removeEventListener(DOCUMENT_SAVED, refresh);
    };
  }, [enabled, includeScans, pollScans]);
  return state;
}
