"use client";

import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import LayerPanel from "@/components/LayerPanel";
import NewsTickerPanel from "@/components/NewsTickerPanel";
import WebcamPanel from "@/components/WebcamPanel";
import InsightsPanel from "@/components/InsightsPanel";

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

          {/* Bottom panels row */}
          <div
            style={{
              height: 220,
              display: "flex",
              borderTop: "1px solid var(--border)",
              flexShrink: 0,
            }}
          >
            {/* News ticker — left 40% */}
            <div style={{ flex: "0 0 40%", overflow: "hidden" }}>
              <NewsTickerPanel />
            </div>

            {/* Webcams — center 35% */}
            <div style={{ flex: "0 0 35%", overflow: "hidden" }}>
              <WebcamPanel />
            </div>

            {/* AI Insights — right 25% */}
            <div style={{ flex: "0 0 25%", overflow: "hidden" }}>
              <InsightsPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
