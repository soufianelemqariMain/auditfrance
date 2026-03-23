"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import FilterBar from "@/components/FilterBar";
import NewsTickerPanel from "@/components/NewsTickerPanel";
import TVPanel from "@/components/TVPanel";
import CAC40Panel from "@/components/CAC40Panel";
import DepartmentPanel from "@/components/DepartmentPanel";
import CommunePanel from "@/components/CommunePanel";
import CommuneSearchBar from "@/components/CommuneSearchBar";
import SousActifsPanel from "@/components/SousActifsPanel";
import AoOuvertsPanel from "@/components/AoOuvertsPanel";
import RecrutementPanel from "@/components/RecrutementPanel";

// MapLibre requires browser APIs — load client-side only
const Map = dynamic(() => import("@/components/Map"), { ssr: false });

export default function Home() {
  const [selectedDept, setSelectedDept] = useState<{ code: string; nom: string } | null>(null);
  const [selectedCommune, setSelectedCommune] = useState<{ code: string; nom: string } | null>(null);

  const handleDeptClick = useCallback((code: string, nom: string) => {
    setSelectedDept({ code, nom });
    setSelectedCommune(null);
  }, []);

  const handleCommuneSelect = useCallback((code: string, nom: string) => {
    setSelectedCommune({ code, nom });
  }, []);

  return (
    <div
      className="main-wrapper"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--bg-primary)",
        overflow: "hidden",
      }}
    >
      <Navbar />
      <FilterBar />

      <div className="main-content-area" style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        {/* Map — 50% of available height */}
        <div className="map-section" style={{ flex: "0 0 50%", position: "relative", overflow: "hidden" }}>
          <Map onDeptClick={handleDeptClick} onCommuneClick={handleCommuneSelect} />

          {/* Commune search — floating top-left over map */}
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              width: 200,
              zIndex: 30,
            }}
          >
            <CommuneSearchBar onSelect={handleCommuneSelect} />
          </div>

          {/* Department intelligence panel — slides over the map */}
          {selectedDept && !selectedCommune && (
            <DepartmentPanel
              code={selectedDept.code}
              nom={selectedDept.nom}
              onClose={() => setSelectedDept(null)}
              onCommuneClick={handleCommuneSelect}
            />
          )}

          {/* Commune panel — slides over the map, higher z-index than dept panel */}
          {selectedCommune && (
            <CommunePanel
              code={selectedCommune.code}
              nom={selectedCommune.nom}
              onClose={() => setSelectedCommune(null)}
            />
          )}
        </div>

        {/* Bottom panels — 50% of available height: News · TV Direct · Sous-actifs · AO Ouverts · CAC40 */}
        <div
          className="bottom-panels"
          style={{
            flex: "0 0 50%",
            display: "flex",
            borderTop: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          {/* News — 22% */}
          <div className="bp-news" style={{ flex: "0 0 22%", overflow: "hidden" }}>
            <NewsTickerPanel />
          </div>

          {/* TV Direct — 15% */}
          <div className="bp-tv" style={{ flex: "0 0 15%", overflow: "hidden" }}>
            <TVPanel />
          </div>

          {/* Sous-actifs — 18% */}
          <div className="bp-sousactifs" style={{ flex: "0 0 18%", overflow: "hidden" }}>
            <SousActifsPanel />
          </div>

          {/* AO Ouverts — 18% */}
          <div className="bp-ao" style={{ flex: "0 0 18%", overflow: "hidden" }}>
            <AoOuvertsPanel />
          </div>

          {/* CAC40 — fixed width */}
          <div className="bp-cac" style={{ flex: "0 0 14%", overflow: "hidden" }}>
            <CAC40Panel />
          </div>

          {/* Recrutement — fills remaining space */}
          <div className="bp-recrutement" style={{ flex: 1, overflow: "hidden" }}>
            <RecrutementPanel />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="footer-bar"
        style={{
          height: 22,
          background: "var(--bg-secondary)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          gap: 6,
        }}
      >
        <span style={{ fontSize: 9, color: "var(--text-secondary)", letterSpacing: "0.1em" }}>
          OPEN SOURCE
        </span>
        <span style={{ fontSize: 9, color: "var(--border)" }}>·</span>
        <a
          href="https://github.com/soufianelemqariMain/auditfrance"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 9, color: "var(--text-secondary)", textDecoration: "none", letterSpacing: "0.1em" }}
        >
          github.com/soufianelemqariMain/auditfrance
        </a>
        <span style={{ fontSize: 9, color: "var(--border)" }}>·</span>
        <span style={{ fontSize: 9, color: "var(--text-secondary)", letterSpacing: "0.1em" }}>MIT</span>
      </div>
    </div>
  );
}
