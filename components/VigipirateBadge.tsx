"use client";

import { useAppStore, VigipiratLevel } from "../lib/store";

const LEVEL_MAP: Record<VigipiratLevel, { color: string; label: string }> = {
  VIGILANCE_RENFORCEE: { color: "#00ff41", label: "Vigilance Renforcée" },
  SECURITE_RENFORCEE: { color: "#ffcc00", label: "Sécurité Renforcée" },
  URGENCE_ATTENTAT: { color: "#ff2020", label: "Urgence Attentat" },
};

export default function VigipirateBadge() {
  const vigipirate = useAppStore((s) => s.vigipirate);
  const { color, label } = LEVEL_MAP[vigipirate];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 10,
        letterSpacing: "0.08em",
        color: color,
      }}
    >
      <div
        style={{
          width: 7,
          height: 7,
          backgroundColor: color,
          flexShrink: 0,
          boxShadow: `0 0 5px ${color}88`,
        }}
      />
      <span style={{ color: "var(--text-secondary)", textTransform: "uppercase" }}>Vigipirate</span>
      <span style={{ fontWeight: 700, textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}
