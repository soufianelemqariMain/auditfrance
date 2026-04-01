"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { track } from "@vercel/analytics";
import Navbar from "@/components/Navbar";
import NewsBandeau from "@/components/NewsBandeau";
import TVPanel from "@/components/TVPanel";
import DepartmentPanel from "@/components/DepartmentPanel";
import CommunePanel from "@/components/CommunePanel";
import CorpusPolitiquePanel from "@/components/CorpusPolitiquePanel";
import DiscoursPanel from "@/components/DiscoursPanel";
import NewsTickerPanel from "@/components/NewsTickerPanel";
import { useAppStore } from "@/lib/store";

// MapLibre requires browser APIs — load client-side only
const Map = dynamic(() => import("@/components/Map"), { ssr: false });

/* ── Inline analyser types & helpers ───────────────────────── */
interface Technique {
  // Backend fields
  disarm_code?: string;
  disarm_tactic?: string;
  name: string;
  evidence?: string;
  severity?: string;
  confidence?: number | string;
  explanation?: string;
  cognitive_mechanism?: string;
  contextual_impact?: string;
  recommended_action?: string;
  // Legacy aliases
  id?: string;
  tactic?: string;
  excerpt?: string;
}
interface CorrectionAdvice {
  instead_of?: string;
  say_instead?: string;
  because?: string;
  technique_code?: string;
}
interface VerifResult {
  propaganda_score?: number;
  conspiracy_score?: number;
  misinfo_score?: number;
  overall_influence?: number;
  verdict_level?: string;
  verdict_label?: string;
  viewpoint_balance?: string;
  nuance_note?: string;
  transparency_of_advocacy?: string;
  audience_targeted?: string;
  urgency_framing?: boolean;
  red_flags_summary?: string;
  pattern_tags?: string[];
  content_summary?: string;
  manipulation_summary?: string;
  techniques?: Technique[];
  technique_interactions?: Array<{ technique_1: string; technique_2: string; interaction: string }>;
  fact_check_priority?: string[];
  top_recommendations?: string[];
  correction_advice?: CorrectionAdvice[];
  summary?: string;
  reasoning_summary?: string;
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
  const analyserInput = useAppStore((s) => s.analyserInput);
  const setAnalyserInput = useAppStore((s) => s.setAnalyserInput);

  // When a news article sends a URL, prefill and start analysis
  useEffect(() => {
    if (analyserInput && analyserInput !== input) {
      setInput(analyserInput);
      setStatus("idle");
      setResult(null);
      setAnalyserInput(""); // clear so re-sending same URL works
    }
  }, [analyserInput]); // eslint-disable-line react-hooks/exhaustive-deps
  const [result, setResult] = useState<VerifResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isUrl = /^https?:\/\//i.test(input.trim());
  const verdictColor = result?.verdict_level ? (VERDICT_COLOR[result.verdict_level] ?? "#6b7280") : "#6b7280";

