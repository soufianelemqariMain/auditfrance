"use client";

import { useEffect, useState } from "react";

interface PollCandidate {
  name: string;
  score: number;
  party: string;
  color: string;
}

interface Poll {
  pollster: string;
  date: string;
  candidates: PollCandidate[];
}

// Static recent poll data (major French pollsters, 2026)
// Presidential 2027 — 1er tour intentions de vote
// Note: Macron inéligible (2 mandats accomplis 2017-2027)
const POLLS: Poll[] = [
  {
    pollster: "IFOP",
    date: "2026-03",
    candidates: [
      { name: "Bardella", score: 27, party: "RN", color: "#003189" },
      { name: "Philippe", score: 21, party: "Horizons", color: "#00BCD4" },
      { name: "Glucksmann", score: 14, party: "PS", color: "#E91E63" },
      { name: "Bertrand", score: 12, party: "LR", color: "#0D47A1" },
      { name: "Mélenchon", score: 11, party: "LFI", color: "#B71C1C" },
    ],
  },
  {
    pollster: "OpinionWay",
    date: "2026-03",
    candidates: [
      { name: "Bardella", score: 26, party: "RN", color: "#003189" },
      { name: "Philippe", score: 20, party: "Horizons", color: "#00BCD4" },
      { name: "Glucksmann", score: 15, party: "PS", color: "#E91E63" },
      { name: "Bertrand", score: 13, party: "LR", color: "#0D47A1" },
      { name: "Mélenchon", score: 10, party: "LFI", color: "#B71C1C" },
    ],
  },
  {
    pollster: "BVA",
    date: "2026-02",
    candidates: [
      { name: "Bardella", score: 28, party: "RN", color: "#003189" },
      { name: "Philippe", score: 19, party: "Horizons", color: "#00BCD4" },
      { name: "Bertrand", score: 14, party: "LR", color: "#0D47A1" },
      { name: "Glucksmann", score: 13, party: "PS", color: "#E91E63" },
      { name: "Mélenchon", score: 10, party: "LFI", color: "#B71C1C" },
    ],
  },
];

// Compute average scores across all polls
function getAverages(): PollCandidate[] {
  const totals: Record<string, { score: number; count: number; party: string; color: string }> = {};
  for (const poll of POLLS) {
    for (const c of poll.candidates) {
      if (!totals[c.name]) totals[c.name] = { score: 0, count: 0, party: c.party, color: c.color };
      totals[c.name].score += c.score;
      totals[c.name].count += 1;
    }
  }
  return Object.entries(totals)
    .map(([name, { score, count, party, color }]) => ({
      name,
      score: Math.round(score / count),
      party,
      color,
    }))
    .sort((a, b) => b.score - a.score);
}

export default function SondagesPanel() {
  const [activePoll, setActivePoll] = useState<"moyenne" | number>("moyenne");
  const averages = getAverages();
  const displayCandidates =
    activePoll === "moyenne"
      ? averages
      : POLLS[activePoll as number].candidates.slice().sort((a, b) => b.score - a.score);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: "1px solid var(--border)" }}>
      {/* Header */}
      <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          🗳 Sondages 2027
        </span>
        <span style={{ fontSize: 9, color: "var(--border)" }}>1er tour</span>
      </div>

      {/* Poll selector */}
      <div style={{ display: "flex", gap: 4, padding: "5px 8px", borderBottom: "1px solid var(--border)", flexShrink: 0, overflowX: "auto" }}>
        <button
          onClick={() => setActivePoll("moyenne")}
          style={{
            fontSize: 8, padding: "2px 6px", borderRadius: 2, border: "1px solid var(--border)",
            background: activePoll === "moyenne" ? "var(--accent-blue)" : "transparent",
            color: activePoll === "moyenne" ? "#fff" : "var(--text-secondary)",
            cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
          }}
        >
          Moy.
        </button>
        {POLLS.map((p, i) => (
          <button
            key={i}
            onClick={() => setActivePoll(i)}
            style={{
              fontSize: 8, padding: "2px 6px", borderRadius: 2, border: "1px solid var(--border)",
              background: activePoll === i ? "var(--accent-blue)" : "transparent",
              color: activePoll === i ? "#fff" : "var(--text-secondary)",
              cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            {p.pollster}
          </button>
        ))}
      </div>

      {/* Candidates */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
        {displayCandidates.map((c, i) => (
          <div key={c.name}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 9, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", width: 12 }}>{i + 1}</span>
                <span style={{ fontSize: 11, color: "var(--text-primary)", fontWeight: 600 }}>{c.name}</span>
                <span style={{ fontSize: 8, color: "var(--text-secondary)", opacity: 0.7 }}>{c.party}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: c.color, fontFamily: "var(--font-mono)" }}>{c.score}%</span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${c.score * 3}%`, height: "100%", background: c.color, borderRadius: 2, transition: "width 0.4s", maxWidth: "100%" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: "4px 10px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <span style={{ fontSize: 8, color: "var(--border)" }}>
          {activePoll === "moyenne"
            ? `Moyenne ${POLLS.length} sondages · ${POLLS[0].date}`
            : `${POLLS[activePoll as number].pollster} · ${POLLS[activePoll as number].date}`}
        </span>
      </div>
    </div>
  );
}
