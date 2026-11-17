import { useEffect, useRef, useState } from "react";
import { Check, X, ZoomIn, ZoomOut } from "lucide-react";

const SIZE = 280;
const OUTPUT_SIZE = 512;

export default function ProfilePhotoCropper({ file, onConfirm, onCancel }) {
  const [source, setSource] = useState("");
  const [dimensions, setDimensions] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const imageRef = useRef(null);
  const pointerRef = useRef(null);
  const imageUrlRef = useRef("");

  useEffect(() => {
    const url = URL.createObjectURL(file);
    imageUrlRef.current = url;
    setSource(url);
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    img.onerror = () => setError("Unable to read this image. Please choose another photo.");
    img.src = url;
    return () => {
      URL.revokeObjectURL(url);
      imageRef.current = null;
    };
  }, [file]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [busy, onCancel]);

  const baseScale = dimensions
    ? Math.max(SIZE / dimensions.width, SIZE / dimensions.height)
    : 1;
  const displayWidth = dimensions ? dimensions.width * baseScale * zoom : SIZE;
  const displayHeight = dimensions ? dimensions.height * baseScale * zoom : SIZE;
  const maxX = Math.max(0, (displayWidth - SIZE) / 2);
  const maxY = Math.max(0, (displayHeight - SIZE) / 2);
  const clamp = (value, max) => Math.max(-max, Math.min(max, value));
  const currentX = clamp(offset.x, maxX);
  const currentY = clamp(offset.y, maxY);

  const startDrag = (event) => {
    if (!dimensions) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerRef.current = { x: event.clientX, y: event.clientY, ox: currentX, oy: currentY };
  };
  const drag = (event) => {
    if (!pointerRef.current) return;
    const p = pointerRef.current;
    setOffset({ x: clamp(p.ox + event.clientX - p.x, maxX), y: clamp(p.oy + event.clientY - p.y, maxY) });
  };
  const stopDrag = () => { pointerRef.current = null; };
  const updateZoom = (value) => {
    const next = Math.max(1, Math.min(3, Number(value)));
    const w = dimensions ? dimensions.width * baseScale * next : SIZE;
    const h = dimensions ? dimensions.height * baseScale * next : SIZE;
    setOffset((p) => ({ x: clamp(p.x, (w - SIZE) / 2), y: clamp(p.y, (h - SIZE) / 2) }));
    setZoom(next);
  };

  const confirm = async () => {
    if (!imageRef.current || !dimensions || busy) return;
    setBusy(true);
    setError("");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Your browser cannot crop this photo.");
      const factor = OUTPUT_SIZE / SIZE;
      ctx.drawImage(
        imageRef.current,
        (SIZE / 2 + currentX - displayWidth / 2) * factor,
        (SIZE / 2 + currentY - displayHeight / 2) * factor,
        displayWidth * factor,
        displayHeight * factor
      );
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (!blob) throw new Error("Unable to save the cropped photo.");
      const cropped = new File([blob], `family-profile-${Date.now()}.jpg`, { type: "image/jpeg" });
      onConfirm(cropped);
    } catch (err) {
      setError(err.message || "Unable to crop the photo.");
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Crop profile photo" style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(12, 5, 32, .82)", display: "flex", alignItems: "center", justifyContent: "center", padding: 12, overflowY: "auto" }}>
      <div style={{ width: "100%", maxWidth: 420, maxHeight: "calc(100dvh - 24px)", overflowY: "auto", background: "#fff", borderRadius: 18, padding: "18px 16px 22px", boxSizing: "border-box", color: "#130438" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontSize: 22 }}>Crop Profile Photo</h2>
          <button type="button" aria-label="Cancel crop" onClick={onCancel} disabled={busy} style={{ background: "none", border: 0, color: "#2D0B84", padding: 6 }}><X size={23} /></button>
        </div>
        <p style={{ fontSize: 13, color: "#4D485A", margin: "12px 0 8px" }}>Drag and zoom to position the face inside the circle.</p>
        <div onPointerDown={startDrag} onPointerMove={drag} onPointerUp={stopDrag} onPointerCancel={stopDrag} style={{ position: "relative", width: "min(280px, 100%)", aspectRatio: "1", margin: "0 auto", overflow: "hidden", touchAction: "none", background: "#eae4f4", cursor: "grab", borderRadius: 8 }}>
          {dimensions && <img src={source} alt="Photo being cropped" draggable={false} style={{ position: "absolute", width: displayWidth, height: displayHeight, maxWidth: "none", left: `calc(50% + ${currentX}px)`, top: `calc(50% + ${currentY}px)`, transform: "translate(-50%, -50%)", pointerEvents: "none", userSelect: "none" }} />}
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", boxShadow: "0 0 0 100px rgba(0,0,0,.48)", border: "2px solid white", pointerEvents: "none" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
          <ZoomOut size={20} />
          <input aria-label="Photo zoom" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => updateZoom(e.target.value)} style={{ flex: 1, accentColor: "#2D0B84" }} />
          <ZoomIn size={20} />
        </div>
        {error && <p role="alert" style={{ color: "#b4233d", fontSize: 13 }}>{error}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button type="button" onClick={onCancel} disabled={busy} style={{ flex: 1, padding: "12px 6px", background: "#fff", border: "1px solid #ddd6ed", borderRadius: 10, color: "#2D0B84", fontWeight: 700 }}>Cancel</button>
          <button type="button" onClick={confirm} disabled={busy || !dimensions} style={{ flex: 1.5, padding: "12px 6px", background: "#2D0B84", border: 0, borderRadius: 10, color: "#fff", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Check size={18} />{busy ? "Processing..." : "Confirm & Apply"}</button>
        </div>
      </div>
    </div>
  );
}
