"use client";

import { useEffect, useRef, useState } from "react";
import { NewsItem } from "@/lib/store";

export default function NewsBandeau() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const seenTitles = useRef(new Set<string>());

  async function poll() {
    try {
      const res = await fetch("/api/news");
      if (!res.ok) return;
      const data = await res.json();
      const allItems: NewsItem[] = data.items ?? [];

      // Only add articles we haven't shown yet
      const fresh = allItems.filter((item) => !seenTitles.current.has(item.title));
      fresh.forEach((item) => seenTitles.current.add(item.title));

      if (fresh.length > 0) {
        setItems((prev) => [...fresh, ...prev].slice(0, 40));
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, []);

  const text =
    items.length > 0
      ? items.map((i) => `[${i.source.toUpperCase()}]  ${i.title}`).join("   ·   ") + "   ·   "
      : "INFOVERIF  ·  Surveillance de l'information française en temps réel  ·  ";

  return (
    <div
      style={{
        height: 26,
        background: "#060b14",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* BREAKING badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 12px",
          borderRight: "1px solid var(--border)",
          height: "100%",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            background: "#EF4135",
            color: "#fff",
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: "0.15em",
            padding: "2px 5px",
          }}
        >
          BREAKING
        </span>
        <span style={{ color: "#EF4135", fontSize: 10, lineHeight: 1 }}>▶</span>
      </div>

      {/* Scrolling text */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div
          className="bandeau-track"
          style={{
            display: "inline-block",
            whiteSpace: "nowrap",
            fontSize: 10,
            color: "var(--text-secondary)",
            letterSpacing: "0.04em",
          }}
        >
          {text + text}
        </div>
      </div>
    </div>
  );
}
