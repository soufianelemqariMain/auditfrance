"use client";

import { useAppStore, VigipiratLevel } from "../lib/store";

const LEVEL_MAP: Record<VigipiratLevel, { color: string; label: string }> = {
  VIGILANCE_RENFORCEE: { color: "#00ff41", label: "VIGILANCE RENFORCÉE" },
  SECURITE_RENFORCEE: { color: "#ffcc00", label: "SÉCURITÉ RENFORCÉE" },
  URGENCE_ATTENTAT: { color: "#ff2020", label: "URGENCE ATTENTAT" },
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
        fontSize: 11,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: color,
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      <span>{label}</span>
    </div>
  );
}
