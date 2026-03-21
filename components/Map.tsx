"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const { layers, mapState, setMapState, is3D } = useAppStore();

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let map: {
      remove: () => void;
      on: (event: string, cb: () => void) => void;
      getCenter: () => { lng: number; lat: number };
      getZoom: () => number;
      setPitch: (v: number) => void;
      addSource: (id: string, source: object) => void;
      getSource: (id: string) => unknown;
      addLayer: (layer: object) => void;
      setLayoutProperty: (layer: string, prop: string, val: unknown) => void;
      getLayer: (id: string) => unknown;
    } | null = null;

    const initMap = async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      await import("maplibre-gl/dist/maplibre-gl.css");

      map = new maplibregl.Map({
        container: mapContainer.current!,
        style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        center: [mapState.lon, mapState.lat],
        zoom: mapState.zoom,
        pitch: is3D ? 45 : 0,
        bearing: 0,
      }) as typeof map;

      mapRef.current = map;

      map!.on("load", () => {
        loadLayers(map!);
      });

      map!.on("moveend", () => {
        const center = map!.getCenter();
        setMapState({ lat: center.lat, lon: center.lng, zoom: map!.getZoom() });
      });
    };

    initMap();

    return () => {
      if (mapRef.current) {
        (
          mapRef.current as { remove: () => void }
        ).remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update layer visibility when layers state changes
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current as {
      getLayer: (id: string) => unknown;
      setLayoutProperty: (layer: string, prop: string, val: string) => void;
    };

    const layerIds = [
      "nuclear-plants-circle",
      "nuclear-plants-label",
      "military-bases-circle",
      "military-bases-label",
    ];

    layerIds.forEach((id) => {
      if (map.getLayer(id)) {
        const key = id.startsWith("nuclear") ? "nuclear_plants" : "military_bases";
        map.setLayoutProperty(id, "visibility", layers[key] ? "visible" : "none");
      }
    });
  }, [layers]);

  // Update 3D pitch
  useEffect(() => {
    if (!mapRef.current) return;
    (mapRef.current as { setPitch: (v: number) => void }).setPitch(is3D ? 45 : 0);
  }, [is3D]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {/* Map controls */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          zIndex: 10,
        }}
      >
        <MapButton onClick={() => { /* zoom handled by maplibre controls */ }}>+</MapButton>
        <MapButton onClick={() => { /* zoom handled by maplibre controls */ }}>−</MapButton>
      </div>
      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          background: "rgba(13,13,13,0.9)",
          border: "1px solid var(--border)",
          padding: "8px 12px",
          fontSize: 11,
          color: "var(--text-secondary)",
          lineHeight: 1.8,
          zIndex: 10,
        }}
      >
        <div style={{ color: "var(--accent-yellow)" }}>☢ Centrale nucléaire</div>
        <div style={{ color: "var(--accent-green)" }}>⬟ Base militaire</div>
        <div style={{ color: "var(--accent-blue)" }}>⬤ Préfecture</div>
        <div style={{ color: "var(--accent-red)" }}>⚠ Alerte météo</div>
      </div>
    </div>
  );
}

function MapButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        background: "var(--bg-panel)",
        border: "1px solid var(--border)",
        color: "var(--text-primary)",
        fontSize: 18,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-mono)",
      }}
    >
      {children}
    </button>
  );
}


function loadLayers(map: {
  addSource: (id: string, source: object) => void;
  getSource: (id: string) => unknown;
  addLayer: (layer: object) => void;
  getLayer: (id: string) => unknown;
}) {
  // Nuclear plants
  fetch("/data/nuclear-plants.geojson")
    .then((r) => r.json())
    .then((data) => {
      if (!map.getSource("nuclear-plants")) {
        map.addSource("nuclear-plants", { type: "geojson", data });
        map.addLayer({
          id: "nuclear-plants-circle",
          type: "circle",
          source: "nuclear-plants",
          paint: {
            "circle-radius": 8,
            "circle-color": "#ffcc00",
            "circle-stroke-color": "#ffcc00",
            "circle-stroke-width": 2,
            "circle-opacity": 0.8,
          },
        });
        map.addLayer({
          id: "nuclear-plants-label",
          type: "symbol",
          source: "nuclear-plants",
          layout: {
            "text-field": "☢",
            "text-size": 14,
            "text-offset": [0, 0],
          },
          paint: { "text-color": "#0a0a0a" },
        });
      }
    })
    .catch(() => {});

  // Military bases
  fetch("/data/military-bases.geojson")
    .then((r) => r.json())
    .then((data) => {
      if (!map.getSource("military-bases")) {
        map.addSource("military-bases", { type: "geojson", data });
        map.addLayer({
          id: "military-bases-circle",
          type: "circle",
          source: "military-bases",
          paint: {
            "circle-radius": 6,
            "circle-color": "#00ff41",
            "circle-stroke-color": "#00ff41",
            "circle-stroke-width": 1,
            "circle-opacity": 0.7,
          },
        });
        map.addLayer({
          id: "military-bases-label",
          type: "symbol",
          source: "military-bases",
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
            "text-size": 10,
            "text-offset": [0, 1.5],
            "text-anchor": "top",
          },
          paint: {
            "text-color": "#00ff41",
            "text-halo-color": "#0a0a0a",
            "text-halo-width": 1,
          },
        });
      }
    })
    .catch(() => {});

}
