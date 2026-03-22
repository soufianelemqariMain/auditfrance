"use client";

import { useAppStore } from "../lib/store";

interface LayerDef {
  key: string;
  label: string;
  description: string;
}

const LAYERS: LayerDef[] = [
  { key: "nuclear_plants", label: "☢ Centrales Nucl.",    description: "56 réacteurs en activité — 70 % de l'électricité française" },
  { key: "military_bases", label: "⬟ Bases Militaires",  description: "Emplacements des forces terrestres, navales et aériennes" },
  { key: "data_centers",   label: "◈ Data Centers",      description: "Infrastructure numérique stratégique et souveraineté des données" },
  { key: "telco_hubs",     label: "◉ Hubs Télécoms",     description: "Noeuds d'échange Internet et câbles nationaux" },
  { key: "cities",         label: "● Villes",            description: "23 villes de plus de 130 000 habitants" },
  { key: "departments",    label: "▭ Départements",      description: "Les 101 départements — unité administrative de base" },
  { key: "heatmap_elus",   label: "🗳 Activité Élus",    description: "Intensité des votes et présences à l'Assemblée par département" },
];

export default function LayerPanel() {
  const layers = useAppStore((s) => s.layers);
  const toggleLayer = useAppStore((s) => s.toggleLayer);

  return (
    <aside
      style={{
        width: 220,
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
          padding: "12px 12px 10px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "var(--accent-green)",
          marginBottom: 6,
        }}>
          INFRASTRUCTURE CRITIQUE
        </div>
        <div style={{
          fontSize: 10,
          color: "var(--text-secondary)",
          lineHeight: 1.5,
          letterSpacing: "0.03em",
        }}>
          Cartographie en temps réel des actifs stratégiques et des institutions de la République.
        </div>
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
                padding: "8px 12px",
                fontSize: 12,
                cursor: "pointer",
                color: active ? "var(--text-primary)" : "var(--text-secondary)",
                userSelect: "none",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontWeight: active ? 600 : 400 }}>{layer.label}</span>
                {/* Toggle square */}
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 2,
                    flexShrink: 0,
                    background: active ? "var(--accent-green)" : "transparent",
                    border: active
                      ? "1px solid var(--accent-green)"
                      : "1px solid var(--border)",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.4, opacity: active ? 1 : 0.6 }}>
                {layer.description}
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
