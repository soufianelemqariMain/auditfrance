"use client";

import { useEffect, useState, useCallback } from "react";

interface EmployerEntry {
  nom: string;
  offres: number;
  secteur: string;
  localisation: string;
}

interface RecrutementData {
  topEmployeurs: EmployerEntry[];
  totalOffres: number;
  fetchedAt: string;
  source: "france_travail" | "unavailable";
  message?: string;
  error?: string;
}

const REFRESH_MS = 30 * 60 * 1000; // 30 min

export default function RecrutementPanel() {
  const [data, setData] = useState<RecrutementData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/recrutement");
      const json: RecrutementData = await res.json();
      setData(json);
    } catch {
      // keep stale
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  const updatedAt = data?.fetchedAt
    ? new Date(data.fetchedAt).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const max = data?.topEmployeurs?.[0]?.offres ?? 1;

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
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#22c55e" }}>
          RECRUTEMENT
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {updatedAt && (
            <span style={{ fontSize: 8, color: "var(--text-secondary)", letterSpacing: "0.06em" }}>
              {updatedAt}
            </span>
          )}
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: data?.source === "france_travail" ? "#22c55e" : "var(--border)",
              boxShadow: data?.source === "france_travail" ? "0 0 4px #22c55e" : "none",
            }}
          />
        </div>
      </div>

      {/* Total */}
      {data?.source === "france_travail" && (
        <div
          style={{
            padding: "5px 10px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
            background: "rgba(34,197,94,0.05)",
          }}
        >
          <span style={{ fontSize: 9, color: "var(--text-secondary)", letterSpacing: "0.08em" }}>
            TOP RECRUTEUR
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#22c55e", letterSpacing: "0.06em" }}>
            {data.totalOffres > 0
              ? data.totalOffres.toLocaleString("fr-FR")
              : `${data.topEmployeurs.length * 3}+`}
          </span>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading && !data && (
          <div style={{ padding: "12px 10px", fontSize: 10, color: "var(--text-secondary)", letterSpacing: "0.1em" }}>
            CHARGEMENT...
          </div>
        )}

        {data?.source === "unavailable" && (
          <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 9, color: "var(--accent-yellow)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Configuration requise
            </div>
            <div style={{ fontSize: 9, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {data.message ?? "Ajoutez les identifiants France Travail dans .env.local"}
            </div>
            <a
              href="https://francetravail.io/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 9, color: "var(--accent-blue)", textDecoration: "none", marginTop: 4 }}
            >
              → francetravail.io (inscription gratuite)
            </a>
          </div>
        )}

        {data?.source === "france_travail" &&
          data.topEmployeurs.map((e, i) => {
            const pct = max > 0 ? (e.offres / max) * 100 : 0;
            return (
              <div
                key={e.nom}
                style={{
                  padding: "4px 10px",
                  borderBottom: "1px solid rgba(31,31,31,0.6)",
                }}
              >
                {/* Rank + name */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 4, marginBottom: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 8, color: "var(--text-secondary)", width: 14, flexShrink: 0 }}>
                      {i + 1}.
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        color: "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        letterSpacing: "0.03em",
                      }}
                    >
                      {e.nom}
                    </span>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#22c55e", flexShrink: 0, letterSpacing: "0.04em" }}>
                    {e.offres}
                  </span>
                </div>

                {/* Bar */}
                <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden", marginLeft: 19 }}>
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: "#22c55e",
                      opacity: 0.7,
                      borderRadius: 2,
                      minWidth: 2,
                    }}
                  />
                </div>

                {/* Location */}
                {e.localisation && (
                  <div style={{ fontSize: 8, color: "var(--text-secondary)", marginLeft: 19, marginTop: 1, letterSpacing: "0.04em" }}>
                    {e.localisation}
                  </div>
                )}
              </div>
            );
          })}
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
        FRANCE TRAVAIL · CDI · TOP RECRUTEURS
      </div>
    </div>
  );
}
