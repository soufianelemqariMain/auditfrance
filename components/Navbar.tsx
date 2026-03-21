"use client";

import { useEffect, useState } from "react";
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
        <span style={{ fontSize: 18, lineHeight: 1 }}>🐓</span>
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
            Audit{" "}
            <span style={{ color: "var(--accent-red)" }}>France</span>
          </span>
          <div style={{ fontSize: 8, color: "var(--text-secondary)", letterSpacing: "0.15em", marginTop: 1 }}>
            LIBERTÉ · ÉGALITÉ · INFORMATION
          </div>
        </div>

        {/* Tagline */}
        <div style={{ marginLeft: 12, fontSize: 10, color: "var(--text-secondary)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Intelligence · Économie · Territoire
        </div>
      </div>

      {/* Center: live UTC clock — suppressHydrationWarning prevents #418 mismatch */}
      <span
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
