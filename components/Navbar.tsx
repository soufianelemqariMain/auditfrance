"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import VigipirateBadge from "./VigipirateBadge";

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
  const [copied, setCopied] = useState(false);
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
    // Set immediately on mount to avoid server/client mismatch (hydration)
    setClock(formatUTC(new Date()));
    const id = setInterval(() => {
      setClock(formatUTC(new Date()));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleFullscreen() {
    document.documentElement.requestFullscreen();
  }

  return (
    <>
      {/* French tricolor stripe */}
      <div className="tricolor-bar" />

    <nav
      style={{
        height: 44,
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        flexShrink: 0,
      }}
    >
      {/* Left: brand + rooster + nav tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
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
              TRANSPARENCE · VÉRITÉ · DÉMOCRATIE
            </div>
          </div>
        </Link>

        {/* Nav links */}
        <Link
          href="/narratives"
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
            opacity: 0.85,
          }}
        >
          Prédictions
        </Link>
        <Link
          href="/analyse"
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
            opacity: 0.85,
          }}
        >
          Analyser
        </Link>
      </div>

      {/* Center: live UTC clock — suppressHydrationWarning prevents #418 mismatch */}
      <span
        className="nav-clock"
        suppressHydrationWarning
        style={{
          fontSize: 12,
          color: "var(--text-secondary)",
          letterSpacing: "0.05em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {clock}
      </span>

      {/* Right: badge + actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <VigipirateBadge />

        <button
          className="nav-share"
          onClick={handleShare}
          title="Copier le lien"
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: copied ? "var(--accent-green)" : "var(--text-secondary)",
            fontSize: 11,
            padding: "3px 8px",
            cursor: "pointer",
            letterSpacing: "0.05em",
          }}
        >
          {copied ? "COPIÉ" : "PARTAGER"}
        </button>

        <button
          onClick={toggleTheme}
          title={light ? "Thème sombre" : "Thème clair"}
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

        <button
          onClick={handleFullscreen}
          title="Plein écran"
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            fontSize: 11,
            padding: "3px 8px",
            cursor: "pointer",
            letterSpacing: "0.05em",
          }}
        >
          ⛶
        </button>
      </div>
    </nav>
    </>
  );
}
