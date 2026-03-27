"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";

interface CorpStatement {
  company: string;
  sector: string;
  color: string;
  date: string;
  claim: string;
  sourceUrl: string;
  sourceOutlet: string;
  sourceOutletDomain: string;
}

const SECTOR_COLOR: Record<string, string> = {
  "Énergie":      "#f97316",
  "Luxe":         "#a78bfa",
  "Distribution": "#3b82f6",
  "Automobile":   "#eab308",
  "Finance":      "#22c55e",
  "Télécoms":     "#ef4444",
  "Santé":        "#8b5cf6",
};

export default function TransparencePanel() {
  const setAnalyserInput = useAppStore((s) => s.setAnalyserInput);
  const [statements, setStatements] = useState<CorpStatement[]>([]);
  const [source, setSource] = useState<"live" | "static">("static");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/corpus-entreprise")
      .then((r) => r.json())
      .then((data) => {
        setStatements(data.statements ?? []);
        setSource(data.source ?? "static");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sourceLabel = source === "live" ? "Actualités · Google News" : "Déclarations publiques";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: "1px solid var(--border)" }}>
      {/* Header */}
      <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          🏢 Corpus Entreprises
        </span>
      </div>

      {/* Statements */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: "20px 10px", fontSize: 9, color: "var(--border)", textAlign: "center" }}>
            Chargement…
          </div>
        ) : (
          <div style={{ padding: "4px 0" }}>
            {statements.map((s, i) => (
              <div
                key={i}
                style={{ padding: "7px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{
                      fontSize: 8, padding: "1px 4px", borderRadius: 2,
                      background: (SECTOR_COLOR[s.sector] ?? "#6b7280") + "22",
                      color: SECTOR_COLOR[s.sector] ?? "#6b7280",
                      fontWeight: 700, flexShrink: 0,
                    }}>{s.sector}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)" }}>{s.company}</span>
                  </div>
                  <span style={{ fontSize: 8, color: "var(--border)", flexShrink: 0 }}>{s.date}</span>
                </div>
                <div style={{ fontSize: 9, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 5 }}>
                  {s.claim}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={() => setAnalyserInput(s.sourceUrl)}
                    style={{
                      fontSize: 8, padding: "2px 7px", borderRadius: 2,
                      border: "1px solid var(--border)",
                      background: "transparent",
                      color: "var(--accent-blue)",
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    → Vérifier
                  </button>
                  {s.sourceUrl && (
                    <a
                      href={s.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 8, color: "var(--border)", textDecoration: "none" }}
                      title={`Source : ${s.sourceOutlet}`}
                    >
                      ↗ {s.sourceOutlet}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "4px 10px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <span style={{ fontSize: 8, color: "var(--border)" }}>
          {sourceLabel} · Cliquez pour vérifier
        </span>
      </div>
    </div>
  );
}
