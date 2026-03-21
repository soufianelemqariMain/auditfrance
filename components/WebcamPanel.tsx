"use client";

import { useState } from "react";

interface WebcamEntry {
  name: string;
  region: string;
  url: string;
  thumb: string;
}

const WEBCAMS: WebcamEntry[] = [
  {
    name: "Tour Eiffel",
    region: "ÎLE-DE-FRANCE",
    url: "https://www.earthcam.com/world/france/paris/?cam=eiffeltower_paris",
    thumb: "",
  },
  {
    name: "Arc de Triomphe",
    region: "ÎLE-DE-FRANCE",
    url: "https://www.earthcam.com/world/france/paris/?cam=arcdetriomphe",
    thumb: "",
  },
  {
    name: "Port de Marseille",
    region: "PACA",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumb: "",
  },
  {
    name: "Côte d'Azur Nice",
    region: "PACA",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumb: "",
  },
  {
    name: "Mont Saint-Michel",
    region: "NORMANDIE",
    url: "https://www.earthcam.com/world/france/normandy/",
    thumb: "",
  },
  {
    name: "Port de Brest",
    region: "BRETAGNE",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumb: "",
  },
];

const FILTER_TABS = ["TOUS", "ÎLE-DE-FRANCE", "NORMANDIE", "PACA", "BRETAGNE"];

function WebcamCard({ cam }: { cam: WebcamEntry }) {
  return (
    <div
      onClick={() => window.open(cam.url, "_blank", "noopener,noreferrer")}
      style={{
        background: "#000",
        border: "1px solid var(--border)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
        minHeight: 90,
      }}
    >
      {/* Placeholder area — SIGNAL PERDU */}
      <div
        style={{
          flex: 1,
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
      </div>

      {/* Bottom bar */}
      <div
        style={{
          padding: "4px 8px",
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 4,
          borderTop: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 9,
            color: "var(--text-primary)",
            fontWeight: 600,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
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
