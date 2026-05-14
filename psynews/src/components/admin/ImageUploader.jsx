import { useState, useRef, useCallback } from "react";
import { uploadArticleImage, validateImage } from "../../lib/storage";
import "./ImageUploader.css";

/**
 * ImageUploader
 *
 * Props:
 *   value      — current image URL (string)
 *   onChange   — called with new URL when upload succeeds
 *   label      — field label text
 */
export default function ImageUploader({ value, onChange, label = "Cover image" }) {
  const [dragging, setDragging]   = useState(false);
  const [progress, setProgress]   = useState(null); // null | 0-100
  const [error, setError]         = useState("");
  const [preview, setPreview]     = useState(value || "");
  const inputRef = useRef(null);

  const handleFile = useCallback(async (file) => {
    const err = validateImage(file);
    if (err) { setError(err); return; }

    setError("");
    setPreview(URL.createObjectURL(file));
    setProgress(0);

    const { url, error: uploadErr } = await uploadArticleImage(file, setProgress);

    if (uploadErr) {
      setError(uploadErr);
      setPreview(value || "");
      setProgress(null);
      return;
    }

    setProgress(null);
    setPreview(url);
    onChange(url);
  }, [value, onChange]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const clearImage = () => {
    setPreview("");
    setError("");
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="image-uploader">
      <label className="admin-label">{label}</label>

      {/* Drop zone */}
      <div
        className={`image-uploader__zone ${dragging ? "image-uploader__zone--drag" : ""} ${preview ? "image-uploader__zone--has-image" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !preview && inputRef.current?.click()}
        role="button"
        tabIndex={preview ? -1 : 0}
        aria-label="Upload cover image — drag and drop or click to browse"
        onKeyDown={(e) => e.key === "Enter" && !preview && inputRef.current?.click()}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Cover preview"
              className="image-uploader__preview"
            />
            {/* Overlay shown on hover */}
            <div className="image-uploader__overlay">
              <button
                type="button"
                className="image-uploader__replace"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                aria-label="Replace image"
              >
                ↑ Replace
              </button>
              <button
                type="button"
                className="image-uploader__remove"
                onClick={(e) => { e.stopPropagation(); clearImage(); }}
                aria-label="Remove image"
              >
                ✕ Remove
              </button>
            </div>
          </>
        ) : (
          <div className="image-uploader__placeholder">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p className="image-uploader__hint">
              <strong>Drag & drop</strong> or <span className="image-uploader__browse">browse</span>
            </p>
            <p className="image-uploader__sub">JPG, PNG, WebP, GIF — max 5 MB</p>
          </div>
        )}

        {/* Progress bar */}
        {progress !== null && (
          <div className="image-uploader__progress-wrap" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
            <div className="image-uploader__progress-bar" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={onInputChange}
        className="image-uploader__input"
        aria-hidden="true"
        tabIndex={-1}
      />

      {error && <p className="admin-error" role="alert">{error}</p>}

      {/* Manual URL fallback */}
      <details className="image-uploader__manual">
        <summary className="image-uploader__manual-toggle">Or enter image URL manually</summary>
        <input
          type="url"
          className="admin-input"
          placeholder="https://images.unsplash.com/…"
          defaultValue={value}
          onBlur={(e) => {
            const url = e.target.value.trim();
            if (url) { setPreview(url); onChange(url); }
          }}
        />
      </details>
    </div>
  );
}
