"use client";

import { useState, useRef } from "react";

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
  low: "✅", medium: "⚠️", high: "🚨", critical: "❌",
};

// API returns 0-100 scale scores (not 0-1)
function scoreLabel(v?: number) {
  return v != null ? `${Math.round(v)}/100` : "—";
}

// confidence may be 0-1 or 0-100; normalize to display as %
function confLabel(v: number) {
  const pct = v > 1 ? Math.round(v) : Math.round(v * 100);
  return `${pct}%`;
}

function ScoreRow({ label, value, color }: { label: string; value?: number; color: string }) {
  const barWidth = Math.min(value ?? 0, 100);
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text-secondary)", marginBottom: 2 }}>
        <span>{label}</span>
        <span style={{ fontFamily: "var(--font-mono)", color }}>{scoreLabel(value)}</span>
      </div>
      <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${barWidth}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.5s" }} />
      </div>
    </div>
  );
}

export default function VerifPanel() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<VerifResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isUrl = /^https?:\/\//i.test(input.trim());
  const verdictColor = result?.verdict_level ? (VERDICT_COLOR[result.verdict_level] ?? "#6b7280") : "#6b7280";

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
    // Read text content from file and populate textarea
    const text = await file.text().catch(() => "");
    if (text.trim()) {
      setInput(text.trim().slice(0, 4000));
      setStatus("idle");
      setResult(null);
    }
    // Reset file input so the same file can be re-selected
    e.target.value = "";
  }

  function reset() {
    setInput("");
    setStatus("idle");
    setResult(null);
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: "1px solid var(--border)" }}>

      {/* Header */}
      <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          🔍 Vérifier une info
        </span>
        {(status === "done" || status === "error") && (
          <button onClick={reset} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 9, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
            Effacer ×
          </button>
        )}
      </div>

      {/* Input area */}
      <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ position: "relative", marginBottom: 6 }}>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); if (status !== "idle") reset(); }}
            placeholder="Texte, URL, article, discours…"
            rows={3}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border)",
              borderRadius: 3,
              color: "var(--text-primary)",
              fontSize: 11,
              fontFamily: "inherit",
              padding: "6px 8px",
              resize: "none",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {input.trim() && (
            <span style={{
              position: "absolute", top: 5, right: 6,
              fontSize: 8, fontWeight: 700, padding: "1px 4px", borderRadius: 2,
              background: isUrl ? "rgba(99,102,241,0.15)" : "rgba(34,197,94,0.12)",
              color: isUrl ? "#a5b4fc" : "#86efac",
              pointerEvents: "none",
            }}>
              {isUrl ? "URL" : "TEXTE"}
            </span>
          )}
        </div>

        {/* Actions row */}
        <div style={{ display: "flex", gap: 5 }}>
          <button
            onClick={analyse}
            disabled={!input.trim() || status === "loading"}
            style={{
              flex: 1,
              background: "var(--accent-blue)", color: "#fff", border: "none",
              padding: "5px 0", borderRadius: 3, fontSize: 11, fontWeight: 700,
              cursor: (!input.trim() || status === "loading") ? "default" : "pointer",
              fontFamily: "inherit",
              opacity: (!input.trim() || status === "loading") ? 0.5 : 1,
            }}
          >
            {status === "loading" ? "Analyse…" : "Analyser"}
          </button>

          {/* File upload button */}
          <button
            onClick={() => fileRef.current?.click()}
            title="Importer un fichier texte"
            style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
              color: "var(--text-secondary)", padding: "5px 8px", borderRadius: 3,
              fontSize: 11, cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
            }}
          >
            📎
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.csv,.json,.html,.xml,text/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFile}
            style={{ display: "none" }}
          />
        </div>
      </div>

      {/* Results area */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 10px" }}>

        {status === "idle" && (
          <div style={{ fontSize: 9, color: "var(--border)", textAlign: "center", marginTop: 10, lineHeight: 1.8 }}>
            Texte · URL · Article · Discours<br />
            Document · Image · Vidéo · Audio<br />
            <a
              href="https://infoverif.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent-blue)", textDecoration: "none", opacity: 0.6 }}
            >
              Propulsé par Infoverif · DISARM
            </a>
          </div>
        )}

        {status === "loading" && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16, color: "var(--text-secondary)", fontSize: 11 }}>
            <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid var(--border)", borderTopColor: "var(--accent-blue)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            En cours…
          </div>
        )}

        {status === "error" && result?.error && (
          <div style={{ fontSize: 10, color: "#ef4444", lineHeight: 1.5 }}>
            Erreur : {result.error}
          </div>
        )}

        {status === "done" && result && !result.error && (
          <>
            {/* Verdict */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "7px 9px", background: verdictColor + "14", border: `1px solid ${verdictColor}33`, borderRadius: 4 }}>
              <span style={{ fontSize: 16 }}>{VERDICT_ICON[result.verdict_level ?? ""] ?? "🔎"}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: verdictColor }}>
                  {VERDICT_FR[result.verdict_level ?? ""] ?? result.verdict_level}
                </div>
                <div style={{ fontSize: 9, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                  Influence {scoreLabel(result.overall_influence)}
                </div>
              </div>
            </div>

            {/* Scores */}
            <div style={{ marginBottom: 10 }}>
              <ScoreRow label="Propagande" value={result.propaganda_score} color="#ef4444" />
              <ScoreRow label="Désinformation" value={result.misinfo_score} color="#f97316" />
              <ScoreRow label="Complot" value={result.conspiracy_score} color="#a78bfa" />
            </div>

            {/* Summary */}
            {result.summary && (
              <div style={{ marginBottom: 10, fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.6, borderLeft: "2px solid var(--border)", paddingLeft: 8 }}>
                {result.summary}
              </div>
            )}

            {/* Techniques */}
            {result.techniques && result.techniques.length > 0 && (
              <div>
                <div style={{ fontSize: 9, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>
                  Techniques DISARM ({result.techniques.length})
                </div>
                {result.techniques.map((t, i) => (
                  <div key={i} style={{ marginBottom: 5, padding: "5px 7px", background: "rgba(255,255,255,0.03)", borderRadius: 3, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                        {t.id && <span style={{ fontSize: 8, fontFamily: "var(--font-mono)", color: "var(--text-secondary)", background: "rgba(255,255,255,0.06)", padding: "0 4px", borderRadius: 2 }}>{t.id}</span>}
                        <span style={{ fontSize: 10, color: "var(--text-primary)", fontWeight: 500 }}>{t.name}</span>
                      </div>
                      {t.confidence != null && (
                        <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "#6366f1", flexShrink: 0, marginLeft: 4 }}>{confLabel(t.confidence)}</span>
                      )}
                    </div>
                    {t.excerpt && (
                      <div style={{ fontSize: 9, color: "var(--text-secondary)", fontStyle: "italic", marginTop: 3, lineHeight: 1.4 }}>
                        &ldquo;{t.excerpt}&rdquo;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Attribution */}
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--border)", textAlign: "center" }}>
              <a
                href="https://infoverif.org"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 9, color: "var(--text-secondary)", textDecoration: "none", letterSpacing: "0.05em" }}
              >
                Analyse par infoverif.org · DISARM
              </a>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
