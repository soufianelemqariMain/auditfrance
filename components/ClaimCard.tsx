"use client";

import { useState } from "react";

export interface Claim {
  id: number;
  text: string;
  topic_slug: string;
  topic_display: string;
  region: string;
  source_url?: string;
  disarm_codes?: string[];
  deadline?: string;
  status: string;
  yes_count: number;
  no_count: number;
  total_votes: number;
  probability: number;
  user_vote?: string | null;
}

interface Props {
  claim: Claim;
  voterId: string;
  onVoted?: (updated: Claim) => void;
}

export default function ClaimCard({ claim, voterId, onVoted }: Props) {
  const [local, setLocal] = useState(claim);
  const [loading, setLoading] = useState<"yes" | "no" | null>(null);

  const pct = Math.round((local.probability ?? 0.5) * 100);
  const hasVoted = !!local.user_vote;
  const deadline = local.deadline
    ? new Date(local.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const barColor =
    pct >= 65 ? "var(--accent-red)" : pct <= 35 ? "var(--accent-blue)" : "var(--accent-yellow)";

  const handleVote = async (vote: "yes" | "no") => {
    setLoading(vote);
    try {
      const res = await fetch(`/api/claims/${local.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Voter-Id": voterId },
        body: JSON.stringify({ vote }),
      });
      if (res.ok) {
        const updated: Claim = await res.json();
        setLocal(updated);
        onVoted?.(updated);
      } else if (res.status === 409) {
        // Already voted — update local state to reflect
        setLocal((prev) => ({ ...prev, user_vote: vote }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-panel)",
        border: "1px solid var(--border)",
        borderRadius: "2px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Badges */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
            padding: "2px 6px",
          }}
        >
          {local.topic_display || local.topic_slug}
        </span>
        {local.region && local.region !== "GLOBAL" && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-secondary)" }}>
            {local.region}
          </span>
        )}
        {local.disarm_codes && local.disarm_codes.length > 0 && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--accent-red)", opacity: 0.7 }}>
            {local.disarm_codes.slice(0, 2).join(" · ")}
          </span>
        )}
      </div>

      {/* Claim text */}
      <p style={{ color: "var(--text-primary)", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
        {local.text}
      </p>

      {/* Probability bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)" }}>
            Community probability
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 700, color: barColor }}>
            {pct}%
          </span>
        </div>
        <div style={{ height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
          <div
            style={{ height: "100%", width: `${pct}%`, background: barColor, transition: "width 0.5s ease", borderRadius: "2px" }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-secondary)" }}>
            {local.yes_count} Yes
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-secondary)" }}>
            {local.total_votes} votes
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-secondary)" }}>
            {local.no_count} No
          </span>
        </div>
      </div>

      {/* Voting */}
      {hasVoted ? (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              padding: "4px 10px",
              border: `1px solid ${local.user_vote === "yes" ? "var(--accent-red)" : "var(--accent-blue)"}`,
              color: local.user_vote === "yes" ? "var(--accent-red)" : "var(--accent-blue)",
              borderRadius: "2px",
            }}
          >
            ✓ {local.user_vote === "yes" ? "True" : "False"}
          </span>
          {deadline && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-secondary)", marginLeft: "auto" }}>
              Resolves {deadline}
            </span>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => handleVote("yes")}
            disabled={!!loading}
            style={{
              flex: 1,
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              padding: "8px 0",
              background: "transparent",
              border: "1px solid var(--accent-red)",
              color: "var(--accent-red)",
              cursor: "pointer",
              borderRadius: "2px",
              opacity: loading ? 0.5 : 1,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,65,53,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {loading === "yes" ? "..." : "True"}
          </button>
          <button
            onClick={() => handleVote("no")}
            disabled={!!loading}
            style={{
              flex: 1,
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              padding: "8px 0",
              background: "transparent",
              border: "1px solid var(--accent-blue)",
              color: "var(--accent-blue)",
              cursor: "pointer",
              borderRadius: "2px",
              opacity: loading ? 0.5 : 1,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,85,164,0.15)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {loading === "no" ? "..." : "False"}
          </button>
          {deadline && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
              → {deadline}
            </span>
          )}
        </div>
      )}

      {local.source_url && (
        <a
          href={local.source_url}
          target="_blank"
          rel="noreferrer"
          style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-secondary)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          ↗ {local.source_url}
        </a>
      )}
    </div>
  );
}
