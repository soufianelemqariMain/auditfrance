"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";

interface MapProps {
  onDeptClick?: (code: string, nom: string) => void;
  onCommuneClick?: (code: string, nom: string) => void;
}

// Centroids [lon, lat] for major countries — for global shooting star events
const WORLD_CENTROIDS: Record<string, [number, number]> = {
  US:  [-98.58, 39.83],  GB:  [-3.44,  55.38],  FR:  [2.21,  46.23],
  DE:  [10.45,  51.17],  ES:  [-3.75,  40.46],  IT:  [12.57,  41.87],
  BR:  [-51.93, -14.24], IN:  [78.96,  20.59],  CN:  [104.19, 35.86],
  RU:  [105.32, 61.52],  JP:  [138.25, 36.20],  AU:  [133.78, -25.27],
  CA:  [-96.80, 60.00],  MX:  [-102.55, 23.63], ZA:  [25.08, -29.00],
  NG:  [8.68,   9.08],   EG:  [30.80,  26.82],  SA:  [45.08,  23.89],
  TR:  [35.24,  38.96],  UA:  [31.17,  48.38],  PL:  [19.15,  51.92],
  NL:  [5.29,   52.13],  SE:  [18.64,  60.13],  IL:  [34.85,  31.05],
  KR:  [127.77, 35.91],  AR:  [-63.62, -38.42], ID:  [117.72, -0.79],
};

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

      // Start at world view; France drill-down kicks in when user zooms to > 4
      const initialCenter: [number, number] = mapState.zoom > 3 ? [mapState.lon, mapState.lat] : [10, 20];
      const initialZoom = mapState.zoom > 3 ? mapState.zoom : 2;

      map = new maplibregl.Map({
        container: mapContainer.current!,
        style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        center: initialCenter,
        zoom: initialZoom,
        pitch: is3D ? 45 : 0,
        bearing: 0,
      }) as typeof map;

      mapRef.current = map;

      map!.on("load", () => {
        map!.getStyle().layers.forEach((layer: { id: string; type: string; layout?: Record<string, unknown> }) => {
          if (layer.type === "symbol" && layer.layout?.["text-field"] !== undefined) {
            map!.setLayoutProperty(layer.id, "text-field", [
              "coalesce", ["get", "name:fr"], ["get", "name"],
            ]);
          }
        });

        injectOverlayCSS();

        // Add SVG shooting-star overlay + toast container
        const wrapper = mapContainer.current!.parentElement!;
        addOverlays(wrapper);

        // Load world choropleth (primary view)
        loadWorldLayer(map!);
        // Load France dept + city layers (shown when zoom > 4)
        loadLayers(map!, maplibregl);

        setTimeout(() => {
          radarInterval = startNewsRadar(map!, maplibregl, wrapper, (code, nom) => {
            if (onDeptClickRef.current) onDeptClickRef.current(code, nom);
          });
        }, 3000);
      });

      map!.on("mouseenter", "departments-fill", () => { map!.getCanvas().style.cursor = "pointer"; });
      map!.on("mouseleave", "departments-fill", () => { map!.getCanvas().style.cursor = ""; });
      map!.on("mouseenter", "cities-dot", () => { map!.getCanvas().style.cursor = "pointer"; });
      map!.on("mouseleave", "cities-dot", () => { map!.getCanvas().style.cursor = ""; });

      map!.on("click", "cities-dot", (e: { features?: Array<{properties: {code: string, name: string}}>, point: {x: number, y: number} }) => {
        if (!e.features?.length) return;
        const { code, name } = e.features[0].properties;
        if (onCommuneClickRef.current && code) onCommuneClickRef.current(code, name);
      });

      map!.on("click", (e: { point: {x: number, y: number} }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cityFeatures = map!.queryRenderedFeatures(e.point, { layers: ["cities-dot"] });
        if (cityFeatures?.length) return;
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

function addOverlays(wrapper: HTMLElement) {
  if (wrapper.querySelector(".star-svg")) return;

  // SVG overlay for shooting stars (pointer-events: none so map stays clickable)
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "star-svg");
  svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5;";
  wrapper.appendChild(svg);

  // Toast container — bottom left
  const toastWrap = document.createElement("div");
  toastWrap.className = "news-toast-wrap";
  toastWrap.style.cssText =
    "position:absolute;bottom:20px;left:14px;display:flex;flex-direction:column;gap:5px;z-index:20;pointer-events:none;max-width:260px;";
  wrapper.appendChild(toastWrap);
}

function injectOverlayCSS() {
  if (document.getElementById("map-overlay-style")) return;
  const style = document.createElement("style");
  style.id = "map-overlay-style";
  style.textContent = `
    @keyframes pulse-ring {
      0%   { transform: scale(1);   opacity: 0.9; }
      70%  { transform: scale(3.5); opacity: 0.3; }
      100% { transform: scale(5);   opacity: 0;   }
    }
    @keyframes pulse-dot-fade {
      0%   { opacity: 1; }
      80%  { opacity: 1; }
      100% { opacity: 0; }
    }
    @keyframes toast-in {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0);   }
    }
    @keyframes toast-out {
      from { opacity: 1; }
      to   { opacity: 0; }
    }
    .news-pulse-wrap {
      position: relative; width: 12px; height: 12px; cursor: pointer;
    }
    .news-pulse-dot {
      position: absolute; inset: 0; border-radius: 50%;
      background: #00d4ff;
      box-shadow: 0 0 8px #00d4ff88;
      animation: pulse-dot-fade 5s ease-out forwards;
    }
    .news-pulse-ring {
      position: absolute; inset: 0; border-radius: 50%;
      border: 1.5px solid #00d4ff;
      animation: pulse-ring 1.8s ease-out infinite;
    }
    .news-pulse-ring.d {
      animation-delay: 0.9s;
    }
    .news-toast {
      background: rgba(8,12,24,0.88);
      border: 1px solid rgba(0,212,255,0.3);
      border-radius: 3px;
      padding: 5px 8px;
      animation: toast-in 0.2s ease-out forwards;
      backdrop-filter: blur(4px);
    }
    .news-toast.out {
      animation: toast-out 0.3s ease-in forwards;
    }
    .toast-src {
      font-size: 8px;
      color: #00d4ff;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      display: block;
      margin-bottom: 2px;
      font-family: var(--font-mono, monospace);
    }
    .toast-title {
      font-size: 9.5px;
      color: #e5e7eb;
      line-height: 1.4;
      display: block;
      font-family: inherit;
    }
  `;
  document.head.appendChild(style);
}

function showToast(wrapper: HTMLElement, source: string, title: string) {
  const toastWrap = wrapper.querySelector(".news-toast-wrap");
  if (!toastWrap) return;

  // Limit to 3 visible toasts — remove oldest
  const existing = toastWrap.querySelectorAll(".news-toast");
  if (existing.length >= 3) existing[0].remove();

  const toast = document.createElement("div");
  toast.className = "news-toast";
  toast.innerHTML = `<span class="toast-src">${source}</span><span class="toast-title">${title.slice(0, 90)}${title.length > 90 ? "…" : ""}</span>`;
  toastWrap.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("out");
    setTimeout(() => toast.remove(), 350);
  }, 6000);
}

