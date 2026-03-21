"use client";

import { useEffect, useState, useCallback } from "react";
import type { StockQuote } from "@/app/api/stocks/route";

const REFRESH_MS = 60_000;

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function CAC40Panel() {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState("");

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await fetch("/api/stocks");
      const data = await res.json();
      if (Array.isArray(data.quotes)) {
        setQuotes(data.quotes);
        const d = new Date(data.fetchedAt);
        setUpdatedAt(
          d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        );
      }
    } catch {
      // keep stale data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
    const id = setInterval(fetchQuotes, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchQuotes]);

  // Separate index from company rows
  const index = quotes.find((q) => q.symbol === "^FCHI");
  const stocks = quotes.filter((q) => q.symbol !== "^FCHI");

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
        fontFamily: "var(--font-mono)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 10px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "var(--accent-yellow)" }}>
          CAC 40
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {updatedAt && (
            <span style={{ fontSize: 8, color: "var(--text-secondary)", letterSpacing: "0.06em" }}>
              {updatedAt}
            </span>
          )}
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-green)", boxShadow: "0 0 4px var(--accent-green)" }} />
        </div>
      </div>

      {/* CAC40 index row */}
      {index && (
        <div
          style={{
            padding: "6px 10px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            background: "rgba(255,204,0,0.05)",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-yellow)", letterSpacing: "0.05em" }}>
            {fmt(index.price, 0)}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: index.changePercent >= 0 ? "var(--accent-green)" : "var(--accent-red)",
              letterSpacing: "0.05em",
            }}
          >
            {index.changePercent >= 0 ? "+" : ""}
            {fmt(index.changePercent)}%
          </span>
        </div>
      )}

      {/* Stock list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading && quotes.length === 0 ? (
          <div style={{ padding: "12px 10px", fontSize: 10, color: "var(--text-secondary)", letterSpacing: "0.1em" }}>
            CHARGEMENT...
          </div>
        ) : stocks.length === 0 ? (
          <div style={{ padding: "12px 10px", fontSize: 10, color: "var(--text-secondary)", letterSpacing: "0.1em" }}>
            DONNÉES INDISPONIBLES
          </div>
        ) : (
          stocks.map((q) => {
            const up = q.changePercent >= 0;
            const color = up ? "var(--accent-green)" : "var(--accent-red)";
            return (
              <div
                key={q.symbol}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 10px",
                  borderBottom: "1px solid rgba(31,31,31,0.6)",
                }}
              >
                {/* Name */}
                <span
                  style={{
                    fontSize: 9,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                    paddingRight: 6,
                    letterSpacing: "0.03em",
                  }}
                >
                  {q.name}
                </span>
                {/* Price + change */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 9, color: "var(--text-primary)", letterSpacing: "0.04em" }}>
                    {fmt(q.price)}
                  </span>
                  <span style={{ fontSize: 9, color, fontWeight: 600, minWidth: 52, textAlign: "right", letterSpacing: "0.04em" }}>
                    {up ? "▲" : "▼"} {fmt(Math.abs(q.changePercent))}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "3px 10px",
          borderTop: "1px solid var(--border)",
          fontSize: 8,
          color: "var(--text-secondary)",
          letterSpacing: "0.08em",
          flexShrink: 0,
        }}
      >
        EURONEXT PARIS · DIFF. 60S
      </div>
    </div>
  );
}
