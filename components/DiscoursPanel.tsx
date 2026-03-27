"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";

interface Intervention {
  id: string;
  depute: string;
  groupe: string;
  date: string;
  type: string;
  texte: string;
  url?: string;
}

const GROUPE_COLORS: Record<string, string> = {
  RN: "#003189",
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
};

function groupColor(groupe: string) {
  return GROUPE_COLORS[groupe] ?? "#8b5cf6";
}

export default function DiscoursPanel() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"live" | "static">("static");
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);
  const setAnalyserInput = useAppStore((s) => s.setAnalyserInput);

  async function fetchData() {
    try {
      setLoading(true);
      const res = await fetch("/api/discours");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setInterventions(data.interventions ?? []);
      setSource(data.source ?? "static");
      setSessionUrl(data.sessionUrl ?? null);
    } catch {
      setInterventions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: "1px solid var(--border)" }}>
      {/* Header */}
      <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          🎙 Discours & Interventions
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {source === "static" && (
            <span style={{ fontSize: 7, color: "var(--border)", fontFamily: "var(--font-mono)" }}>STATIQUE</span>
          )}
          {source === "live" && (
            <span style={{ fontSize: 7, color: "#22c55e", fontFamily: "var(--font-mono)" }}>● LIVE</span>
          )}
          <button
            onClick={fetchData}
            title="Actualiser"
            style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 11, cursor: "pointer", padding: 0 }}
          >
            ↻
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: "20px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} style={{ height: 52, background: "var(--border)", borderRadius: 3, opacity: 0.2 }} />
            ))}
          </div>
        ) : interventions.length === 0 ? (
          <div style={{ padding: 16, fontSize: 10, color: "var(--text-secondary)", textAlign: "center" }}>Aucune intervention</div>
        ) : (
          <div style={{ padding: "4px 0" }}>
            {interventions.map((item) => {
              const gc = groupColor(item.groupe);
              return (
                <div
                  key={item.id}
                  style={{ padding: "7px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  {/* Name + groupe + date */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4, marginBottom: 3 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                      <span style={{
                        fontSize: 8, padding: "1px 4px", borderRadius: 2, flexShrink: 0,
                        background: gc + "22", color: gc, fontWeight: 700,
                        border: `1px solid ${gc}44`,
                      }}>{item.groupe || "—"}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.depute}
                      </span>
                    </div>
                    <span style={{ fontSize: 8, color: "var(--border)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>{item.date}</span>
                  </div>

                  {/* Excerpt */}
                  <div style={{
                    fontSize: 9, color: "var(--text-secondary)", lineHeight: 1.5,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    overflow: "hidden", marginBottom: 5,
                  }}>
                    {item.texte || "—"}
                  </div>

                  {/* Analyser button */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      onClick={() => setAnalyserInput(item.url ?? item.texte)}
                      style={{
                        fontSize: 8, padding: "2px 7px", borderRadius: 2,
                        border: "1px solid rgba(139,92,246,0.4)",
                        background: "rgba(139,92,246,0.08)",
                        color: "#a78bfa",
                        cursor: "pointer", fontFamily: "inherit",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.18)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.08)"; }}
                    >
                      → Analyser
                    </button>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 8, color: "var(--border)", textDecoration: "none" }}
                        title="Voir sur assemblee-nationale.fr"
                      >
                        ↗ source
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "4px 10px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        {sessionUrl ? (
          <a href={sessionUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 8, color: "var(--border)", textDecoration: "none" }}>
            Source : assemblee-nationale.fr · XVII° législature
          </a>
        ) : (
          <span style={{ fontSize: 8, color: "var(--border)" }}>Source : assemblee-nationale.fr · XVII° législature</span>
        )}
      </div>
    </div>
  );
}
