"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
}

export default function UploadZone({ onFileSelected }: UploadZoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setError(null);
      if (rejectedFiles.length > 0) {
        const firstError = rejectedFiles[0]?.errors[0];
        const msg = firstError?.message || "Invalid file type";
        setError(msg.includes("file-invalid-type") ? "Only CSV files are accepted." : msg);
        return;
      }
      const file = acceptedFiles[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) { setError("File too large. Max 10MB."); return; }
      setSelectedFile(file);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "application/vnd.ms-excel": [".csv"] },
    maxFiles: 1,
    multiple: false,
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
  };

  const fmt = (b: number) =>
    b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

  const borderColor = isDragReject ? "#dc2626" : isDragActive ? "var(--accent)" : selectedFile ? "#16a34a" : "var(--border-strong)";
  const bg = isDragReject ? "var(--status-bad-bg)" : isDragActive ? "var(--accent-light)" : selectedFile ? "var(--status-good-bg)" : "var(--bg-subtle)";

  return (
    <div style={{ width: "100%" }}>
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${borderColor}`,
          borderRadius: "var(--radius-xl)",
          padding: selectedFile ? "20px 24px" : "44px 28px",
          cursor: selectedFile ? "default" : "pointer",
          background: bg,
          textAlign: "center",
          outline: "none",
          transition: "all 0.18s ease",
          transform: isDragActive ? "scale(1.01)" : "none",
        }}
      >
        <input {...getInputProps()} id="csv-file-input" />

        {selectedFile ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
            <div style={{
              width: 44, height: 44, borderRadius: "var(--radius)",
              background: "var(--status-good-bg)", border: "1px solid var(--status-good-border)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <FileText size={20} color="var(--status-good)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>{selectedFile.name}</div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>{fmt(selectedFile.size)}</div>
            </div>
            <CheckCircle size={18} color="var(--status-good)" style={{ flexShrink: 0 }} />
            <button
              onClick={clearFile}
              style={{
                width: 26, height: 26, borderRadius: "50%",
                border: "1px solid var(--border)", background: "var(--bg)",
                color: "var(--text-muted)", display: "flex", alignItems: "center",
                justifyContent: "center", cursor: "pointer", flexShrink: 0,
                transition: "all 0.15s ease",
              }}
              title="Remove"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "var(--bg)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "var(--shadow-md)", transition: "all 0.18s ease",
            }}>
              {isDragReject
                ? <AlertCircle size={28} color="#dc2626" />
                : <Upload size={28} color={isDragActive ? "var(--accent)" : "var(--text-muted)"} />
              }
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem", color: isDragActive ? "var(--accent)" : isDragReject ? "#dc2626" : "var(--text-primary)", marginBottom: 4 }}>
                {isDragReject ? "Only CSV files accepted" : isDragActive ? "Drop your CSV here" : "Drag & drop your CSV"}
              </div>
              {!isDragActive && !isDragReject && (
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  or <span style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "underline", textDecorationStyle: "dotted" }}>browse to choose a file</span>
                </div>
              )}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-subtle)" }}>CSV only · Max 10MB</div>
          </div>
        )}
      </div>

      {error && (
        <div className="fade-in" style={{
          display: "flex", alignItems: "center", gap: 6,
          marginTop: 8, padding: "8px 12px",
          background: "var(--status-bad-bg)", border: "1px solid var(--status-bad-border)",
          borderRadius: "var(--radius)", fontSize: "0.82rem", color: "var(--status-bad)",
        }}>
          <AlertCircle size={13} /> {error}
        </div>
      )}
    </div>
  );
}
