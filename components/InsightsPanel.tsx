"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../lib/store";

function formatTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function InsightsPanel() {
  const insightText = useAppStore((s) => s.insightText);
  const setInsightText = useAppStore((s) => s.setInsightText);
  const insightLoading = useAppStore((s) => s.insightLoading);
  const setInsightLoading = useAppStore((s) => s.setInsightLoading);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function fetchInsights() {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setInsightLoading(true);
    setInsightText("");

    try {
      const res = await fetch("/api/insights", { signal: controller.signal });
      if (!res.ok || !res.body) {
        setInsightLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setInsightText(accumulated);
      }

      setLastUpdated(new Date());
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        // silently ignore non-abort errors
      }
    } finally {
      setInsightLoading(false);
    }
  }

  useEffect(() => {
    fetchInsights();
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return (
    <div
      style={{
        background: "var(--bg-panel)",
        borderTop: "1px solid var(--border)",
        borderLeft: "1px solid var(--border)",
        height: "100%",
        overflowY: "auto",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--accent-green)",
            }}
          >
            INSIGHTS IA
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {/* Pulsing green dot */}
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent-green)",
                boxShadow: "0 0 0 0 var(--accent-green)",
                animation: "pulse-ring 1.5s ease-out infinite",
              }}
            />
            <span
              style={{
                fontSize: 9,
                color: "var(--accent-green)",
                letterSpacing: "0.1em",
              }}
            >
              EN DIRECT
            </span>
          </div>
        </div>

        <button
          onClick={fetchInsights}
          title="Rafraîchir"
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            fontSize: 12,
            padding: "2px 6px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          🔄
        </button>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          fontSize: 12,
          lineHeight: 1.6,
          color: "var(--text-primary)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {insightLoading && !insightText ? (
          <span style={{ color: "var(--text-secondary)" }}>Chargement…</span>
        ) : insightText ? (
          <>
            {insightText}
            {insightLoading && (
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 14,
                  background: "var(--accent-green)",
                  marginLeft: 2,
                  verticalAlign: "text-bottom",
                  animation: "pulse-ring 0.8s step-start infinite",
                }}
              />
            )}
          </>
        ) : (
          <span style={{ color: "var(--text-secondary)" }}>Aucun insight disponible.</span>
        )}
      </div>

      {/* Timestamp */}
      {lastUpdated && (
        <div
          style={{
            fontSize: 10,
            color: "var(--text-secondary)",
            borderTop: "1px solid var(--border)",
            paddingTop: 8,
            flexShrink: 0,
          }}
        >
          Dernière mise à jour : {formatTimestamp(lastUpdated)}
        </div>
      )}
    </div>
  );
}
