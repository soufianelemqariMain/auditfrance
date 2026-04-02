"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";

const PLANS = [
  {
    name: "API Starter",
    price: "$299",
    period: "/mo",
    color: "var(--accent-blue)",
    features: [
      "Read-only API access",
      "3 topics",
      "10,000 API calls/month",
      "JSON export",
      "Community prediction data",
    ],
    cta: "Get API Key",
  },
  {
    name: "Intelligence",
    price: "$999",
    period: "/mo",
    color: "#a855f7",
    featured: true,
    features: [
      "10 topics",
      "100,000 API calls/month",
      "JSON + CSV export",
      "Manipulation risk score",
      "Weekly AI reports",
      "Email alerts on threshold",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Campaign",
    price: "$2,999",
    period: "/mo",
    color: "var(--accent-red)",
    features: [
      "Unlimited topics",
      "Custom prediction campaigns",
      "Embeddable widget",
      "Webhook push",
      "All Intelligence features",
      "Priority support",
    ],
    cta: "Contact Sales",
  },
];

const USE_CASES = [
  { sector: "Media", icon: "📰", description: "Track how your audience perceives breaking stories before they peak. Know what narratives are gaining traction 24h before mainstream coverage." },
  { sector: "Finance", icon: "📈", description: "Crowd-sourced prediction signals as an alternative data source. Identify market sentiment shifts before they show up in price action." },
  { sector: "Consulting", icon: "🏛", description: "Add a community prediction layer to your research reports. Show clients the gap between expert consensus and crowd intelligence." },
  { sector: "PR & Comms", icon: "📣", description: "Monitor how narratives about your brand or sector evolve. Get early warning when a story is going viral in the prediction community." },
];

export default function ProPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg-primary)", overflowY: "auto" }}>
      <Navbar />

      {/* Hero */}
      <div style={{ padding: "48px 24px 40px", textAlign: "center", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 9,
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            color: "#4ade80",
            border: "1px solid #4ade80",
            padding: "3px 10px",
            borderRadius: "2px",
            marginBottom: 16,
          }}>
            ✅ Zero bets · No gambling · Pure data
          </div>
          <h1 style={{ margin: "0 0 12px", fontSize: 28, fontWeight: 700, color: "var(--accent-white)", lineHeight: 1.2 }}>
            Community prediction intelligence<br />for decision makers
          </h1>
          <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Thousands of people vote daily on world events — economics, politics, tech, health.
            Zero bets, zero risk. You buy the aggregated prediction data.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="mailto:pro@infoverif.org?subject=API%20Access%20Request"
              style={{
                padding: "10px 24px",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                background: "var(--accent-blue)",
                color: "var(--accent-white)",
                textDecoration: "none",
                borderRadius: "2px",
                fontWeight: 600,
              }}
            >
              Request API Access
            </a>
            <Link
              href="/predictions"
              style={{
                padding: "10px 24px",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                textDecoration: "none",
                borderRadius: "2px",
              }}
            >
              See Live Data
            </Link>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        padding: "20px 24px",
        display: "flex",
        justifyContent: "center",
        gap: 48,
        flexWrap: "wrap",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-secondary)",
      }}>
        {[
          { value: "10", label: "Global Topics" },
          { value: "Daily", label: "New Predictions" },
          { value: "Global", label: "Community" },
          { value: "0", label: "Money at Risk" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent-white)", fontFamily: "var(--font-mono)" }}>{s.value}</div>
            <div style={{ fontSize: 9, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.8px", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div style={{ padding: "40px 24px", maxWidth: 960, margin: "0 auto", width: "100%" }}>
        <h2 style={{ textAlign: "center", fontSize: 16, fontWeight: 700, color: "var(--accent-white)", marginBottom: 24, letterSpacing: "-0.01em" }}>
          Simple, transparent pricing
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              style={{
                border: `1px solid ${plan.featured ? plan.color : "var(--border)"}`,
                borderRadius: 4,
                padding: 24,
                background: plan.featured ? `rgba(168,85,247,0.06)` : "var(--bg-secondary)",
                position: "relative",
              }}
            >
              {plan.featured && (
                <div style={{
                  position: "absolute",
                  top: -10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: 8,
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  background: plan.color,
                  color: "var(--accent-white)",
                  padding: "2px 8px",
                  borderRadius: "2px",
                }}>
                  Most Popular
                </div>
              )}
              <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "1px", color: plan.color, marginBottom: 8 }}>
                {plan.name}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 16 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: "var(--accent-white)" }}>{plan.price}</span>
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{plan.period}</span>
              </div>
              <ul style={{ margin: "0 0 20px", padding: 0, listStyle: "none" }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ fontSize: 11, color: "var(--text-secondary)", padding: "3px 0", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: plan.color, fontSize: 10 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:pro@infoverif.org?subject=InfoVerif%20Pro%20Inquiry"
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "8px 0",
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  background: plan.featured ? plan.color : "transparent",
                  border: `1px solid ${plan.color}`,
                  color: plan.featured ? "var(--accent-white)" : plan.color,
                  textDecoration: "none",
                  borderRadius: "2px",
                  fontWeight: 600,
                }}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Use cases */}
      <div style={{ padding: "0 24px 40px", maxWidth: 960, margin: "0 auto", width: "100%" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-white)", marginBottom: 20, letterSpacing: "-0.01em" }}>
          Built for
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          {USE_CASES.map((uc) => (
            <div key={uc.sector} style={{ padding: 16, border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-secondary)" }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{uc.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-white)", marginBottom: 6 }}>{uc.sector}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5 }}>{uc.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* API sample */}
      <div style={{ padding: "0 24px 40px", maxWidth: 960, margin: "0 auto", width: "100%" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-white)", marginBottom: 16, letterSpacing: "-0.01em" }}>
          Simple API
        </h2>
        <pre style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: 4,
          padding: 20,
          fontSize: 11,
          color: "#4ade80",
          overflowX: "auto",
          margin: 0,
          lineHeight: 1.6,
        }}>
{`curl https://infoverif.org/api/b2b/topics/economics \\
  -H "X-API-Key: iv_your_key_here"

{
  "topic_slug": "economics",
  "count": 12,
  "claims": [
    {
      "id": 42,
      "claim": "US inflation will exceed 4% before Q3 2026",
      "community_prediction": 0.61,
      "vote_count": 1243,
      "is_shooting_star": true,
      "manipulation_risk_score": 0.12,  // Intelligence tier+
      "deadline": "2026-09-30T00:00:00Z"
    }
  ]
}`}
        </pre>
      </div>

      {/* Footer CTA */}
      <div style={{ padding: "32px 24px", textAlign: "center", borderTop: "1px solid var(--border)", background: "var(--bg-secondary)" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--text-secondary)" }}>
            Ready to add community prediction intelligence to your workflow?
          </p>
          <a
            href="mailto:pro@infoverif.org?subject=API%20Access%20Request"
            style={{
              display: "inline-block",
              padding: "10px 28px",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              background: "var(--accent-blue)",
              color: "var(--accent-white)",
              textDecoration: "none",
              borderRadius: "2px",
              fontWeight: 600,
            }}
          >
            pro@infoverif.org
          </a>
        </div>
      </div>
    </div>
  );
}
