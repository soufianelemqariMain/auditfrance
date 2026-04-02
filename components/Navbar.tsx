"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function formatUTC(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}-${month}-${day} · ${hours}:${minutes}:${seconds} UTC`;
}

export default function Navbar() {
  const [clock, setClock] = useState("");
  const [light, setLight] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("infoverif_theme");
    const preferLight = stored ? stored === "light" : window.matchMedia("(prefers-color-scheme: light)").matches;
    setLight(preferLight);
    document.body.classList.toggle("light", preferLight);
  }, []);

  function toggleTheme() {
    const next = !light;
    setLight(next);
    document.body.classList.toggle("light", next);
    localStorage.setItem("infoverif_theme", next ? "light" : "dark");
  }

  useEffect(() => {
    setClock(formatUTC(new Date()));
    const id = setInterval(() => setClock(formatUTC(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <nav
      style={{
        height: 48,
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        flexShrink: 0,
      }}
    >
      {/* Left: brand + nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>🔍</span>
          <div>
            <span
              style={{
                color: "var(--accent-white)",
                fontWeight: 700,
                letterSpacing: "0.2em",
                fontSize: 13,
                textTransform: "uppercase",
              }}
            >
              Info<span style={{ color: "var(--accent-blue)" }}>Verif</span>
            </span>
            <div style={{ fontSize: 8, color: "var(--text-secondary)", letterSpacing: "0.15em", marginTop: 1 }}>
              GLOBAL PREDICTION COMMUNITY
            </div>
          </div>
        </Link>

        <Link
          href="/predictions"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: "var(--accent-red)",
            border: "1px solid var(--accent-red)",
            padding: "3px 8px",
            textDecoration: "none",
            borderRadius: "2px",
          }}
        >
          Predictions
        </Link>

        <Link
          href="/leaderboard"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: "var(--accent-blue)",
            border: "1px solid var(--accent-blue)",
            padding: "3px 8px",
            textDecoration: "none",
            borderRadius: "2px",
          }}
        >
          Leaderboard
        </Link>

        <Link
          href="/pro"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: "var(--accent-green, #4ade80)",
            border: "1px solid var(--accent-green, #4ade80)",
            padding: "3px 8px",
            textDecoration: "none",
            borderRadius: "2px",
          }}
        >
          For Companies
        </Link>
      </div>

      {/* Center: UTC clock */}
      <span
        suppressHydrationWarning
        style={{
          fontSize: 11,
          color: "var(--text-secondary)",
          letterSpacing: "0.05em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {clock}
      </span>

      {/* Right: theme toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          onClick={toggleTheme}
          title={light ? "Dark mode" : "Light mode"}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            fontSize: 13,
            padding: "3px 8px",
            cursor: "pointer",
          }}
        >
          {light ? "🌙" : "☀️"}
        </button>
      </div>
    </nav>
  );
}
