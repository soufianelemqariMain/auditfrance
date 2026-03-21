"use client";

import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import LayerPanel from "@/components/LayerPanel";
import NewsTickerPanel from "@/components/NewsTickerPanel";
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
      <Navbar />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left sidebar — layer controls */}
        <LayerPanel />

        <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
          {/* Map */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <Map />
          </div>

          {/* Bottom panels — News · TV Direct · CAC40 · Insights */}
          <div
            style={{
              height: 240,
              display: "flex",
              borderTop: "1px solid var(--border)",
              flexShrink: 0,
            }}
          >
            {/* News — 35% */}
            <div style={{ flex: "0 0 35%", overflow: "hidden" }}>
              <NewsTickerPanel />
            </div>

            {/* TV Direct — 25% */}
            <div style={{ flex: "0 0 25%", overflow: "hidden" }}>
              <TVPanel />
            </div>

            {/* CAC40 — 25% */}
            <div style={{ flex: "0 0 25%", overflow: "hidden" }}>
              <CAC40Panel />
            </div>

            {/* AI Insights — 15% */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <InsightsPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
