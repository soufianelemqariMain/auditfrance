"use client";

import { useState, useEffect } from "react";

interface Offre {
  id: string;
  titre: string;
  lieuTravail: string;
  typeContrat: string;
  salaire: string;
  urlOffre: string;
  dateCreation: string;
}

interface EmployeurEntry {
  nom: string;
  offres: Offre[];
}

interface OffresData {
  employeurs: EmployeurEntry[];
  total: number;
  source: "france_travail" | "unavailable";
  fetchedAt?: string;
  error?: string;
  message?: string;
}

interface Props {
  /** INSEE commune code — mutually exclusive with dept */
  commune?: string;
  /** Department code — mutually exclusive with commune */
  dept?: string;
}

export default function OffresTab({ commune, dept }: Props) {
  const [data, setData] = useState<OffresData | null>(null);
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [expanded, setExpanded] = useState<string | null>(null);

  const url = commune
    ? `/api/offres?commune=${commune}`
    : `/api/offres?dept=${dept}`;

  useEffect(() => {
    setStatus("loading");
    setData(null);
    setExpanded(null);
    fetch(url)
      .then((r) => r.json())
      .then((d: OffresData) => {
        setData(d);
        setStatus("done");
      })
      .catch(() => setStatus("error"));
  }, [url]);

  if (status === "loading") {
    return (
      <div style={{ fontSize: 11, color: "var(--text-secondary)", padding: "20px 0" }}>
        Chargement des offres France Travail…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ fontSize: 11, color: "#ef4444", padding: "20px 0" }}>
        Erreur lors du chargement des offres.
      </div>
    );
  }

  if (!data) return null;

  if (data.source === "unavailable") {
    return (
      <div>
        <div
          style={{
            background: "rgba(234,179,8,0.08)",
            border: "1px solid rgba(234,179,8,0.25)",
            borderRadius: 5,
            padding: "10px 12px",
            fontSize: 11,
            color: "var(--text-secondary)",
            lineHeight: 1.5,
          }}
        >
          {data.message ?? "Service France Travail temporairement indisponible."}
        </div>
        <div style={{ marginTop: 10 }}>
          <a
            href="https://candidat.francetravail.fr/offres/recherche"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: "var(--accent-blue)", textDecoration: "none" }}
          >
            → Rechercher sur francetravail.fr
          </a>
        </div>
      </div>
    );
  }

  const { employeurs, total } = data;

  if (total === 0) {
    return (
      <div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", padding: "12px 0", lineHeight: 1.5 }}>
          Aucune offre d'emploi trouvée dans cette zone via France Travail.
        </div>
        <a
          href="https://candidat.francetravail.fr/offres/recherche"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 11, color: "var(--accent-blue)", textDecoration: "none" }}
        >
          → Rechercher sur francetravail.fr
        </a>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 10 }}>
        <span style={{ color: "#22c55e", fontWeight: 700 }}>● </span>
        {total} offre{total > 1 ? "s" : ""} · {employeurs.length} recruteur{employeurs.length > 1 ? "s" : ""} · France Travail
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {employeurs.map((emp) => {
          const isOpen = expanded === emp.nom;
          const maxOffers = emp.offres.length;
          return (
            <div
              key={emp.nom}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border)",
                borderRadius: 5,
                overflow: "hidden",
              }}
            >
              {/* Employer row — click to expand */}
              <button
                onClick={() => setExpanded(isOpen ? null : emp.nom)}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 10px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  gap: 8,
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {emp.nom}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: "#22c55e",
                      background: "rgba(34,197,94,0.1)",
                      border: "1px solid rgba(34,197,94,0.25)",
                      borderRadius: 3,
                      padding: "1px 6px",
                    }}
                  >
                    {maxOffers} offre{maxOffers > 1 ? "s" : ""}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>
                    {isOpen ? "▲" : "▼"}
                  </span>
                </div>
              </button>

              {/* Expanded offer list */}
              {isOpen && (
                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    maxHeight: 340,
                    overflowY: "auto",
                  }}
                >
                  {emp.offres.map((offre, i) => (
                    <div
                      key={offre.id || i}
                      style={{
                        padding: "8px 10px",
                        borderBottom:
                          i < emp.offres.length - 1 ? "1px solid var(--border)" : "none",
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
                        {offre.titre}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {offre.lieuTravail && (
                          <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>
                            📍 {offre.lieuTravail}
                          </span>
                        )}
                        {offre.typeContrat && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: "var(--accent-blue)",
                              background: "rgba(0,85,164,0.1)",
                              border: "1px solid rgba(0,85,164,0.2)",
                              borderRadius: 3,
                              padding: "1px 5px",
                            }}
                          >
                            {offre.typeContrat}
                          </span>
                        )}
                      </div>
                      {offre.salaire && (
                        <div style={{ fontSize: 10, color: "#22c55e" }}>{offre.salaire}</div>
                      )}
                      {offre.urlOffre && (
                        <a
                          href={offre.urlOffre}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 10,
                            color: "var(--accent-blue)",
                            textDecoration: "none",
                            marginTop: 2,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          → Voir l'offre sur France Travail
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 10, letterSpacing: "0.05em" }}>
        Source : France Travail · francetravail.fr
      </div>
    </div>
  );
}
