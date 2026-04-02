"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface LeaderboardEntry {
  rank: number;
  user_id: number;
  display_name: string;
  rank_tier: string;
  total_xp: number;
  monthly_xp: number;
  calibration_score: number;
}

const RANK_BADGES: Record<string, string> = {
  oracle: "✨",
  sentinel: "🛡",
  forecaster: "🎯",
  analyst: "📊",
  observer: "👁",
  novice: "—",
};

const TABS = [
  { key: "global", label: "Global" },
  { key: "monthly", label: "Monthly" },
];

export default function LeaderboardPage() {
  const [tab, setTab] = useState("global");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = tab === "monthly" ? "/api/leaderboard/monthly" : "/api/leaderboard";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setEntries(d.entries || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-primary)", overflow: "hidden" }}>
      <Navbar />

      <div style={{ flex: 1, overflowY: "auto", maxWidth: 800, margin: "0 auto", width: "100%", padding: "0 16px" }}>
        {/* Header */}
        <div style={{ padding: "20px 0 12px" }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--accent-white)", letterSpacing: "-0.01em" }}>
            Leaderboard
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--text-secondary)" }}>
            The best predictors in the InfoVerif community. Ranked by XP.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                fontSize: 9,
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                padding: "4px 10px",
                background: tab === t.key ? "var(--accent-blue)" : "transparent",
                border: `1px solid ${tab === t.key ? "var(--accent-blue)" : "var(--border)"}`,
                color: tab === t.key ? "var(--accent-white)" : "var(--text-secondary)",
                cursor: "pointer",
                borderRadius: "2px",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: 24, textAlign: "center", fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            Loading…
          </div>
        ) : entries.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", fontFamily: "var(--font-mono)" }}>
            <div style={{ fontSize: 13, color: "var(--accent-white)", marginBottom: 8 }}>No ranked predictors yet.</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 20 }}>
              Cast your first vote to appear on the leaderboard. Accuracy earns XP — top predictors gain Oracle status.
            </div>
            <Link href="/predictions" style={{
              display: "inline-block",
              padding: "8px 20px",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "1px",
              background: "var(--accent-blue)",
              color: "var(--accent-white)",
              textDecoration: "none",
              borderRadius: "2px",
              fontFamily: "var(--font-mono)",
            }}>
              Start Predicting →
            </Link>
          </div>
        ) : (
          <div style={{ borderRadius: 4, overflow: "hidden", border: "1px solid var(--border)" }}>
            {/* Header row */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "36px 1fr 80px 80px 80px",
              gap: 0,
              padding: "6px 12px",
              background: "var(--bg-secondary)",
              borderBottom: "1px solid var(--border)",
            }}>
              {["#", "Predictor", "Rank", "XP", "Accuracy"].map((h) => (
                <span key={h} style={{ fontSize: 8, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.8px", color: "var(--text-secondary)" }}>
                  {h}
                </span>
              ))}
            </div>

            {entries.map((entry) => (
              <div
                key={entry.user_id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "36px 1fr 80px 80px 80px",
                  gap: 0,
                  padding: "10px 12px",
                  borderBottom: "1px solid var(--border)",
                  background: entry.rank <= 3 ? "rgba(59,130,246,0.04)" : "transparent",
                }}
              >
                <span style={{ fontSize: 11, color: entry.rank <= 3 ? "#facc15" : "var(--text-secondary)", fontWeight: entry.rank <= 3 ? 700 : 400 }}>
                  {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500 }}>
                  {entry.display_name}
                </span>
                <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>
                  {RANK_BADGES[entry.rank_tier] || "—"} {entry.rank_tier}
                </span>
                <span style={{ fontSize: 11, color: "var(--accent-blue)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                  {entry.total_xp.toLocaleString()}
                </span>
                <span style={{ fontSize: 10, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                  {entry.calibration_score > 0 ? `${(entry.calibration_score * 100).toFixed(0)}%` : "—"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Rank legend */}
        <div style={{ marginTop: 24, padding: 16, border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-secondary)" }}>
          <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", marginBottom: 10 }}>
            Rank Tiers
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { tier: "Oracle", badge: "✨", xp: "10,000 XP" },
              { tier: "Sentinel", badge: "🛡", xp: "5,000 XP" },
              { tier: "Forecaster", badge: "🎯", xp: "2,000 XP" },
              { tier: "Analyst", badge: "📊", xp: "500 XP" },
              { tier: "Observer", badge: "👁", xp: "100 XP" },
              { tier: "Novice", badge: "—", xp: "0 XP" },
            ].map((r) => (
              <div key={r.tier} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 12 }}>{r.badge}</span>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-primary)", fontWeight: 500 }}>{r.tier}</div>
                  <div style={{ fontSize: 9, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{r.xp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
