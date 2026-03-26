"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";

interface MapProps {
  onDeptClick?: (code: string, nom: string) => void;
  onCommuneClick?: (code: string, nom: string) => void;
}

// Approximate centroid [lon, lat] for each metropolitan department
const DEPT_CENTROIDS: Record<string, [number, number]> = {
  "01": [5.35, 46.0],   "02": [3.62, 49.57],  "03": [3.39, 46.35],
  "04": [6.23, 44.09],  "05": [6.26, 44.56],  "06": [7.18, 43.93],
  "07": [4.54, 44.75],  "08": [4.72, 49.70],  "09": [1.56, 42.90],
  "10": [4.18, 48.30],  "11": [2.45, 43.07],  "12": [2.74, 44.27],
  "13": [5.38, 43.53],  "14": [-0.36, 49.09], "15": [2.73, 45.07],
  "16": [0.16, 45.70],  "17": [-0.73, 45.75], "18": [2.49, 47.07],
  "19": [1.88, 45.32],  "2A": [9.00, 41.86],  "2B": [9.22, 42.40],
  "21": [4.83, 47.42],  "22": [-2.98, 48.45], "23": [2.02, 46.05],
  "24": [0.75, 45.14],  "25": [6.39, 47.23],  "26": [5.22, 44.73],
  "27": [1.17, 49.10],  "28": [1.37, 48.44],  "29": [-4.07, 48.23],
  "30": [4.16, 44.06],  "31": [1.44, 43.61],  "32": [0.59, 43.70],
  "33": [-0.58, 44.83], "34": [3.42, 43.61],  "35": [-1.68, 48.15],
  "36": [1.56, 46.68],  "37": [0.69, 47.24],  "38": [5.60, 45.26],
  "39": [5.77, 46.69],  "40": [-0.69, 43.97], "41": [1.34, 47.59],
  "42": [4.20, 45.73],  "43": [3.79, 45.07],  "44": [-1.67, 47.36],
  "45": [2.32, 47.91],  "46": [1.67, 44.62],  "47": [0.46, 44.37],
  "48": [3.50, 44.52],  "49": [-0.56, 47.39], "50": [-1.28, 49.06],
  "51": [4.36, 49.05],  "52": [5.32, 48.07],  "53": [-0.62, 48.12],
  "54": [6.18, 48.69],  "55": [5.39, 49.01],  "56": [-2.83, 47.82],
  "57": [6.54, 49.02],  "58": [3.50, 47.07],  "59": [3.27, 50.52],
  "60": [2.43, 49.41],  "61": [0.12, 48.61],  "62": [2.44, 50.52],
  "63": [3.08, 45.77],  "64": [-0.76, 43.28], "65": [0.17, 43.12],
  "66": [2.53, 42.66],  "67": [7.55, 48.59],  "68": [7.36, 47.77],
  "69": [4.73, 45.74],  "70": [6.09, 47.71],  "71": [4.64, 46.66],
  "72": [0.19, 48.02],  "73": [6.43, 45.49],  "74": [6.43, 45.90],
  "75": [2.35, 48.86],  "76": [0.97, 49.65],  "77": [2.89, 48.62],
  "78": [1.85, 48.78],  "79": [-0.31, 46.58], "80": [2.30, 49.97],
  "81": [2.17, 43.79],  "82": [1.22, 44.08],  "83": [6.24, 43.46],
  "84": [5.16, 43.99],  "85": [-1.35, 46.67], "86": [0.34, 46.59],
  "87": [1.26, 45.83],  "88": [6.43, 48.17],  "89": [3.57, 47.80],
  "90": [6.87, 47.64],  "91": [2.36, 48.54],  "92": [2.23, 48.83],
  "93": [2.48, 48.91],  "94": [2.47, 48.79],  "95": [2.19, 49.08],
};

const ALL_DEPT_CODES = Object.keys(DEPT_CENTROIDS);

