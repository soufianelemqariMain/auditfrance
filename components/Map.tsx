"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

// Centroids [lon, lat] for major countries — for vote events & claim dots
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

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", GB: "United Kingdom", FR: "France", DE: "Germany",
  ES: "Spain", IT: "Italy", BR: "Brazil", IN: "India", CN: "China",
  RU: "Russia", JP: "Japan", AU: "Australia", CA: "Canada", MX: "Mexico",
  ZA: "South Africa", NG: "Nigeria", EG: "Egypt", SA: "Saudi Arabia",
  TR: "Turkey", UA: "Ukraine", PL: "Poland", NL: "Netherlands", SE: "Sweden",
  IL: "Israel", KR: "South Korea", AR: "Argentina", ID: "Indonesia",
};

// Region-to-ISO mapping — only explicit mappings.
// GLOBAL topics do NOT get dots (they'd appear on every country as false signal).
const REGION_TO_ISO: Record<string, string[]> = {
  US: ["US"], GB: ["GB"], FR: ["FR"], DE: ["DE"], ES: ["ES"], IT: ["IT"],
  BR: ["BR"], IN: ["IN"], CN: ["CN"], RU: ["RU"], JP: ["JP"], AU: ["AU"],
  CA: ["CA"], MX: ["MX"], ZA: ["ZA"], NG: ["NG"], EG: ["EG"], SA: ["SA"],
  TR: ["TR"], UA: ["UA"], PL: ["PL"], NL: ["NL"], SE: ["SE"], IL: ["IL"],
  KR: ["KR"], AR: ["AR"], ID: ["ID"],
  EU: ["FR", "DE", "ES", "IT", "NL", "PL", "SE"],
  // GLOBAL intentionally omitted — no dots for global topics
};

interface ClaimDot {
  lnglat: [number, number];
  yesPercent: number;
  slug: string;
  region: string;
}

// Canvas-rendered shooting stars — store geo coords so they track globe rotation
interface ActiveStar {
  x0: number; y0: number;   // fixed screen origin (edge of viewport)
  lng: number; lat: number; // geographic target — reprojected each frame
  t0: number;               // performance.now() at fire time
  isYes: boolean;           // true = TRUE vote (red), false = FALSE vote (blue)
}

interface PanelClaim {
  id: number;
  claim_text: string;
  yes_count: number;
  no_count: number;
  topic_display?: string;
  topic_slug?: string;
}