function fireShootingStar(wrapper: HTMLElement, targetPx: { x: number; y: number }) {
  const svg = wrapper.querySelector(".star-svg") as SVGSVGElement | null;
  if (!svg) return;

  const w = wrapper.clientWidth;
  const h = wrapper.clientHeight;

  // Random start point on a map edge
  const side = Math.floor(Math.random() * 4);
  let x0: number, y0: number;
  if (side === 0) { x0 = Math.random() * w; y0 = -10; }
  else if (side === 1) { x0 = w + 10; y0 = Math.random() * h; }
  else if (side === 2) { x0 = Math.random() * w; y0 = h + 10; }
  else { x0 = -10; y0 = Math.random() * h; }

  const dx = targetPx.x - x0;
  const dy = targetPx.y - y0;
  const length = Math.sqrt(dx * dx + dy * dy);

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", String(x0));
  line.setAttribute("y1", String(y0));
  line.setAttribute("x2", String(targetPx.x));
  line.setAttribute("y2", String(targetPx.y));
  line.setAttribute("stroke", "#00d4ff");
  line.setAttribute("stroke-width", "1.2");
  line.setAttribute("stroke-linecap", "round");
  line.setAttribute("stroke-dasharray", String(length));
  line.setAttribute("stroke-dashoffset", String(length));
  line.style.opacity = "0.85";
  svg.appendChild(line);

  const DRAW = 500;   // ms to draw the line
  const HOLD = 150;   // ms to hold
  const FADE = 350;   // ms to fade out

  let t0: number | null = null;
  function tick(ts: number) {
    if (!t0) t0 = ts;
    const el = ts - t0;
    if (el < DRAW) {
      const p = 1 - Math.pow(1 - el / DRAW, 3);
      line.setAttribute("stroke-dashoffset", String(length * (1 - p)));
      requestAnimationFrame(tick);
    } else if (el < DRAW + HOLD) {
      line.setAttribute("stroke-dashoffset", "0");
      requestAnimationFrame(tick);
    } else if (el < DRAW + HOLD + FADE) {
      const fp = (el - DRAW - HOLD) / FADE;
      line.style.opacity = String(0.85 * (1 - fp));
      requestAnimationFrame(tick);
    } else {
      svg?.removeChild(line);
    }
  }
  requestAnimationFrame(tick);
}

