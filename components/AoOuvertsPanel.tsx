"use client";

import { useEffect, useState } from "react";

interface Consultation {
  id: string;
  objet: string;
  acheteur: string;
  typeMarche?: string;
  departement?: string;
  dateLimite: string;
  url: string;
}

function fmtDate(s: string): string {
  if (!s) return "—";
  return s.slice(0, 10);
}

function daysLeft(dateLimite: string): { n: number; color: string } | null {
  if (!dateLimite) return null;
  const d = new Date(dateLimite);
  if (isNaN(d.getTime())) return null;
  const n = Math.ceil((d.getTime() - Date.now()) / 86400000);
  return { n, color: n <= 3 ? "#ef4444" : n <= 7 ? "#eab308" : "#22c55e" };
}

export default function AoOuvertsPanel() {
  const [items, setItems] = useState<Consultation[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function load() {
    setStatus("loading");
    try {
      const res = await fetch("/api/consultations");
      const json = await res.json();
      setItems((json.consultations ?? []).slice(0, 15));
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
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent-blue)" }}>📋 AO OUVERTS</span>
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
          APPELS D'OFFRES — NATIONAL · BOAMP
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
        {status === "loading" && (
          <>
            {[1,2,3,4].map((n) => (
              <div key={n} style={{ height: 64, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 4 }} />
            ))}
          </>
        )}
        {status === "error" && (
          <div style={{ padding: 12, fontSize: 10, color: "var(--text-secondary)" }}>
            Indisponible. <a href="https://www.boamp.fr" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)" }}>→ BOAMP</a>
          </div>
        )}
        {status === "done" && items.length === 0 && (
          <div style={{ padding: 12, fontSize: 10, color: "var(--text-secondary)" }}>Aucun appel d'offres actif.</div>
        )}
        {status === "done" && items.map((c) => {
          const rem = daysLeft(c.dateLimite);
          return (
            <div
              key={c.id}
              onClick={() => c.url && window.open(c.url, "_blank", "noopener,noreferrer")}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "8px 10px",
                cursor: c.url ? "pointer" : "default",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.15)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.35, flex: 1 }}>
                  {c.objet || "Objet non précisé"}
                </div>
                {rem && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: rem.color, fontFamily: "var(--font-mono)", flexShrink: 0, lineHeight: 1 }}>
                    J-{rem.n}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 9, color: "var(--text-secondary)", marginTop: 3 }}>
                {c.acheteur}
                {c.departement && <span style={{ marginLeft: 6, color: "var(--accent-blue)", fontFamily: "var(--font-mono)" }}>Dépt {c.departement}</span>}
              </div>
              {c.dateLimite && (
                <div style={{ fontSize: 9, color: "var(--text-secondary)", marginTop: 3, fontFamily: "var(--font-mono)" }}>
                  Limite {fmtDate(c.dateLimite)}
                  {c.typeMarche && <span style={{ marginLeft: 8, padding: "0px 4px", border: "1px solid var(--border)", borderRadius: 2 }}>{c.typeMarche.slice(0, 18)}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: "4px 10px", borderTop: "1px solid var(--border)", fontSize: 9, color: "var(--text-secondary)", flexShrink: 0 }}>
        <a href="https://www.boamp.fr" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)", textDecoration: "none" }}>boamp.fr</a>
      </div>
    </div>
  );
}
