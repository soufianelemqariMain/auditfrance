"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import ClaimCard, { Claim } from "@/components/ClaimCard";
import Link from "next/link";

interface TopicData {
  slug: string;
  display: string;
  claim_count: number;
  overall_probability: number;
  claims: Claim[];
}

function getOrCreateVoterId(): string {
  if (typeof window === "undefined") return "";
  const stored = localStorage.getItem("infoverif_voter_id");
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem("infoverif_voter_id", id);
  return id;
}

function RiskGauge({ probability }: { probability: number }) {
  const pct = Math.round(probability * 100);
  const color = pct >= 70 ? "var(--accent-red)" : pct >= 50 ? "var(--accent-yellow)" : "var(--accent-blue)";
  const circumference = 2 * Math.PI * 50;
  const dash = (pct / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <svg width="100" height="100" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r="50"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.7s ease" }}
        />
        <text
          x="60" y="65"
          textAnchor="middle"
          fill={color}
          fontSize="22"
          fontWeight="700"
          fontFamily="var(--font-mono)"
          style={{ transform: "rotate(90deg)", transformOrigin: "60px 60px" }}
        >
          {pct}%
        </text>
      </svg>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)" }}>
        Narrative Risk
      </span>
    </div>
  );
}

export default function TopicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<TopicData | null>(null);
  const [loading, setLoading] = useState(true);
  const voterId = useRef<string>("");

  useEffect(() => {
    voterId.current = getOrCreateVoterId();
  }, []);

  const fetchTopic = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (voterId.current) headers["X-Voter-Id"] = voterId.current;
      const res = await fetch(`/api/claims?topic=${slug}&status=open&limit=50`, { headers });
      const listData = await res.json();

      // Build topic summary from claims list
      const claims: Claim[] = listData.claims || [];
      const totalYes = claims.reduce((s: number, c: Claim) => s + (c.yes_count || 0), 0);
      const totalNo = claims.reduce((s: number, c: Claim) => s + (c.no_count || 0), 0);
      const total = totalYes + totalNo;

      setData({
        slug,
        display: claims[0]?.topic_display || slug,
        claim_count: claims.length,
        overall_probability: total > 0 ? totalYes / total : 0.5,
        claims,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchTopic(); }, [fetchTopic]);

  const handleVoted = (updated: Claim) => {
    setData((prev) => prev ? { ...prev, claims: prev.claims.map((c) => c.id === updated.id ? updated : c) } : prev);
  };

  const sortedByRisk = data?.claims
    ? [...data.claims].sort((a, b) => {
        const riskA = a.probability * a.total_votes;
        const riskB = b.probability * b.total_votes;
        return riskB - riskA;
      })
    : [];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <Navbar />

      <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)", padding: "60px 16px 24px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <Link
            href="/narratives"
            style={{ fontFamily: "var(--font-mono)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", textDecoration: "none", display: "inline-block", marginBottom: "12px" }}
          >
            ← Narrative Feed
          </Link>

          {loading ? (
            <div style={{ height: "60px", background: "var(--bg-panel)", borderRadius: "2px", opacity: 0.5 }} />
          ) : data ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h1 style={{ fontSize: "26px", fontWeight: 700, marginBottom: "4px" }}>{data.display}</h1>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)" }}>
                  {data.claim_count} open claims
                </p>
              </div>
              <RiskGauge probability={data.overall_probability} />
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "24px 16px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: "160px", background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "2px", opacity: 0.5 }} />
            ))}
          </div>
        ) : sortedByRisk.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "60px 0", fontSize: "13px" }}>
            No claims found for this topic.
          </p>
        ) : (
          <>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "2px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              Claims sorted by risk
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {sortedByRisk.map((claim) => (
                <ClaimCard
                  key={claim.id}
                  claim={claim}
                  voterId={voterId.current}
                  onVoted={handleVoted}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
