import { useEffect, useState } from "react";
import { DOCUMENT_SAVED, listDocuments } from "../api/documentsApi.js";

export default function useDocuments(enabled = true) {
  const [state, setState] = useState({ documents: null, error: "" });
  useEffect(() => {
    if (!enabled) return;
    let controller;
    function refresh() {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      listDocuments(request.signal).then((documents) => {
        if (!request.signal.aborted) setState({ documents, error: "" });
      }).catch((error) => {
        if (!request.signal.aborted) setState((previous) => ({ ...previous, error: error.message }));
      });
    }
    refresh();
    window.addEventListener(DOCUMENT_SAVED, refresh);
    return () => {
      controller.abort();
      window.removeEventListener(DOCUMENT_SAVED, refresh);
    };
  }, [enabled]);
  return state;
}
