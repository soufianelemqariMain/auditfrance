"use client";

import { useAppStore } from "../lib/store";
import CommuneSearchBar from "./CommuneSearchBar";

const FILTERS = [
  { key: "nuclear_plants", label: "☢ Nucléaire",      color: "#ffcc00" },
  { key: "military_bases", label: "⬟ Militaire",      color: "#00ff41" },
  { key: "data_centers",   label: "◈ Data Centers",   color: "#C9A227" },
  { key: "telco_hubs",     label: "◉ Télécoms",       color: "#00aaff" },
  { key: "ports",          label: "⚓ Ports & Hubs",  color: "#38bdf8" },
  { key: "departments",    label: "▭ Départements",   color: "#0055A4" },
  { key: "heatmap_elus",   label: "🗳 Activité Élus", color: "#c084fc" },
];

interface Props {
  onCommuneSelect?: (code: string, nom: string) => void;
}

export default function FilterBar({ onCommuneSelect }: Props) {
  const layers = useAppStore((s) => s.layers);
  const toggleLayer = useAppStore((s) => s.toggleLayer);

  return (
    <div
      className="filterbar-container"
      style={{
        height: 36,
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 14px",
        flexShrink: 0,
        overflowX: "auto",
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--text-secondary)",
          flexShrink: 0,
          marginRight: 4,
        }}
      >
        COUCHES
      </span>

      {FILTERS.map((f) => {
        const active = !!layers[f.key];
        return (
          <button
            key={f.key}
            onClick={() => toggleLayer(f.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 10px",
              fontSize: 11,
              fontWeight: active ? 600 : 400,
              cursor: "pointer",
              border: `1px solid ${active ? f.color : "var(--border)"}`,
              borderRadius: 3,
              background: active ? `${f.color}1a` : "transparent",
              color: active ? f.color : "var(--text-secondary)",
              letterSpacing: "0.04em",
              flexShrink: 0,
              transition: "all 0.12s",
              outline: "none",
            }}
          >
            {f.label}
          </button>
        );
      })}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Commune search — right side of filter bar */}
      {onCommuneSelect && (
        <div style={{ flexShrink: 0, width: 180 }}>
          <CommuneSearchBar onSelect={onCommuneSelect} />
        </div>
      )}
    </div>
  );
}
