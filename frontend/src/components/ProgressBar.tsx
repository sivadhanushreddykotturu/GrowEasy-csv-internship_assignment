"use client";

import { Brain, Zap } from "lucide-react";

interface ProgressBarProps { percent: number; fileName: string; }

const getLabel = (p: number) => {
  if (p < 10) return "Uploading file…";
  if (p < 20) return "Parsing CSV rows…";
  if (p < 35) return "Discovering schema (AI phase 1)…";
  if (p < 85) return "Extracting CRM fields (batch processing)…";
  if (p < 100) return "Finalizing results…";
  return "Complete!";
};

function AiStep({ done, active, label }: { done: boolean; active: boolean; label: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 9,
      fontSize: "0.8rem", fontWeight: done || active ? 500 : 400,
      color: done ? "var(--status-good)" : active ? "var(--text-primary)" : "var(--text-subtle)",
      transition: "all 0.3s ease",
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.62rem", fontWeight: 700, flexShrink: 0,
        background: done ? "var(--status-good)" : active ? "var(--accent)" : "var(--bg-muted)",
        color: done || active ? "#fff" : "var(--text-subtle)",
        border: !done && !active ? "1px solid var(--border)" : "none",
        transition: "all 0.3s ease",
      }}>
        {done ? "✓" : active ? "→" : "·"}
      </span>
      {label}
      {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animation: "pulse 1s ease infinite", display: "inline-block" }} />}
    </div>
  );
}

export default function ProgressBar({ percent, fileName }: ProgressBarProps) {
  const p = Math.min(Math.round(percent), 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "var(--accent-light)", border: "1px solid var(--accent-medium)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--accent)", flexShrink: 0, animation: "pulse 2s ease infinite",
        }}>
          <Brain size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "0.93rem", marginBottom: 3 }}>Analyzing your CSV</div>
          <code style={{
            fontSize: "0.75rem", background: "var(--bg-muted)",
            padding: "2px 7px", borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)", color: "var(--text-muted)",
          }}>{fileName}</code>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          fontSize: "0.83rem", fontWeight: 700, color: "var(--accent)",
          background: "var(--accent-light)", border: "1px solid var(--accent-medium)",
          padding: "5px 12px", borderRadius: "var(--radius-pill)",
        }}>
          <Zap size={11} /> {p}%
        </div>
      </div>

      {/* Track */}
      <div style={{ height: 7, background: "var(--bg-muted)", borderRadius: 9999, overflow: "hidden", border: "1px solid var(--border)" }}>
        <div style={{
          height: "100%",
          width: `${p}%`,
          background: "linear-gradient(90deg, var(--accent-hover), var(--accent))",
          borderRadius: 9999,
          transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>

      {/* Status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", animation: "pulse 2s ease infinite" }}>{getLabel(p)}</span>
        <div style={{ display: "flex", gap: 3 }}>
          {[0, 200, 400].map((d) => (
            <span key={d} style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent)", display: "inline-block", animation: `pulse 1.2s ease ${d}ms infinite` }} />
          ))}
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 9, padding: "14px 16px", background: "var(--bg-subtle)", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
        <AiStep done={p >= 10}  active={p < 10}              label="CSV Upload & Parsing" />
        <AiStep done={p >= 35}  active={p >= 10 && p < 35}   label="Schema Discovery (1 AI call)" />
        <AiStep done={p >= 85}  active={p >= 35 && p < 85}   label="Batch Field Extraction (AI)" />
        <AiStep done={p >= 100} active={p >= 85 && p < 100}  label="Finalizing Results" />
      </div>
    </div>
  );
}
