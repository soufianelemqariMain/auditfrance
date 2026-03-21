"use client";

import { useEffect, useState } from "react";

interface DeputeScore {
  nom: string;
  groupe: string;
  dept: string;
  circo: string;
  score: number;
  url: string;
}

const GROUPE_COLORS: Record<string, string> = {
  RN: "#142B6F", LFI: "#CC0000", SOC: "#FF8083", RE: "#FFEB3B",
  LIOT: "#78716c", HOR: "#3DAADC", LR: "#006EB7", GDR: "#DD051D",
  ECO: "#6CB33F", UDI: "#3DAADC", DEM: "#F4A81F",
};

export default function SousActifsPanel() {
  const [deputes, setDeputes] = useState<DeputeScore[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [total, setTotal] = useState(0);

  async function load() {
    setStatus("loading");
    try {
      const res = await fetch("/api/elus/national");
      const json = await res.json();
      setDeputes(json.deputes ?? []);
      setTotal(json.total ?? 0);
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
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#ef4444" }}>⚠ SOUS-ACTIFS</span>
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

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {status === "loading" && (
          <div style={{ padding: 12, fontSize: 10, color: "var(--text-secondary)" }}>Chargement nosdeputes.fr…</div>
        )}
        {status === "error" && (
          <div style={{ padding: 12, fontSize: 10, color: "var(--text-secondary)" }}>
            Indisponible. <a href="https://www.nosdeputes.fr" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)" }}>→ nosdeputes.fr</a>
          </div>
        )}
        {status === "done" && (
          <div>
            <div style={{ padding: "5px 10px", fontSize: 9, color: "var(--text-secondary)", borderBottom: "1px solid var(--border)", letterSpacing: "0.08em" }}>
              LES MOINS ACTIF·VE·S · {total} total
            </div>
            {deputes.map((d, i) => {
              const gc = GROUPE_COLORS[d.groupe] ?? "#555";
              const scoreColor = d.score <= 10 ? "#ef4444" : d.score <= 25 ? "#eab308" : "#f97316";
              return (
                <div
                  key={i}
                  style={{ padding: "5px 10px", borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  onClick={() => window.open(d.url, "_blank", "noopener,noreferrer")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {d.nom}
                      </div>
                      <div style={{ fontSize: 9, color: "var(--text-secondary)", marginTop: 1 }}>
                        {d.dept} · {d.circo}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                      <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 4px", borderRadius: 2, background: gc + "22", color: gc, border: `1px solid ${gc}44` }}>
                        {d.groupe}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: scoreColor, fontFamily: "var(--font-mono)", minWidth: 22, textAlign: "right" }}>
                        {d.score}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "4px 10px", borderTop: "1px solid var(--border)", fontSize: 9, color: "var(--text-secondary)", flexShrink: 0 }}>
        <a href="https://www.nosdeputes.fr" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)", textDecoration: "none" }}>nosdeputes.fr</a>
      </div>
    </div>
  );
}
