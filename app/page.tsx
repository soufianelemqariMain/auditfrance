"use client";

import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import LiveClaimsPanel from "@/components/LiveClaimsPanel";

// MapLibre requires browser APIs — load client-side only
const Map = dynamic(() => import("@/components/Map"), { ssr: false });

export default function Home() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-primary)", overflow: "hidden" }}>
      <Navbar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Globe / world map — 55% of height */}
        <div style={{ flex: "0 0 55%", position: "relative", overflow: "hidden" }}>
          <Map globalMode={true} />

          {/* Overlay label — top left */}
          <div style={{
            position: "absolute",
            top: 10,
            left: 14,
            zIndex: 10,
            pointerEvents: "none",
          }}>
            <span style={{
              fontSize: 9,
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              color: "#00d4ff",
              background: "rgba(0,0,0,0.55)",
              padding: "3px 8px",
              borderRadius: "2px",
              backdropFilter: "blur(4px)",
            }}>
              ● LIVE · Community Predictions
            </span>
          </div>
        </div>

        {/* Live claims feed — 45% of height */}
        <div style={{
          flex: "0 0 45%",
          overflow: "hidden",
          borderTop: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{
            padding: "5px 14px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--bg-secondary)",
          }}>
            <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--accent-red)", textTransform: "uppercase", letterSpacing: "1px" }}>
              ● Active Predictions
            </span>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <LiveClaimsPanel />
          </div>
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
