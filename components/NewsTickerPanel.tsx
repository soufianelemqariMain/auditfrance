"use client";

import { useEffect, useState } from "react";
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

function SkeletonList() {
  return (
    <ul style={{ listStyle: "none", padding: "8px 0" }}>
      {[1, 2, 3, 4].map((n) => (
        <li key={n} style={{ padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ height: 10, width: "60%", background: "var(--border)", borderRadius: 2 }} />
          <div style={{ height: 8, width: "85%", background: "var(--border)", borderRadius: 2, opacity: 0.6 }} />
        </li>
      ))}
    </ul>
  );
}

export default function NewsTickerPanel() {
  const newsItems = useAppStore((s) => s.newsItems);
  const setNewsItems = useAppStore((s) => s.setNewsItems);
  const [loading, setLoading] = useState(newsItems.length === 0);

  async function fetchNews() {
    try {
      setLoading(true);
      const res = await fetch("/api/news");
      if (res.ok) {
        const data = await res.json();
        setNewsItems(data.items ?? []);
      }
    } catch {
      // silently ignore fetch errors — stale data remains visible
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNews();
    const id = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const items = Array.isArray(newsItems) ? newsItems : [];
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
          ACTUALITÉS EN DIRECT
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

      {/* Article list — full feed, all sources */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <SkeletonList />
        ) : items.length === 0 ? (
          <div style={{ padding: 16, fontSize: 11, color: "var(--text-secondary)", textAlign: "center" }}>
            Aucun article
          </div>
        ) : (
          <ul style={{ listStyle: "none" }}>
            {items.map((item) => (
              <li
                key={item.id}
                onClick={() => window.open(item.url, "_blank", "noopener,noreferrer")}
                style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
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
                  <span style={{ fontSize: 10, color: "var(--text-secondary)", flexShrink: 0 }}>
                    {formatTime(item.publishedAt)}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-primary)", lineHeight: 1.4 }}>
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
