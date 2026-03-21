"use client";

import { useState } from "react";

interface TVChannel {
  name: string;
  short: string;
  // YouTube nocookie embed URL for the channel's live stream
  embedUrl: string;
  // Official live stream page
  url: string;
  color: string;
}

// Open/public French TV live streams via official YouTube channels
const CHANNELS: TVChannel[] = [
  {
    name: "France 24",
    short: "F24",
    embedUrl:
      "https://www.youtube-nocookie.com/embed/l8PMl7tUDIE?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0",
    url: "https://www.france24.com/fr/direct",
    color: "#0066cc",
  },
  {
    name: "BFM TV",
    short: "BFM",
    embedUrl:
      "https://www.youtube-nocookie.com/embed/MRxHZaBPAZI?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0",
    url: "https://www.bfmtv.com/en-direct/",
    color: "#e60000",
  },
  {
    name: "LCI",
    short: "LCI",
    embedUrl:
      "https://www.youtube-nocookie.com/embed/Pkh8UtuejOw?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0",
    url: "https://www.lci.fr/direct/",
    color: "#003399",
  },
  {
    name: "Euronews FR",
    short: "EUR",
    embedUrl:
      "https://www.youtube-nocookie.com/embed/V1W6Z5_G5Lo?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0",
    url: "https://fr.euronews.com/direct-live",
    color: "#0099cc",
  },
];

export default function TVPanel() {
  const [active, setActive] = useState(0);
  const [loaded, setLoaded] = useState(false);
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
            onClick={() => { setActive(i); setLoaded(false); }}
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

      {/* Video embed */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#000" }}>
        <iframe
          key={ch.embedUrl}
          src={ch.embedUrl}
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          onLoad={() => setLoaded(true)}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
            position: "absolute",
            inset: 0,
          }}
          title={ch.name}
        />
        {!loaded && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#000",
              fontSize: 10,
              color: "var(--text-secondary)",
              letterSpacing: "0.1em",
              pointerEvents: "none",
            }}
          >
            CONNEXION...
          </div>
        )}
      </div>

      {/* Channel info bar */}
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
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "0.05em",
          }}
        >
          {ch.name}
        </span>
        <button
          onClick={() => window.open(ch.url, "_blank", "noopener,noreferrer")}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--accent-blue)",
            fontSize: 9,
            padding: "2px 6px",
            cursor: "pointer",
            fontFamily: "inherit",
            letterSpacing: "0.08em",
          }}
        >
          ↗ PLEIN ÉCRAN
        </button>
      </div>
    </div>
  );
}
