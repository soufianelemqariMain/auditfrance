"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import SondagesPanel from "@/components/SondagesPanel";
import MediaAuditPanel from "@/components/audit/MediaAuditPanel";

type MediasTab = "sondages" | "audit-medias";

const TABS: { key: MediasTab; label: string }[] = [
  { key: "sondages", label: "Sondages présidentiels" },
  { key: "audit-medias", label: "Audit Médias" },
];

export default function MediasPage() {
  const [tab, setTab] = useState<MediasTab>("sondages");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-primary)", overflow: "hidden" }}>
      <Navbar />

      {/* Tab bar */}
      <div style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", padding: "0 16px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 0 }}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: "10px 18px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                borderBottom: tab === key ? "2px solid var(--accent-blue)" : "2px solid transparent",
                fontFamily: "inherit",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                background: "transparent",
                color: tab === key ? "var(--text-primary)" : "var(--text-secondary)",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 10, color: "var(--text-secondary)", letterSpacing: "0.06em" }}>
          Opinion publique · Médias · Infoverif
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {tab === "sondages" && <SondagesPanel />}
        {tab === "audit-medias" && <MediaAuditPanel />}
      </div>
    </div>
  );
}