  async function analyse() {
    if (!input.trim() || status === "loading") return;
    setStatus("loading");
    track("analyse_submitted", { input_type: isUrl ? "url" : "text" });
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

      <div style={{ flex: 1, overflow: "auto", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Input row */}
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexShrink: 0 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <textarea
              value={input}
              onChange={(e) => { setInput(e.target.value); if (status !== "idle") reset(); }}
              placeholder="Collez ici une URL, un article, un discours, un tweet, ou tout texte à vérifier…"
              style={{
                width: "100%",
                height: 70,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                color: "var(--text-primary)",
                fontSize: 12,
                fontFamily: "inherit",
                padding: "8px 38px 8px 10px",
                resize: "none",
                outline: "none",
                boxSizing: "border-box",
                lineHeight: 1.5,
              }}
            />
            {input.trim() && (
              <span style={{
                position: "absolute", top: 6, right: 6,
                fontSize: 7, fontWeight: 800, padding: "1px 4px", borderRadius: 2,
                background: isUrl ? "rgba(99,102,241,0.15)" : "rgba(34,197,94,0.12)",
                color: isUrl ? "#a5b4fc" : "#86efac",
                pointerEvents: "none",
              }}>
                {isUrl ? "URL" : "TEXTE"}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
            <button
              onClick={analyse}
              disabled={!input.trim() || status === "loading"}
              style={{
                background: "var(--accent-blue)", color: "#fff", border: "none",
                padding: "8px 14px", borderRadius: 4, fontSize: 11, fontWeight: 700,
                cursor: (!input.trim() || status === "loading") ? "default" : "pointer",
                fontFamily: "inherit", opacity: (!input.trim() || status === "loading") ? 0.5 : 1,
                letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap",
              }}
            >
              {status === "loading" ? "Analyse…" : "Analyser"}
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              title="Importer un fichier"
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
                color: "var(--text-secondary)", padding: "6px 0", borderRadius: 4,
                fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "center",
              }}
            >📎</button>
          </div>
          <input ref={fileRef} type="file" accept=".txt,.md,.html,text/*" onChange={handleFile} style={{ display: "none" }} />
        </div>

        {/* Status / results — fills remaining space */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {status === "idle" && !input && (
            <div style={{ paddingTop: 8, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "var(--border)", lineHeight: 2 }}>
                Article · URL · Discours · Post réseaux · Document
                <br /><span style={{ color: "var(--text-secondary)", opacity: 0.5 }}>Taxonomie DISARM Framework</span>
              </div>
            </div>
          )}

          {status === "loading" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--text-secondary)", fontSize: 11, paddingTop: 8 }}>
              <span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid var(--border)", borderTopColor: "var(--accent-blue)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              Analyse DISARM en cours…
            </div>
          )}

          {status === "error" && result?.error && (
            <div style={{ fontSize: 11, color: "#ef4444", lineHeight: 1.5, padding: "4px 0" }}>Erreur : {result.error}</div>
          )}

          {status === "done" && result && !result.error && (
            <>
              {/* Verdict header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "8px 12px",
                background: verdictColor + "14", border: `1px solid ${verdictColor}40`, borderRadius: 5,
              }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{VERDICT_ICON[result.verdict_level ?? ""] ?? "🔎"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: verdictColor }}>
                    {result.verdict_label ?? (VERDICT_FR[result.verdict_level ?? ""] ?? result.verdict_level)}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 3 }}>
                    <span style={{ fontSize: 9, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                      Influence : {scoreLabel(result.overall_influence)}
                    </span>
                    {result.audience_targeted && (
                      <span style={{ fontSize: 8, color: "#fbbf24", background: "rgba(251,191,36,0.1)", padding: "0 5px", borderRadius: 2 }}>
                        {result.audience_targeted}
                      </span>
                    )}
                    {result.urgency_framing && (
                      <span style={{ fontSize: 8, color: "#ef4444", background: "rgba(239,68,68,0.1)", padding: "0 5px", borderRadius: 2 }}>
                        ⚠ urgence
                      </span>
                    )}
                    {result.viewpoint_balance && (
                      <span style={{ fontSize: 8, color: "var(--text-secondary)", background: "rgba(255,255,255,0.05)", padding: "0 5px", borderRadius: 2 }}>
                        {result.viewpoint_balance}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={reset} style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 10, cursor: "pointer", padding: 0, fontFamily: "inherit", flexShrink: 0 }}>✕</button>
              </div>

              {/* Red flags summary */}
              {result.red_flags_summary && (
                <div style={{ marginBottom: 8, padding: "6px 10px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 3, fontSize: 10, color: "#fca5a5", lineHeight: 1.5 }}>
                  {result.red_flags_summary}
                </div>
              )}

              {/* Pattern tags */}
              {result.pattern_tags && result.pattern_tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                  {result.pattern_tags.map((tag, i) => (
                    <span key={i} style={{ fontSize: 8, padding: "1px 6px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Scores */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "var(--text-secondary)", opacity: 0.55, marginBottom: 6, fontFamily: "var(--font-mono)" }}>
                  <span>0 = neutre</span>
                  <span>100 = sévère</span>
                </div>
                <ScoreBar label="Propagande" value={result.propaganda_score} color="#ef4444" />
                <ScoreBar label="Désinformation" value={result.misinfo_score} color="#f97316" />
                <ScoreBar label="Complotisme" value={result.conspiracy_score} color="#a78bfa" />
              </div>

              {/* Content summary */}
              {result.content_summary && (
                <div style={{ marginBottom: 8, fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.5, borderLeft: "2px solid var(--border)", paddingLeft: 8 }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: "var(--border)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Contenu</div>
                  {result.content_summary}
                </div>
              )}

              {/* Manipulation summary */}
              {result.manipulation_summary && (
                <div style={{ marginBottom: 10, fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.5, borderLeft: "2px solid rgba(239,68,68,0.4)", paddingLeft: 8 }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: "#fca5a5", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>Stratégie de manipulation</div>
                  {result.manipulation_summary}
                </div>
              )}

              {/* Nuance note */}
              {result.nuance_note && (
                <div style={{ marginBottom: 8, fontSize: 9, color: "#86efac", lineHeight: 1.5, borderLeft: "2px solid rgba(34,197,94,0.4)", paddingLeft: 8 }}>
                  {result.nuance_note}
                </div>
              )}

              {/* Techniques */}
              {result.techniques && result.techniques.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                    Techniques DISARM ({result.techniques.length})
                  </div>
                  {result.techniques.map((t, i) => {
                    const code = t.disarm_code ?? t.id;
                    const confRaw = t.confidence;
                    const confStr = confRaw != null
                      ? (typeof confRaw === "string" ? confRaw : confLabel(confRaw as number))
                      : null;
                    const sevColor: Record<string, string> = { high: "#ef4444", medium: "#f97316", low: "#eab308" };
                    return (
                      <div key={i} style={{ marginBottom: 6, padding: "7px 9px", background: "rgba(255,255,255,0.03)", borderRadius: 3, border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 3 }}>
                          <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap", minWidth: 0 }}>
                            {code && <span style={{ fontSize: 8, fontFamily: "var(--font-mono)", color: "var(--text-secondary)", background: "rgba(255,255,255,0.06)", padding: "0 3px", borderRadius: 2, flexShrink: 0 }}>{code}</span>}
                            <span style={{ fontSize: 10, color: "var(--text-primary)", fontWeight: 600 }}>{t.name}</span>
                          </div>
                          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                            {t.severity && <span style={{ fontSize: 8, color: sevColor[t.severity] ?? "var(--text-secondary)" }}>{t.severity}</span>}
                            {confStr && <span style={{ fontSize: 8, fontFamily: "var(--font-mono)", color: "#6366f1" }}>{confStr}</span>}
                          </div>
                        </div>
                        {(t.evidence ?? t.excerpt) && (
                          <div style={{ fontSize: 8, color: "var(--text-secondary)", fontStyle: "italic", marginBottom: 3, lineHeight: 1.4, borderLeft: "2px solid rgba(255,255,255,0.1)", paddingLeft: 6 }}>
                            &ldquo;{t.evidence ?? t.excerpt}&rdquo;
                          </div>
                        )}
                        {t.cognitive_mechanism && (
                          <div style={{ fontSize: 8, color: "#a78bfa", lineHeight: 1.4, marginBottom: 2 }}>
                            🧠 {t.cognitive_mechanism}
                          </div>
                        )}
                        {t.explanation && (
                          <div style={{ fontSize: 8, color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: 2 }}>
                            {t.explanation}
                          </div>
                        )}
                        {t.contextual_impact && (
                          <div style={{ fontSize: 8, color: "#fbbf24", lineHeight: 1.4, marginBottom: 2, borderLeft: "2px solid rgba(251,191,36,0.3)", paddingLeft: 5 }}>
                            ⚡ {t.contextual_impact}
                          </div>
                        )}
                        {t.recommended_action && (
                          <div style={{ fontSize: 8, color: "#86efac", lineHeight: 1.4, marginTop: 3 }}>
                            → {t.recommended_action}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Fact check priority */}
              {result.fact_check_priority && result.fact_check_priority.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
                    À vérifier ({result.fact_check_priority.length})
                  </div>
                  {result.fact_check_priority.map((claim, i) => (
                    <div key={i} style={{ fontSize: 9, color: "var(--text-secondary)", lineHeight: 1.5, padding: "4px 8px", marginBottom: 3, background: "rgba(56,189,248,0.04)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: 3 }}>
                      {i + 1}. {claim}
                    </div>
                  ))}
                </div>
              )}

              {/* Correction advice */}
              {result.correction_advice && result.correction_advice.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
                    Correction suggérée
                  </div>
                  {result.correction_advice.map((c, i) => (
                    <div key={i} style={{ marginBottom: 6, padding: "7px 9px", background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 3 }}>
                      {c.instead_of && (
                        <div style={{ fontSize: 8, color: "#ef4444", fontStyle: "italic", marginBottom: 3 }}>
                          ✗ &ldquo;{c.instead_of}&rdquo;
                        </div>
                      )}
                      {c.say_instead && (
                        <div style={{ fontSize: 8, color: "#86efac", marginBottom: 3 }}>
                          ✓ {c.say_instead}
                        </div>
                      )}
                      {c.because && (
                        <div style={{ fontSize: 8, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                          {c.because}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Top recommendations */}
              {result.top_recommendations && result.top_recommendations.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#86efac", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
                    Recommandations
                  </div>
                  {result.top_recommendations.map((r, i) => (
                    <div key={i} style={{ fontSize: 9, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 3 }}>
                      {i + 1}. {r}
                    </div>
                  ))}
                </div>
              )}
            </>
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
      <NewsBandeau />

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

        {/* Bottom panels — 50%: Analyser · Infos en direct · Transparence · Discours · TV */}
        <div
          className="bottom-panels"
          style={{ flex: "0 0 50%", display: "flex", borderTop: "1px solid var(--border)", overflow: "hidden" }}
        >
          {/* Analyser — fills remaining space */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            <AnalyserPanel />
          </div>

          {/* Infos en direct (live radar news) — 18% */}
          <div style={{ flex: "0 0 18%", overflow: "hidden" }}>
            <NewsTickerPanel />
          </div>

          {/* Vidéos Politique — 12% */}
          <div style={{ flex: "0 0 12%", overflow: "hidden" }}>
            <CorpusPolitiquePanel />
          </div>

          {/* Discours & Interventions — 15% */}
          <div style={{ flex: "0 0 15%", overflow: "hidden" }}>
            <DiscoursPanel />
          </div>

          {/* TV Direct — 23% (enlarged after sunset of Sondages) */}
          <div style={{ flex: "0 0 23%", overflow: "hidden", borderLeft: "1px solid var(--border)" }}>
            <TVPanel />
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
          href="https://infoverif.org"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 9, color: "var(--text-secondary)", textDecoration: "none", letterSpacing: "0.1em" }}
        >
          infoverif.org
        </a>
        <span style={{ fontSize: 9, color: "var(--border)" }}>·</span>
        <a
          href="https://github.com/soufianelemqariMain/auditfrance"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 9, color: "var(--text-secondary)", textDecoration: "none", letterSpacing: "0.1em" }}
        >
          GitHub
        </a>
        <span style={{ fontSize: 9, color: "var(--border)" }}>·</span>
        <span style={{ fontSize: 9, color: "var(--text-secondary)", letterSpacing: "0.1em" }}>MIT</span>
      </div>
    </div>
  );
}
