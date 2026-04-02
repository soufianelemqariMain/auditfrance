"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import ClaimCard, { Claim } from "@/components/ClaimCard";
import Link from "next/link";

interface Topic {
  slug: string;
  display: string;
  claim_count: number;
  avg_probability: number;
}

function getOrCreateVoterId(): string {
  if (typeof window === "undefined") return "";
  const stored = localStorage.getItem("infoverif_voter_id");
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem("infoverif_voter_id", id);
  return id;
}

export default function NarrativesPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activeTopic, setActiveTopic] = useState<string>("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const voterId = useRef<string>("");

  useEffect(() => {
    voterId.current = getOrCreateVoterId();
  }, []);

  const fetchClaims = useCallback(async (topic: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "open", limit: "30" });
      if (topic) params.set("topic", topic);
      const headers: Record<string, string> = {};
      if (voterId.current) headers["X-Voter-Id"] = voterId.current;
      const res = await fetch(`/api/claims?${params}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setClaims(data.claims || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTopics = useCallback(async () => {
    try {
      const res = await fetch("/api/topics");
      if (res.ok) setTopics(await res.json());
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchClaims(activeTopic);
    fetchTopics();
  }, [fetchClaims, fetchTopics, activeTopic]);

  const handleVoted = (updated: Claim) => {
    setClaims((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <Navbar />

      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          padding: "60px 16px 24px",
        }}
      >
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "9px",
                textTransform: "uppercase",
                letterSpacing: "2px",
                color: "var(--accent-red)",
                border: "1px solid var(--accent-red)",
                padding: "2px 8px",
                borderRadius: "2px",
              }}
            >
              LIVE
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>
              {total} active claims
            </span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px", color: "var(--text-primary)" }}>
            Narrative Intelligence
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "520px", lineHeight: 1.6 }}>
            Vote on whether narrative claims will prove true or gain traction.
            Community predictions in real time — no money, just collective intelligence.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "24px 16px" }}>
        {/* Topic filter pills */}
        {topics.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
            {[{ slug: "", display: "All", claim_count: total, avg_probability: 0.5 }, ...topics.slice(0, 12)].map((t) => (
              <button
                key={t.slug}
                onClick={() => setActiveTopic(t.slug)}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  padding: "4px 10px",
                  background: activeTopic === t.slug ? "var(--accent-blue)" : "transparent",
                  border: `1px solid ${activeTopic === t.slug ? "var(--accent-blue)" : "var(--border)"}`,
                  color: activeTopic === t.slug ? "#fff" : "var(--text-secondary)",
                  cursor: "pointer",
                  borderRadius: "2px",
                  transition: "all 0.15s",
                }}
              >
                {t.display}{t.slug ? ` (${t.claim_count})` : ""}
              </button>
            ))}
          </div>
        )}

        {/* Claims feed */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{ height: "180px", background: "var(--bg-panel)", border: "1px solid var(--border)", borderRadius: "2px", opacity: 0.5 }}
              />
            ))}
          </div>
        ) : claims.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginBottom: "8px" }}>
              No active claims yet.
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", opacity: 0.6 }}>
              Claims are generated automatically from trending narratives.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {claims.map((claim) => (
              <ClaimCard
                key={claim.id}
                claim={claim}
                voterId={voterId.current}
                onVoted={handleVoted}
              />
            ))}
          </div>
        )}

        {/* Corporate CTA */}
        <div
          style={{
            marginTop: "48px",
            border: "1px solid var(--border)",
            borderRadius: "2px",
            padding: "24px",
            background: "var(--bg-panel)",
            textAlign: "center",
          }}
        >
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", textTransform: "uppercase", letterSpacing: "2px", color: "var(--text-secondary)", marginBottom: "8px" }}>
            For organizations
          </p>
          <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>
            Track narrative risk for your brand
          </h3>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px", maxWidth: "420px", margin: "0 auto 16px" }}>
            Subscribe to topics, monitor real-time community probability, and get alerts when narrative risk crosses your threshold.
          </p>
          <a
            href="https://app.infoverif.org/pricing"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              textTransform: "uppercase",
              letterSpacing: "1px",
              background: "var(--accent-red)",
              color: "#fff",
              padding: "10px 20px",
              borderRadius: "2px",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Get Pro access →
          </a>
        </div>
      </div>
    </div>
  );
}
