"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import LayerPanel from "@/components/LayerPanel";
import NewsTickerPanel from "@/components/NewsTickerPanel";
import TVPanel from "@/components/TVPanel";
import CAC40Panel from "@/components/CAC40Panel";
import DepartmentPanel from "@/components/DepartmentPanel";
import SousActifsPanel from "@/components/SousActifsPanel";
import AoOuvertsPanel from "@/components/AoOuvertsPanel";

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

          {/* Bottom panels — 50% of available height: News · TV Direct · Sous-actifs · AO Ouverts · CAC40 */}
          <div
            style={{
              flex: "0 0 50%",
              display: "flex",
              borderTop: "1px solid var(--border)",
              overflow: "hidden",
            }}
          >
            {/* News — 22% */}
            <div style={{ flex: "0 0 22%", overflow: "hidden" }}>
              <NewsTickerPanel />
            </div>

            {/* TV Direct — 15% */}
            <div style={{ flex: "0 0 15%", overflow: "hidden" }}>
              <TVPanel />
            </div>

            {/* Sous-actifs — 18% */}
            <div style={{ flex: "0 0 18%", overflow: "hidden" }}>
              <SousActifsPanel />
            </div>

            {/* AO Ouverts — 18% */}
            <div style={{ flex: "0 0 18%", overflow: "hidden" }}>
              <AoOuvertsPanel />
            </div>

            {/* CAC40 — fills remaining space */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <CAC40Panel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
