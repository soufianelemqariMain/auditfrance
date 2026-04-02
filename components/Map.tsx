"use client";

import { useEffect, useRef } from "react";

// Centroids [lon, lat] for major countries — for vote shooting star events
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

// Minimal inline style — no external tile server to conflict with globe projection.
// All geography comes from the GeoJSON choropleth in loadWorldLayer.
const GLOBE_STYLE = {
  version: 8 as const,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background" as const,
      paint: { "background-color": "#060d1f" },
    },
  ],
};

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const voteRadarRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rotAnimRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any = null;

    const initMap = async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      await import("maplibre-gl/dist/maplibre-gl.css");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapOptions: any = {
        container: mapContainer.current!,
        style: GLOBE_STYLE,
        center: [15, 20] as [number, number],
        zoom: 1.2,
        bearing: 0,
        pitch: 0,
        projection: "globe",
        renderWorldCopies: false,
      };

      map = new maplibregl.Map(mapOptions);
      mapRef.current = map;

      map.on("load", () => {
        // Belt-and-suspenders: set projection after load too
        map.setProjection("globe");

        // Fog creates the sphere-in-space appearance.
        // space-color must be near-black to contrast against the dark map background.
        map.setFog({
          range: [0.5, 10],
          color: "rgba(100,150,230,0.5)",
          "horizon-blend": 0.05,
          "high-color": "#1a4fad",
          "space-color": "#000005",
          "star-intensity": 0.3,
        });

        injectOverlayCSS();
        const wrapper = mapContainer.current!.parentElement!;
        addOverlays(wrapper);

        loadWorldLayer(map);

        // Gentle auto-rotation — stops on first user interaction
        let isRotating = true;
        function spinGlobe() {
          if (!map || !isRotating) return;
          const center = map.getCenter();
          center.lng -= 0.06;
          map.setCenter(center);
          rotAnimRef.current = requestAnimationFrame(spinGlobe);
        }
        rotAnimRef.current = requestAnimationFrame(spinGlobe);

        const stopRotation = () => {
          isRotating = false;
          if (rotAnimRef.current) cancelAnimationFrame(rotAnimRef.current);
        };
        map.once("mousedown", stopRotation);
        map.once("touchstart", stopRotation);
        map.once("wheel", stopRotation);

        voteRadarRef.current = startVoteRadar(map, maplibregl, wrapper);
      });
    };

    initMap();

    return () => {
      if (rotAnimRef.current) cancelAnimationFrame(rotAnimRef.current);
      if (voteRadarRef.current) clearInterval(voteRadarRef.current);
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}

function addOverlays(wrapper: HTMLElement) {
  if (wrapper.querySelector(".star-svg")) return;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "star-svg");
  svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5;";
  wrapper.appendChild(svg);

  const toastWrap = document.createElement("div");
  toastWrap.className = "news-toast-wrap";
  toastWrap.style.cssText =
    "position:absolute;bottom:80px;left:14px;display:flex;flex-direction:column;gap:5px;z-index:20;pointer-events:none;max-width:260px;";
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

function fireShootingStar(wrapper: HTMLElement, targetPx: { x: number; y: number }) {
  const svg = wrapper.querySelector(".star-svg") as SVGSVGElement | null;
  if (!svg) return;

  const w = wrapper.clientWidth;
  const h = wrapper.clientHeight;

  const side = Math.floor(Math.random() * 4);
  let x0: number, y0: number;
  if (side === 0)      { x0 = Math.random() * w; y0 = -10; }
  else if (side === 1) { x0 = w + 10; y0 = Math.random() * h; }
  else if (side === 2) { x0 = Math.random() * w; y0 = h + 10; }
  else                 { x0 = -10; y0 = Math.random() * h; }

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

  const DRAW = 500, HOLD = 150, FADE = 350;
  let t0: number | null = null;

  function tick(ts: number) {
    if (!t0) t0 = ts;
    const el = ts - t0;
    if (el < DRAW) {
      line.setAttribute("stroke-dashoffset", String(length * (1 - Math.pow(1 - el / DRAW, 3))));
      requestAnimationFrame(tick);
    } else if (el < DRAW + HOLD) {
      line.setAttribute("stroke-dashoffset", "0");
      requestAnimationFrame(tick);
    } else if (el < DRAW + HOLD + FADE) {
      line.style.opacity = String(0.85 * (1 - (el - DRAW - HOLD) / FADE));
      requestAnimationFrame(tick);
    } else {
      svg?.removeChild(line);
    }
  }
  requestAnimationFrame(tick);
}

