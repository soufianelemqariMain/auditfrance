"use client";

import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import LayerPanel from "@/components/LayerPanel";
import NewsTickerPanel from "@/components/NewsTickerPanel";
import WebcamPanel from "@/components/WebcamPanel";
import InsightsPanel from "@/components/InsightsPanel";
import TVPanel from "@/components/TVPanel";
import CAC40Panel from "@/components/CAC40Panel";

// MapLibre requires browser APIs — load client-side only
const Map = dynamic(() => import("@/components/Map"), { ssr: false });

export default function Home() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--bg-primary)",
        overflow: "hidden",
      }}
    >
      {/* Top navbar */}
      <Navbar />

      {/* Main content area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left sidebar — layer controls */}
        <LayerPanel />

        {/* Center + right — map + panels */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          {/* Map takes most vertical space */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <Map />
          </div>

          {/* Bottom panels row — two tiers */}
          {/* Tier 1: News · Webcams · TV Direct */}
          <div
            style={{
              height: 230,
              display: "flex",
              borderTop: "1px solid var(--border)",
              flexShrink: 0,
            }}
          >
            {/* News ticker — 35% */}
            <div style={{ flex: "0 0 35%", overflow: "hidden" }}>
              <NewsTickerPanel />
            </div>

            {/* Webcams — 30% */}
            <div style={{ flex: "0 0 30%", overflow: "hidden" }}>
              <WebcamPanel />
            </div>

            {/* TV Direct — 20% */}
            <div style={{ flex: "0 0 20%", overflow: "hidden" }}>
              <TVPanel />
            </div>

            {/* AI Insights + CAC40 — remaining 15% split vertically */}
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {/* CAC40 top half */}
              <div style={{ flex: "0 0 50%", overflow: "hidden" }}>
                <CAC40Panel />
              </div>
              {/* AI Insights bottom half */}
              <div style={{ flex: 1, overflow: "hidden" }}>
                <InsightsPanel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
