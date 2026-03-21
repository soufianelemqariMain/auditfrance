"use client";

import { useState } from "react";

interface WebcamEntry {
  name: string;
  region: string;
  url: string;
  // YouTube embed URL — if set, shows an iframe instead of SIGNAL PERDU
  embedUrl?: string;
}

// Real French public webcams. For embeds we use YouTube nocookie format.
// Clickthrough URLs go to official webcam/camera pages.
const WEBCAMS: WebcamEntry[] = [
  {
    name: "Tour Eiffel",
    region: "ÎLE-DE-FRANCE",
    url: "https://www.earthcam.com/world/france/paris/?cam=eiffeltower_paris",
    // EarthCam Paris live — publicly viewable
    embedUrl:
      "https://www.youtube-nocookie.com/embed/ByXw-RV0pUQ?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0",
  },
  {
    name: "Arc de Triomphe",
    region: "ÎLE-DE-FRANCE",
    url: "https://www.earthcam.com/world/france/paris/?cam=arcdetriomphe",
    embedUrl:
      "https://www.youtube-nocookie.com/embed/N_OD0NK_OAg?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0",
  },
  {
    name: "Port de Marseille",
    region: "PACA",
    url: "https://www.marseille-port.fr/le-port/webcam",
    embedUrl:
      "https://www.youtube-nocookie.com/embed/2DgSBMEBSaY?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0",
  },
  {
    name: "Promenade des Anglais",
    region: "PACA",
    url: "https://www.nice.fr/fr/nice-pratique/webcam",
    embedUrl:
      "https://www.youtube-nocookie.com/embed/HklFPX2VyD8?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0",
  },
  {
    name: "Mont Saint-Michel",
    region: "NORMANDIE",
    url: "https://www.earthcam.com/world/france/normandy/",
    embedUrl:
      "https://www.youtube-nocookie.com/embed/Z2VDVDR4Rdo?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0",
  },
  {
    name: "Port de Brest",
    region: "BRETAGNE",
    url: "https://www.brest.fr/webcam-port",
    embedUrl:
      "https://www.youtube-nocookie.com/embed/qp4oCJ6PKXY?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0",
  },
];

const FILTER_TABS = ["TOUS", "ÎLE-DE-FRANCE", "NORMANDIE", "PACA", "BRETAGNE"];

function WebcamCard({ cam }: { cam: WebcamEntry }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div
      style={{
        background: "#000",
        border: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        minHeight: 90,
      }}
    >
      {/* Stream area */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 68 }}>
        {cam.embedUrl && !errored ? (
          <>
            {/* Iframe embed */}
            <iframe
              src={cam.embedUrl}
              allow="autoplay; encrypted-media"
              allowFullScreen
              onLoad={() => setLoaded(true)}
              onError={() => setErrored(true)}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                display: "block",
                position: "absolute",
                inset: 0,
              }}
              title={cam.name}
            />
            {/* Spinner while loading */}
            {!loaded && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  color: "var(--text-secondary)",
                  letterSpacing: "0.1em",
                  background: "#000",
                }}
              >
                CONNEXION...
              </div>
            )}
          </>
        ) : (
          /* Fallback — SIGNAL PERDU with clickthrough */
          <div
            onClick={() => window.open(cam.url, "_blank", "noopener,noreferrer")}
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              color: "var(--text-secondary)",
              letterSpacing: "0.1em",
              padding: "12px 8px",
              gap: 4,
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            <span>SIGNAL PERDU</span>
            <span
              style={{
                color: "var(--accent-red)",
                fontWeight: 700,
                animation: "blink-cursor 1s step-start infinite",
              }}
            >
              _
            </span>
            <span style={{ fontSize: 9, marginTop: 4, color: "var(--accent-blue)" }}>
              ▶ VOIR DIRECT
            </span>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          padding: "4px 8px",
          background: "rgba(0,0,0,0.9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 4,
          borderTop: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <span
          onClick={() => window.open(cam.url, "_blank", "noopener,noreferrer")}
          style={{
            fontSize: 9,
            color: "var(--text-primary)",
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            cursor: "pointer",
          }}
        >
          {cam.name}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <span style={{ fontSize: 8, letterSpacing: "0.06em", color: "var(--text-secondary)" }}>
            {cam.region}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "var(--accent-red)",
                boxShadow: "0 0 4px var(--accent-red)",
              }}
            />
            <span style={{ fontSize: 8, color: "var(--accent-red)", letterSpacing: "0.1em" }}>
              LIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WebcamPanel() {
  const [activeFilter, setActiveFilter] = useState("TOUS");

  const filtered = WEBCAMS.filter(
    (cam) => activeFilter === "TOUS" || cam.region === activeFilter
  );

  return (
    <div
      style={{
        background: "var(--bg-panel)",
        borderTop: "1px solid var(--border)",
        borderLeft: "1px solid var(--border)",
        borderRight: "1px solid var(--border)",
        height: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--accent-green)",
          }}
        >
          LIVE WEBCAMS
        </span>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--accent-red)",
            boxShadow: "0 0 6px var(--accent-red)",
          }}
        />
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            style={{
              background: "transparent",
              border: "none",
              borderRight: "1px solid var(--border)",
              color:
                activeFilter === tab
                  ? "var(--accent-green)"
                  : "var(--text-secondary)",
              fontSize: 10,
              padding: "5px 8px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              letterSpacing: "0.05em",
              fontFamily: "inherit",
              borderBottom:
                activeFilter === tab
                  ? "2px solid var(--accent-green)"
                  : "2px solid transparent",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 2-column grid */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 8,
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gridAutoRows: "minmax(90px, auto)",
          gap: 6,
          alignContent: "start",
        }}
      >
        {filtered.map((cam) => (
          <WebcamCard key={`${cam.name}__${cam.region}`} cam={cam} />
        ))}
        {filtered.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: 16,
              fontSize: 11,
              color: "var(--text-secondary)",
              textAlign: "center",
            }}
          >
            Aucune webcam pour cette région
          </div>
        )}
      </div>
    </div>
  );
}
