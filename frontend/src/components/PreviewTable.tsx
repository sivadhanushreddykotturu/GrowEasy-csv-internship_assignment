"use client";

interface PreviewTableProps {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

export default function PreviewTable({ headers, rows, totalRows }: PreviewTableProps) {
  const displayRows = rows.slice(0, 50);

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Meta row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[`${totalRows} rows`, `${headers.length} columns`].map((t) => (
            <span key={t} style={{
              fontSize: "0.72rem", fontWeight: 600, padding: "3px 9px",
              borderRadius: "var(--radius-pill)", background: "var(--bg-muted)",
              border: "1px solid var(--border)", color: "var(--text-muted)",
            }}>{t}</span>
          ))}
          {totalRows > 50 && (
            <span style={{
              fontSize: "0.72rem", fontWeight: 600, padding: "3px 9px",
              borderRadius: "var(--radius-pill)", background: "var(--status-warn-bg)",
              border: "1px solid var(--status-warn-border)", color: "var(--status-warn)",
            }}>Showing first 50 rows</span>
          )}
        </div>
        <span style={{ fontSize: "0.72rem", color: "var(--text-subtle)", fontStyle: "italic" }}>
          Raw preview — no AI yet
        </span>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 44, textAlign: "center" }}>#</th>
              {headers.map((h) => <th key={h} title={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr key={i}>
                <td style={{ textAlign: "center", color: "var(--text-subtle)", fontSize: "0.72rem" }}>{i + 1}</td>
                {headers.map((h) => (
                  <td key={h} title={row[h] || ""}>
                    {row[h]
                      ? <span style={{ display: "block", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{row[h]}</span>
                      : <span style={{ color: "var(--text-subtle)" }}>—</span>
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