function showVoteToast(wrapper: HTMLElement, topic: string, claimText: string, vote: string) {
  const toastWrap = wrapper.querySelector(".news-toast-wrap");
  if (!toastWrap) return;

  const existing = toastWrap.querySelectorAll(".news-toast");
  if (existing.length >= 3) existing[0].remove();

  const voteColor = vote === "yes" ? "#ef4444" : "#3b82f6";
  const voteLabel = vote === "yes" ? "TRUE" : "FALSE";

  const toast = document.createElement("div");
  toast.className = "news-toast";
  toast.innerHTML = `
    <span class="toast-src" style="color:${voteColor}">${topic} · ${voteLabel}</span>
    <span class="toast-title">${claimText.slice(0, 80)}${claimText.length > 80 ? "…" : ""}</span>
  `;
  toastWrap.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("out");
    setTimeout(() => toast.remove(), 350);
  }, 5000);
}

function firePulse(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  maplibregl: any,
  lnglat: [number, number],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeMarkers: any[],
) {
  const el = document.createElement("div");
  el.className = "news-pulse-wrap";
  el.appendChild(Object.assign(document.createElement("div"), { className: "news-pulse-dot" }));
  el.appendChild(Object.assign(document.createElement("div"), { className: "news-pulse-ring" }));
  el.appendChild(Object.assign(document.createElement("div"), { className: "news-pulse-ring d" }));

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

function startVoteRadar(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  maplibregl: any,
  wrapper: HTMLElement,
): ReturnType<typeof setInterval> {
  let lastSeenVoteId: number | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeMarkers: any[] = [];

  async function poll() {
    try {
      const res = await fetch("/api/votes/recent?limit=10", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const events: Array<{
        vote_id: number; claim_text: string; topic_display: string;
        topic_slug: string; vote: string; countries: string[];
      }> = data.events ?? [];

      if (!events.length) return;

      const newEvents = lastSeenVoteId
        ? events.filter((e) => e.vote_id > lastSeenVoteId!)
        : events.slice(0, 3);

      if (newEvents.length) lastSeenVoteId = newEvents[0].vote_id;

      for (const event of newEvents.slice(0, 4)) {
        for (const iso of event.countries) {
          const centroid = WORLD_CENTROIDS[iso];
          if (!centroid) continue;
          const px: { x: number; y: number } = map.project(centroid);
          fireShootingStar(wrapper, px);
          setTimeout(() => {
            firePulse(map, maplibregl, centroid, activeMarkers);
            showVoteToast(wrapper, event.topic_display, event.claim_text, event.vote);
          }, 550);
        }
      }
    } catch {/* silent */}
  }

  setTimeout(poll, 2000);
  return setInterval(poll, 8000);
}

// ── World choropleth (narrative risk by country) ──────────────────────────────

const REGION_TO_ISO: Record<string, string[]> = {
  US: ["US"], GB: ["GB"], FR: ["FR"], DE: ["DE"], ES: ["ES"],
  EU: ["FR", "DE", "ES", "IT", "NL", "PL", "SE"],
  GLOBAL: Object.keys(WORLD_CENTROIDS),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadWorldLayer(map: any) {
  let narrativeRisk: Record<string, number> = {};
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.infoverif.org";
    const res = await fetch(`${apiBase}/api/topics`, { cache: "no-store" });
    if (res.ok) {
      const topics: Array<{ slug: string; region?: string; avg_probability: number }> = await res.json();
      for (const topic of topics) {
        const regions = REGION_TO_ISO[topic.region || "GLOBAL"] || REGION_TO_ISO.GLOBAL;
        for (const iso of regions) {
          narrativeRisk[iso] = Math.max(narrativeRisk[iso] || 0, topic.avg_probability || 0.5);
        }
      }
    }
  } catch {
    narrativeRisk = { US: 0.72, FR: 0.65, GB: 0.58, DE: 0.48, RU: 0.80, CN: 0.61 };
  }

  try {
    const geoRes = await fetch(
      "https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson"
    );
    if (!geoRes.ok) return;
    const geoData = await geoRes.json();

    geoData.features = geoData.features.map((f: { properties: Record<string, string> }) => ({
      ...f,
      properties: {
        ...f.properties,
        narrative_risk: narrativeRisk[f.properties.iso_a2] ?? 0.35,
      },
    }));

    if (!map.getSource("world-countries")) {
      map.addSource("world-countries", { type: "geojson", data: geoData });

      map.addLayer({
        id: "world-fill",
        type: "fill",
        source: "world-countries",
        paint: {
          "fill-color": [
            "interpolate", ["linear"], ["get", "narrative_risk"],
            0.0, "#0a2d5c",
            0.4, "#1a5276",
            0.6, "#7d3c98",
            0.75, "#c0392b",
            1.0, "#ff1a1a",
          ],
          "fill-opacity": 0.75,
        },
      });

      map.addLayer({
        id: "world-line",
        type: "line",
        source: "world-countries",
        paint: {
          "line-color": "rgba(148,163,184,0.4)",
          "line-width": 0.6,
          "line-opacity": 1,
        },
      });
    }
  } catch {/* silently skip */}
}