// Stable voter ID stored in localStorage so a user's votes persist
function getVoterId(): string {
  if (typeof window === "undefined") return "anon";
  const key = "iv_voter_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export default function Map() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const voteRadarRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const claimDotsRef = useRef<ClaimDot[]>([]);
  const activeStarsRef = useRef<ActiveStar[]>([]);
  const topicsRef = useRef<Array<{ slug: string; region?: string; avg_probability?: number; yes_percent?: number }>>([]);
  // showPanel is called from inside the canvas click handler (not React land)
  const showPanelRef = useRef<(isoCode: string) => void>(() => {});

  const [panel, setPanel] = useState<{ isoCode: string; name: string } | null>(null);
  const [panelClaims, setPanelClaims] = useState<PanelClaim[]>([]);
  const [panelLoading, setPanelLoading] = useState(false);
  const [votedIds, setVotedIds] = useState<Record<number, "yes" | "no">>({});

  // Cast a vote on a claim
  const castVote = useCallback(async (claimId: number, vote: "yes" | "no") => {
    setVotedIds((prev) => ({ ...prev, [claimId]: vote }));
    // Optimistically update counts
    setPanelClaims((prev) => prev.map((c) => {
      if (c.id !== claimId) return c;
      return {
        ...c,
        yes_count: vote === "yes" ? c.yes_count + 1 : c.yes_count,
        no_count: vote === "no" ? c.no_count + 1 : c.no_count,
      };
    }));
    try {
      await fetch(`/api/claims/${claimId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Voter-Id": getVoterId() },
        body: JSON.stringify({ vote }),
      });
    } catch {/* silent */}
  }, []);

  // When a country is clicked from the canvas, open the panel and fetch claims
  // Uses topic slugs (not region ISO) to query — the only reliable backend param.
  const openPanel = useCallback(async (isoCode: string) => {
    setPanel({ isoCode, name: COUNTRY_NAMES[isoCode] ?? isoCode });
    setPanelClaims([]);
    setVotedIds({});
    setPanelLoading(true);
    try {
      // Find topics that map to this country via REGION_TO_ISO
      const matchingSlugs = topicsRef.current
        .filter((t) => {
          if (!t.region) return false;
          const isos = REGION_TO_ISO[t.region];
          return isos?.includes(isoCode);
        })
        .map((t) => t.slug);

      if (matchingSlugs.length === 0) {
        setPanelLoading(false);
        return;
      }

      // Fetch claims for each matching topic in parallel
      const results = await Promise.allSettled(
        matchingSlugs.map((slug) =>
          fetch(`/api/claims?topic=${slug}&limit=10`, { cache: "no-store" }).then((r) => r.json())
        )
      );
      const all: PanelClaim[] = [];
      for (const r of results) {
        if (r.status === "fulfilled") {
          const d = r.value;
          const items: PanelClaim[] = Array.isArray(d) ? d : (d.claims ?? d.items ?? []);
          all.push(...items);
        }
      }
      // Deduplicate by ID
      const seen = new Set<number>();
      setPanelClaims(all.filter((c) => { if (seen.has(c.id)) return false; seen.add(c.id); return true; }));
    } catch {/* silent */}
    setPanelLoading(false);
  }, []);

  useEffect(() => {
    showPanelRef.current = openPanel;
  }, [openPanel]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    let destroyed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let timerHandle: any = null;
    let canvasMouseDown: ((e: MouseEvent) => void) | null = null;
    let canvasWheel: ((e: WheelEvent) => void) | null = null;
    let canvasClick: ((e: MouseEvent) => void) | null = null;

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

      // ── Render loop ───────────────────────────────────────────────────────────
      const render = () => {
        ctx.clearRect(0, 0, w, h);
        const scale = projection.scale();
        const sf = scale / R;

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
        ctx.beginPath();
        path(d3.geoGraticule()());
        ctx.strokeStyle = "rgba(40,90,180,0.2)";
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Land outlines
        ctx.beginPath();
        landFeatures.features.forEach((f: unknown) => path(f as never));
        ctx.strokeStyle = "rgba(80,150,240,0.55)";
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Halftone land dots
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

        // Persistent claim dots
        claimDotsRef.current.forEach((dot) => {
          const p = projection(dot.lnglat);
          if (!p) return;
          const [px, py] = p;
          if (px < 0 || px > w || py < 0 || py > h) return;
          // Color: green (low yes%) → yellow → red (high yes%)
          const r = Math.round(dot.yesPercent * 220 + 35);
          const g = Math.round((1 - dot.yesPercent) * 180 + 40);
          const color = `rgb(${r},${g},40)`;
          const dotR = 4 * sf;
          // Glow
          const grd = ctx.createRadialGradient(px, py, 0, px, py, dotR * 2.5);
          grd.addColorStop(0, color.replace("rgb", "rgba").replace(")", ",0.9)"));
          grd.addColorStop(1, color.replace("rgb", "rgba").replace(")", ",0)"));
          ctx.beginPath();
          ctx.arc(px, py, dotR * 2.5, 0, 2 * Math.PI);
          ctx.fillStyle = grd;
          ctx.fill();
          // Core
          ctx.beginPath();
          ctx.arc(px, py, dotR, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        });

        // Canvas shooting stars — reprojected every frame so they track globe rotation
        const now = performance.now();
        activeStarsRef.current = activeStarsRef.current.filter((star) => {
          const el = now - star.t0;
          const DRAW = 480, HOLD = 180, FADE = 380, TOTAL = DRAW + HOLD + FADE;
          if (el > TOTAL) return false;

          const p = projection([star.lng, star.lat]);
          if (!p) return el < TOTAL; // on back of globe — keep alive but skip draw

          const [tx, ty] = p;
          const baseAlpha = el > DRAW + HOLD ? 0.85 * (1 - (el - DRAW - HOLD) / FADE) : 0.85;
          const progress = el < DRAW ? Math.pow(el / DRAW, 0.55) : 1;
          const cx = star.x0 + (tx - star.x0) * progress;
          const cy = star.y0 + (ty - star.y0) * progress;
          const lineColor = star.isYes
            ? `rgba(239,80,80,${baseAlpha})`
            : `rgba(80,140,255,${baseAlpha})`;

          // Shooting line
          ctx.beginPath();
          ctx.moveTo(star.x0, star.y0);
          ctx.lineTo(cx, cy);
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = 1.3;
          ctx.stroke();

          // Expanding ring at target once line arrives
          if (el > DRAW) {
            const ringProgress = Math.min((el - DRAW) / (HOLD + FADE), 1);
            const ringR = ringProgress * 14;
            const ringAlpha = baseAlpha * (1 - ringProgress * 0.7);
            ctx.beginPath();
            ctx.arc(tx, ty, ringR, 0, 2 * Math.PI);
            ctx.strokeStyle = star.isYes ? `rgba(239,80,80,${ringAlpha})` : `rgba(80,140,255,${ringAlpha})`;
            ctx.lineWidth = 0.9;
            ctx.stroke();
            // Core dot
            ctx.beginPath();
            ctx.arc(tx, ty, 2.5, 0, 2 * Math.PI);
            ctx.fillStyle = lineColor;
            ctx.fill();
          }
          return true;
        });
      };

      // ── Load land + generate halftone dots ────────────────────────────────────
      try {
        const res = await fetch(
          "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json"
        );
        if (res.ok && !destroyed) {
          landFeatures = await res.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          landFeatures.features.forEach((feature: any) => {
            const [[minLng, minLat], [maxLng, maxLat]] = d3.geoBounds(feature);
            const step = 1.4;
            for (let lng = minLng; lng <= maxLng; lng += step) {
              for (let lat = minLat; lat <= maxLat; lat += step) {
                if (pointInFeature([lng, lat], feature)) allDots.push([lng, lat]);
              }
            }
          });
          render();
        }
      } catch {/* skip */}

      // ── Load claim dots (active topics only, explicit regions) ───────────────
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
        const res = await fetch(`${apiBase}/api/topics`, { cache: "no-store" });
        if (res.ok) {
          const topics: Array<{ slug: string; region?: string; avg_probability?: number; yes_percent?: number }> =
            await res.json();
          topicsRef.current = topics; // store for panel country → topic lookup
          const dots: ClaimDot[] = [];
          for (const topic of topics) {
            const region = topic.region;
            // Skip GLOBAL or unmapped topics — dots must represent real country claims
            if (!region || !REGION_TO_ISO[region]) continue;
            const isos = REGION_TO_ISO[region];
            const yesPercent = topic.avg_probability ?? topic.yes_percent ?? 0.5;
            for (const iso of isos) {
              const centroid = WORLD_CENTROIDS[iso];
              if (!centroid) continue;
              // Small jitter so multiple topics for same country don't overlap exactly
              const jitter: [number, number] = [
                centroid[0] + (Math.random() - 0.5) * 3,
                centroid[1] + (Math.random() - 0.5) * 3,
              ];
              dots.push({ lnglat: jitter, yesPercent, slug: topic.slug, region: iso });
            }
          }
          claimDotsRef.current = dots;
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
        }
        render();
      });

      // ── Drag to rotate ────────────────────────────────────────────────────────
      let dragging = false;
      canvasMouseDown = (e: MouseEvent) => {
        dragging = false;
        autoRotate = false;
        const startX = e.clientX;
        const startY = e.clientY;
        const startRot: [number, number] = [...rotation];

        const onMove = (me: MouseEvent) => {
          dragging = true;
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

      // ── Click to see country claims ───────────────────────────────────────────
      canvasClick = (e: MouseEvent) => {
        if (dragging) { dragging = false; return; }
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const geo = projection.invert?.([x, y]);
        if (!geo) return;
        const [lng, lat] = geo;

        // Find nearest country centroid within 20° threshold
        let best: string | null = null;
        let bestDist = 20;
        for (const [iso, [cLng, cLat]] of Object.entries(WORLD_CENTROIDS)) {
          const dist = Math.sqrt(Math.pow(lng - cLng, 2) + Math.pow(lat - cLat, 2));
          if (dist < bestDist) { bestDist = dist; best = iso; }
        }
        if (best) showPanelRef.current(best);
      };

      canvas.addEventListener("mousedown", canvasMouseDown);
      canvas.addEventListener("wheel", canvasWheel, { passive: false });
      canvas.addEventListener("click", canvasClick);
      canvas.style.cursor = "pointer";

      // ── Vote radar — canvas stars + vote feed toasts ─────────────────────────
      injectOverlayCSS();
      addToastOverlay(wrapper);

      voteRadarRef.current = startVoteRadar(wrapper, w, h, activeStarsRef);
    };

    init();

    return () => {
      destroyed = true;
      if (timerHandle) timerHandle.stop();
      if (voteRadarRef.current) clearInterval(voteRadarRef.current);
      if (canvas && canvasMouseDown) canvas.removeEventListener("mousedown", canvasMouseDown);
      if (canvas && canvasWheel) canvas.removeEventListener("wheel", canvasWheel);
      if (canvas && canvasClick) canvas.removeEventListener("click", canvasClick);
    };
  }, []);

  const yesPercent = (c: PanelClaim) => {
    const total = (c.yes_count ?? 0) + (c.no_count ?? 0);
    return total === 0 ? null : Math.round((c.yes_count / total) * 100);
  };

  return (
    <div ref={wrapperRef} className="relative w-full h-full" style={{ background: "#000010" }}>
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />

      {/* Country claims panel */}
      {panel && (
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: 320,
          background: "rgba(4,8,20,0.96)", borderLeft: "1px solid rgba(0,212,255,0.2)",
          backdropFilter: "blur(12px)", zIndex: 30, display: "flex", flexDirection: "column",
          fontFamily: "var(--font-mono, monospace)",
        }}>
          {/* Header */}
          <div style={{
            padding: "12px 14px", borderBottom: "1px solid rgba(0,212,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 10, color: "#00d4ff", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px" }}>
                ACTIVE CLAIMS
              </div>
              <div style={{ fontSize: 14, color: "#e5e7eb", fontWeight: 600, marginTop: 2 }}>
                {panel.name}
              </div>
            </div>
            <button
              onClick={() => setPanel(null)}
              style={{ background: "none", border: "none", color: "rgba(229,231,235,0.5)", fontSize: 18, cursor: "pointer", lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          {/* Claims list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {panelLoading && (
              <div style={{ padding: "20px 14px", color: "rgba(229,231,235,0.4)", fontSize: 11, textAlign: "center" }}>
                Loading claims…
              </div>
            )}
            {!panelLoading && panelClaims.length === 0 && (
              <div style={{ padding: "20px 14px", color: "rgba(229,231,235,0.4)", fontSize: 11, textAlign: "center" }}>
                No active claims for this country.
              </div>
            )}
            {panelClaims.map((claim) => {
              const pct = yesPercent(claim);
              const voted = votedIds[claim.id];
              return (
                <div key={claim.id} style={{
                  padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                  {claim.topic_display && (
                    <div style={{ fontSize: 8, color: "#00d4ff", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 4 }}>
                      {claim.topic_display}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "#e5e7eb", lineHeight: 1.5, marginBottom: 7 }}>
                    {claim.claim_text}
                  </div>
                  {pct !== null && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: pct > 60 ? "#ef4444" : pct > 40 ? "#f59e0b" : "#22c55e", borderRadius: 2 }} />
                      </div>
                      <div style={{ fontSize: 9, color: "rgba(229,231,235,0.6)", whiteSpace: "nowrap" }}>
                        {pct}% TRUE · {(claim.yes_count ?? 0) + (claim.no_count ?? 0)} votes
                      </div>
                    </div>
                  )}
                  {/* Vote buttons */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      disabled={!!voted}
                      onClick={() => castVote(claim.id, "yes")}
                      style={{
                        flex: 1, padding: "4px 0", fontSize: 9, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "1px", cursor: voted ? "default" : "pointer",
                        border: `1px solid ${voted === "yes" ? "#ef4444" : "rgba(239,68,68,0.35)"}`,
                        background: voted === "yes" ? "rgba(239,68,68,0.18)" : "rgba(239,68,68,0.06)",
                        color: voted === "yes" ? "#ef4444" : "rgba(239,68,68,0.7)",
                        borderRadius: 2, fontFamily: "var(--font-mono, monospace)",
                      }}
                    >
                      {voted === "yes" ? "✓ TRUE" : "TRUE"}
                    </button>
                    <button
                      disabled={!!voted}
                      onClick={() => castVote(claim.id, "no")}
                      style={{
                        flex: 1, padding: "4px 0", fontSize: 9, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "1px", cursor: voted ? "default" : "pointer",
                        border: `1px solid ${voted === "no" ? "#3b82f6" : "rgba(59,130,246,0.35)"}`,
                        background: voted === "no" ? "rgba(59,130,246,0.18)" : "rgba(59,130,246,0.06)",
                        color: voted === "no" ? "#3b82f6" : "rgba(59,130,246,0.7)",
                        borderRadius: 2, fontFamily: "var(--font-mono, monospace)",
                      }}
                    >
                      {voted === "no" ? "✓ FALSE" : "FALSE"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
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

// ── Overlay helpers ───────────────────────────────────────────────────────────

// Toast wrap only — shooting stars are now rendered on canvas
function addToastOverlay(wrapper: HTMLElement) {
  if (wrapper.querySelector(".news-toast-wrap")) return;
  const toastWrap = document.createElement("div");
  toastWrap.className = "news-toast-wrap";
  toastWrap.style.cssText =
    "position:absolute;bottom:80px;left:14px;display:flex;flex-direction:column;gap:5px;z-index:20;pointer-events:none;max-width:280px;";
  wrapper.appendChild(toastWrap);
}

function injectOverlayCSS() {
  if (document.getElementById("map-overlay-style")) return;
  const style = document.createElement("style");
  style.id = "map-overlay-style";
  style.textContent = `
    @keyframes toast-in  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
    @keyframes toast-out { from { opacity:1; } to { opacity:0; } }
    .news-toast {
      background:rgba(6,10,22,0.92); border-radius:3px; padding:6px 10px;
      animation:toast-in 0.18s ease-out forwards; backdrop-filter:blur(6px);
      border-left:2px solid currentColor;
    }
    .news-toast.out { animation:toast-out 0.25s ease-in forwards; }
    .toast-vote {
      font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:2px;
      display:block; margin-bottom:3px; font-family:var(--font-mono,monospace);
    }
    .toast-meta {
      font-size:9px; color:rgba(229,231,235,0.55); line-height:1.4; display:block;
      font-family:var(--font-mono,monospace);
    }
  `;
  document.head.appendChild(style);
}

function showVoteFeedToast(wrapper: HTMLElement, topic: string, countries: string[], vote: string) {
  const toastWrap = wrapper.querySelector(".news-toast-wrap");
  if (!toastWrap) return;
  const existing = toastWrap.querySelectorAll(".news-toast");
  if (existing.length >= 4) existing[0].remove();

  const isYes = vote === "yes";
  const color = isYes ? "#ef4444" : "#3b82f6";
  const label = isYes ? "VOTED TRUE" : "VOTED FALSE";
  const countryNames = countries
    .map((iso) => COUNTRY_NAMES[iso] ?? iso)
    .slice(0, 2)
    .join(", ");

  const toast = document.createElement("div");
  toast.className = "news-toast";
  toast.style.color = color;
  toast.innerHTML = `<span class="toast-vote">${label}</span><span class="toast-meta">${topic}${countryNames ? " · " + countryNames : ""}</span>`;
  toastWrap.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("out");
    setTimeout(() => toast.remove(), 280);
  }, 4500);
}

// startVoteRadar: pushes canvas-tracked stars to activeStarsRef, shows vote-feed toasts
function startVoteRadar(
  wrapper: HTMLElement,
  viewportW: number,
  viewportH: number,
  activeStarsRef: React.MutableRefObject<ActiveStar[]>,
): ReturnType<typeof setInterval> {
  let lastSeenVoteId: number | null = null;

  async function poll() {
    try {
      const res = await fetch("/api/votes/recent?limit=10", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const events: Array<{
        vote_id: number; topic_display: string; vote: string; countries: string[];
      }> = data.events ?? [];
      if (!events.length) return;

      const newEvents = lastSeenVoteId
        ? events.filter((e) => e.vote_id > lastSeenVoteId!)
        : events.slice(0, 3);
      if (newEvents.length) lastSeenVoteId = newEvents[0].vote_id;

      for (const event of newEvents.slice(0, 4)) {
        // Show vote-feed toast (topic + country, not claim text)
        showVoteFeedToast(wrapper, event.topic_display, event.countries, event.vote);

        for (const iso of event.countries) {
          const centroid = WORLD_CENTROIDS[iso];
          if (!centroid) continue;

          // Pick a random screen-edge origin
          const side = Math.floor(Math.random() * 4);
          let x0: number, y0: number;
          if (side === 0)      { x0 = Math.random() * viewportW; y0 = -10; }
          else if (side === 1) { x0 = viewportW + 10; y0 = Math.random() * viewportH; }
          else if (side === 2) { x0 = Math.random() * viewportW; y0 = viewportH + 10; }
          else                 { x0 = -10; y0 = Math.random() * viewportH; }

          activeStarsRef.current.push({
            x0, y0,
            lng: centroid[0], lat: centroid[1],
            t0: performance.now(),
            isYes: event.vote === "yes",
          });
        }
      }
    } catch {/* silent */}
  }

  setTimeout(poll, 2000);
  return setInterval(poll, 8000);
}
