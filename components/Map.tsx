"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";

interface MapProps {
  onDeptClick?: (code: string, nom: string) => void;
  onCommuneClick?: (code: string, nom: string) => void;
}

export default function Map({ onDeptClick, onCommuneClick }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const onDeptClickRef = useRef(onDeptClick);
  onDeptClickRef.current = onDeptClick;
  const onCommuneClickRef = useRef(onCommuneClick);
  onCommuneClickRef.current = onCommuneClick;
  const { layers, mapState, setMapState, is3D } = useAppStore();

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any = null;

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
        // Localize all basemap labels to French
        // OpenMapTiles vector tiles carry name:fr alongside name
        map!.getStyle().layers.forEach((layer: { id: string; type: string; layout?: Record<string, unknown> }) => {
          if (layer.type === "symbol" && layer.layout?.["text-field"] !== undefined) {
            map!.setLayoutProperty(layer.id, "text-field", [
              "coalesce",
              ["get", "name:fr"],
              ["get", "name"],
            ]);
          }
        });
        loadLayers(map!, maplibregl);
      });

      // Cursor pointer on department hover
      map!.on("mouseenter", "departments-fill", () => {
        map!.getCanvas().style.cursor = "pointer";
      });
      map!.on("mouseleave", "departments-fill", () => {
        map!.getCanvas().style.cursor = "";
      });

      // Cursor pointer on city hover
      map!.on("mouseenter", "cities-dot", () => {
        map!.getCanvas().style.cursor = "pointer";
      });
      map!.on("mouseleave", "cities-dot", () => {
        map!.getCanvas().style.cursor = "";
      });

      // Click on city → open commune panel (fires before department handler due to z-order)
      map!.on("click", "cities-dot", (e: { features?: Array<{properties: {code: string, name: string}}>, point: {x: number, y: number} }) => {
        if (!e.features?.length) return;
        const { code, name } = e.features[0].properties;
        if (onCommuneClickRef.current && code) {
          onCommuneClickRef.current(code, name);
        }
      });

      // Click on department → open intelligence panel
      // At zoom >= 10, the general reverse-geocode handler takes over for commune-level navigation
      map!.on("click", "departments-fill", (e: { features?: Array<{properties: {code: string, nom: string}}>, point: {x: number, y: number}, lngLat: {lng: number, lat: number} }) => {
        if (!e.features?.length) return;
        // At high zoom, let the general click handler open the commune instead
        if (map!.getZoom() >= 10) return;
        // If a city dot is here, city handler takes priority
        const cityFeatures = map!.queryRenderedFeatures(e.point, { layers: ["cities-dot"] });
        if (cityFeatures.length > 0) return;
        const { code, nom } = e.features[0].properties;
        if (onDeptClickRef.current) {
          onDeptClickRef.current(code, nom);
        }
      });

      // General reverse-geocode handler — fires at zoom >= 10 for any map click
      // This gives access to ALL communes by resolving the lat/lon to a commune code
      map!.on("click", (e: { lngLat: { lat: number; lng: number }; point: { x: number; y: number } }) => {
        if (map!.getZoom() < 10) return;
        // Skip if a city dot (already handled by its own click handler)
        const cityFeatures = map!.queryRenderedFeatures(e.point, { layers: ["cities-dot"] });
        if (cityFeatures.length > 0) return;
        // Resolve which commune is at this lat/lon
        const { lat, lng } = e.lngLat;
        fetch(
          `https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lng}&fields=code,nom&limit=1`,
          { signal: AbortSignal.timeout(5000) }
        )
          .then((r) => r.json())
          .then((results: Array<{ code: string; nom: string }>) => {
            if (results.length > 0 && onCommuneClickRef.current) {
              onCommuneClickRef.current(results[0].code, results[0].nom);
            }
          })
          .catch(() => {});
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = mapRef.current as any;

    const LAYER_MAP: Record<string, string[]> = {
      nuclear_plants:  ["nuclear-plants-circle", "nuclear-plants-label"],
      military_bases:  ["military-bases-circle", "military-bases-label"],
      data_centers:    ["data-centers-circle", "data-centers-label"],
      telco_hubs:      ["telco-hubs-circle", "telco-hubs-label"],
      ports:           ["ports-circle", "ports-label"],
      departments:     ["departments-fill", "departments-line"],
      cities:          ["cities-dot", "cities-label"],
    };

    Object.entries(LAYER_MAP).forEach(([key, ids]) => {
      const visible = layers[key] !== false;
      ids.forEach((id) => {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
        }
      });
    });

    // Heatmap: colour departments by elected officials' activity score
    if (layers.heatmap_elus) {
      applyHeatmap(map);
    } else if (map.getLayer && map.getLayer("departments-fill")) {
      // Reset to subtle default blue tint
      map.setPaintProperty("departments-fill", "fill-color", "#0055A4");
      map.setPaintProperty("departments-fill", "fill-opacity", 0.06);
    }
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


// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applyHeatmap(map: any) {
  try {
    const res = await fetch("/api/dept-stats");
    if (!res.ok) return;
    const json = await res.json();
    const depts: Array<{ code: string; norm: number }> = json.depts ?? [];
    if (!depts.length || !map.getLayer("departments-fill")) return;

    // Build a MapLibre match expression: ["match", ["get", "code"], "75", color75, "69", color69, ..., defaultColor]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matchExpr: any[] = ["match", ["get", "code"]];
    for (const dept of depts) {
      const t = dept.norm; // 0–1
      // Interpolate: low = dark navy #0c1c2e, high = bright red #EF4135
      const r = Math.round(12 + t * (239 - 12));
      const g = Math.round(28 + t * (65 - 28));
      const b = Math.round(46 + t * (53 - 46));
      matchExpr.push(dept.code, `rgb(${r},${g},${b})`);
    }
    matchExpr.push("#0c1c2e"); // default fallback

    map.setPaintProperty("departments-fill", "fill-color", matchExpr);
    map.setPaintProperty("departments-fill", "fill-opacity", 0.65);
  } catch {
    // silently ignore
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadLayers(map: any, maplibregl: any) {
  void maplibregl; // available for future popup use inside layers
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
            "text-color": "#0055A4",
            "text-halo-color": "#0c1c2e",
            "text-halo-width": 1,
          },
        });
      }
    })
    .catch(() => {});

  // French departments — subtle fill + border
  fetch("/data/departments.geojson")
    .then((r) => r.json())
    .then((data) => {
      if (!map.getSource("departments")) {
        map.addSource("departments", { type: "geojson", data });

        // Filled regions (very subtle blue tint)
        map.addLayer({
          id: "departments-fill",
          type: "fill",
          source: "departments",
          paint: {
            "fill-color": "#0055A4",
            "fill-opacity": 0.06,
          },
        });

        // Department borders (French blue)
        map.addLayer({
          id: "departments-line",
          type: "line",
          source: "departments",
          paint: {
            "line-color": "#0055A4",
            "line-width": 0.8,
            "line-opacity": 0.5,
          },
        });
      }
    })
    .catch(() => {});

  // Major French ports & airports
  fetch("/data/ports.geojson")
    .then((r) => r.json())
    .then((data) => {
      if (!map.getSource("ports")) {
        map.addSource("ports", { type: "geojson", data });
        map.addLayer({
          id: "ports-circle",
          type: "circle",
          source: "ports",
          paint: {
            "circle-radius": [
              "match", ["get", "rang"],
              1, 8,
              2, 6,
              5,
            ],
            "circle-color": [
              "match", ["get", "type"],
              "port",    "#38bdf8",
              "airport", "#818cf8",
              "#38bdf8",
            ],
            "circle-stroke-color": "#F5F5F5",
            "circle-stroke-width": 1,
            "circle-opacity": 0.9,
          },
        });
        map.addLayer({
          id: "ports-label",
          type: "symbol",
          source: "ports",
          layout: {
            "text-field": [
              "concat",
              ["match", ["get", "type"], "port", "⚓ ", "✈ "],
              ["get", "name"],
            ],
            "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
            "text-size": 9,
            "text-offset": [0, 1.4],
            "text-anchor": "top",
          },
          paint: {
            "text-color": "#38bdf8",
            "text-halo-color": "#0c1c2e",
            "text-halo-width": 1,
          },
        });
      }
    })
    .catch(() => {});

  // Major French cities — code = INSEE commune code for CommunePanel routing
  const CITIES_GEOJSON = {
    type: "FeatureCollection" as const,
    features: [
      { type: "Feature" as const, properties: { name: "Paris",          code: "75056", pop: 2161000 }, geometry: { type: "Point" as const, coordinates: [2.3522,   48.8566] } },
      { type: "Feature" as const, properties: { name: "Marseille",      code: "13055", pop: 861635  }, geometry: { type: "Point" as const, coordinates: [5.3698,   43.2965] } },
      { type: "Feature" as const, properties: { name: "Lyon",           code: "69123", pop: 522250  }, geometry: { type: "Point" as const, coordinates: [4.8357,   45.7640] } },
      { type: "Feature" as const, properties: { name: "Toulouse",       code: "31555", pop: 479553  }, geometry: { type: "Point" as const, coordinates: [1.4442,   43.6047] } },
      { type: "Feature" as const, properties: { name: "Nice",           code: "06088", pop: 342669  }, geometry: { type: "Point" as const, coordinates: [7.2620,   43.7102] } },
      { type: "Feature" as const, properties: { name: "Nantes",         code: "44109", pop: 314138  }, geometry: { type: "Point" as const, coordinates: [-1.5534,  47.2184] } },
      { type: "Feature" as const, properties: { name: "Montpellier",    code: "34172", pop: 295542  }, geometry: { type: "Point" as const, coordinates: [3.8767,   43.6108] } },
      { type: "Feature" as const, properties: { name: "Strasbourg",     code: "67482", pop: 284677  }, geometry: { type: "Point" as const, coordinates: [7.7521,   48.5734] } },
      { type: "Feature" as const, properties: { name: "Bordeaux",       code: "33063", pop: 257804  }, geometry: { type: "Point" as const, coordinates: [-0.5792,  44.8378] } },
      { type: "Feature" as const, properties: { name: "Lille",          code: "59350", pop: 232741  }, geometry: { type: "Point" as const, coordinates: [3.0573,   50.6292] } },
      { type: "Feature" as const, properties: { name: "Rennes",         code: "35238", pop: 216268  }, geometry: { type: "Point" as const, coordinates: [-1.6778,  48.1173] } },
      { type: "Feature" as const, properties: { name: "Reims",          code: "51454", pop: 183522  }, geometry: { type: "Point" as const, coordinates: [4.0317,   49.2583] } },
      { type: "Feature" as const, properties: { name: "Le Havre",       code: "76351", pop: 172074  }, geometry: { type: "Point" as const, coordinates: [0.1079,   49.4944] } },
      { type: "Feature" as const, properties: { name: "Toulon",         code: "83137", pop: 176198  }, geometry: { type: "Point" as const, coordinates: [5.9281,   43.1258] } },
      { type: "Feature" as const, properties: { name: "Saint-Étienne",  code: "42218", pop: 171961  }, geometry: { type: "Point" as const, coordinates: [4.3872,   45.4397] } },
      { type: "Feature" as const, properties: { name: "Grenoble",       code: "38185", pop: 158198  }, geometry: { type: "Point" as const, coordinates: [5.7245,   45.1885] } },
      { type: "Feature" as const, properties: { name: "Dijon",          code: "21231", pop: 157431  }, geometry: { type: "Point" as const, coordinates: [5.0415,   47.3220] } },
      { type: "Feature" as const, properties: { name: "Angers",         code: "49007", pop: 155840  }, geometry: { type: "Point" as const, coordinates: [-0.5518,  47.4784] } },
      { type: "Feature" as const, properties: { name: "Nîmes",          code: "30189", pop: 148889  }, geometry: { type: "Point" as const, coordinates: [4.3601,   43.8367] } },
      { type: "Feature" as const, properties: { name: "Aix-en-Provence",code: "13001", pop: 143097  }, geometry: { type: "Point" as const, coordinates: [5.4474,   43.5297] } },
      { type: "Feature" as const, properties: { name: "Le Mans",        code: "72181", pop: 143599  }, geometry: { type: "Point" as const, coordinates: [0.1966,   48.0061] } },
      { type: "Feature" as const, properties: { name: "Clermont-Fd",    code: "63113", pop: 143886  }, geometry: { type: "Point" as const, coordinates: [3.0863,   45.7772] } },
      { type: "Feature" as const, properties: { name: "Brest",          code: "29019", pop: 140064  }, geometry: { type: "Point" as const, coordinates: [-4.4860,  48.3904] } },
    ],
  };

  // Data centers
  fetch("/data/data-centers.geojson")
    .then((r) => r.json())
    .then((data) => {
      if (!map.getSource("data-centers")) {
        map.addSource("data-centers", { type: "geojson", data });
        map.addLayer({
          id: "data-centers-circle",
          type: "circle",
          source: "data-centers",
          paint: {
            "circle-radius": 7,
            "circle-color": "#C9A227",
            "circle-stroke-color": "#F5F5F5",
            "circle-stroke-width": 1,
            "circle-opacity": 0.9,
          },
        });
        map.addLayer({
          id: "data-centers-label",
          type: "symbol",
          source: "data-centers",
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
            "text-size": 9,
            "text-offset": [0, 1.4],
            "text-anchor": "top",
          },
          paint: {
            "text-color": "#C9A227",
            "text-halo-color": "#0c1c2e",
            "text-halo-width": 1,
          },
        });
      }
    })
    .catch(() => {});

  // Telco hubs / internet exchanges
  fetch("/data/telco-hubs.geojson")
    .then((r) => r.json())
    .then((data) => {
      if (!map.getSource("telco-hubs")) {
        map.addSource("telco-hubs", { type: "geojson", data });
        map.addLayer({
          id: "telco-hubs-circle",
          type: "circle",
          source: "telco-hubs",
          paint: {
            "circle-radius": 6,
            "circle-color": "#00aaff",
            "circle-stroke-color": "#F5F5F5",
            "circle-stroke-width": 1,
            "circle-opacity": 0.85,
          },
        });
        map.addLayer({
          id: "telco-hubs-label",
          type: "symbol",
          source: "telco-hubs",
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
            "text-size": 9,
            "text-offset": [0, 1.4],
            "text-anchor": "top",
          },
          paint: {
            "text-color": "#00aaff",
            "text-halo-color": "#0c1c2e",
            "text-halo-width": 1,
          },
        });
      }
    })
    .catch(() => {});

  if (!map.getSource("cities")) {
    map.addSource("cities", { type: "geojson", data: CITIES_GEOJSON });

    map.addLayer({
      id: "cities-dot",
      type: "circle",
      source: "cities",
      paint: {
        "circle-radius": [
          "interpolate", ["linear"], ["get", "pop"],
          100000, 3,
          500000, 5,
          2000000, 8,
        ],
        "circle-color": "#EF4135",
        "circle-opacity": 0.85,
        "circle-stroke-color": "#F5F5F5",
        "circle-stroke-width": 1,
      },
    });

    map.addLayer({
      id: "cities-label",
      type: "symbol",
      source: "cities",
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
        "text-size": 10,
        "text-offset": [0, 1.2],
        "text-anchor": "top",
      },
      paint: {
        "text-color": "#F5F5F5",
        "text-halo-color": "#0c1c2e",
        "text-halo-width": 1,
      },
    });
  }
}
