"use client";

import { useAppStore } from "../lib/store";

interface LayerDef {
  key: string;
  label: string;
}

const LAYERS: LayerDef[] = [
  { key: "nuclear_plants", label: "☢ Centrales Nucl." },
  { key: "military_bases", label: "⬟ Bases Militaires" },
  { key: "data_centers",   label: "◈ Data Centers" },
  { key: "telco_hubs",     label: "◉ Hubs Télécoms" },
  { key: "cities",         label: "● Villes principales" },
  { key: "departments",    label: "▭ Départements" },
  { key: "heatmap_elus",   label: "🗳 Activité Élus" },
];

export default function LayerPanel() {
  const layers = useAppStore((s) => s.layers);
  const toggleLayer = useAppStore((s) => s.toggleLayer);

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

      {/* Layer list */}
      <ul style={{ listStyle: "none", flex: 1 }}>
        {LAYERS.map((layer) => {
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