function startNewsRadar(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  maplibregl: any,
  wrapper: HTMLElement,
  onDeptClick: (code: string, nom: string) => void,
): ReturnType<typeof setInterval> {
  const seenTitles = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeMarkers: any[] = [];

  // Determine current view: world (zoom < 4) or France drill-down
  function isWorldView(): boolean {
    return map.getZoom() < 4;
  }

  async function poll() {
    if (isWorldView()) {
      // World mode: fire shooting stars at random country centroids
      const worldCodes = Object.keys(WORLD_CENTROIDS);
      const shuffled = [...worldCodes].sort(() => Math.random() - 0.5).slice(0, 5);
      for (const iso of shuffled) {
        const centroid = WORLD_CENTROIDS[iso];
        if (!centroid) continue;
        const px: { x: number; y: number } = map.project(centroid);
        fireShootingStar(wrapper, px);
        setTimeout(() => {
          firePulse(map, maplibregl, centroid, iso, onDeptClick, activeMarkers);
        }, 550);
      }
      return;
    }

    // France mode: existing dept-news radar
    const shuffled = [...ALL_DEPT_CODES].sort(() => Math.random() - 0.5).slice(0, 8);
    for (const code of shuffled) {
      const centroid = DEPT_CENTROIDS[code];
      if (!centroid) continue;
      try {
        const res = await fetch(`/api/dept-news/${code}?bust=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) continue;
        const data = await res.json();
        const articles: Array<{ title: string; source: string; url: string; description?: string }> = data.articles ?? [];
        const fresh = articles.filter((a) => a.title && !seenTitles.has(a.title));
        if (!fresh.length) continue;
        fresh.forEach((a) => seenTitles.add(a.title));

        const first = fresh[0];
        const source = first.source && first.source !== "Google Actualités" ? first.source : (data.source ?? "Presse locale");

        // Pixel position of centroid (for SVG overlay)
        const px: { x: number; y: number } = map.project(centroid);

        // 1) Shooting star
        fireShootingStar(wrapper, px);

        // Push to radar news store for NewsTickerPanel
        useAppStore.getState().addRadarNewsItem({
          id: `${code}-${Date.now()}`,
          source,
          title: first.title,
          url: first.url || "",
          publishedAt: new Date().toISOString(),
          description: first.description,
        });

        // 2) Pulse marker (fires after star arrives)
        setTimeout(() => {
          firePulse(map, maplibregl, centroid, code, onDeptClick, activeMarkers);
          // 3) Toast
          showToast(wrapper, source, first.title);
        }, 550);

      } catch {
        // silent
      }
    }
  }

  setTimeout(poll, 4000);
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
  onDeptClick: (code: string, nom: string) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeMarkers: any[],
) {
  const el = document.createElement("div");
  el.className = "news-pulse-wrap";

  const dot = document.createElement("div");
  dot.className = "news-pulse-dot";
  el.appendChild(dot);

  const r1 = document.createElement("div");
  r1.className = "news-pulse-ring";
  el.appendChild(r1);

  const r2 = document.createElement("div");
  r2.className = "news-pulse-ring d";
  el.appendChild(r2);

  el.addEventListener("click", () => onDeptClick(deptCode, deptCode));

  const marker = new maplibregl.Marker({ element: el, anchor: "center" })
    .setLngLat(lnglat)
    .addTo(map);

  activeMarkers.push(marker);
  setTimeout(() => {
    marker.remove();
    const i = activeMarkers.indexOf(marker);
    if (i !== -1) activeMarkers.splice(i, 1);
  }, 8000);
}

// ── World choropleth (narrative risk by country) ──────────────────────────────

// Maps topic region codes to ISO-2 country codes for coloring
const REGION_TO_ISO: Record<string, string[]> = {
  US: ["US"], GB: ["GB"], FR: ["FR"], DE: ["DE"], ES: ["ES"],
  EU: ["FR", "DE", "ES", "IT", "NL", "PL", "SE"],
  GLOBAL: Object.keys(WORLD_CENTROIDS),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadWorldLayer(map: any) {
  // Fetch narrative probabilities from InfoVerif API
  let narrativeRisk: Record<string, number> = {};
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.infoverif.org";
    const res = await fetch(`${apiBase}/api/topics`, { cache: "no-store" });
    if (res.ok) {
      const topics: Array<{ slug: string; region?: string; avg_probability: number }> = await res.json();
      // Map topics to countries; use avg_probability as risk signal
      for (const topic of topics) {
        const regions = REGION_TO_ISO[topic.region || "GLOBAL"] || REGION_TO_ISO.GLOBAL;
        for (const iso of regions) {
          narrativeRisk[iso] = Math.max(narrativeRisk[iso] || 0, topic.avg_probability || 0.5);
        }
      }
    }
  } catch {
    // Fallback to static demo values if API unreachable
    narrativeRisk = { US: 0.72, FR: 0.65, GB: 0.58, DE: 0.48, RU: 0.80, CN: 0.61 };
  }

  try {
    // Natural Earth 110m countries — lightweight public dataset via MapLibre CDN
    const geoRes = await fetch(
      "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson"
    );
    if (!geoRes.ok) return;
    const geoData = await geoRes.json();

    // Inject narrative_risk property into each feature
    geoData.features = geoData.features.map((f: { properties: Record<string, string> }) => ({
      ...f,
      properties: {
        ...f.properties,
        narrative_risk: narrativeRisk[f.properties.iso_a2] ?? 0.35,
      },
    }));

    if (!map.getSource("world-countries")) {
      map.addSource("world-countries", { type: "geojson", data: geoData });

      // Choropleth fill: color by narrative_risk (0 = dark blue, 1 = coral red)
      map.addLayer(
        {
          id: "world-fill",
          type: "fill",
          source: "world-countries",
          paint: {
            "fill-color": [
              "interpolate", ["linear"],
              ["get", "narrative_risk"],
              0.0, "#0a2d5c",   // low risk — deep navy
              0.4, "#1a5276",   // moderate — teal blue
              0.6, "#7d3c98",   // elevated — purple
              0.75, "#c0392b",  // high — coral red
              1.0, "#ff1a1a",   // critical — bright red
            ],
            "fill-opacity": 0.55,
          },
        },
        "departments-fill" // insert below France layers
      );

      // Country borders
      map.addLayer(
        {
          id: "world-line",
          type: "line",
          source: "world-countries",
          paint: {
            "line-color": "#334155",
            "line-width": 0.5,
            "line-opacity": 0.8,
          },
        },
        "departments-fill"
      );

      // Visibility toggle: show world at low zoom, hide at high zoom
      map.setLayoutProperty("world-fill", "visibility", "visible");
      map.setLayoutProperty("world-line", "visibility", "visible");
    }
  } catch {
    // World layer is optional — silently skip on error
  }
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadLayers(map: any, _maplibregl: any) {
  fetch("/data/departments.geojson")
    .then((r) => r.json())
    .then((data) => {
      if (!map.getSource("departments")) {
        map.addSource("departments", { type: "geojson", data });
        map.addLayer({ id: "departments-fill", type: "fill", source: "departments", paint: { "fill-color": "#0055A4", "fill-opacity": 0.06 } });
        map.addLayer({ id: "departments-line", type: "line", source: "departments", paint: { "line-color": "#0055A4", "line-width": 0.8, "line-opacity": 0.5 } });
      }
    }).catch(() => {});

  const CITIES: { name: string; code: string; pop: number; lon: number; lat: number }[] = [
    { name: "Paris",          code: "75056", pop: 2161000, lon: 2.3522,  lat: 48.8566 },
    { name: "Marseille",      code: "13055", pop: 861635,  lon: 5.3698,  lat: 43.2965 },
    { name: "Lyon",           code: "69123", pop: 522250,  lon: 4.8357,  lat: 45.7640 },
    { name: "Toulouse",       code: "31555", pop: 479553,  lon: 1.4442,  lat: 43.6047 },
    { name: "Nice",           code: "06088", pop: 342669,  lon: 7.2620,  lat: 43.7102 },
    { name: "Nantes",         code: "44109", pop: 314138,  lon: -1.5534, lat: 47.2184 },
    { name: "Montpellier",    code: "34172", pop: 295542,  lon: 3.8767,  lat: 43.6108 },
    { name: "Strasbourg",     code: "67482", pop: 284677,  lon: 7.7521,  lat: 48.5734 },
    { name: "Bordeaux",       code: "33063", pop: 257804,  lon: -0.5792, lat: 44.8378 },
    { name: "Lille",          code: "59350", pop: 232741,  lon: 3.0573,  lat: 50.6292 },
    { name: "Rennes",         code: "35238", pop: 216268,  lon: -1.6778, lat: 48.1173 },
    { name: "Reims",          code: "51454", pop: 183522,  lon: 4.0317,  lat: 49.2583 },
    { name: "Le Havre",       code: "76351", pop: 172074,  lon: 0.1079,  lat: 49.4944 },
    { name: "Toulon",         code: "83137", pop: 176198,  lon: 5.9281,  lat: 43.1258 },
    { name: "Saint-Étienne",  code: "42218", pop: 171961,  lon: 4.3872,  lat: 45.4397 },
    { name: "Grenoble",       code: "38185", pop: 158198,  lon: 5.7245,  lat: 45.1885 },
    { name: "Dijon",          code: "21231", pop: 157431,  lon: 5.0415,  lat: 47.3220 },
    { name: "Angers",         code: "49007", pop: 155840,  lon: -0.5518, lat: 47.4784 },
    { name: "Nîmes",          code: "30189", pop: 148889,  lon: 4.3601,  lat: 43.8367 },
    { name: "Clermont-Fd",    code: "63113", pop: 143886,  lon: 3.0863,  lat: 45.7772 },
    { name: "Brest",          code: "29019", pop: 140064,  lon: -4.4860, lat: 48.3904 },
  ];

  const geojson = {
    type: "FeatureCollection" as const,
    features: CITIES.map((c) => ({
      type: "Feature" as const,
      properties: { name: c.name, code: c.code, pop: c.pop },
      geometry: { type: "Point" as const, coordinates: [c.lon, c.lat] },
    })),
  };

  if (!map.getSource("cities")) {
    map.addSource("cities", { type: "geojson", data: geojson });
    map.addLayer({
      id: "cities-dot", type: "circle", source: "cities",
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["get", "pop"], 100000, 3, 500000, 5, 2000000, 8],
        "circle-color": "#EF4135", "circle-opacity": 0.85,
        "circle-stroke-color": "#F5F5F5", "circle-stroke-width": 1,
      },
    });
    map.addLayer({
      id: "cities-label", type: "symbol", source: "cities",
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
        "text-size": 10, "text-offset": [0, 1.2], "text-anchor": "top",
      },
      paint: { "text-color": "#F5F5F5", "text-halo-color": "#0c1c2e", "text-halo-width": 1 },
    });
  }
}
