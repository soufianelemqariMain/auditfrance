"use client";

import Navbar from "@/components/Navbar";
import AnalyserPanel from "@/components/AnalyserPanel";

export default function AnalysisPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        overflow: "hidden",
      }}
    >
      <Navbar />

      <div
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "32px 20px",
          gap: 24,
        }}
      >
        {/* Header */}
        <div style={{ width: "100%", maxWidth: 760, textAlign: "center" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--accent-blue)",
              marginBottom: 8,
            }}
          >
            DISARM Framework · Multimodal Analysis
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "var(--accent-white)",
              margin: 0,
            }}
          >
            Influence Operation Detector
          </h1>
          <p
            style={{
              fontSize: 11,
              color: "var(--text-secondary)",
              marginTop: 8,
              lineHeight: 1.6,
              maxWidth: 540,
              margin: "8px auto 0",
            }}
          >
            Paste a URL, text, or upload a file. The analysis engine detects manipulation
            techniques using the DISARM disinformation framework, scores propaganda and
            conspiracy risk, and surfaces actionable intelligence.
          </p>
        </div>

        {/* Analysis Panel */}
        <div style={{ width: "100%", maxWidth: 760 }}>
          <AnalyserPanel />
        </div>

        {/* Footer note */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            color: "var(--text-secondary)",
            letterSpacing: "0.1em",
            textAlign: "center",
            opacity: 0.6,
          }}
        >
          Analysis powered by InfoVerif DISARM engine · Results are AI-generated and should be
          verified by human experts
        </div>
      </div>
    </div>
  );
}