export default function Map({ onDeptClick, onCommuneClick }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const onDeptClickRef = useRef(onDeptClick);
  onDeptClickRef.current = onDeptClick;
  const onCommuneClickRef = useRef(onCommuneClick);
  onCommuneClickRef.current = onCommuneClick;
  const { mapState, is3D } = useAppStore();

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any = null;
    let radarInterval: ReturnType<typeof setInterval> | null = null;

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
        map!.getStyle().layers.forEach((layer: { id: string; type: string; layout?: Record<string, unknown> }) => {
          if (layer.type === "symbol" && layer.layout?.["text-field"] !== undefined) {
            map!.setLayoutProperty(layer.id, "text-field", [
              "coalesce",
              ["get", "name:fr"],
              ["get", "name"],
            ]);
          }
        });

        // Inject pulse keyframe CSS once
        injectPulseCSS();

        loadLayers(map!, maplibregl);

        // Start news radar after a short delay (let map settle)
        setTimeout(() => {
          radarInterval = startNewsRadar(map!, maplibregl, (code, nom) => {
            if (onDeptClickRef.current) onDeptClickRef.current(code, nom);
          });
        }, 3000);
      });

      // Cursor on department hover
      map!.on("mouseenter", "departments-fill", () => {
        map!.getCanvas().style.cursor = "pointer";
      });
      map!.on("mouseleave", "departments-fill", () => {
        map!.getCanvas().style.cursor = "";
      });

      // Cursor on city hover
      map!.on("mouseenter", "cities-dot", () => {
        map!.getCanvas().style.cursor = "pointer";
      });
      map!.on("mouseleave", "cities-dot", () => {
        map!.getCanvas().style.cursor = "";
      });

      // City click → commune panel
      map!.on("click", "cities-dot", (e: { features?: Array<{properties: {code: string, name: string}}>, point: {x: number, y: number} }) => {
        if (!e.features?.length) return;
        const { code, name } = e.features[0].properties;
        if (onCommuneClickRef.current && code) {
          onCommuneClickRef.current(code, name);
        }
      });

      // Department click (fires after city handler)
      map!.on("click", (e: { point: {x: number, y: number} }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cityFeatures = map!.queryRenderedFeatures(e.point, { layers: ["cities-dot"] });
        if (cityFeatures?.length) return; // handled by city click
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const deptFeatures = map!.queryRenderedFeatures(e.point, { layers: ["departments-fill"] });
        if (deptFeatures?.length) {
          const props = deptFeatures[0].properties as { code?: string; nom?: string; nom_dept?: string };
          const code = props.code ?? "";
          const nom = props.nom ?? props.nom_dept ?? code;
          if (code && onDeptClickRef.current) onDeptClickRef.current(code, nom);
        }
      });
    };

    initMap();

    return () => {
      if (radarInterval) clearInterval(radarInterval);
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update 3D pitch
  useEffect(() => {
    if (!mapRef.current) return;
    (mapRef.current as { setPitch: (v: number) => void }).setPitch(is3D ? 45 : 0);
  }, [is3D]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}

/** Inject pulse keyframe CSS once into document head */
function injectPulseCSS() {
  if (document.getElementById("news-pulse-style")) return;
  const style = document.createElement("style");
  style.id = "news-pulse-style";
  style.textContent = `
    @keyframes news-pulse-ring {
      0%   { transform: scale(1);   opacity: 0.9; }
      70%  { transform: scale(3.5); opacity: 0.3; }
      100% { transform: scale(5);   opacity: 0;   }
    }
    @keyframes news-pulse-dot {
      0%   { opacity: 1; }
      80%  { opacity: 1; }
      100% { opacity: 0; }
    }
    .news-pulse-container {
      position: relative;
      width: 12px;
      height: 12px;
      cursor: pointer;
    }
    .news-pulse-dot {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: #ef4444;
      animation: news-pulse-dot 4s ease-out forwards;
      box-shadow: 0 0 6px #ef4444;
    }
    .news-pulse-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 2px solid #ef4444;
      animation: news-pulse-ring 1.8s ease-out infinite;
    }
    .news-pulse-ring.delay {
      animation-delay: 0.9s;
    }
  `;
  document.head.appendChild(style);
}

/** Poll news for random departments every 60s, show pulse markers for fresh articles */
function startNewsRadar(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  maplibregl: any,
  onDeptClick: (code: string, nom: string) => void,
): ReturnType<typeof setInterval> {
  const seenTitles = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeMarkers: any[] = [];

  async function poll() {
    // Pick 8 random departments each cycle
    const shuffled = [...ALL_DEPT_CODES].sort(() => Math.random() - 0.5).slice(0, 8);

    for (const code of shuffled) {
      const centroid = DEPT_CENTROIDS[code];
      if (!centroid) continue;

      try {
        const res = await fetch(`/api/dept-news/${code}?bust=${Date.now()}`, {
          cache: "no-store",
        });
        if (!res.ok) continue;
        const data = await res.json();
        const articles: Array<{ title: string; url: string; source: string }> = data.articles ?? [];

        const newArticles = articles.filter((a) => a.title && !seenTitles.has(a.title));
        if (newArticles.length === 0) continue;

        // Mark as seen
        newArticles.forEach((a) => seenTitles.add(a.title));

        // Fire a pulse marker at centroid
        firePulse(map, maplibregl, centroid, code, data.source ?? "Presse locale", onDeptClick, activeMarkers);
      } catch {
        // silent — radar continues
      }
    }
  }

  // First poll after 5s
  setTimeout(poll, 5000);

  // Then every 90s
  const interval = setInterval(poll, 90_000);
  return interval;
}

function firePulse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  maplibregl: any,
  lnglat: [number, number],
  deptCode: string,
  sourceName: string,
  onDeptClick: (code: string, nom: string) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeMarkers: any[],
) {
  const el = document.createElement("div");
  el.className = "news-pulse-container";
  el.title = `${sourceName} · ${deptCode}`;

  const dot = document.createElement("div");
  dot.className = "news-pulse-dot";
  el.appendChild(dot);

  const ring1 = document.createElement("div");
  ring1.className = "news-pulse-ring";
  el.appendChild(ring1);

  const ring2 = document.createElement("div");
  ring2.className = "news-pulse-ring delay";
  el.appendChild(ring2);

  el.addEventListener("click", () => {
    onDeptClick(deptCode, deptCode);
  });

  const marker = new maplibregl.Marker({ element: el, anchor: "center" })
    .setLngLat(lnglat)
    .addTo(map);

  activeMarkers.push(marker);

  // Auto-remove after animation completes (8s)
  setTimeout(() => {
    marker.remove();
    const idx = activeMarkers.indexOf(marker);
    if (idx !== -1) activeMarkers.splice(idx, 1);
  }, 8000);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadLayers(map: any, _maplibregl: any) {
  // French departments — clickable fill + border
  fetch("/data/departments.geojson")
    .then((r) => r.json())
    .then((data) => {
      if (!map.getSource("departments")) {
        map.addSource("departments", { type: "geojson", data });

        map.addLayer({
          id: "departments-fill",
          type: "fill",
          source: "departments",
          paint: {
            "fill-color": "#0055A4",
            "fill-opacity": 0.06,
          },
        });

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

  // Major French cities
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applyHeatmap(map: any) {
  try {
    const res = await fetch("/api/dept-stats");
    if (!res.ok) return;
    const json = await res.json();
    const depts: Array<{ code: string; norm: number }> = json.depts ?? [];
    if (!depts.length || !map.getLayer("departments-fill")) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matchExpr: any[] = ["match", ["get", "code"]];
    for (const dept of depts) {
      const t = dept.norm;
      const r = Math.round(12 + t * (239 - 12));
      const g = Math.round(28 + t * (65 - 28));
      const b = Math.round(46 + t * (53 - 46));
      matchExpr.push(dept.code, `rgb(${r},${g},${b})`);
    }
    matchExpr.push("#0c1c2e");

    map.setPaintProperty("departments-fill", "fill-color", matchExpr);
    map.setPaintProperty("departments-fill", "fill-opacity", 0.65);
  } catch {
    // silently ignore
  }
}

// Export for potential future use from Navbar
export { applyHeatmap };
