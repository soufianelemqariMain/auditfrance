"use client";

import { useState } from "react";
import HLSPlayer from "./HLSPlayer";

interface TVChannel {
  name: string;
  short: string;
  hlsUrl: string;
  color: string;
}

// Official / publicly available HLS live streams (via iptv-org & official CDNs)
const CHANNELS: TVChannel[] = [
  {
    name: "France 24",
    short: "F24",
    hlsUrl:
      "https://live.france24.com/hls/live/2037179/F24_FR_HI_HLS/master_5000.m3u8",
    color: "#0066cc",
  },
  {
    name: "BFM TV",
    short: "BFM",
    hlsUrl:
      "https://live-cdn-stream-euw1.bfmtv.bct.nextradiotv.com/master.m3u8",
    color: "#e60000",
  },
  {
    name: "Arte",
    short: "ART",
    hlsUrl:
      "https://artesimulcast.akamaized.net/hls/live/2031003/artelive_fr/index.m3u8",
    color: "#cc6600",
  },
  {
    name: "Euronews FR",
    short: "EUR",
    hlsUrl:
      "https://2f6c5bf4.wurl.com/master/f36d25e7e52f1ba8d7e56eb859c636563214f541/UmxheHhUVi1ldV9FdXJvbmV3c0ZyYW5jYWlzX0hMUw/playlist.m3u8",
    color: "#0099cc",
  },
];

export default function TVPanel() {
  const [active, setActive] = useState(0);
  const ch = CHANNELS[active];

  return (
    <div
      style={{
        background: "var(--bg-panel)",
        borderTop: "1px solid var(--border)",
        borderLeft: "1px solid var(--border)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
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
            color: "var(--accent-red)",
          }}
        >
          TV DIRECT
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--accent-red)",
              boxShadow: "0 0 6px var(--accent-red)",
              animation: "pulse-ring 1.5s infinite",
            }}
          />
          <span style={{ fontSize: 9, color: "var(--accent-red)", letterSpacing: "0.1em" }}>
            EN DIRECT
          </span>
        </div>
      </div>

      {/* Channel tabs */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        {CHANNELS.map((c, i) => (
          <button
            key={c.short}
            onClick={() => setActive(i)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              borderRight: i < CHANNELS.length - 1 ? "1px solid var(--border)" : "none",
              borderBottom: active === i ? `2px solid ${c.color}` : "2px solid transparent",
              color: active === i ? "var(--text-primary)" : "var(--text-secondary)",
              fontSize: 10,
              padding: "5px 4px",
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.05em",
              fontWeight: active === i ? 700 : 400,
            }}
          >
            {c.short}
          </button>
        ))}
      </div>

      {/* HLS video */}
      <div style={{ flex: 1, overflow: "hidden", background: "#000" }}>
        <HLSPlayer key={ch.hlsUrl} hlsUrl={ch.hlsUrl} />
      </div>

      {/* Channel info */}
      <div
        style={{
          padding: "4px 10px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: ch.color, letterSpacing: "0.05em" }}>
          {ch.name}
        </span>
        <span style={{ fontSize: 9, color: "var(--text-secondary)", letterSpacing: "0.08em" }}>
          HLS DIRECT
        </span>
      </div>
    </div>
  );
}
