"use client";

import { useEffect, useState } from "react";

interface Deputy {
  nom: string;
  groupe: string;
  score: number;
  semaines: number;
}

const GROUPE_COLORS: Record<string, string> = {
  RN: "#003189",
  RE: "#FFEB3B",
  LFI: "#B71C1C",
  SOC: "#E91E63",
  LR: "#0D47A1",
  HOR: "#FF9800",
  GDR: "#D32F2F",
  LIOT: "#607D8B",
  ECO: "#388E3C",
};

function groupColor(groupe: string) {
  return GROUPE_COLORS[groupe] ?? "#6b7280";
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(score, 100);
  const color = score < 20 ? "#ef4444" : score < 40 ? "#f97316" : "#22c55e";
  return (
    <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginTop: 2 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.4s" }} />
    </div>
  );
}

export default function TransparencePanel() {
  const [deputes, setDeputes] = useState<Deputy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/transparence");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDeputes(data.deputes ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
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
          😴 Sous-actifs
        </span>
        <button
          onClick={fetchData}
          title="Actualiser"
          style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 11, cursor: "pointer", padding: 0 }}
        >
          ↻
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: "20px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} style={{ height: 28, background: "var(--border)", borderRadius: 3, opacity: 0.3 }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ padding: "16px 10px", fontSize: 10, color: "#ef4444", textAlign: "center" }}>
            <div>Données indisponibles</div>
            <div style={{ color: "var(--text-secondary)", marginTop: 4 }}>{error}</div>
            <button onClick={fetchData} style={{ marginTop: 8, fontSize: 9, color: "var(--accent-blue)", background: "none", border: "none", cursor: "pointer" }}>Réessayer</button>
          </div>
        ) : deputes.length === 0 ? (
          <div style={{ padding: 16, fontSize: 10, color: "var(--text-secondary)", textAlign: "center" }}>Aucune donnée</div>
        ) : (
          <div style={{ padding: "4px 0" }}>
            <div style={{ padding: "4px 10px 6px", fontSize: 8, color: "var(--border)", borderBottom: "1px solid var(--border)", marginBottom: 2 }}>
              15 députés les moins actifs · score d&apos;activité / présence
            </div>
            {deputes.map((d, i) => (
              <div
                key={d.nom}
                style={{ padding: "6px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                    <span style={{ fontSize: 8, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>#{i + 1}</span>
                    <span style={{ fontSize: 10, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.nom}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 8, padding: "1px 4px", borderRadius: 2,
                      background: groupColor(d.groupe) + "22",
                      color: groupColor(d.groupe),
                      fontWeight: 700,
                    }}>{d.groupe}</span>
                    <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: d.score < 20 ? "#ef4444" : d.score < 40 ? "#f97316" : "#22c55e", fontWeight: 700 }}>
                      {d.score}
                    </span>
                  </div>
                </div>
                <ScoreBar score={d.score} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "4px 10px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <span style={{ fontSize: 8, color: "var(--border)" }}>Source: nosdéputés.fr · XVI° législature</span>
      </div>
    </div>
  );
}
