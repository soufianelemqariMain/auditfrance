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

export default function Map() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const voteRadarRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    let destroyed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let timerHandle: any = null;
    let canvasMouseDown: ((e: MouseEvent) => void) | null = null;
    let canvasWheel: ((e: WheelEvent) => void) | null = null;

    const init = async () => {
      const d3 = await import("d3");

      const w = wrapper.clientWidth;
      const h = wrapper.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);

      // Radius: fill most of the screen, leave small margin so circle edge is visible
      const R = Math.min(w, h) * 0.46;

      const projection = d3
        .geoOrthographic()
        .scale(R)
        .translate([w / 2, h / 2])
        .clipAngle(90);

      const path = d3.geoPath().projection(projection).context(ctx);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let landFeatures: any = null;
      const allDots: [number, number][] = [];

      // ── Render ───────────────────────────────────────────────────────────────
      const render = () => {
        ctx.clearRect(0, 0, w, h);
        const scale = projection.scale();

        // Globe circle (ocean)
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, scale, 0, 2 * Math.PI);
        ctx.fillStyle = "#000814";
        ctx.fill();
        ctx.strokeStyle = "rgba(60,120,220,0.5)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (!landFeatures) return;

        // Graticule
        const graticule = d3.geoGraticule()();
        ctx.beginPath();
        path(graticule);
        ctx.strokeStyle = "rgba(40,90,180,0.2)";
        ctx.lineWidth = 0.6;
        ctx.globalAlpha = 1;
        ctx.stroke();

        // Land outlines
        ctx.beginPath();
        landFeatures.features.forEach((f: unknown) => path(f as never));
        ctx.strokeStyle = "rgba(80,150,240,0.55)";
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Halftone land dots (InfoVerif blue)
        const sf = scale / R;
        allDots.forEach((dot) => {
          const p = projection(dot);
          if (!p) return;
          const [px, py] = p;
          if (px < 0 || px > w || py < 0 || py > h) return;
          ctx.beginPath();
          ctx.arc(px, py, 1.1 * sf, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(80,160,255,0.75)";
          ctx.fill();
        });
      };

      // ── Load land + generate dots ─────────────────────────────────────────────
      try {
        const res = await fetch(
          "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json"
        );
        if (res.ok && !destroyed) {
          landFeatures = await res.json();

          // Generate halftone dot grid for each land feature
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          landFeatures.features.forEach((feature: any) => {
            const [[minLng, minLat], [maxLng, maxLat]] = d3.geoBounds(feature);
            const step = 1.4; // degrees — lower = more dots, higher = faster

            for (let lng = minLng; lng <= maxLng; lng += step) {
              for (let lat = minLat; lat <= maxLat; lat += step) {
                if (pointInFeature([lng, lat], feature)) {
                  allDots.push([lng, lat]);
                }
              }
            }
          });

          render();
        }
      } catch {/* skip */}

      // ── Auto-rotation ─────────────────────────────────────────────────────────
      const rotation: [number, number] = [0, -20];
      let autoRotate = true;

      timerHandle = d3.timer(() => {
        if (destroyed) return;
        if (autoRotate) {
          rotation[0] += 0.18;
          projection.rotate(rotation);
          render();
        }
      });

      // ── Drag to rotate ────────────────────────────────────────────────────────
      canvasMouseDown = (e: MouseEvent) => {
        autoRotate = false;
        const startX = e.clientX;
        const startY = e.clientY;
        const startRot: [number, number] = [...rotation];

        const onMove = (me: MouseEvent) => {
          rotation[0] = startRot[0] + (me.clientX - startX) * 0.4;
          rotation[1] = Math.max(-80, Math.min(80, startRot[1] - (me.clientY - startY) * 0.4));
          projection.rotate(rotation);
          render();
        };
        const onUp = () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
          setTimeout(() => { autoRotate = true; }, 50);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      };

      // ── Scroll to zoom ────────────────────────────────────────────────────────
      canvasWheel = (e: WheelEvent) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.92 : 1.08;
        const newScale = Math.max(R * 0.5, Math.min(R * 2.5, projection.scale() * factor));
        projection.scale(newScale);
        render();
      };

      canvas.addEventListener("mousedown", canvasMouseDown);
      canvas.addEventListener("wheel", canvasWheel, { passive: false });

      // ── Vote radar overlays ───────────────────────────────────────────────────
      injectOverlayCSS();
      addOverlays(wrapper);

      const projectFn = (lnglat: [number, number]): { x: number; y: number } | null => {
        const p = projection(lnglat);
        if (!p) return null;
        return { x: p[0], y: p[1] };
      };

      voteRadarRef.current = startVoteRadar(wrapper, projectFn);
    };

    init();

    return () => {
      destroyed = true;
      if (timerHandle) timerHandle.stop();
      if (voteRadarRef.current) clearInterval(voteRadarRef.current);
      if (canvas && canvasMouseDown) canvas.removeEventListener("mousedown", canvasMouseDown);
      if (canvas && canvasWheel) canvas.removeEventListener("wheel", canvasWheel);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full h-full" style={{ background: "#000010" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />
    </div>
  );
}

