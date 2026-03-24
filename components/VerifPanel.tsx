"use client";

import { useState, useRef, useEffect } from "react";

interface Technique {
  id?: string;
  name: string;
  tactic?: string;
  confidence?: number;
  excerpt?: string;
}

interface VerifResult {
  propaganda_score?: number;
  conspiracy_score?: number;
  misinfo_score?: number;
  overall_influence?: number;
  verdict_level?: string;
  techniques?: Technique[];
  summary?: string;
  _input_type?: string;
  error?: string;
}

const VERDICT_COLOR: Record<string, string> = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

const VERDICT_FR: Record<string, string> = {
  low: "Faible risque",
  medium: "Risque modéré",
  high: "Risque élevé",
  critical: "Critique",
};

function pct(v?: number) {
  return v != null ? `${Math.round(v * 100)}%` : "—";
}

function ScoreRow({ label, value, color }: { label: string; value?: number; color: string }) {
  const pctVal = value != null ? value * 100 : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-secondary)", marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ fontFamily: "var(--font-mono)", color }}>{pct(value)}</span>
      </div>
      <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pctVal}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.5s" }} />
      </div>
    </div>
  );
}

export default function VerifPanel() {
  const [modalOpen, setModalOpen] = useState(false);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<VerifResult | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isUrl = /^https?:\/\//i.test(input.trim());
  const verdictColor = result?.verdict_level ? (VERDICT_COLOR[result.verdict_level] ?? "#6b7280") : "#6b7280";

  useEffect(() => {
    if (modalOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  }, [modalOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setModalOpen(false);
    }
    if (modalOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  async function analyse() {
    if (!input.trim() || status === "loading") return;
    setStatus("loading");
    setResult(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
      });
      const data: VerifResult = await res.json();
      if (!res.ok || data.error) {
        setResult({ error: data.error ?? `HTTP ${res.status}` });
        setStatus("error");
      } else {
        setResult(data);
        setStatus("done");
      }
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : "Erreur réseau" });
      setStatus("error");
    }
  }

  function reset() {
    setInput("");
    setStatus("idle");
    setResult(null);
  }

  return (
    <>
      {/* Bottom bar panel — click to open modal */}
      <div
        onClick={() => setModalOpen(true)}
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          gap: 6,
          padding: "0 8px",
          borderLeft: "1px solid var(--border)",
          transition: "background 0.15s",
          userSelect: "none",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        title="Ouvrir l'analyseur Infoverif"
      >
        <span style={{ fontSize: 18 }}>🔍</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
          Vérifier
        </span>
        <span style={{ fontSize: 8, color: "var(--border)", textAlign: "center", lineHeight: 1.4 }}>
          texte · url · lien
        </span>
      </div>

      {/* Modal overlay */}
      {modalOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.75)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div style={{
            width: "min(680px, 95vw)",
            maxHeight: "85vh",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>🔍</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.05em" }}>
                    Analyse Infoverif
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>
                    Détection propagande · biais · désinformation (DISARM)
                  </div>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 18, cursor: "pointer", lineHeight: 1, padding: "2px 6px" }}
              >×</button>
            </div>

            {/* Input area */}
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              <div style={{ position: "relative" }}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); if (status !== "idle") reset(); }}
                  placeholder="Collez un texte, une URL ou un lien d'article…"
                  rows={4}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    color: "var(--text-primary)",
                    fontSize: 12,
                    fontFamily: "inherit",
                    padding: "10px 12px",
                    resize: "none",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {input.trim() && (
                  <span style={{
                    position: "absolute", top: 8, right: 8,
                    fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 3,
                    background: isUrl ? "rgba(99,102,241,0.15)" : "rgba(34,197,94,0.12)",
                    color: isUrl ? "#a5b4fc" : "#86efac",
                    border: `1px solid ${isUrl ? "rgba(99,102,241,0.3)" : "rgba(34,197,94,0.25)"}`,
                    pointerEvents: "none",
                  }}>
                    {isUrl ? "URL" : "TEXTE"}
                  </span>
                )}
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  onClick={analyse}
                  disabled={!input.trim() || status === "loading"}
                  style={{
                    background: "var(--accent-blue)", color: "#fff", border: "none",
                    padding: "7px 18px", borderRadius: 4, fontSize: 12, fontWeight: 700,
                    cursor: (!input.trim() || status === "loading") ? "default" : "pointer",
                    fontFamily: "inherit",
                    opacity: (!input.trim() || status === "loading") ? 0.5 : 1,
                    transition: "opacity 0.15s",
                  }}
                >
                  {status === "loading" ? "Analyse en cours…" : "Analyser"}
                </button>
                {(status === "done" || status === "error") && (
                  <button onClick={reset} style={{ background: "none", border: "1px solid var(--border)", color: "var(--text-secondary)", padding: "6px 12px", borderRadius: 4, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                    Nouveau
                  </button>
                )}
                <span style={{ fontSize: 10, color: "var(--text-secondary)", marginLeft: "auto" }}>
                  Propulsé par Infoverif · Cadre DISARM
                </span>
              </div>
            </div>

            {/* Loading */}
            {status === "loading" && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--text-secondary)", fontSize: 12, padding: 24 }}>
                <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid var(--border)", borderTopColor: "var(--accent-blue)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Analyse en cours…
              </div>
            )}

            {/* Error */}
            {status === "error" && result?.error && (
              <div style={{ padding: "16px 18px", color: "#ef4444", fontSize: 12 }}>
                Erreur : {result.error}
              </div>
            )}

            {/* Results */}
            {status === "done" && result && !result.error && (
              <div style={{ flex: 1, overflow: "auto", padding: "16px 18px" }}>
                {/* Verdict header */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, padding: "12px 16px", background: verdictColor + "12", border: `1px solid ${verdictColor}33`, borderRadius: 6 }}>
                  <div style={{ fontSize: 28 }}>
                    {result.verdict_level === "low" ? "✅" : result.verdict_level === "medium" ? "⚠️" : result.verdict_level === "high" ? "🚨" : "❌"}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: verdictColor }}>
                      {VERDICT_FR[result.verdict_level ?? ""] ?? result.verdict_level}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                      Score d'influence global : <strong style={{ color: verdictColor, fontFamily: "var(--font-mono)" }}>{pct(result.overall_influence)}</strong>
                      {result._input_type && (
                        <span style={{ marginLeft: 10, fontSize: 9, padding: "1px 5px", borderRadius: 3, background: "rgba(255,255,255,0.07)", color: "var(--text-secondary)" }}>
                          {result._input_type === "url" ? "URL analysée" : "Texte analysé"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score bars */}
                <div style={{ marginBottom: 16 }}>
                  <ScoreRow label="Propagande" value={result.propaganda_score} color="#ef4444" />
                  <ScoreRow label="Désinformation" value={result.misinfo_score} color="#f97316" />
                  <ScoreRow label="Complot" value={result.conspiracy_score} color="#a78bfa" />
                </div>

                {/* Summary */}
                {result.summary && (
                  <div style={{ marginBottom: 16, padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 4, borderLeft: "3px solid var(--border)" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Résumé</div>
                    <div style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.6 }}>{result.summary}</div>
                  </div>
                )}

                {/* DISARM techniques */}
                {result.techniques && result.techniques.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                      Techniques DISARM détectées ({result.techniques.length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {result.techniques.map((t, i) => (
                        <div key={i} style={{ padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 4, border: "1px solid rgba(255,255,255,0.06)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: t.excerpt ? 4 : 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              {t.id && <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-secondary)", background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 3 }}>{t.id}</span>}
                              <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500 }}>{t.name}</span>
                              {t.tactic && <span style={{ fontSize: 9, color: "var(--text-secondary)" }}>{t.tactic}</span>}
                            </div>
                            {t.confidence != null && (
                              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#6366f1" }}>{Math.round(t.confidence * 100)}%</span>
                            )}
                          </div>
                          {t.excerpt && (
                            <div style={{ fontSize: 10, color: "var(--text-secondary)", fontStyle: "italic", borderLeft: "2px solid rgba(255,255,255,0.1)", paddingLeft: 8, marginTop: 4, lineHeight: 1.5 }}>
                              "{t.excerpt}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
