"use client";

import { useAppStore, NewsItem } from "../lib/store";

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "--:--";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function buildTickerString(items: NewsItem[]): string {
  if (items.length === 0) return "";
  return items.map((i) => `[${i.source.toUpperCase()}] ${i.title}`).join(" · ") + " · ";
}

export default function NewsTickerPanel() {
  const radarNewsItems = useAppStore((s) => s.radarNewsItems);
  const setAnalyserInput = useAppStore((s) => s.setAnalyserInput);

  const items = Array.isArray(radarNewsItems) ? radarNewsItems : [];
  const tickerText = buildTickerString(items);
  const doubledTicker = tickerText + tickerText;

  return (
    <div
      style={{
        height: "100%",
        background: "var(--bg-panel)",
        borderTop: "1px solid var(--border)",
        borderRight: "1px solid var(--border)",
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
          gap: 8,
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
          RADAR LOCAL
        </span>
        <span
          style={{
            fontSize: 10,
            background: "var(--accent-green)",
            color: "#000",
            padding: "1px 5px",
            fontWeight: 700,
          }}
        >
          {items.length}
        </span>
        <span
          style={{
            fontSize: 8,
            color: "var(--text-secondary)",
            marginLeft: "auto",
            letterSpacing: "0.06em",
          }}
        >
          LIVE
        </span>
      </div>

      {/* Ticker */}
      {items.length > 0 && (
        <div
          style={{
            overflow: "hidden",
            borderBottom: "1px solid var(--border)",
            padding: "5px 0",
            flexShrink: 0,
            fontSize: 11,
            color: "var(--text-secondary)",
          }}
        >
          <div className="ticker-track">{doubledTicker}</div>
        </div>
      )}

      {/* Article list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {items.length === 0 ? (
          <div style={{ padding: 16, fontSize: 11, color: "var(--text-secondary)", textAlign: "center", lineHeight: 1.8 }}>
            <div style={{ marginBottom: 8, fontSize: 16 }}>📡</div>
            En attente du radar…
            <br />
            <span style={{ fontSize: 9, opacity: 0.6 }}>Les événements apparaissent dès qu&apos;une étoile filante se déclenche</span>
          </div>
        ) : (
          <ul style={{ listStyle: "none" }}>
            {items.map((item) => (
              <li
                key={item.id}
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.1em",
                      color: "var(--accent-green)",
                      textTransform: "uppercase",
                      flexShrink: 0,
                    }}
                  >
                    {item.source}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {item.url && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setAnalyserInput(item.url); }}
                        title="Analyser cet article"
                        style={{
                          fontSize: 8, padding: "1px 5px", borderRadius: 2,
                          background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
                          color: "#a5b4fc", cursor: "pointer", fontFamily: "inherit",
                          lineHeight: 1.4, fontWeight: 700,
                        }}
                      >
                        → Analyser
                      </button>
                    )}
                    <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>
                      {formatTime(item.publishedAt)}
                    </span>
                  </div>
                </div>
                <span
                  onClick={() => item.url && window.open(item.url, "_blank", "noopener,noreferrer")}
                  style={{ fontSize: 11, color: "var(--text-primary)", lineHeight: 1.4, cursor: item.url ? "pointer" : "default" }}
                >
                  {item.title}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
