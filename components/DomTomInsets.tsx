"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "../lib/store";

interface TerritoryDef {
  id: string;
  label: string;
  center: [number, number];
  zoom: number;
}

const TERRITORIES: TerritoryDef[] = [
  { id: "guadeloupe",  label: "GP", center: [-61.46, 16.17], zoom: 8.2 },
  { id: "martinique",  label: "MQ", center: [-61.02, 14.67], zoom: 8.8 },
  { id: "guyane",      label: "GF", center: [-53.1,  3.9],   zoom: 5.8 },
  { id: "reunion",     label: "RE", center: [55.55, -21.13], zoom: 9.0 },
  { id: "mayotte",     label: "YT", center: [45.17, -12.82], zoom: 9.5 },
];

const INSET_W = 110;
const INSET_H = 80;

export default function DomTomInsets() {
  const layers = useAppStore((s) => s.layers);
  const mapsRef = useRef<Record<string, unknown>>({});

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      await import("maplibre-gl/dist/maplibre-gl.css");

      for (const territory of TERRITORIES) {
        if (cancelled) return;
        const container = document.getElementById(`domtom-${territory.id}`);
        if (!container || mapsRef.current[territory.id]) continue;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map: any = new maplibregl.Map({
          container,
          style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
          center: territory.center,
          zoom: territory.zoom,
          interactive: false,
          attributionControl: false,
        });

        mapsRef.current[territory.id] = map;

        map.on("load", () => {
          // French labels
          map.getStyle().layers.forEach((layer: { id: string; type: string; layout?: Record<string, unknown> }) => {
            if (layer.type === "symbol" && layer.layout?.["text-field"] !== undefined) {
              map.setLayoutProperty(layer.id, "text-field", [
                "coalesce",
                ["get", "name:fr"],
                ["get", "name"],
              ]);
            }
          });

          // Add departments overlay (DOM-TOM depts are in the same geojson)
          fetch("/data/departments.geojson")
            .then((r) => r.json())
            .then((data) => {
              if (!map.getSource("depts")) {
                map.addSource("depts", { type: "geojson", data });
                map.addLayer({
                  id: "depts-fill",
                  type: "fill",
                  source: "depts",
                  paint: { "fill-color": "#0055A4", "fill-opacity": 0.12 },
                });
                map.addLayer({
                  id: "depts-line",
                  type: "line",
                  source: "depts",
                  paint: { "line-color": "#0055A4", "line-width": 0.8, "line-opacity": 0.6 },
                });
              }
            })
            .catch(() => {});
        });
      }
    };

    init();
    return () => { cancelled = true; };
  }, []);

  // Sync dept layer visibility
  useEffect(() => {
    for (const territory of TERRITORIES) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = mapsRef.current[territory.id] as any;
      if (!map) continue;
      const deptsVisible = layers.departments !== false;
      ["depts-fill", "depts-line"].forEach((id) => {
        if (map.getLayer?.(id)) {
          map.setLayoutProperty(id, "visibility", deptsVisible ? "visible" : "none");
        }
      });
    }
  }, [layers]);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 16,
        left: 12,
        display: "flex",
        gap: 4,
        zIndex: 20,
      }}
    >
      {TERRITORIES.map((t) => (
        <div
          key={t.id}
          style={{
            width: INSET_W,
            background: "var(--bg-panel)",
            border: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          {/* Label */}
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "var(--text-secondary)",
              padding: "2px 5px",
              background: "var(--bg-secondary)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {t.label}
          </div>
          {/* Map container */}
          <div
            id={`domtom-${t.id}`}
            style={{ width: INSET_W, height: INSET_H }}
          />
        </div>
      ))}
    </div>
  );
}
