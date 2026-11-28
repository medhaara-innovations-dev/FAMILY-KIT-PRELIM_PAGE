import { useEffect, useState } from "react";
import "./DocumentPreview.css";

export default function DocumentPreview({ file, contentType }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const previewFile = file.type === contentType ? file : new Blob([file], { type: contentType });
    const previewUrl = URL.createObjectURL(previewFile);
    setUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [file, contentType]);

  return <section className="fk-document-preview" aria-label="Document preview">
    <p>{file.name}</p>
    {url && (contentType === "application/pdf" ? <>
      <iframe title="PDF preview" src={url} />
      <a href={url} target="_blank" rel="noopener noreferrer">Open PDF preview</a>
    </> : <img src={url} alt="Preview of selected document" />)}
  </section>;
}
