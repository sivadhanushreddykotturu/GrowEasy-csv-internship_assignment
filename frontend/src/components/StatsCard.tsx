"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, BarChart2 } from "lucide-react";

function useCountUp(target: number, duration = 700) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    const steps = 25;
    const inc = target / steps;
    const ms  = duration / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(cur));
    }, ms);
    return () => clearInterval(t);
  }, [target, duration]);
  return count;
}

export default function StatsCard({ imported, skipped, total }: { imported: number; skipped: number; total: number }) {
  const i = useCountUp(imported);
  const s = useCountUp(skipped);
  const t = useCountUp(total);
  const rate = total > 0 ? Math.round((imported / total) * 100) : 0;

  const cards = [
    { icon: <CheckCircle2 size={20} />, value: i, label: "Successfully Imported", accentVar: "--status-good", bgVar: "--status-good-bg", borderVar: "--status-good-border" },
    { icon: <XCircle    size={20} />, value: s, label: "Skipped Records",        accentVar: "--status-warn", bgVar: "--status-warn-bg", borderVar: "--status-warn-border" },
    { icon: <BarChart2  size={20} />, value: t, label: "Total Processed",        accentVar: "--status-sale", bgVar: "--status-sale-bg", borderVar: "--status-sale-border", extra: `${rate}% success` },
  ];

  return (
    <div className="fade-in" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
      {cards.map((c) => (
        <div key={c.label} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "18px 16px", borderRadius: "var(--radius-lg)",
          background: `var(${c.bgVar})`, border: `1px solid var(${c.borderVar})`,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "var(--bg)", boxShadow: "var(--shadow-sm)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, color: `var(${c.accentVar})`,
          }}>
            {c.icon}
          </div>
          <div>
            <div style={{ fontSize: "1.65rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: `var(${c.accentVar})` }}>
              {c.value}
            </div>
            <div style={{ fontSize: "0.74rem", fontWeight: 500, color: "var(--text-muted)", marginTop: 2 }}>{c.label}</div>
          </div>
          {c.extra && (
            <div style={{ position: "absolute", top: 10, right: 12, fontSize: "0.72rem", fontWeight: 700, color: `var(${c.accentVar})` }}>
              {c.extra}
            </div>
          )}
        </div>
      ))}

      <style>{`@media(max-width:600px){div[style*="repeat(3"]{grid-template-columns:1fr !important;}}`}</style>
    </div>
  );
}
