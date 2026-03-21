"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import LayerPanel from "@/components/LayerPanel";
import NewsTickerPanel from "@/components/NewsTickerPanel";
import InsightsPanel from "@/components/InsightsPanel";
import TVPanel from "@/components/TVPanel";
import CAC40Panel from "@/components/CAC40Panel";
import DepartmentPanel from "@/components/DepartmentPanel";
import ParlementPanel from "@/components/ParlementPanel";

// MapLibre requires browser APIs — load client-side only
const Map = dynamic(() => import("@/components/Map"), { ssr: false });

export default function Home() {
  const [selectedDept, setSelectedDept] = useState<{ code: string; nom: string } | null>(null);

  const handleDeptClick = useCallback((code: string, nom: string) => {
    setSelectedDept({ code, nom });
  }, []);

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
          {/* Map — 50% of available height */}
          <div style={{ flex: "0 0 50%", position: "relative", overflow: "hidden" }}>
            <Map onDeptClick={handleDeptClick} />

            {/* Department intelligence panel — slides over the map */}
            {selectedDept && (
              <DepartmentPanel
                code={selectedDept.code}
                nom={selectedDept.nom}
                onClose={() => setSelectedDept(null)}
              />
            )}
          </div>

          {/* Bottom panels — 50% of available height: News · TV Direct · CAC40 · Insights */}
          <div
            style={{
              flex: "0 0 50%",
              display: "flex",
              borderTop: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            {/* News — 30% */}
            <div style={{ flex: "0 0 30%", overflow: "hidden" }}>
              <NewsTickerPanel />
            </div>

            {/* TV Direct — 20% */}
            <div style={{ flex: "0 0 20%", overflow: "hidden" }}>
              <TVPanel />
            </div>

            {/* CAC40 — 20% */}
            <div style={{ flex: "0 0 20%", overflow: "hidden" }}>
              <CAC40Panel />
            </div>

            {/* Parlement AN/Sénat — 20% */}
            <div style={{ flex: "0 0 20%", overflow: "hidden" }}>
              <ParlementPanel />
            </div>

            {/* AI Insights — 10% */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <InsightsPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
