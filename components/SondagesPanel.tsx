"use client";

// Sondages présidentiels 2027 — 1er tour
// Source: IFOP/Fiducial, mars 2026
// trend: "up" | "down" | "flat"
const CANDIDATES = [
  { name: "J. Bardella",  party: "RN",         score: 33, trend: "up"   },
  { name: "É. Philippe",  party: "Horizons",   score: 21, trend: "down" },
  { name: "G. Attal",     party: "Renaiss.",   score: 12, trend: "flat" },
  { name: "J.-L. Mélen.", party: "LFI",        score: 10, trend: "down" },
  { name: "F. Ruffin",    party: "Gauche",     score:  8, trend: "up"   },
  { name: "É. Ciotti",    party: "LR",         score:  5, trend: "down" },
];

const PARTY_COLOR: Record<string, string> = {
  RN: "#3b5bdb",
  Horizons: "#339af0",
  "Renaiss.": "#f59f00",
  LFI: "#c92a2a",
  PS: "#e64980",
  LR: "#1864ab",
  Gauche: "#c92a2a",
};

const TREND_ICON: Record<string, string> = {
  up: "▲",
  down: "▼",
  flat: "—",
};
const TREND_COLOR: Record<string, string> = {
  up: "#22c55e",
  down: "#ef4444",
  flat: "#6b7280",
};

export default function SondagesPanel() {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: "1px solid var(--border)" }}>
      {/* Header */}
      <div style={{ padding: "5px 10px 4px", borderBottom: "1px solid var(--border)", flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Sondages 2027
        </span>
        <span style={{ fontSize: 8, color: "var(--border)", fontFamily: "var(--font-mono)" }}>IFOP mars 26</span>
      </div>

      {/* Candidate list */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {CANDIDATES.map((c, i) => {
          const color = PARTY_COLOR[c.party] ?? "#6b7280";
          return (
            <div
              key={c.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 8px",
                borderBottom: "1px solid rgba(255,255,255,0.03)",
              }}
            >
              <span style={{ fontSize: 9, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", width: 10, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: 10, color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
              <span style={{ fontSize: 8, padding: "1px 4px", borderRadius: 2, background: color + "22", color, border: `1px solid ${color}33`, flexShrink: 0 }}>{c.party}</span>
              <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--text-primary)", width: 28, textAlign: "right", flexShrink: 0 }}>{c.score}%</span>
              <span style={{ fontSize: 9, color: TREND_COLOR[c.trend], width: 10, textAlign: "right", flexShrink: 0 }}>{TREND_ICON[c.trend]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
