"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

interface MarchesData {
  count: number;
  totalMontant: number;
  recent: Array<{
    montant?: number;
    acheteur?: { nom?: string };
    objet?: string;
    dateNotification?: string;
  }>;
}

interface EntrepriseResult {
  siren: string;
  company: {
    unite_legale?: {
      denomination?: string;
      sigle?: string;
      categorie_juridique_libelle?: string;
      activite_principale_libelle?: string;
      etat_administratif?: string;
      date_creation?: string;
      tranche_effectif_salarie_libelle?: string;
    };
    adresse?: {
      libelle_voie?: string;
      libelle_commune?: string;
      code_postal?: string;
    };
  } | null;
  marches: MarchesData;
  subventions: { total: number; count: number };
  alerts: string[];
  error?: string;
}

interface SearchResult {
  siren: string;
  nom_complet?: string;
  denomination?: string;
  activite_principale_libelle?: string;
  etat_administratif?: string;
  siege?: {
    commune?: string;
  };
}

function formatEur(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M€`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k€`;
  return `${n}€`;
}

export default function EntreprisePage() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<EntrepriseResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    setSearchResults([]);
    setSelected(null);
    try {
      const res = await fetch(`/api/entreprise?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setSearchResults(data.results ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function loadSiren(siren: string) {
    setLoading(true);
    setSelected(null);
    setSearchResults([]);
    try {
      const res = await fetch(`/api/entreprise/${siren}`);
      const data: EntrepriseResult = await res.json();
      setSelected(data);
    } catch (err) {
      setSelected({ siren, company: null, marches: { count: 0, totalMontant: 0, recent: [] }, subventions: { total: 0, count: 0 }, alerts: [], error: err instanceof Error ? err.message : "Erreur" });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") search();
  }

  const ul = selected?.company?.["unite_legale" as keyof typeof selected.company] as EntrepriseResult["company"] extends null ? never : NonNullable<EntrepriseResult["company"]>["unite_legale"];
  const addr = selected?.company?.["adresse" as keyof typeof selected.company] as EntrepriseResult["company"] extends null ? never : NonNullable<EntrepriseResult["company"]>["adresse"];
  const isActive = (ul as { etat_administratif?: string } | undefined)?.etat_administratif === "A";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--bg-primary)",
        overflow: "hidden",
      }}
    >
      <Navbar />

      <div
        style={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "40px 24px",
        }}
      >
        {/* Header */}
        <div style={{ width: "100%", maxWidth: 720, marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>🏢</span>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Audit Entreprise
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  letterSpacing: "0.08em",
                  marginTop: 2,
                }}
              >
                MARCHÉS PUBLICS · SUBVENTIONS · SANTÉ FINANCIÈRE
              </p>
            </div>
          </div>
          <div
            style={{
              height: 2,
              background: "linear-gradient(90deg, var(--accent-blue) 0%, transparent 100%)",
              borderRadius: 1,
            }}
          />
        </div>

        {/* Search */}
        <div
          style={{
            width: "100%",
            maxWidth: 720,
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <label
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              display: "block",
              marginBottom: 8,
            }}
          >
            Rechercher une entreprise
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nom, SIREN, ou activité…"
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                color: "var(--text-primary)",
                fontSize: 13,
                fontFamily: "inherit",
                padding: "10px 14px",
                outline: "none",
              }}
            />
            <button
              onClick={search}
              disabled={!query.trim() || searching}
              style={{
                background: "var(--accent-blue)",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                cursor: !query.trim() || searching ? "default" : "pointer",
                fontFamily: "inherit",
                opacity: !query.trim() || searching ? 0.5 : 1,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {searching ? "…" : "Rechercher"}
            </button>
          </div>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div
            style={{
              width: "100%",
              maxWidth: 720,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              marginBottom: 24,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 16px",
                borderBottom: "1px solid var(--border)",
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {searchResults.length} résultat{searchResults.length > 1 ? "s" : ""}
            </div>
            {searchResults.map((r) => (
              <button
                key={r.siren}
                onClick={() => loadSiren(r.siren)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  color: "var(--text-primary)",
                  fontFamily: "inherit",
                  cursor: "pointer",
                  textAlign: "left",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                    {r.nom_complet ?? r.denomination ?? r.siren}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    {r.siren}
                    {r.activite_principale_libelle ? ` · ${r.activite_principale_libelle}` : ""}
                    {r.siege?.commune ? ` · ${r.siege.commune}` : ""}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 3,
                    flexShrink: 0,
                    background:
                      r.etat_administratif === "A"
                        ? "rgba(34,197,94,0.12)"
                        : "rgba(239,68,68,0.12)",
                    color: r.etat_administratif === "A" ? "#22c55e" : "#ef4444",
                  }}
                >
                  {r.etat_administratif === "A" ? "ACTIVE" : "CESSÉE"}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 40,
              color: "var(--text-secondary)",
              fontSize: 13,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 16,
                height: 16,
                border: "2px solid var(--border)",
                borderTopColor: "var(--accent-blue)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            Chargement des données publiques…
          </div>
        )}

        {/* Company result */}
        {selected && !loading && (
          <div style={{ width: "100%", maxWidth: 720, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Alerts */}
            {selected.alerts.length > 0 && (
              <div
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 6,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#ef4444",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 8,
                  }}
                >
                  ⚠️ Alertes
                </div>
                {selected.alerts.map((a, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#ef4444", marginBottom: 4 }}>
                    • {a}
                  </div>
                ))}
              </div>
            )}

            {/* Identity card */}
            <div
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: 24,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 18,
                      fontWeight: 800,
                      color: "var(--text-primary)",
                      marginBottom: 4,
                    }}
                  >
                    {(ul as { denomination?: string } | undefined)?.denomination ?? selected.siren}
                  </h2>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                    SIREN {selected.siren}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 4,
                    background: isActive ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                    color: isActive ? "#22c55e" : "#ef4444",
                    letterSpacing: "0.06em",
                  }}
                >
                  {isActive ? "ACTIVE" : "CESSÉE"}
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 12,
                  fontSize: 12,
                }}
              >
                {(ul as { activite_principale_libelle?: string } | undefined)?.activite_principale_libelle && (
                  <div>
                    <div style={{ color: "var(--text-secondary)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
                      Activité
                    </div>
                    <div style={{ color: "var(--text-primary)" }}>
                      {(ul as { activite_principale_libelle?: string }).activite_principale_libelle}
                    </div>
                  </div>
                )}
                {(ul as { date_creation?: string } | undefined)?.date_creation && (
                  <div>
                    <div style={{ color: "var(--text-secondary)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
                      Création
                    </div>
                    <div style={{ color: "var(--text-primary)" }}>
                      {(ul as { date_creation?: string }).date_creation}
                    </div>
                  </div>
                )}
                {(ul as { tranche_effectif_salarie_libelle?: string } | undefined)?.tranche_effectif_salarie_libelle && (
                  <div>
                    <div style={{ color: "var(--text-secondary)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
                      Effectif
                    </div>
                    <div style={{ color: "var(--text-primary)" }}>
                      {(ul as { tranche_effectif_salarie_libelle?: string }).tranche_effectif_salarie_libelle}
                    </div>
                  </div>
                )}
                {(addr as { libelle_commune?: string; code_postal?: string } | undefined)?.libelle_commune && (
                  <div>
                    <div style={{ color: "var(--text-secondary)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
                      Siège
                    </div>
                    <div style={{ color: "var(--text-primary)" }}>
                      {(addr as { libelle_commune: string; code_postal?: string }).libelle_commune}
                      {(addr as { code_postal?: string }).code_postal ? ` (${(addr as { code_postal: string }).code_postal})` : ""}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Marchés publics */}
            <div
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: 24,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  marginBottom: 16,
                }}
              >
                Marchés publics (DECP)
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 16,
                  marginBottom: selected.marches.recent.length ? 16 : 0,
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 4,
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
                    {selected.marches.count}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Contrats
                  </div>
                </div>
                <div
                  style={{
                    padding: "12px 16px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 4,
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent-blue)", marginBottom: 4 }}>
                    {formatEur(selected.marches.totalMontant)}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Volume total
                  </div>
                </div>
              </div>

              {selected.marches.recent.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                    Derniers contrats
                  </div>
                  {selected.marches.recent.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "8px 12px",
                        background: "rgba(255,255,255,0.02)",
                        borderRadius: 3,
                        marginBottom: 6,
                        border: "1px solid rgba(255,255,255,0.04)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 11, color: "var(--text-primary)", marginBottom: 2, lineHeight: 1.4 }}>
                          {m.objet ?? "Objet non renseigné"}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>
                          {m.acheteur?.nom ?? "Acheteur inconnu"}
                          {m.dateNotification ? ` · ${m.dateNotification.slice(0, 10)}` : ""}
                        </div>
                      </div>
                      {m.montant != null && (
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-blue)", flexShrink: 0 }}>
                          {formatEur(m.montant)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Subventions */}
            {selected.subventions.count > 0 && (
              <div
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: 24,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    marginBottom: 12,
                  }}
                >
                  Subventions publiques
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#22c55e", marginBottom: 4 }}>
                  {formatEur(selected.subventions.total)}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                  {selected.subventions.count} dossier{selected.subventions.count > 1 ? "s" : ""} de subvention
                </div>
              </div>
            )}

            {/* Data sources */}
            <div
              style={{
                textAlign: "center",
                paddingBottom: 20,
                fontSize: 10,
                color: "var(--text-secondary)",
                letterSpacing: "0.06em",
              }}
            >
              Sources : INSEE SIRENE · data.economie.gouv.fr (DECP) · data-subventions.beta.gouv.fr · données publiques
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
