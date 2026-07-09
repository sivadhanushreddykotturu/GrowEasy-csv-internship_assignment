"use client";

import { CRMRecord, CRMStatus } from "@/types/crm";
import { Download } from "lucide-react";

const COLS: { key: keyof CRMRecord; label: string; w?: string }[] = [
  { key: "name",                          label: "Name",        w: "150px" },
  { key: "email",                         label: "Email",       w: "190px" },
  { key: "mobile_without_country_code",   label: "Mobile",      w: "120px" },
  { key: "country_code",                  label: "Code",        w: "60px"  },
  { key: "crm_status",                    label: "Status",      w: "140px" },
  { key: "company",                       label: "Company",     w: "150px" },
  { key: "city",                          label: "City",        w: "100px" },
  { key: "state",                         label: "State",       w: "100px" },
  { key: "country",                       label: "Country",     w: "90px"  },
  { key: "data_source",                   label: "Source",      w: "120px" },
  { key: "lead_owner",                    label: "Lead Owner",  w: "150px" },
  { key: "created_at",                    label: "Created At",  w: "150px" },
  { key: "crm_note",                      label: "Notes",       w: "200px" },
  { key: "possession_time",               label: "Possession",  w: "120px" },
  { key: "description",                   label: "Description", w: "190px" },
];

const STATUS: Record<CRMStatus, { label: string; cls: string }> = {
  GOOD_LEAD_FOLLOW_UP: { label: "Follow Up",  cls: "badge-good" },
  DID_NOT_CONNECT:     { label: "No Connect", cls: "badge-warn" },
  BAD_LEAD:            { label: "Bad Lead",   cls: "badge-bad"  },
  SALE_DONE:           { label: "Sale Done",  cls: "badge-sale" },
};

function fmtDate(s: string) {
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return s; }
}

function exportCSV(records: CRMRecord[]) {
  const hdr = COLS.map((c) => c.key).join(",");
  const rows = records.map((r) =>
    COLS.map((c) => `"${String(r[c.key] ?? "").replace(/"/g, '""')}"`).join(",")
  );
  const blob = new Blob([[hdr, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `groweasy_crm_${new Date().toISOString().slice(0,10)}.csv` });
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function ResultTable({ records }: { records: CRMRecord[] }) {
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span style={{
          fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px",
          borderRadius: "var(--radius-pill)", background: "var(--status-good-bg)",
          border: "1px solid var(--status-good-border)", color: "var(--status-good)",
        }}>{records.length} records extracted</span>
        <button className="btn btn-secondary btn-sm" onClick={() => exportCSV(records)}>
          <Download size={13} /> Export CSV
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 44, textAlign: "center" }}>#</th>
              {COLS.map((c) => <th key={c.key} style={{ minWidth: c.w }}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={i}>
                <td style={{ textAlign: "center", color: "var(--text-subtle)", fontSize: "0.72rem" }}>{i + 1}</td>
                {COLS.map((c) => {
                  const val = r[c.key];
                  if (c.key === "crm_status") {
                    const cfg = STATUS[val as CRMStatus];
                    return <td key={c.key}>{cfg ? <span className={`badge ${cfg.cls}`}>{cfg.label}</span> : <span style={{ color: "var(--text-subtle)" }}>—</span>}</td>;
                  }
                  if (c.key === "data_source" && val) {
                    return <td key={c.key}><span style={{ fontSize: "0.7rem", fontWeight: 600, padding: "2px 8px", background: "var(--bg-muted)", border: "1px solid var(--border)", borderRadius: "var(--radius-pill)", color: "var(--text-muted)", fontFamily: "monospace", whiteSpace: "nowrap" }}>{val}</span></td>;
                  }
                  if (c.key === "email" && val) {
                    return <td key={c.key}><a href={`mailto:${val}`} style={{ color: "var(--accent)", fontSize: "0.82rem" }} onClick={(e) => e.stopPropagation()}>{val}</a></td>;
                  }
                  if (c.key === "created_at" && val) {
                    return <td key={c.key}><span style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{fmtDate(val)}</span></td>;
                  }
                  return (
                    <td key={c.key} title={val}>
                      {val
                        ? <span style={{ display: "block", maxWidth: c.w || 160, overflow: "hidden", textOverflow: "ellipsis" }}>{val}</span>
                        : <span style={{ color: "var(--text-subtle)" }}>—</span>
                      }
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
