"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import NewsTickerPanel from "@/components/NewsTickerPanel";
import TVPanel from "@/components/TVPanel";
import DepartmentPanel from "@/components/DepartmentPanel";
import CommunePanel from "@/components/CommunePanel";
import CommuneSearchBar from "@/components/CommuneSearchBar";

// MapLibre requires browser APIs — load client-side only
const Map = dynamic(() => import("@/components/Map"), { ssr: false });

/* ── Inline analyser types & helpers ───────────────────────── */
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
  error?: string;
}
const VERDICT_COLOR: Record<string, string> = {
  low: "#22c55e", medium: "#eab308", high: "#f97316", critical: "#ef4444",
};
const VERDICT_FR: Record<string, string> = {
  low: "Faible risque", medium: "Risque modéré", high: "Risque élevé", critical: "Critique",
};
const VERDICT_ICON: Record<string, string> = {
  low: "✅", medium: "⚠️", high: "🚨", critical: "❌",
};
function scoreLabel(v?: number) { return v != null ? `${Math.round(v)}/100` : "—"; }
function confLabel(v: number) { return `${v > 1 ? Math.round(v) : Math.round(v * 100)}%`; }

function ScoreBar({ label, value, color }: { label: string; value?: number; color: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-secondary)", marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ fontFamily: "var(--font-mono)", color, fontWeight: 700 }}>{scoreLabel(value)}</span>
      </div>
      <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(value ?? 0, 100)}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.5s" }} />
      </div>
    </div>
  );
}

