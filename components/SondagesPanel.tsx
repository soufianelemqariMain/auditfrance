"use client";

interface Candidat {
  nom: string;
  parti: string;
  couleur: string;
  score: number; // % 1er tour
  evolution: number; // points vs sondage précédent
}

const CANDIDATS: Candidat[] = [
  { nom: "E. Philippe",    parti: "Horizons",   couleur: "#3b82f6", score: 27, evolution: +1 },
  { nom: "J. Bardella",    parti: "RN",         couleur: "#1d4ed8", score: 22, evolution: -1 },
  { nom: "J.-L. Mélenchon",parti: "LFI",        couleur: "#dc2626", score: 14, evolution: 0  },
  { nom: "G. Attal",       parti: "Renaissance",couleur: "#f59e0b", score: 11, evolution: +2 },
  { nom: "R. Glucksmann",  parti: "PS/Place P.", couleur: "#f97316", score: 9,  evolution: +1 },
  { nom: "A. Hidalgo",     parti: "PS",         couleur: "#ec4899", score: 5,  evolution: -1 },
  { nom: "F. Roussel",     parti: "PCF",        couleur: "#b91c1c", score: 4,  evolution: 0  },
  { nom: "Autres",         parti: "",           couleur: "#6b7280", score: 8,  evolution: 0  },
];

const SOURCE = "IFOP / Fiducial — Fév. 2026";

export default function SondagesPanel() {
  const max = Math.max(...CANDIDATS.map((c) => c.score));

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
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#f59e0b" }}>
          SONDAGES PRÉSIDENTIELLES 2027
        </span>
        <span style={{ fontSize: 8, color: "var(--text-secondary)", letterSpacing: "0.06em" }}>
          1ER TOUR
        </span>
      </div>

      {/* Candidates */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
        {CANDIDATS.map((c) => (
          <div
            key={c.nom}
            style={{
              padding: "3px 10px",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: c.couleur,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    letterSpacing: "0.04em",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {c.nom}
                </span>
                {c.parti && (
                  <span style={{ fontSize: 8, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                    {c.parti}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                {c.evolution !== 0 && (
                  <span
                    style={{
                      fontSize: 8,
                      color: c.evolution > 0 ? "#22c55e" : "#ef4444",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {c.evolution > 0 ? `▲${c.evolution}` : `▼${Math.abs(c.evolution)}`}
                  </span>
                )}
                <span style={{ fontSize: 11, fontWeight: 700, color: c.couleur, letterSpacing: "0.06em" }}>
                  {c.score}%
                </span>
              </div>
            </div>
            {/* Bar */}
            <div
              style={{
                height: 3,
                background: "var(--border)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(c.score / max) * 100}%`,
                  background: c.couleur,
                  borderRadius: 2,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Source */}
      <div
        style={{
          padding: "4px 10px",
          borderTop: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 8, color: "var(--text-secondary)", letterSpacing: "0.06em" }}>
          {SOURCE}
        </span>
      </div>
    </div>
  );
}
