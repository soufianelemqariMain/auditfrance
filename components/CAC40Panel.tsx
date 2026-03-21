"use client";

import { useEffect, useRef } from "react";

// TradingView Mini Symbol Overview widget — free, no API key needed
// Renders a real-time CAC40 (PX1) chart inline
export default function CAC40Panel() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any previous widget
    containerRef.current.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    containerRef.current.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: "EURONEXT:PX1",
      width: "100%",
      height: "100%",
      locale: "fr",
      dateRange: "1D",
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "https://fr.tradingview.com/symbols/EURONEXT-PX1/",
      noTimeScale: false,
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div
      style={{
        background: "var(--bg-panel)",
        borderLeft: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
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
          padding: "5px 12px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.15em",
            color: "var(--accent-yellow)",
          }}
        >
          CAC 40
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--accent-green)",
              boxShadow: "0 0 4px var(--accent-green)",
            }}
          />
          <span style={{ fontSize: 9, color: "var(--accent-green)", letterSpacing: "0.1em" }}>
            EURONEXT
          </span>
        </div>
      </div>

      {/* TradingView widget mount point */}
      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ flex: 1, overflow: "hidden", minHeight: 0 }}
      />
    </div>
  );
}
