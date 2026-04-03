"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Claim } from "./ClaimCard";

function getOrCreateVoterId(): string {
  if (typeof window === "undefined") return "";
  const stored = localStorage.getItem("infoverif_voter_id");
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem("infoverif_voter_id", id);
  return id;
}

function CompactClaim({ claim, voterId }: { claim: Claim; voterId: string }) {
  const [local, setLocal] = useState(claim);
  const [voting, setVoting] = useState<"yes" | "no" | null>(null);

  const pct = Math.round((local.probability ?? 0.5) * 100);
  const barColor = pct >= 65 ? "var(--accent-red)" : pct <= 35 ? "var(--accent-blue)" : "#eab308";

  async function vote(v: "yes" | "no") {
    if (voting || local.user_vote) return;
    setVoting(v);
    try {
      const res = await fetch(`/api/claims/${local.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Voter-Id": voterId },
        body: JSON.stringify({ vote: v }),
      });
      if (res.ok) setLocal(await res.json());
      else if (res.status === 409) setLocal((p) => ({ ...p, user_vote: v }));
    } catch { /* silent */ } finally {
      setVoting(null);
    }
  }

  const hasVoted = !!local.user_vote;

  return (
    <div style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      {/* Topic + region */}
      <div style={{ display: "flex", gap: 5, marginBottom: 4, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 8, fontFamily: "var(--font-mono)", color: "var(--accent-red)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {local.topic_display || local.topic_slug}
        </span>
        {local.region && local.region !== "GLOBAL" && (
          <span style={{ fontSize: 8, color: "var(--border)" }}>{local.region}</span>
        )}
        {local.disarm_codes && local.disarm_codes.length > 0 && (
          <span style={{ fontSize: 8, color: "var(--accent-red)", opacity: 0.6 }}>
            {local.disarm_codes[0]}
          </span>
        )}
      </div>

      {/* Claim text */}
      <div style={{ fontSize: 9, color: "var(--text-primary)", lineHeight: 1.45, marginBottom: 6 }}>
        {local.text.length > 100 ? local.text.slice(0, 100) + "…" : local.text}
      </div>

      {/* Probability bar */}
      <div style={{ marginBottom: 5 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
          <span style={{ fontSize: 8, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            {local.total_votes} votes
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: barColor, fontFamily: "var(--font-mono)" }}>
            {pct}%
          </span>
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 1, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: barColor, transition: "width 0.4s", borderRadius: 1 }} />
        </div>
      </div>

      {/* Vote buttons */}
      {hasVoted ? (
        <span style={{ fontSize: 8, color: local.user_vote === "yes" ? "var(--accent-red)" : "var(--accent-blue)", fontFamily: "var(--font-mono)" }}>
          ✓ {local.user_vote === "yes" ? "True" : "False"}
        </span>
      ) : (
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => vote("yes")}
            disabled={!!voting}
            style={{
              flex: 1, fontSize: 8, padding: "3px 0", fontFamily: "var(--font-mono)",
              background: "transparent", border: "1px solid var(--accent-red)",
              color: "var(--accent-red)", cursor: "pointer", borderRadius: 2,
              opacity: voting ? 0.5 : 1, textTransform: "uppercase", letterSpacing: "0.05em",
            }}
          >
            {voting === "yes" ? "…" : "True"}
          </button>
          <button
            onClick={() => vote("no")}
            disabled={!!voting}
            style={{
              flex: 1, fontSize: 8, padding: "3px 0", fontFamily: "var(--font-mono)",
              background: "transparent", border: "1px solid var(--accent-blue)",
              color: "var(--accent-blue)", cursor: "pointer", borderRadius: 2,
              opacity: voting ? 0.5 : 1, textTransform: "uppercase", letterSpacing: "0.05em",
            }}
          >
            {voting === "no" ? "…" : "False"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function LiveClaimsPanel() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const voterId = useRef("");

  useEffect(() => {
    voterId.current = getOrCreateVoterId();
    fetch("/api/claims?status=open&limit=8")
      .then((r) => r.json())
      .then((d) => setClaims(d.claims ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: "1px solid var(--border)" }}>
      {/* Header */}
      <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          📊 Claims en direct
        </span>
        <Link
          href="/narratives"
          style={{ fontSize: 8, color: "var(--accent-blue)", textDecoration: "none", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}
        >
          TOUT VOIR →
        </Link>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: "20px 10px", fontSize: 9, color: "var(--border)", textAlign: "center" }}>
            Chargement…
          </div>
        ) : claims.length === 0 ? (
          <div style={{ padding: "20px 10px", fontSize: 9, color: "var(--border)", textAlign: "center" }}>
            Aucun claim en cours
          </div>
        ) : (
          claims.map((c) => <CompactClaim key={c.id} claim={c} voterId={voterId.current} />)
        )}
      </div>

      <div style={{ padding: "4px 10px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <span style={{ fontSize: 8, color: "var(--border)" }}>Prédictions communautaires · Taxonomie DISARM</span>
      </div>
    </div>
  );
}
