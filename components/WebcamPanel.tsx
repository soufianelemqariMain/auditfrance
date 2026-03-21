"use client";

import { useState } from "react";
import HLSPlayer from "./HLSPlayer";

interface WebcamEntry {
  name: string;
  region: string;
  // HLS m3u8 stream — regional French broadcast as live feed
  hlsUrl: string;
  // Official page to open on click for full view
  url: string;
}

// Live HLS streams sourced from official broadcasters / iptv-org (fr.m3u)
const WEBCAMS: WebcamEntry[] = [
  {
    name: "Paris — Île-de-France",
    region: "ÎLE-DE-FRANCE",
    hlsUrl: "https://figarotv-live.freecaster.com/live/freecaster/figarotv.m3u8",
    url: "https://www.lefigaro.fr/idf",
  },
  {
    name: "Paris Direct",
    region: "ÎLE-DE-FRANCE",
    hlsUrl: "https://live.france24.com/hls/live/2037179/F24_FR_HI_HLS/master_5000.m3u8",
    url: "https://www.france24.com/fr/direct",
  },
  {
    name: "Côte d'Azur",
    region: "PACA",
    hlsUrl: "https://vdo2.pro-fhi.net:3628/live/uppodsfqlive.m3u8",
    url: "https://www.lerendezvous.tv",
  },
  {
    name: "Marseille / PACA",
    region: "PACA",
    hlsUrl: "https://live-cdn-stream-euw1.bfmtv.bct.nextradiotv.com/master.m3u8",
    url: "https://www.bfmtv.com/en-direct/",
  },
  {
    name: "Mont Saint-Michel",
    region: "NORMANDIE",
    hlsUrl: "https://streamtv.cdn.dvmr.fr/TVR/ngrp:tvr.stream_all/master.m3u8",
    url: "https://www.tvr-bretagne.fr/direct",
  },
  {
    name: "Brest — Bretagne",
    region: "BRETAGNE",
    hlsUrl: "https://streamtv.cdn.dvmr.fr/TVR/ngrp:tvr.stream_all/master.m3u8",
    url: "https://www.tvr-bretagne.fr/direct",
  },
];

const FILTER_TABS = ["TOUS", "ÎLE-DE-FRANCE", "NORMANDIE", "PACA", "BRETAGNE"];

function WebcamCard({ cam }: { cam: WebcamEntry }) {
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
      {/* HLS stream */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative", minHeight: 68 }}>
        <HLSPlayer hlsUrl={cam.hlsUrl} />
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
          LIVE FEEDS
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
                activeFilter === tab ? "var(--accent-green)" : "var(--text-secondary)",
              fontSize: 10,
              padding: "5px 8px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              letterSpacing: "0.05em",
              fontFamily: "inherit",
              borderBottom:
                activeFilter === tab ? "2px solid var(--accent-green)" : "2px solid transparent",
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
            Aucun flux pour cette région
          </div>
        )}
      </div>
    </div>
  );
}
