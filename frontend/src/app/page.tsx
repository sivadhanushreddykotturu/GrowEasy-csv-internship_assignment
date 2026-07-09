"use client";

import { useState, useCallback } from "react";
import {
  Upload, Eye, Sparkles, RotateCcw, ChevronRight,
  AlertTriangle, Cpu, Check, Download, Brain,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import UploadZone from "@/components/UploadZone";
import PreviewTable from "@/components/PreviewTable";
import ProgressBar from "@/components/ProgressBar";
import ResultTable from "@/components/ResultTable";
import StatsCard from "@/components/StatsCard";
import { parseCSVClient, ParsedCSV } from "@/lib/csv-parser";
import { importCSV } from "@/lib/api";
import { CRMRecord, Step } from "@/types/crm";

type StepId = "upload" | "preview" | "processing" | "results";

const STEPS: { id: StepId; label: string }[] = [
  { id: "upload",     label: "Upload" },
  { id: "preview",    label: "Preview" },
  { id: "processing", label: "Processing" },
  { id: "results",    label: "Results" },
];

function StepIndicator({ current }: { current: StepId }) {
  const idx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="steps-row">
      {STEPS.map((step, i) => {
        const done   = i < idx;
        const active = i === idx;
        return (
          <div key={step.id} className="step-item">
            <div className={`step-dot${active ? " active" : done ? " done" : ""}`}>
              {done ? <Check size={11} strokeWidth={3} /> : i + 1}
            </div>
            <span className={`step-label-text${active ? " active" : done ? " done" : ""}`}>
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`step-connector${done ? " done" : ""}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [step, setStep]           = useState<StepId>("upload");
  const [file, setFile]           = useState<File | null>(null);
  const [parsedCSV, setParsedCSV] = useState<ParsedCSV | null>(null);
  const [progress, setProgress]   = useState(0);
  const [results, setResults]     = useState<CRMRecord[]>([]);
  const [stats, setStats]         = useState({ imported: 0, skipped: 0, total: 0 });
  const [error, setError]         = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelected = useCallback(async (f: File) => {
    setFile(f);
    setError(null);
    setIsLoading(true);
    try {
      const parsed = await parseCSVClient(f);
      setParsedCSV(parsed);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!file) return;
    setError(null);
    setProgress(0);
    setStep("processing");
    try {
      const result = await importCSV(file, setProgress);
      if (!result.success) throw new Error(result.error || "Import failed");
      setResults(result.data);
      setStats({ imported: result.processed, skipped: result.skipped, total: result.total });
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error occurred.");
      setStep("preview");
    }
  }, [file]);

  const handleReset = useCallback(() => {
    setStep("upload"); setFile(null); setParsedCSV(null);
    setProgress(0); setResults([]); setStats({ imported: 0, skipped: 0, total: 0 });
    setError(null); setIsLoading(false);
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* ── Navbar ── */}
      <nav className="navbar" style={{ padding: "8px 0" }}>
        <div className="container">
          <div className="nav-inner" style={{ padding: "0 10px" }}>
            <div className="nav-brand" style={{ gap: "12px" }}>
              <img 
                src="/logo.svg" 
                alt="GrowEasy Logo" 
                style={{ width: "32px", height: "32px", borderRadius: "6px", objectFit: "contain" }}
              />
              <span className="nav-brand-name" style={{ fontSize: "1.05rem", fontWeight: 700, letterSpacing: "-0.01em" }}>GrowEasy</span>
            </div>
            <div className="nav-actions" style={{ gap: "16px" }}>
              {step !== "upload" && (
                <button className="btn-reset" onClick={handleReset} style={{ padding: "6px 16px", fontSize: "0.85rem" }}>
                  <RotateCcw size={13} /> Start over
                </button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: "40px 0 60px" }}>
        <div className="container-md">

          {/* Error banner */}
          {error && (
            <div className="fade-in" style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "14px 16px", borderRadius: "var(--radius-lg)",
              background: "var(--status-bad-bg)", border: "1px solid var(--status-bad-border)",
              color: "var(--status-bad)", marginBottom: 20,
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>Something went wrong</div>
                <div style={{ fontSize: "0.82rem", marginTop: 2, color: "var(--text-muted)" }}>{error}</div>
              </div>
            </div>
          )}

          {/* ═══════════════════════ STEP 1: UPLOAD ═══════════════════════ */}
          {step === "upload" && (
            <div className="slide-up">
              {/* Hero heading */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 32, marginBottom: 36, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 380px", textAlign: "left" }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em",
                    textTransform: "uppercase", color: "var(--accent)",
                    background: "var(--accent-light)", border: "1px solid var(--accent-medium)",
                    padding: "3px 10px", borderRadius: "var(--radius-pill)", marginBottom: 20,
                  }}>
                    <Sparkles size={11} /> AI-Powered
                  </div>
                  <h1 style={{ fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: 14 }}>
                    Import any CSV into<br />
                    <span className="text-accent">GrowEasy CRM.</span>
                  </h1>
                  <p style={{ fontSize: "1rem", color: "var(--text-muted)", maxWidth: 480, lineHeight: 1.7 }}>
                    Upload leads from Facebook, Google Ads, Excel, or any spreadsheet.
                    AI automatically maps your columns to CRM fields.
                  </p>
                </div>

                {/* Right side test download files */}
                <div className="card-subtle" style={{ flex: "1 1 260px", maxWidth: "340px", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                    Download Test CSVs
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                    Use these sample files directly to try the parser:
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                    <button 
                      onClick={() => {
                        const url = "https://raw.githubusercontent.com/sivadhanushreddykotturu/GrowEasy-csv-internship_assignment/main/test-csvs/facebook_leads.csv";
                        fetch(url).then(res => res.blob()).then(blob => {
                          const a = document.createElement("a");
                          a.href = URL.createObjectURL(blob);
                          a.download = "facebook_leads.csv";
                          a.click();
                        }).catch(() => window.open(url, "_blank"));
                      }}
                      className="btn-reset"
                      style={{ fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, border: "none", background: "none", color: "var(--accent)", cursor: "pointer", padding: 0 }}
                    >
                      <Download size={12} /> facebook_leads.csv
                    </button>
                    <button 
                      onClick={() => {
                        const url = "https://raw.githubusercontent.com/sivadhanushreddykotturu/GrowEasy-csv-internship_assignment/main/test-csvs/realestate_crm.csv";
                        fetch(url).then(res => res.blob()).then(blob => {
                          const a = document.createElement("a");
                          a.href = URL.createObjectURL(blob);
                          a.download = "realestate_crm.csv";
                          a.click();
                        }).catch(() => window.open(url, "_blank"));
                      }}
                      className="btn-reset"
                      style={{ fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, border: "none", background: "none", color: "var(--accent)", cursor: "pointer", padding: 0 }}
                    >
                      <Download size={12} /> realestate_crm.csv
                    </button>
                    <button 
                      onClick={() => {
                        const url = "https://raw.githubusercontent.com/sivadhanushreddykotturu/GrowEasy-csv-internship_assignment/main/test-csvs/messy_spreadsheet.csv";
                        fetch(url).then(res => res.blob()).then(blob => {
                          const a = document.createElement("a");
                          a.href = URL.createObjectURL(blob);
                          a.download = "messy_spreadsheet.csv";
                          a.click();
                        }).catch(() => window.open(url, "_blank"));
                      }}
                      className="btn-reset"
                      style={{ fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600, border: "none", background: "none", color: "var(--accent)", cursor: "pointer", padding: 0 }}
                    >
                      <Download size={12} /> messy_spreadsheet.csv
                    </button>
                  </div>
                </div>
              </div>

              {/* Step indicator */}
              <div className="card" style={{ padding: "16px 24px", marginBottom: 20 }}>
                <StepIndicator current={step} />
              </div>

              {/* Upload card */}
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "var(--accent)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.78rem", fontWeight: 800, flexShrink: 0,
                  }}>1</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Upload your CSV file</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Drag & drop or click to browse</div>
                  </div>
                </div>
                <UploadZone onFileSelected={handleFileSelected} />
                {isLoading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: "0.83rem", color: "var(--text-muted)" }}>
                    <div style={{ width: 14, height: 14, border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    Parsing CSV…
                  </div>
                )}
              </div>

              {/* Format chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["📣 Facebook Leads","📊 Google Ads","📋 Excel Sheets","🏠 Real Estate CRM","📈 Sales Reports","🎯 Marketing CSVs"].map((f) => (
                  <span key={f} style={{
                    fontSize: "0.78rem", fontWeight: 500,
                    padding: "5px 12px", borderRadius: "var(--radius-pill)",
                    border: "1px solid var(--border)", background: "var(--bg-subtle)",
                    color: "var(--text-muted)",
                  }}>{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════ STEP 2: PREVIEW ═══════════════════════ */}
          {step === "preview" && parsedCSV && (
            <div className="slide-up">
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
                  <Eye size={20} /> CSV Preview
                </h2>
                <p style={{ fontSize: "0.88rem" }}>Review your data before AI processing.</p>
              </div>

              <div className="card" style={{ padding: "16px 24px", marginBottom: 20 }}>
                <StepIndicator current={step} />
              </div>

              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "var(--accent)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.78rem", fontWeight: 800, flexShrink: 0,
                  }}>2</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{file?.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      {parsedCSV.totalRows} rows · {parsedCSV.headers.length} columns · No AI yet
                    </div>
                  </div>
                </div>
                <PreviewTable headers={parsedCSV.headers} rows={parsedCSV.rows} totalRows={parsedCSV.totalRows} />
              </div>

              {/* Confirm bar */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 16, padding: "18px 20px", borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border)", background: "var(--bg-subtle)",
                flexWrap: "wrap",
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: 2 }}>
                    Ready to extract CRM fields with AI?
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Groq AI will map {parsedCSV.headers.length} columns to GrowEasy CRM format.
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="btn btn-secondary btn-sm" onClick={handleReset}>
                    ← Different file
                  </button>
                  <button id="confirm-import-btn" className="btn btn-primary btn-lg" onClick={handleConfirm}>
                    <Brain size={15} /> Confirm Import <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════ STEP 3: PROCESSING ═══════════════════════ */}
          {step === "processing" && file && (
            <div className="slide-up">
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 6 }}>AI Processing</h2>
                <p style={{ fontSize: "0.88rem" }}>Please wait while Groq AI extracts your CRM fields.</p>
              </div>

              <div className="card" style={{ padding: "16px 24px", marginBottom: 20 }}>
                <StepIndicator current={step} />
              </div>

              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "var(--accent)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.78rem", fontWeight: 800, flexShrink: 0,
                    animation: "pulse 1.5s ease infinite",
                  }}>3</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>AI Processing</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Groq · llama-3.3-70b-versatile</div>
                  </div>
                </div>
                <ProgressBar percent={progress} fileName={file.name} />
              </div>

              <div className="card-subtle" style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                <Sparkles size={14} style={{ color: "var(--accent)", flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0 }}>
                  <strong style={{ color: "var(--text-primary)" }}>Two-phase extraction:</strong>{" "}
                  Schema discovery (1 call) → Batch field extraction (10 rows/call) with retry logic.
                </p>
              </div>
            </div>
          )}

          {/* ═══════════════════════ STEP 4: RESULTS ═══════════════════════ */}
          {step === "results" && (
            <div className="slide-up">
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
                  <Check size={22} style={{ color: "var(--status-good)" }} /> Import Complete
                </h2>
                <p style={{ fontSize: "0.88rem" }}>AI has extracted and mapped your CRM leads.</p>
              </div>

              <div className="card" style={{ padding: "16px 24px", marginBottom: 20 }}>
                <StepIndicator current={step} />
              </div>

              <StatsCard imported={stats.imported} skipped={stats.skipped} total={stats.total} />

              <div className="card" style={{ marginTop: 20, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "var(--status-good)", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.78rem", fontWeight: 800, flexShrink: 0,
                  }}><Check size={13} strokeWidth={3} /></div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Extracted CRM Records</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      {stats.skipped > 0
                        ? `${stats.skipped} record${stats.skipped > 1 ? "s" : ""} skipped — no email or phone found`
                        : "All records successfully extracted"}
                    </div>
                  </div>
                </div>
                <ResultTable records={results} />
              </div>

              <div style={{ display: "flex", justifyContent: "center" }}>
                <button className="btn btn-secondary" onClick={handleReset}>
                  <Upload size={14} /> Import another CSV
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <p className="footer-copy">
              © 2026 GrowEasy. Built with Next.js + Express + Groq AI.
            </p>
            <div className="footer-links">
              <a href="https://github.com/sivadhanushreddykotturu/GrowEasy-csv-internship_assignment.git" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
