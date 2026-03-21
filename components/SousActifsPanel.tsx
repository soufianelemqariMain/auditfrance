"use client";

import { useEffect, useState } from "react";

interface DeputeScore {
  nom: string;
  groupe: string;
  dept: string;
  circo: string;
  score: number | null;
  url: string;
}

// 17th legislature group colors
const GROUPE_COLORS: Record<string, string> = {
  RN: "#1F3A8A",
  EPR: "#FF7900",
  "LFI-NFP": "#CC0000",
  SOC: "#FF8083",
  DR: "#003189",
  EcoS: "#6CB33F",
  Dem: "#F4A81F",
  HOR: "#3DAADC",
  LIOT: "#78716c",
  GDR: "#DD051D",
  UDR: "#7C3AED",
  NI: "#555555",
  // Legacy
  LFI: "#CC0000", RE: "#FFEB3B", LR: "#006EB7",
};

export default function SousActifsPanel() {
  const [deputes, setDeputes] = useState<DeputeScore[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [total, setTotal] = useState(0);
  const [legislature, setLegislature] = useState("");

  async function load() {
    setStatus("loading");
    try {
      const res = await fetch("/api/elus/national");
      const json = await res.json();
      setDeputes(json.deputes ?? []);
      setTotal(json.total ?? 0);
      setLegislature(json.legislature ?? "");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ background: "var(--bg-panel)", borderLeft: "1px solid var(--border)", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-blue)" }}>HÉMICYCLE</span>
          {status === "loading" && <span style={{ fontSize: 9, color: "var(--accent-yellow)" }}>…</span>}
          {status === "done" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 4px rgba(34,197,94,0.6)" }} />}
          {status === "error" && <span style={{ fontSize: 9, color: "#ef4444" }}>err</span>}
        </div>
        <button
          onClick={load}
          title="Rafraîchir"
          style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 10, padding: "2px 6px", cursor: "pointer", fontFamily: "inherit" }}
        >↻</button>
      </div>

      {/* Sub-header */}
      {status === "done" && (
        <div style={{ padding: "5px 12px", borderBottom: "1px solid var(--border)", fontSize: 9, color: "var(--text-secondary)", letterSpacing: "0.08em", flexShrink: 0 }}>
          {total} DÉPUTÉ·E·S · {legislature}
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
        {status === "loading" && (
          <>
            {[1,2,3,4].map((n) => (
              <div key={n} style={{ height: 56, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 4 }} />
            ))}
          </>
        )}
        {status === "error" && (
          <div style={{ padding: 12, fontSize: 10, color: "var(--text-secondary)" }}>
            Indisponible. <a href="https://www.assemblee-nationale.fr/dyn/deputes" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)" }}>→ Assemblée Nationale</a>
          </div>
        )}
        {status === "done" && deputes.map((d, i) => {
          const gc = GROUPE_COLORS[d.groupe] ?? "#555";
          return (
            <div
              key={i}
              onClick={() => window.open(d.url, "_blank", "noopener,noreferrer")}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "8px 10px",
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>
                    {d.nom}
                  </div>
                  <div style={{ fontSize: 9, color: "var(--text-secondary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {d.circo}
                  </div>
                </div>
                <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 2, background: gc + "22", color: gc, border: `1px solid ${gc}44`, flexShrink: 0 }}>
                  {d.groupe}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: "4px 10px", borderTop: "1px solid var(--border)", fontSize: 9, color: "var(--text-secondary)", flexShrink: 0 }}>
        <a href="https://data.assemblee-nationale.fr" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)", textDecoration: "none" }}>data.assemblee-nationale.fr</a>
      </div>
    </div>
  );
}
