"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import NewsBandeau from "@/components/NewsBandeau";
import TVPanel from "@/components/TVPanel";
import DepartmentPanel from "@/components/DepartmentPanel";
import CommunePanel from "@/components/CommunePanel";
import LiveClaimsPanel from "@/components/LiveClaimsPanel";
import DiscoursPanel from "@/components/DiscoursPanel";
import NewsTickerPanel from "@/components/NewsTickerPanel";

// MapLibre requires browser APIs — load client-side only
const Map = dynamic(() => import("@/components/Map"), { ssr: false });

/* ── Main page ──────────────────────────────────────────────── */
export default function Home() {
  const [selectedDept, setSelectedDept] = useState<{ code: string; nom: string } | null>(null);
  const [selectedCommune, setSelectedCommune] = useState<{ code: string; nom: string } | null>(null);

  const handleDeptClick = useCallback((code: string, nom: string) => {
    setSelectedDept({ code, nom });
    setSelectedCommune(null);
  }, []);

  const handleCommuneSelect = useCallback((code: string, nom: string) => {
    setSelectedCommune({ code, nom });
    setSelectedDept(null);
  }, []);

  return (
    <div
      className="main-wrapper"
      style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-primary)", overflow: "hidden" }}
    >
      <Navbar />
      <NewsBandeau />

      <div className="main-content-area" style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        {/* Map — 50% of available height */}
        <div className="map-section" style={{ flex: "0 0 50%", position: "relative", overflow: "hidden" }}>
          <Map onDeptClick={handleDeptClick} onCommuneClick={handleCommuneSelect} />

          {selectedDept && !selectedCommune && (
            <DepartmentPanel
              code={selectedDept.code}
              nom={selectedDept.nom}
              onClose={() => setSelectedDept(null)}
            />
          )}

          {selectedCommune && (
            <CommunePanel
              code={selectedCommune.code}
              nom={selectedCommune.nom}
              onClose={() => setSelectedCommune(null)}
            />
          )}
        </div>

        {/* Bottom panels — Claims en direct · Infos · Discours · TV */}
        <div
          className="bottom-panels"
          style={{ flex: "0 0 50%", display: "flex", borderTop: "1px solid var(--border)", overflow: "hidden" }}
        >
          {/* Claims en direct — primary, fills remaining space */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            <LiveClaimsPanel />
          </div>

          {/* Infos en direct (live radar news) — 20% */}
          <div style={{ flex: "0 0 20%", overflow: "hidden" }}>
            <NewsTickerPanel />
          </div>

          {/* Discours & Interventions — 18% */}
          <div style={{ flex: "0 0 18%", overflow: "hidden" }}>
            <DiscoursPanel />
          </div>

          {/* TV Direct — 22% */}
          <div style={{ flex: "0 0 22%", overflow: "hidden", borderLeft: "1px solid var(--border)" }}>
            <TVPanel />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="footer-bar"
        style={{
          height: 22, background: "var(--bg-secondary)", borderTop: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, gap: 6,
        }}
      >
        <span style={{ fontSize: 9, color: "var(--text-secondary)", letterSpacing: "0.1em" }}>OPEN SOURCE</span>
        <span style={{ fontSize: 9, color: "var(--border)" }}>·</span>
        <a
          href="https://infoverif.org"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 9, color: "var(--text-secondary)", textDecoration: "none", letterSpacing: "0.1em" }}
        >
          infoverif.org
        </a>
        <span style={{ fontSize: 9, color: "var(--border)" }}>·</span>
        <a
          href="https://github.com/soufianelemqariMain/auditfrance"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 9, color: "var(--text-secondary)", textDecoration: "none", letterSpacing: "0.1em" }}
        >
          GitHub
        </a>
        <span style={{ fontSize: 9, color: "var(--border)" }}>·</span>
        <span style={{ fontSize: 9, color: "var(--text-secondary)", letterSpacing: "0.1em" }}>MIT</span>
      </div>
    </div>
  );
}
