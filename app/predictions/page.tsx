"use client";

import { useEffect, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";

interface Claim {
  id: number;
  text: string;
  topic_slug: string;
  topic_display?: string;
  probability: number;
  yes_count: number;
  no_count: number;
  total_votes: number;
  is_shooting_star?: boolean;
  user_vote?: string | null;
  deadline?: string | null;
  status: string;
}

const TOPICS = [
  { slug: "", label: "All Topics" },
  { slug: "economics", label: "Economics" },
  { slug: "geopolitics", label: "Geopolitics" },
  { slug: "technology", label: "Technology" },
  { slug: "health", label: "Health" },
  { slug: "elections", label: "Elections" },
  { slug: "climate", label: "Climate" },
  { slug: "finance", label: "Finance" },
  { slug: "science", label: "Science" },
  { slug: "media", label: "Media" },
  { slug: "sports", label: "Sports" },
];

function getOrCreateVoterId(): string {
  if (typeof window === "undefined") return "";
  const stored = localStorage.getItem("infoverif_voter_id");
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem("infoverif_voter_id", id);
  return id;
}

function ClaimRow({ claim, voterId, onVoted }: { claim: Claim; voterId: string; onVoted: (updated: Claim) => void }) {
  const [voting, setVoting] = useState<"yes" | "no" | null>(null);
  const pct = Math.round((claim.probability ?? 0.5) * 100);

  async function vote(v: "yes" | "no") {
    if (voting || claim.user_vote) return;
    setVoting(v);
    try {
      const res = await fetch(`/api/claims/${claim.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Voter-Id": voterId },
        body: JSON.stringify({ vote: v }),
      });
      if (res.ok) onVoted(await res.json());
    } catch {/* silent */} finally {
      setVoting(null);
    }
  }

  return (
    <div style={{
      padding: "12px 16px",
      borderBottom: "1px solid var(--border)",
      background: claim.is_shooting_star ? "rgba(250,204,21,0.04)" : "transparent",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Topic + shooting star */}
          <div style={{ display: "flex", gap: 6, marginBottom: 5, alignItems: "center" }}>
            <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--accent-red)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {claim.topic_display || claim.topic_slug}
            </span>
            {claim.is_shooting_star && (
              <span style={{ fontSize: 9, color: "#facc15" }} title="Shooting star — trending fast">⭐ TRENDING</span>
            )}
          </div>

          {/* Claim text */}
          <div style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.5, marginBottom: 8 }}>
            {claim.text}
          </div>

          {/* Probability bar */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 9, color: "var(--accent-red)", fontFamily: "var(--font-mono)" }}>YES {pct}%</span>
              <span style={{ fontSize: 9, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{claim.total_votes} votes</span>
              <span style={{ fontSize: 9, color: "var(--accent-blue)", fontFamily: "var(--font-mono)" }}>NO {100 - pct}%</span>
            </div>
            <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: pct >= 60 ? "var(--accent-red)" : pct <= 40 ? "var(--accent-blue)" : "#eab308", transition: "width 0.3s" }} />
            </div>
          </div>
        </div>

        {/* Vote buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          <button
            onClick={() => vote("yes")}
            disabled={!!claim.user_vote || !!voting}
            style={{
              padding: "5px 12px",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              background: claim.user_vote === "yes" ? "var(--accent-red)" : "transparent",
              border: "1px solid var(--accent-red)",
              color: claim.user_vote === "yes" ? "var(--accent-white)" : "var(--accent-red)",
              cursor: claim.user_vote ? "default" : "pointer",
              borderRadius: "2px",
              letterSpacing: "0.5px",
              opacity: claim.user_vote && claim.user_vote !== "yes" ? 0.3 : 1,
            }}
          >
            {voting === "yes" ? "…" : "True"}
          </button>
          <button
            onClick={() => vote("no")}
            disabled={!!claim.user_vote || !!voting}
            style={{
              padding: "5px 12px",
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              background: claim.user_vote === "no" ? "var(--accent-blue)" : "transparent",
              border: "1px solid var(--accent-blue)",
              color: claim.user_vote === "no" ? "var(--accent-white)" : "var(--accent-blue)",
              cursor: claim.user_vote ? "default" : "pointer",
              borderRadius: "2px",
              letterSpacing: "0.5px",
              opacity: claim.user_vote && claim.user_vote !== "no" ? 0.3 : 1,
            }}
          >
            {voting === "no" ? "…" : "False"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PredictionsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [shootingStars, setShootingStars] = useState<Claim[]>([]);
  const [activeTopic, setActiveTopic] = useState("");
  const [loading, setLoading] = useState(true);
  const [voterId, setVoterId] = useState("");

  useEffect(() => { setVoterId(getOrCreateVoterId()); }, []);

  useEffect(() => {
    fetch("/api/claims/shooting-stars")
      .then((r) => r.json())
      .then((d) => setShootingStars(d.shooting_stars || []))
      .catch(() => {});
  }, []);

  const loadClaims = useCallback(async (topic: string) => {
    setLoading(true);
    try {
      const url = topic ? `/api/claims?topic=${topic}&limit=50` : "/api/claims?limit=50";
      const res = await fetch(url, { headers: { "X-Voter-Id": voterId } });
      const data = await res.json();
      setClaims(data.claims || []);
    } catch {/* silent */} finally {
      setLoading(false);
    }
  }, [voterId]);

  useEffect(() => { if (voterId) loadClaims(activeTopic); }, [activeTopic, voterId, loadClaims]);

  function handleVoted(updated: Claim) {
    setClaims((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-primary)", overflow: "hidden" }}>
      <Navbar />

      {/* Topic filter bar */}
      <div style={{
        padding: "8px 16px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        flexShrink: 0,
        background: "var(--bg-secondary)",
      }}>
        {TOPICS.map((t) => (
          <button
            key={t.slug}
            onClick={() => setActiveTopic(t.slug)}
            style={{
              fontSize: 9,
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              padding: "3px 8px",
              background: activeTopic === t.slug ? "var(--accent-blue)" : "transparent",
              border: `1px solid ${activeTopic === t.slug ? "var(--accent-blue)" : "var(--border)"}`,
              color: activeTopic === t.slug ? "var(--accent-white)" : "var(--text-secondary)",
              cursor: "pointer",
              borderRadius: "2px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Shooting stars section */}
        {shootingStars.length > 0 && (
          <div style={{ borderBottom: "2px solid rgba(250,204,21,0.3)", padding: "8px 0" }}>
            <div style={{ padding: "4px 16px 8px", fontSize: 9, fontFamily: "var(--font-mono)", color: "#facc15", textTransform: "uppercase", letterSpacing: "1px" }}>
              ⭐ Shooting Stars — Trending Now
            </div>
            {shootingStars.map((c) => (
              <ClaimRow key={c.id} claim={{ ...c, is_shooting_star: true }} voterId={voterId} onVoted={handleVoted} />
            ))}
          </div>
        )}

        {/* Main feed */}
        {loading ? (
          <div style={{ padding: 24, textAlign: "center", fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            Loading predictions…
          </div>
        ) : claims.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            No predictions yet for this topic.
          </div>
        ) : (
          claims.map((c) => (
            <ClaimRow key={c.id} claim={c} voterId={voterId} onVoted={handleVoted} />
          ))
        )}
      </div>
    </div>
  );
}