function AnalyserPanel() {
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
    const text = await file.text().catch(() => "");
    if (text.trim()) { setInput(text.trim().slice(0, 8000)); setStatus("idle"); setResult(null); }
    e.target.value = "";
  }

  function reset() { setInput(""); setStatus("idle"); setResult(null); }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: "1px solid var(--border)" }}>
      {/* Header */}
      <div style={{ padding: "6px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          🔍 Analyser un contenu · Détection DISARM
        </span>
        {(status === "done" || status === "error") && (
          <button onClick={reset} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 10, cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
            Effacer ×
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflow: "auto", display: "flex", gap: 0 }}>
        {/* Left: input */}
        <div style={{ flex: "0 0 380px", padding: "12px 14px", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ position: "relative" }}>
            <textarea
              value={input}
              onChange={(e) => { setInput(e.target.value); if (status !== "idle") reset(); }}
              placeholder="Collez ici une URL, un article, un discours, un tweet, ou tout texte à vérifier…"
              style={{
                width: "100%",
                height: 120,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                color: "var(--text-primary)",
                fontSize: 12,
                fontFamily: "inherit",
                padding: "10px 12px",
                resize: "none",
                outline: "none",
                boxSizing: "border-box",
                lineHeight: 1.6,
              }}
            />
            {input.trim() && (
              <span style={{
                position: "absolute", top: 7, right: 8,
                fontSize: 8, fontWeight: 800, padding: "1px 5px", borderRadius: 2,
                background: isUrl ? "rgba(99,102,241,0.15)" : "rgba(34,197,94,0.12)",
                color: isUrl ? "#a5b4fc" : "#86efac",
                pointerEvents: "none",
              }}>
                {isUrl ? "URL" : "TEXTE"}
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={analyse}
              disabled={!input.trim() || status === "loading"}
              style={{
                flex: 1,
                background: "var(--accent-blue)", color: "#fff", border: "none",
                padding: "9px 0", borderRadius: 4, fontSize: 12, fontWeight: 700,
                cursor: (!input.trim() || status === "loading") ? "default" : "pointer",
                fontFamily: "inherit", opacity: (!input.trim() || status === "loading") ? 0.5 : 1,
                letterSpacing: "0.06em", textTransform: "uppercase",
              }}
            >
              {status === "loading" ? "Analyse…" : "Analyser"}
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              title="Importer un fichier"
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
                color: "var(--text-secondary)", padding: "9px 12px", borderRadius: 4,
                fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              }}
            >📎</button>
            <input ref={fileRef} type="file" accept=".txt,.md,.html,text/*" onChange={handleFile} style={{ display: "none" }} />
          </div>

          {status === "idle" && (
            <div style={{ fontSize: 9, color: "var(--border)", lineHeight: 1.8, textAlign: "center", marginTop: 4 }}>
              Article · URL · Discours · Post réseaux · Document<br />
              <span style={{ color: "var(--text-secondary)", opacity: 0.5 }}>Taxonomie DISARM Framework</span>
            </div>
          )}

          {status === "loading" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--text-secondary)", fontSize: 11 }}>
              <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid var(--border)", borderTopColor: "var(--accent-blue)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              Analyse DISARM en cours…
            </div>
          )}

          {status === "error" && result?.error && (
            <div style={{ fontSize: 11, color: "#ef4444", lineHeight: 1.5 }}>Erreur : {result.error}</div>
          )}
        </div>

        {/* Right: results */}
        <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
          {status === "done" && result && !result.error && (
            <>
              {/* Verdict */}
              <div style={{
                display: "flex", alignItems: "center", gap: 14, marginBottom: 14, padding: "10px 14px",
                background: verdictColor + "14", border: `1px solid ${verdictColor}40`, borderRadius: 5,
              }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{VERDICT_ICON[result.verdict_level ?? ""] ?? "🔎"}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: verdictColor }}>
                    {VERDICT_FR[result.verdict_level ?? ""] ?? result.verdict_level}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                    Influence globale : {scoreLabel(result.overall_influence)}
                  </div>
                </div>
              </div>

              {/* Scores */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Scores de risque</div>
                <ScoreBar label="Propagande" value={result.propaganda_score} color="#ef4444" />
                <ScoreBar label="Désinformation" value={result.misinfo_score} color="#f97316" />
                <ScoreBar label="Complotisme" value={result.conspiracy_score} color="#a78bfa" />
              </div>

              {/* Summary */}
              {result.summary && (
                <div style={{ marginBottom: 14, fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6, borderLeft: "2px solid var(--border)", paddingLeft: 10 }}>
                  {result.summary}
                </div>
              )}

              {/* Techniques */}
              {result.techniques && result.techniques.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                    Techniques DISARM ({result.techniques.length})
                  </div>
                  {result.techniques.map((t, i) => (
                    <div key={i} style={{ marginBottom: 6, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 3, border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          {t.id && <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-secondary)", background: "rgba(255,255,255,0.06)", padding: "0 4px", borderRadius: 2 }}>{t.id}</span>}
                          <span style={{ fontSize: 11, color: "var(--text-primary)", fontWeight: 600 }}>{t.name}</span>
                          {t.tactic && <span style={{ fontSize: 9, color: "var(--text-secondary)", fontStyle: "italic" }}>{t.tactic}</span>}
                        </div>
                        {t.confidence != null && (
                          <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "#6366f1", flexShrink: 0, marginLeft: 6 }}>{confLabel(t.confidence)}</span>
                        )}
                      </div>
                      {t.excerpt && (
                        <div style={{ fontSize: 9, color: "var(--text-secondary)", fontStyle: "italic", marginTop: 4, lineHeight: 1.4, borderLeft: "2px solid rgba(255,255,255,0.1)", paddingLeft: 8 }}>
                          &ldquo;{t.excerpt}&rdquo;
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {status === "idle" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, paddingTop: 4 }}>
              {[
                { icon: "📰", label: "Article", desc: "URL ou texte complet d'un article de presse" },
                { icon: "🎙️", label: "Discours", desc: "Transcription d'un discours politique" },
                { icon: "📱", label: "Post réseaux", desc: "Tweet, publication Facebook, contenu viral" },
                { icon: "📄", label: "Document", desc: "PDF, rapport, note officielle" },
              ].map(({ icon, label, desc }) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 4, padding: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 18, marginBottom: 5 }}>{icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 9, color: "var(--text-secondary)", lineHeight: 1.4 }}>{desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────── */
export default function Home() {
  const [selectedDept, setSelectedDept] = useState<{ code: string; nom: string } | null>(null);
  const [selectedCommune, setSelectedCommune] = useState<{ code: string; nom: string } | null>(null);

  const handleDeptClick = useCallback((code: string, nom: string) => {
    setSelectedDept({ code, nom });
    setSelectedCommune(null);
  }, []);

  const handleCommuneSelect = useCallback((code: string, nom: string) => {
    setSelectedCommune({ code, nom });
    setSelectedDept(null);
  }, []);

  return (
    <div
      className="main-wrapper"
      style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-primary)", overflow: "hidden" }}
    >
      <Navbar />

      {/* Search bar */}
      <div style={{ padding: "4px 16px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <CommuneSearchBar onSelect={handleCommuneSelect} />
      </div>

      <div className="main-content-area" style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        {/* Map — 50% of available height */}
        <div className="map-section" style={{ flex: "0 0 50%", position: "relative", overflow: "hidden" }}>
          <Map onDeptClick={handleDeptClick} onCommuneClick={handleCommuneSelect} />

          {selectedDept && !selectedCommune && (
            <DepartmentPanel
              code={selectedDept.code}
              nom={selectedDept.nom}
              onClose={() => setSelectedDept(null)}
            />
          )}

          {selectedCommune && (
            <CommunePanel
              code={selectedCommune.code}
              nom={selectedCommune.nom}
              onClose={() => setSelectedCommune(null)}
            />
          )}
        </div>

        {/* Bottom panels — 50%: News · TV Direct · Analyser */}
        <div
          className="bottom-panels"
          style={{ flex: "0 0 50%", display: "flex", borderTop: "1px solid var(--border)", overflow: "hidden" }}
        >
          {/* Actualités en direct — 16% */}
          <div style={{ flex: "0 0 16%", overflow: "hidden" }}>
            <NewsTickerPanel />
          </div>

          {/* TV Direct — 10% */}
          <div style={{ flex: "0 0 10%", overflow: "hidden" }}>
            <TVPanel />
          </div>

          {/* Analyser — fills remaining space */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            <AnalyserPanel />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="footer-bar"
        style={{
          height: 22, background: "var(--bg-secondary)", borderTop: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, gap: 6,
        }}
      >
        <span style={{ fontSize: 9, color: "var(--text-secondary)", letterSpacing: "0.1em" }}>OPEN SOURCE</span>
        <span style={{ fontSize: 9, color: "var(--border)" }}>·</span>
        <a
          href="https://github.com/soufianelemqariMain/auditfrance"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 9, color: "var(--text-secondary)", textDecoration: "none", letterSpacing: "0.1em" }}
        >
          infoverif.org
        </a>
        <span style={{ fontSize: 9, color: "var(--border)" }}>·</span>
        <span style={{ fontSize: 9, color: "var(--text-secondary)", letterSpacing: "0.1em" }}>MIT</span>
      </div>
    </div>
  );
}
