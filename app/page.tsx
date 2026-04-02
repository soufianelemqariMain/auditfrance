"use client";

import { useEffect, useState } from "react";
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

export default function Home() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [featured, setFeatured] = useState<Claim | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [voted, setVoted] = useState<"yes" | "no" | null>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    async function fetchClaims() {
      try {
        const res = await fetch("/api/claims?limit=24&status=open", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const list: Claim[] = Array.isArray(data) ? data : (data.claims ?? data.items ?? []);
        if (!list.length) return;
        setClaims(list);
        // Featured = highest vote count, rotate every 60s
        const sorted = [...list].sort((a, b) => (b.vote_count ?? 0) - (a.vote_count ?? 0));
        setFeatured(sorted[0]);
      } catch { /* silent */ }
    }
    fetchClaims();
    const t = setInterval(fetchClaims, 30_000);
    return () => clearInterval(t);
  }, []);

  // Rotate featured every 45s
  useEffect(() => {
    if (claims.length < 2) return;
    const t = setInterval(() => {
      setFeatured(prev => {
        const idx = claims.findIndex(c => c.id === prev?.id);
        return claims[(idx + 1) % claims.length];
      });
      setVoted(null);
    }, 45_000);
    return () => clearInterval(t);
  }, [claims]);

  async function castVote(v: "yes" | "no") {
    if (voting || voted || !featured) return;
    setVoting(true);
    try {
      const voterId = getOrCreateVoterId();
      await fetch(`/api/claims/${featured.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Voter-Id": voterId },
        body: JSON.stringify({ vote: v }),
      });
      setVoted(v);
    } catch { /* silent */ } finally {
      setVoting(false);
    }
  }

  // Build ticker text — doubled for seamless CSS loop
  const tickerParts = claims.length
    ? claims.map(c => {
        const pct = Math.round((c.probability ?? 0.5) * 100);
        const tag = c.topic_display ?? c.topic_slug ?? "";
        return `${tag ? `[${tag}] ` : ""}${c.text.length > 72 ? c.text.slice(0, 72) + "…" : c.text}  ${pct}% YES`;
      })
    : ["Loading predictions…"];
  const tickerText = tickerParts.join("     ·     ");

  const featuredPct = Math.round((featured?.probability ?? 0.5) * 100);
  const pctColor = featuredPct >= 60 ? "#ef4444" : featuredPct <= 40 ? "#3b82f6" : "#eab308";

  return (
    <div style={{
      position: "relative", width: "100vw", height: "100vh",
      background: "#04060e", overflow: "hidden",
    }}>

      {/* ── Ticker bar ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
        height: 30, display: "flex", alignItems: "center",
        background: "rgba(4,6,14,0.95)", borderBottom: "1px solid rgba(0,212,255,0.18)",
        overflow: "hidden",
      }}>
        {/* Brand */}
        <div style={{
          flexShrink: 0, padding: "0 14px",
          borderRight: "1px solid rgba(0,212,255,0.2)",
          fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 700,
          color: "#00d4ff", textTransform: "uppercase", letterSpacing: "2.5px",
          whiteSpace: "nowrap",
        }}>
          INFOVERIF
        </div>

        {/* Scrolling ticker */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <div className="iv-ticker" style={{
            display: "inline-block", whiteSpace: "nowrap",
            fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(229,231,235,0.92)",
            letterSpacing: "0.04em",
          }}>
            {/* Double the text for seamless loop */}
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
            { href: "/leaderboard", label: "Board" },
            { href: "/pro", label: "Pro", accent: true },
          ].map(({ href, label, accent }) => (
            <Link key={href} href={href} style={{
              fontSize: 8, fontFamily: "var(--font-mono)", textTransform: "uppercase",
              letterSpacing: "1px", textDecoration: "none",
              color: accent ? "#00d4ff" : "rgba(229,231,235,0.5)",
            }}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Full-screen globe ── */}
      <div style={{ position: "absolute", inset: 0, top: 30 }}>
        <Map />
      </div>

      {/* ── Featured prediction card (bottom center) ── */}
      {featured && !dismissed && (
        <div style={{
          position: "absolute", bottom: 28, left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20,
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(4,6,14,0.9)",
          border: "1px solid rgba(0,212,255,0.22)",
          borderRadius: 4, padding: "9px 14px",
          backdropFilter: "blur(10px)",
          maxWidth: 580, width: "calc(100vw - 32px)",
          boxShadow: "0 0 30px rgba(0,212,255,0.07)",
        }}>
          {/* Topic tag */}
          {featured.topic_display && (
            <span style={{
              flexShrink: 0, fontSize: 7.5, fontFamily: "var(--font-mono)",
              color: "#00d4ff", textTransform: "uppercase", letterSpacing: "1.2px",
              background: "rgba(0,212,255,0.1)", padding: "2px 7px", borderRadius: 2,
              whiteSpace: "nowrap",
            }}>
              {featured.topic_display}
            </span>
          )}

          {/* Claim text */}
          <span style={{ flex: 1, fontSize: 10.5, color: "#e5e7eb", lineHeight: 1.4, minWidth: 0 }}>
            {featured.text.length > 88 ? featured.text.slice(0, 88) + "…" : featured.text}
          </span>

          {/* Probability */}
          <span style={{
            flexShrink: 0, fontSize: 13, fontWeight: 700, color: pctColor,
            fontFamily: "var(--font-mono)",
          }}>
            {featuredPct}%
          </span>

          {/* Vote buttons */}
          {voted ? (
            <span style={{
              flexShrink: 0, fontSize: 8, fontFamily: "var(--font-mono)",
              color: voted === "yes" ? "#ef4444" : "#3b82f6",
              textTransform: "uppercase", letterSpacing: "1px",
            }}>
              Voted {voted === "yes" ? "TRUE" : "FALSE"} ✓
            </span>
          ) : (
            <>
              <button onClick={() => castVote("yes")} disabled={voting} style={{
                flexShrink: 0, fontSize: 8, fontFamily: "var(--font-mono)",
                textTransform: "uppercase", letterSpacing: "1px",
                color: "#04060e", background: "#ef4444",
                border: "none", borderRadius: 2, padding: "5px 10px",
                cursor: voting ? "not-allowed" : "pointer", opacity: voting ? 0.6 : 1,
              }}>
                TRUE
              </button>
              <button onClick={() => castVote("no")} disabled={voting} style={{
                flexShrink: 0, fontSize: 8, fontFamily: "var(--font-mono)",
                textTransform: "uppercase", letterSpacing: "1px",
                color: "#04060e", background: "#3b82f6",
                border: "none", borderRadius: 2, padding: "5px 10px",
                cursor: voting ? "not-allowed" : "pointer", opacity: voting ? 0.6 : 1,
              }}>
                FALSE
              </button>
            </>
          )}

          {/* Dismiss */}
          <button onClick={() => setDismissed(true)} style={{
            flexShrink: 0, background: "none", border: "none",
            color: "rgba(229,231,235,0.25)", cursor: "pointer",
            fontSize: 14, lineHeight: 1, padding: "2px 2px",
          }}>
            ×
          </button>
        </div>
      )}

      {/* Ticker animation */}
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
      ` }} />
    </div>
  );
}
