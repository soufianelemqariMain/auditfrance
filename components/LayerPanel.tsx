"use client";

import { useState } from "react";
import { useAppStore } from "../lib/store";

interface LayerDef {
  key: string;
  label: string;
}

const LAYERS: LayerDef[] = [
  { key: "nuclear_plants", label: "☢ Centrales Nucl." },
  { key: "military_bases", label: "⬟ Bases Militaires" },
  { key: "data_centers",   label: "⬟ Data Centers" },
  { key: "telco_hubs",     label: "◉ Hubs Télécoms" },
  { key: "departments",    label: "▭ Départements" },
  { key: "heatmap_elus",   label: "🗳 Activité Élus" },
];

export default function LayerPanel() {
  const layers = useAppStore((s) => s.layers);
  const toggleLayer = useAppStore((s) => s.toggleLayer);
  const [search, setSearch] = useState("");

  const filtered = LAYERS.filter((l) =>
    l.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside
      style={{
        width: 200,
        background: "var(--bg-panel)",
        borderRight: "1px solid var(--border)",
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 12px 8px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--accent-green)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        COUCHES
      </div>

      {/* Search */}
      <div style={{ padding: "8px 12px" }}>
        <input
          type="text"
          placeholder="Filtrer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            fontSize: 11,
            padding: "4px 8px",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* Layer list */}
      <ul style={{ listStyle: "none", flex: 1 }}>
        {filtered.map((layer) => {
          const active = !!layers[layer.key];
          return (
            <li
              key={layer.key}
              onClick={() => toggleLayer(layer.key)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                fontSize: 12,
                cursor: "pointer",
                color: active ? "var(--text-primary)" : "var(--text-secondary)",
                userSelect: "none",
              }}
            >
              <span>{layer.label}</span>
              {/* Toggle square */}
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 3,
                  flexShrink: 0,
                  background: active ? "var(--accent-green)" : "transparent",
                  border: active
                    ? "1px solid var(--accent-green)"
                    : "1px solid var(--border)",
                  transition: "background 0.15s, border-color 0.15s",
                }}
              />
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
