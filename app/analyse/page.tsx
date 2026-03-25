"use client";

import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";

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

const VERDICT_ICON: Record<string, string> = {
  low: "✅",
  medium: "⚠️",
  high: "🚨",
  critical: "❌",
};

function scoreLabel(v?: number) {
  return v != null ? `${Math.round(v)}/100` : "—";
}

function confLabel(v: number) {
  const pct = v > 1 ? Math.round(v) : Math.round(v * 100);
  return `${pct}%`;
}

function ScoreBar({ label, value, color }: { label: string; value?: number; color: string }) {
  const barWidth = Math.min(value ?? 0, 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ fontFamily: "var(--font-mono)", color, fontWeight: 700 }}>{scoreLabel(value)}</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
        <div
          style={{
            width: `${barWidth}%`,
            height: "100%",
            background: color,
            borderRadius: 3,
            transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  );
}

export default function AnalysePage() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<VerifResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isUrl = /^https?:\/\//i.test(input.trim());
  const verdictColor = result?.verdict_level
    ? (VERDICT_COLOR[result.verdict_level] ?? "#6b7280")
    : "#6b7280";

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

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text().catch(() => "");
    if (text.trim()) {
      setInput(text.trim().slice(0, 8000));
      setStatus("idle");
      setResult(null);
    }
    e.target.value = "";
  }

  function reset() {
    setInput("");
    setStatus("idle");
    setResult(null);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--bg-primary)",
        overflow: "hidden",
      }}
    >
      <Navbar />

      <div
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "40px 24px",
        }}
      >
        {/* Page header */}
        <div style={{ width: "100%", maxWidth: 720, marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>🔍</span>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Analyser un contenu
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", letterSpacing: "0.08em", marginTop: 2 }}>
                DÉTECTION DE MANIPULATION · DÉSINFORMATION · PROPAGANDE
              </p>
            </div>
          </div>
          <div
            style={{
              height: 2,
              background: "linear-gradient(90deg, var(--accent-blue) 0%, transparent 100%)",
              borderRadius: 1,
            }}
          />
        </div>

        {/* Input card */}
        <div
          style={{
            width: "100%",
            maxWidth: 720,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                display: "block",
                marginBottom: 8,
              }}
            >
              Contenu à analyser
            </label>
            <div style={{ position: "relative" }}>
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (status !== "idle") reset();
                }}
                placeholder="Collez ici une URL, un article, un discours, un tweet, ou tout texte à vérifier…"
                rows={6}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  color: "var(--text-primary)",
                  fontSize: 13,
                  fontFamily: "inherit",
                  padding: "12px 14px",
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                  lineHeight: 1.6,
                }}
              />
              {input.trim() && (
                <span
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 10,
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: 3,
                    background: isUrl ? "rgba(99,102,241,0.15)" : "rgba(34,197,94,0.12)",
                    color: isUrl ? "#a5b4fc" : "#86efac",
                    pointerEvents: "none",
                    letterSpacing: "0.08em",
                  }}
                >
                  {isUrl ? "URL" : "TEXTE"}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={analyse}
              disabled={!input.trim() || status === "loading"}
              style={{
                flex: 1,
                background: "var(--accent-blue)",
                color: "#fff",
                border: "none",
                padding: "12px 0",
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 700,
                cursor: !input.trim() || status === "loading" ? "default" : "pointer",
                fontFamily: "inherit",
                opacity: !input.trim() || status === "loading" ? 0.5 : 1,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                transition: "opacity 0.15s",
              }}
            >
              {status === "loading" ? "Analyse en cours…" : "Analyser"}
            </button>

            <button
              onClick={() => fileRef.current?.click()}
              title="Importer un fichier"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                padding: "12px 16px",
                borderRadius: 4,
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "inherit",
                flexShrink: 0,
              }}
            >
              📎
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.csv,.json,.html,.xml,text/*"
              onChange={handleFile}
              style={{ display: "none" }}
            />

            {(status === "done" || status === "error") && (
              <button
                onClick={reset}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  padding: "12px 16px",
                  borderRadius: 4,
                  fontSize: 11,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  flexShrink: 0,
                  letterSpacing: "0.05em",
                }}
              >
                Effacer
              </button>
            )}
          </div>
        </div>

        {/* Loading state */}
        {status === "loading" && (
          <div
            style={{
              width: "100%",
              maxWidth: 720,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: 40,
              color: "var(--text-secondary)",
              fontSize: 13,
              letterSpacing: "0.06em",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 16,
                height: 16,
                border: "2px solid var(--border)",
                borderTopColor: "var(--accent-blue)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            Analyse DISARM en cours…
          </div>
        )}

        {/* Error state */}
        {status === "error" && result?.error && (
          <div
            style={{
              width: "100%",
              maxWidth: 720,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 6,
              padding: 20,
              fontSize: 13,
              color: "#ef4444",
              lineHeight: 1.6,
            }}
          >
            <strong>Erreur :</strong> {result.error}
          </div>
        )}

        {/* Results */}
        {status === "done" && result && !result.error && (
          <div style={{ width: "100%", maxWidth: 720, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Verdict card */}
            <div
              style={{
                background: verdictColor + "14",
                border: `1px solid ${verdictColor}40`,
                borderRadius: 6,
                padding: 24,
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              <span style={{ fontSize: 40, flexShrink: 0 }}>
                {VERDICT_ICON[result.verdict_level ?? ""] ?? "🔎"}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: verdictColor, marginBottom: 4 }}>
                  {VERDICT_FR[result.verdict_level ?? ""] ?? result.verdict_level}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.06em",
                  }}
                >
                  Score d&apos;influence global : {scoreLabel(result.overall_influence)}
                </div>
              </div>
            </div>

            {/* Scores */}
            <div
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: 24,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: 16,
                }}
              >
                Scores de risque
              </div>
              <ScoreBar label="Propagande" value={result.propaganda_score} color="#ef4444" />
              <ScoreBar label="Désinformation" value={result.misinfo_score} color="#f97316" />
              <ScoreBar label="Complotisme" value={result.conspiracy_score} color="#a78bfa" />
            </div>

            {/* Summary */}
            {result.summary && (
              <div
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: 24,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: 12,
                  }}
                >
                  Synthèse
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: "var(--text-primary)",
                    lineHeight: 1.7,
                  }}
                >
                  {result.summary}
                </p>
              </div>
            )}

            {/* Techniques */}
            {result.techniques && result.techniques.length > 0 && (
              <div
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: 24,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: 16,
                  }}
                >
                  Techniques DISARM détectées ({result.techniques.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {result.techniques.map((t, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "12px 14px",
                        background: "rgba(255,255,255,0.03)",
                        borderRadius: 4,
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: t.excerpt ? 8 : 0,
                        }}
                      >
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          {t.id && (
                            <span
                              style={{
                                fontSize: 10,
                                fontFamily: "var(--font-mono)",
                                color: "var(--text-secondary)",
                                background: "rgba(255,255,255,0.07)",
                                padding: "1px 6px",
                                borderRadius: 3,
                              }}
                            >
                              {t.id}
                            </span>
                          )}
                          <span style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
                            {t.name}
                          </span>
                          {t.tactic && (
                            <span
                              style={{
                                fontSize: 10,
                                color: "var(--text-secondary)",
                                fontStyle: "italic",
                              }}
                            >
                              {t.tactic}
                            </span>
                          )}
                        </div>
                        {t.confidence != null && (
                          <span
                            style={{
                              fontSize: 11,
                              fontFamily: "var(--font-mono)",
                              color: "#6366f1",
                              flexShrink: 0,
                              marginLeft: 8,
                            }}
                          >
                            {confLabel(t.confidence)}
                          </span>
                        )}
                      </div>
                      {t.excerpt && (
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-secondary)",
                            fontStyle: "italic",
                            lineHeight: 1.5,
                            borderLeft: "2px solid rgba(255,255,255,0.12)",
                            paddingLeft: 10,
                          }}
                        >
                          &ldquo;{t.excerpt}&rdquo;
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attribution */}
            <div
              style={{
                textAlign: "center",
                paddingBottom: 20,
                fontSize: 11,
                color: "var(--text-secondary)",
                letterSpacing: "0.06em",
              }}
            >
              Analyse par infoverif.org · Taxonomie DISARM Framework · Données officielles
            </div>
          </div>
        )}

        {/* Idle state explainer */}
        {status === "idle" && (
          <div
            style={{
              width: "100%",
              maxWidth: 720,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
          >
            {[
              { icon: "📰", label: "Article", desc: "URL ou texte complet d'un article de presse" },
              { icon: "🎙️", label: "Discours", desc: "Transcription d'un discours politique ou institutionnel" },
              { icon: "📱", label: "Post réseaux", desc: "Tweet, publication Facebook, contenu viral" },
            ].map(({ icon, label, desc }) => (
              <div
                key={label}
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: 16,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 6,
                  }}
                >
                  {label}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
