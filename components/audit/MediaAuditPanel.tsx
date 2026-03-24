"use client";

import { useState, useCallback } from "react";
import type { ScoredArticle, SourceScore } from "@/app/api/media-audit/route";

interface MediaAuditData {
  configured: boolean;
  articles: ScoredArticle[];
  sources: SourceScore[];
  total: number;
  fetchedAt: string;
}

const VERDICT_COLOR: Record<string, string> = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

const VERDICT_LABEL: Record<string, string> = {
  low: "faible",
  medium: "modéré",
  high: "élevé",
  critical: "critique",
};

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${Math.round(value * 100)}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: 10, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", width: 32, textAlign: "right" }}>
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  );
}

function VerdictBadge({ level }: { level: string }) {
  const color = VERDICT_COLOR[level] ?? "#6b7280";
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4,
      background: color + "22", color, border: `1px solid ${color}44`,
      textTransform: "uppercase", letterSpacing: "0.06em",
    }}>
      {VERDICT_LABEL[level] ?? level}
    </span>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: color ?? "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{value}</div>
    </div>
  );
}

export default function MediaAuditPanel() {
  const [data, setData] = useState<MediaAuditData | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "live" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchAudit = useCallback(async () => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/media-audit");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: MediaAuditData = await res.json();
      setData(json);
      setStatus("live");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const th: React.CSSProperties = {
    padding: "8px 12px", fontSize: 10, fontWeight: 600,
    color: "var(--text-secondary)", textTransform: "uppercase",
    letterSpacing: "0.07em", borderBottom: "1px solid var(--border)",
    whiteSpace: "nowrap", textAlign: "left",
    background: "rgba(255,255,255,0.02)",
  };

  const maxInfluence = data?.articles[0]?.overall_influence ?? 0;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Status bar */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
          background: status === "live" ? "#22c55e" : status === "loading" ? "#eab308" : status === "error" ? "#ef4444" : "var(--border)",
          boxShadow: status === "live" ? "0 0 6px rgba(34,197,94,0.5)" : undefined,
          animation: status === "loading" ? "pulse 1s infinite" : undefined,
        }} />
        <span style={{ fontSize: 11, color: "var(--text-secondary)", flex: 1 }}>
          {status === "idle" && "Analyse Infoverif — détection biais, propagande, désinformation"}
          {status === "loading" && "Analyse en cours via Infoverif…"}
          {status === "live" && data && `${data.total} articles analysés — dernière analyse ${new Date(data.fetchedAt).toLocaleTimeString("fr-FR")}`}
          {status === "error" && `Erreur : ${errorMsg}`}
        </span>
        <button
          onClick={fetchAudit}
          disabled={status === "loading"}
          style={{
            background: "var(--accent-blue)", color: "#fff", border: "none",
            padding: "5px 12px", borderRadius: 4, fontSize: 11, fontWeight: 600,
            cursor: status === "loading" ? "default" : "pointer",
            fontFamily: "inherit", opacity: status === "loading" ? 0.6 : 1,
          }}
        >
          {status === "loading" ? "Analyse…" : status === "live" ? "Réanalyser" : "Lancer l'analyse"}
        </button>
      </div>

      {/* Not configured */}
      {status === "live" && data && !data.configured && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "var(--text-secondary)" }}>
          <div style={{ fontSize: 28 }}>🔑</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Configuration requise</div>
          <div style={{ fontSize: 11, textAlign: "center", maxWidth: 360, lineHeight: 1.6 }}>
            La variable d'environnement <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 5px" }}>INFOVERIF_API_KEY</code> n'est pas définie.
            Demander une clé de service à l'Infoverif Engineer.
          </div>
        </div>
      )}

      {/* Idle / empty state */}
      {status === "idle" && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: "var(--text-secondary)" }}>
          <div style={{ fontSize: 28 }}>🔍</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Audit Médias</div>
          <div style={{ fontSize: 11, textAlign: "center", maxWidth: 400, lineHeight: 1.6 }}>
            Analyse les articles des 6 sources d'actualité françaises via le moteur Infoverif (DISARM framework).
            Détecte propagande, biais éditoriaux et désinformation en temps réel.
          </div>
          <button onClick={fetchAudit} style={{ background: "var(--accent-blue)", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 4 }}>
            Lancer l'analyse
          </button>
        </div>
      )}

      {/* Results */}
      {status === "live" && data && data.configured && data.total > 0 && (
        <>
          {/* Stats row */}
          <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 24, flexShrink: 0 }}>
            <Stat label="Articles analysés" value={String(data.total)} />
            <Stat label="Sources scannées" value={String(data.sources.length)} />
            <Stat
              label="Influence max"
              value={`${(maxInfluence * 100).toFixed(0)}%`}
              color={maxInfluence > 0.6 ? "#ef4444" : maxInfluence > 0.3 ? "#eab308" : "#22c55e"}
            />
            <Stat label="Moteur" value="DISARM" />
          </div>

          <div style={{ flex: 1, overflow: "auto", display: "flex", gap: 0 }}>
            {/* Source leaderboard (left column) */}
            <div style={{ width: 260, flexShrink: 0, borderRight: "1px solid var(--border)", overflow: "auto" }}>
              <div style={{ padding: "10px 14px 6px", fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1px solid var(--border)" }}>
                Classement sources
              </div>
              {data.sources.map((s, i) => (
                <div key={s.name} style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", width: 14 }}>{i + 1}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{s.name}</span>
                    </div>
                    <VerdictBadge level={s.maxVerdictLevel} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-secondary)", marginBottom: 1 }}>
                      <span>Influence</span>
                    </div>
                    <ScoreBar value={s.avgInfluence} color="#6366f1" />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-secondary)", marginBottom: 1, marginTop: 2 }}>
                      <span>Propagande</span>
                    </div>
                    <ScoreBar value={s.avgPropaganda} color="#ef4444" />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-secondary)", marginBottom: 1, marginTop: 2 }}>
                      <span>Désinformation</span>
                    </div>
                    <ScoreBar value={s.avgMisinfo} color="#f97316" />
                  </div>
                </div>
              ))}
            </div>

            {/* Articles table (main area) */}
            <div style={{ flex: 1, overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...th, width: 28 }}>#</th>
                    <th style={th}>Article</th>
                    <th style={th}>Source</th>
                    <th style={{ ...th, textAlign: "right" }}>Influence</th>
                    <th style={{ ...th, textAlign: "right" }}>Propagande</th>
                    <th style={th}>Verdict</th>
                    <th style={th}>Techniques détectées</th>
                  </tr>
                </thead>
                <tbody>
                  {data.articles.map((a, i) => (
                    <tr key={a.id}
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.15s", cursor: "pointer" }}
                      onClick={() => a.url && window.open(a.url, "_blank", "noopener")}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "8px 12px", fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{i + 1}</td>
                      <td style={{ padding: "8px 12px", maxWidth: 320 }}>
                        <div style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {a.title}
                        </div>
                        {a.summary && (
                          <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 3, lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                            {a.summary}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "8px 12px", fontSize: 11, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{a.source}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "#6366f1", fontWeight: 600 }}>
                        {(a.overall_influence * 100).toFixed(0)}%
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, color: "#ef4444" }}>
                        {(a.propaganda_score * 100).toFixed(0)}%
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <VerdictBadge level={a.verdict_level} />
                      </td>
                      <td style={{ padding: "8px 12px", fontSize: 10, color: "var(--text-secondary)", maxWidth: 200 }}>
                        {a.techniques.length > 0
                          ? a.techniques.join(" · ")
                          : <span style={{ opacity: 0.4 }}>aucune détectée</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* No results */}
      {status === "live" && data && data.configured && data.total === 0 && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, color: "var(--text-secondary)" }}>
          <div style={{ fontSize: 11 }}>Aucun article analysé. Vérifier la connexion à l'API Infoverif.</div>
        </div>
      )}
    </div>
  );
}
