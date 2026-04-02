"use client";

import Navbar from "@/components/Navbar";
import LiveClaimsPanel from "@/components/LiveClaimsPanel";
import Link from "next/link";

const TOPICS = [
  { slug: "all", label: "All" },
  { slug: "economics", label: "Economics" },
  { slug: "geopolitics", label: "Geopolitics" },
  { slug: "technology", label: "Technology" },
  { slug: "health", label: "Health" },
  { slug: "elections", label: "Elections" },
  { slug: "climate", label: "Climate" },
  { slug: "finance", label: "Finance" },
  { slug: "science", label: "Science" },
];

export default function Home() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-primary)", overflow: "hidden" }}>
      <Navbar />

      {/* Hero */}
      <div style={{
        padding: "24px 24px 16px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
        background: "var(--bg-secondary)",
      }}>
        <div style={{ maxWidth: 640 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--accent-white)", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
            The global prediction community
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            Vote on world events. Zero bets, zero risk. Earn XP and climb the leaderboard.
            Companies buy the aggregated intelligence.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <Link
              href="/predictions"
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                color: "var(--accent-white)",
                background: "var(--accent-blue)",
                border: "none",
                padding: "6px 14px",
                textDecoration: "none",
                borderRadius: "2px",
                fontWeight: 600,
              }}
            >
              See All Predictions
            </Link>
            <Link
              href="/leaderboard"
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                color: "var(--accent-blue)",
                background: "transparent",
                border: "1px solid var(--accent-blue)",
                padding: "6px 14px",
                textDecoration: "none",
                borderRadius: "2px",
              }}
            >
              Leaderboard
            </Link>
            <Link
              href="/pro"
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                color: "var(--accent-green, #4ade80)",
                background: "transparent",
                border: "1px solid var(--accent-green, #4ade80)",
                padding: "6px 14px",
                textDecoration: "none",
                borderRadius: "2px",
              }}
            >
              For Companies
            </Link>
          </div>
        </div>
      </div>

      {/* Live predictions feed */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{
          padding: "8px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexShrink: 0,
          background: "var(--bg-secondary)",
        }}>
          <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--accent-red)", textTransform: "uppercase", letterSpacing: "1px" }}>
            ● LIVE
          </span>
          <span style={{ fontSize: 9, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            Community predictions
          </span>
        </div>

        <div style={{ flex: 1, overflow: "hidden" }}>
          <LiveClaimsPanel />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        height: 22,
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        gap: 6,
      }}>
        <span style={{ fontSize: 9, color: "var(--text-secondary)", letterSpacing: "0.1em" }}>OPEN SOURCE</span>
        <span style={{ fontSize: 9, color: "var(--border)" }}>·</span>
        <span style={{ fontSize: 9, color: "var(--text-secondary)", letterSpacing: "0.1em" }}>ZERO BETS</span>
        <span style={{ fontSize: 9, color: "var(--border)" }}>·</span>
        <span style={{ fontSize: 9, color: "var(--text-secondary)", letterSpacing: "0.1em" }}>MIT</span>
      </div>
    </div>
  );
}
