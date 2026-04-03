"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

interface Claim {
  id: number;
  text: string;
  topic_display?: string;
  topic_slug?: string;
  probability?: number;
  vote_count?: number;
}

function getOrCreateVoterId(): string {
  if (typeof window === "undefined") return "";
  const stored = localStorage.getItem("infoverif_voter_id");
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem("infoverif_voter_id", id);
  return id;
}

function PctColor(pct: number): string {
  if (pct >= 60) return "#ef4444";
  if (pct <= 40) return "#3b82f6";
  return "#eab308";
}

export default function Home() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [sidebarVoted, setSidebarVoted] = useState<Record<number, "yes" | "no">>({});
  const [sidebarVoting, setSidebarVoting] = useState<Record<number, boolean>>({});
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [totalClaims, setTotalClaims] = useState<number>(0);

  const fetchClaims = useCallback(async () => {
    try {
      const res = await fetch("/api/claims?limit=20&status=open", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const list: Claim[] = Array.isArray(data) ? data : (data.claims ?? data.items ?? []);
      if (!list.length) return;
      // Sort by vote count descending
      const sorted = [...list].sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0));
      setClaims(sorted);
      // Derive stats from the full page (approximate total from returned count + total field)
      const total = Array.isArray(data) ? data.length : (data.total ?? list.length);
      setTotalClaims(total);
      const votes = sorted.reduce((sum, c) => sum + (c.vote_count ?? 0), 0);
      setTotalVotes(v => Math.max(v, votes)); // only goes up
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchClaims();
    const t = setInterval(fetchClaims, 30_000);
    return () => clearInterval(t);
  }, [fetchClaims]);

  async function castSidebarVote(id: number, v: "yes" | "no") {
    if (sidebarVoting[id] || sidebarVoted[id]) return;
    setSidebarVoting(p => ({ ...p, [id]: true }));
    try {
      const voterId = getOrCreateVoterId();
      await fetch(`/api/claims/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Voter-Id": voterId },
        body: JSON.stringify({ vote: v }),
      });
      setSidebarVoted(p => ({ ...p, [id]: v }));
    } catch { /* silent */ } finally {
      setSidebarVoting(p => ({ ...p, [id]: false }));
    }
  }

  // Ticker text from top 16 claims
  const tickerParts = claims.length
    ? claims.slice(0, 16).map(c => {
        const pct = Math.round((c.probability ?? 0.5) * 100);
        const tag = c.topic_display ?? c.topic_slug ?? "";
        return `${tag ? `[${tag}] ` : ""}${c.text.length > 72 ? c.text.slice(0, 72) + "…" : c.text}  ${pct}% YES`;
      })
    : ["Loading predictions…"];
  const tickerText = tickerParts.join("     ·     ");

  return (
    <div style={{
      position: "relative", width: "100vw", height: "100vh",
      background: "#04060e", overflow: "hidden", display: "flex", flexDirection: "column",
    }}>

      {/* ── Ticker bar ── */}
      <div style={{
        flexShrink: 0, height: 40, display: "flex", alignItems: "center",
        background: "rgba(4,6,14,0.97)", borderBottom: "1px solid rgba(0,212,255,0.25)",
        overflow: "hidden", zIndex: 20,
      }}>
        {/* Brand — links home */}
        <Link href="/" style={{
          flexShrink: 0, padding: "0 16px",
          borderRight: "1px solid rgba(0,212,255,0.2)",
          fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
          color: "#00d4ff", textTransform: "uppercase", letterSpacing: "2.5px",
          whiteSpace: "nowrap", textDecoration: "none", display: "flex", alignItems: "center", gap: 7,
        }}>
          <span className="live-dot" />
          INFOVERIF
        </Link>

        {/* Scrolling ticker */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <div className="iv-ticker" style={{
            display: "inline-block", whiteSpace: "nowrap",
            fontFamily: "var(--font-mono)", fontSize: 13, color: "#e5e7eb",
            letterSpacing: "0.05em",
          }}>
            <span>{tickerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
            <span aria-hidden="true">{tickerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
          </div>
        </div>

        {/* Nav */}
        <div style={{
          flexShrink: 0, display: "flex", gap: 14, padding: "0 14px",
          borderLeft: "1px solid rgba(0,212,255,0.2)",
        }}>
          {[
            { href: "/predictions", label: "Predictions" },
            { href: "/leaderboard", label: "Leaderboard" },
            { href: "/pro", label: "VerifPro", accent: true },
          ].map(({ href, label, accent }) => (
            <Link key={href} href={href} style={{
              fontSize: 10, fontFamily: "var(--font-mono)", textTransform: "uppercase",
              letterSpacing: "1px", textDecoration: "none",
              color: accent ? "#f59e0b" : "rgba(229,231,235,0.65)",
            }}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Main content: Globe + Live Claims Panel ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        {/* Globe */}
        <div style={{ flex: 1, position: "relative" }}>
          <Map />
          {/* Discoverability hint */}
          <div style={{
            position: "absolute", bottom: 14, left: 14, zIndex: 10,
            fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(229,231,235,0.35)",
            textTransform: "uppercase", letterSpacing: "1px",
            pointerEvents: "none",
          }}>
            Click any country for claims →
          </div>
        </div>

        {/* ── Live Claims Sidebar ── */}
        <div style={{
          width: 290, flexShrink: 0,
          background: "rgba(4,8,20,0.96)", borderLeft: "1px solid rgba(0,212,255,0.18)",
          display: "flex", flexDirection: "column", overflowY: "auto",
          fontFamily: "var(--font-mono, monospace)",
        }}>
          {/* Sidebar header */}
          <div style={{
            padding: "10px 14px", borderBottom: "1px solid rgba(0,212,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span className="live-dot" />
              <span style={{ fontSize: 10, color: "#00d4ff", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px" }}>
                LIVE PREDICTIONS
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 9, color: "rgba(229,231,235,0.35)" }}>{totalClaims || claims.length} open</div>
              {totalVotes > 0 && (
                <div style={{ fontSize: 8, color: "rgba(0,212,255,0.5)", marginTop: 1 }}>
                  {totalVotes.toLocaleString()} votes cast
                </div>
              )}
            </div>
          </div>

          {/* Claims list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {claims.length === 0 && (
              <div style={{ padding: "20px 14px", color: "rgba(229,231,235,0.35)", fontSize: 11, textAlign: "center" }}>
                Loading…
              </div>
            )}
            {claims.map((claim) => {
              const pct = Math.round((claim.probability ?? 0.5) * 100);
              const voted = sidebarVoted[claim.id];
              const voting = sidebarVoting[claim.id];
              return (
                <div key={claim.id} style={{
                  padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                  {claim.topic_display && (
                    <div style={{ fontSize: 7.5, color: "#00d4ff", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 4, fontWeight: 700 }}>
                      {claim.topic_display}
                    </div>
                  )}
                  <div style={{ fontSize: 10.5, color: "#e5e7eb", lineHeight: 1.45, marginBottom: 7 }}>
                    {claim.text.length > 90 ? claim.text.slice(0, 90) + "…" : claim.text}
                  </div>
                  {/* Probability bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                    <div style={{ flex: 1, height: 2, background: "rgba(255,255,255,0.08)", borderRadius: 1 }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: PctColor(pct), borderRadius: 1 }} />
                    </div>
                    <span style={{ fontSize: 9, color: PctColor(pct), fontWeight: 700, whiteSpace: "nowrap" }}>
                      {pct}% TRUE
                    </span>
                  </div>
                  {/* Vote buttons */}
                  <div style={{ display: "flex", gap: 5 }}>
                    <button
                      disabled={!!voted || voting}
                      onClick={() => castSidebarVote(claim.id, "yes")}
                      style={{
                        flex: 1, padding: "4px 0", fontSize: 8, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "1px",
                        cursor: voted ? "default" : "pointer",
                        border: `1px solid ${voted === "yes" ? "#ef4444" : "rgba(239,68,68,0.3)"}`,
                        background: voted === "yes" ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.05)",
                        color: voted === "yes" ? "#ef4444" : "rgba(239,68,68,0.65)",
                        borderRadius: 2, fontFamily: "var(--font-mono, monospace)",
                      }}
                    >
                      {voted === "yes" ? "✓ TRUE" : "TRUE"}
                    </button>
                    <button
                      disabled={!!voted || voting}
                      onClick={() => castSidebarVote(claim.id, "no")}
                      style={{
                        flex: 1, padding: "4px 0", fontSize: 8, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "1px",
                        cursor: voted ? "default" : "pointer",
                        border: `1px solid ${voted === "no" ? "#3b82f6" : "rgba(59,130,246,0.3)"}`,
                        background: voted === "no" ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.05)",
                        color: voted === "no" ? "#3b82f6" : "rgba(59,130,246,0.65)",
                        borderRadius: 2, fontFamily: "var(--font-mono, monospace)",
                      }}
                    >
                      {voted === "no" ? "✓ FALSE" : "FALSE"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            flexShrink: 0, padding: "10px 14px",
            borderTop: "1px solid rgba(0,212,255,0.15)",
          }}>
            <Link href="/predictions" style={{
              display: "block", textAlign: "center",
              fontSize: 9, color: "#00d4ff", textTransform: "uppercase",
              letterSpacing: "1.5px", textDecoration: "none",
              fontFamily: "var(--font-mono)",
            }}>
              SEE ALL PREDICTIONS →
            </Link>
          </div>
        </div>
      </div>

      {/* Ticker animation + live dot */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes iv-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .iv-ticker {
          animation: iv-marquee 120s linear infinite;
        }
        .iv-ticker:hover {
          animation-play-state: paused;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
        .live-dot {
          display: inline-block;
          width: 6px; height: 6px;
          background: #ef4444; border-radius: 50%;
          animation: blink 1.4s ease-in-out infinite;
          flex-shrink: 0;
        }
      ` }} />
    </div>
  );
}