// ── Point-in-polygon helpers ──────────────────────────────────────────────────

function pointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pointInFeature(point: [number, number], feature: any): boolean {
  const { type, coordinates } = feature.geometry;
  if (type === "Polygon") {
    if (!pointInPolygon(point, coordinates[0])) return false;
    for (let i = 1; i < coordinates.length; i++) {
      if (pointInPolygon(point, coordinates[i])) return false;
    }
    return true;
  } else if (type === "MultiPolygon") {
    for (const poly of coordinates) {
      if (pointInPolygon(point, poly[0])) {
        let inHole = false;
        for (let i = 1; i < poly.length; i++) {
          if (pointInPolygon(point, poly[i])) { inHole = true; break; }
        }
        if (!inHole) return true;
      }
    }
  }
  return false;
}

// ── Overlay helpers (shooting stars + pulse dots + toasts) ────────────────────

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
      position: absolute; width: 12px; height: 12px; transform: translate(-50%,-50%);
      pointer-events: none; z-index: 10;
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
    .news-pulse-ring.d { animation-delay: 0.9s; }
    .news-toast {
      background: rgba(8,12,24,0.88);
      border: 1px solid rgba(0,212,255,0.3);
      border-radius: 3px;
      padding: 5px 8px;
      animation: toast-in 0.2s ease-out forwards;
      backdrop-filter: blur(4px);
    }
    .news-toast.out { animation: toast-out 0.3s ease-in forwards; }
    .toast-src {
      font-size: 8px; color: #00d4ff; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; display: block; margin-bottom: 2px;
      font-family: var(--font-mono, monospace);
    }
    .toast-title {
      font-size: 9.5px; color: #e5e7eb; line-height: 1.4; display: block;
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

function firePulse(wrapper: HTMLElement, px: { x: number; y: number }) {
  const el = document.createElement("div");
  el.className = "news-pulse-wrap";
  el.style.left = `${px.x}px`;
  el.style.top = `${px.y}px`;
  el.appendChild(Object.assign(document.createElement("div"), { className: "news-pulse-dot" }));
  el.appendChild(Object.assign(document.createElement("div"), { className: "news-pulse-ring" }));
  el.appendChild(Object.assign(document.createElement("div"), { className: "news-pulse-ring d" }));
  wrapper.appendChild(el);
  setTimeout(() => el.remove(), 8000);
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

function startVoteRadar(
  wrapper: HTMLElement,
  projectFn: (lnglat: [number, number]) => { x: number; y: number } | null,
): ReturnType<typeof setInterval> {
  let lastSeenVoteId: number | null = null;

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
          const px = projectFn(centroid);
          if (!px) continue; // country is on the back of the globe
          fireShootingStar(wrapper, px);
          setTimeout(() => {
            const px2 = projectFn(centroid);
            if (px2) firePulse(wrapper, px2);
            showVoteToast(wrapper, event.topic_display, event.claim_text, event.vote);
          }, 550);
        }
      }
    } catch {/* silent */}
  }

  setTimeout(poll, 2000);
  return setInterval(poll, 8000);
}
