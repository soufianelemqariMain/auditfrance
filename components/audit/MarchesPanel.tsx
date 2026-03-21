"use client";

import { useState, useCallback } from "react";
import { MARCHES_SAMPLE, fmtM } from "@/lib/auditData";

interface Attributaire {
  nom: string;
  siret: string;
  montantTotal: number;
  nbMarches: number;
  secteur: string;
  acheteursPrincipaux: string[];
}

interface MarchesData {
  totalMontant: number;
  totalMarches: number;
  periodeLabel: string;
  attributaires: Attributaire[];
}

const SECTOR_COLORS: Record<string, string> = {
  "BTP": "#f97316",
  "Défense / Électronique": "#ef4444",
  "Défense / Aéronautique": "#ef4444",
  "Défense navale": "#ef4444",
  "Défense / Missiles": "#ef4444",
  "IT / Conseil": "#6366f1",
  "Conseil / Audit": "#8b5cf6",
  "Énergie / Services": "#22c55e",
  "Énergie / Chauffage": "#22c55e",
  "Environnement": "#22c55e",
  "Routes / BTP": "#f97316",
  "Télécom / IT": "#06b6d4",
  "Télécom": "#06b6d4",
  "Restauration collective": "#eab308",
};

export default function MarchesPanel() {
  const [data, setData] = useState<MarchesData>(MARCHES_SAMPLE as MarchesData);
  const [apiStatus, setApiStatus] = useState<"idle" | "loading" | "live" | "error">("idle");
  const [apiMessage, setApiMessage] = useState("");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<"montantTotal" | "nbMarches" | "nom">("montantTotal");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  const filtered = data.attributaires
    .filter((a) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return a.nom.toLowerCase().includes(q) || a.secteur.toLowerCase().includes(q);
    });

  const sorted = [...filtered].sort((a, b) => {
    const d = sortDir === "asc" ? 1 : -1;
    if (sortCol === "nom") return d * a.nom.localeCompare(b.nom);
    return d * (a[sortCol] - b[sortCol]);
  });

  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const maxPages = Math.ceil(sorted.length / PAGE_SIZE);

  const toggleSort = useCallback((col: typeof sortCol) => {
    if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
    setPage(0);
  }, [sortCol]);

  async function fetchLive() {
    setApiStatus("loading");
    setApiMessage("Agrégation DECP en cours (serveur)…");
    try {
      const res = await fetch("/api/marches/national");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData({
        totalMontant: json.totalMontant,
        totalMarches: json.totalMarches,
        periodeLabel: json.periodeLabel,
        attributaires: json.attributaires,
      });
      setApiStatus("live");
      setApiMessage(`${json.attributaires.length} entreprises — données live DECP`);
    } catch (err) {
      setApiStatus("error");
      setApiMessage(String(err instanceof Error ? err.message : err));
    }
  }

  const th: React.CSSProperties = {
    padding: "8px 12px",
    fontSize: 10,
    fontWeight: 600,
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    borderBottom: "1px solid var(--border)",
    cursor: "pointer",
    whiteSpace: "nowrap",
    textAlign: "left",
    background: "rgba(255,255,255,0.02)",
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Status bar */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
          background: apiStatus === "live" ? "#22c55e" : apiStatus === "loading" ? "#eab308" : apiStatus === "error" ? "#ef4444" : "var(--border)",
          boxShadow: apiStatus === "live" ? "0 0 6px rgba(34,197,94,0.5)" : undefined,
          animation: apiStatus === "loading" ? "pulse 1s infinite" : undefined,
        }} />
        <span style={{ fontSize: 11, color: "var(--text-secondary)", flex: 1 }}>
          {apiMessage || data.periodeLabel}
        </span>

        <input
          type="text"
          placeholder="Chercher entreprise…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 11, padding: "4px 10px", outline: "none", fontFamily: "inherit", width: 160 }}
        />

        <button
          onClick={fetchLive}
          disabled={apiStatus === "loading"}
          style={{
            background: "var(--accent-blue)",
            color: "#fff",
            border: "none",
            padding: "5px 12px",
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            cursor: apiStatus === "loading" ? "default" : "pointer",
            fontFamily: "inherit",
            opacity: apiStatus === "loading" ? 0.6 : 1,
          }}
        >
          {apiStatus === "loading" ? "Chargement…" : "Charger DECP"}
        </button>
      </div>

      {/* Stats row */}
      <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 24, flexShrink: 0 }}>
        <Stat label="Total commande publique" value={fmtM(data.totalMontant)} />
        <Stat label="Marchés enregistrés" value={data.totalMarches.toLocaleString("fr-FR")} />
        <Stat label="Entreprises filtrées" value={filtered.length.toString()} />
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 28 }}>#</th>
              <th style={th} onClick={() => toggleSort("nom")}>Entreprise {sortCol === "nom" ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>
              <th style={th}>Secteur</th>
              <th style={{ ...th, textAlign: "right" }} onClick={() => toggleSort("montantTotal")}>
                Montant {sortCol === "montantTotal" ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </th>
              <th style={{ ...th, textAlign: "right" }} onClick={() => toggleSort("nbMarches")}>
                Marchés {sortCol === "nbMarches" ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </th>
              <th style={th}>Acheteurs principaux</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((a, i) => {
              const rank = page * PAGE_SIZE + i + 1;
              const sectorColor = SECTOR_COLORS[a.secteur] || "var(--text-secondary)";
              return (
                <tr key={a.nom} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "8px 12px", fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{rank}</td>
                  <td style={{ padding: "8px 12px", fontSize: 12, color: "var(--text-primary)", fontWeight: 500 }}>
                    <div>{a.nom}</div>
                    <div style={{ fontSize: 10, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{a.siret}</div>
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4,
                      background: sectorColor + "22", color: sectorColor, border: `1px solid ${sectorColor}44`,
                    }}>{a.secteur}</span>
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--accent-yellow)", fontWeight: 600 }}>
                    {fmtM(a.montantTotal)}
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                    {a.nbMarches.toLocaleString("fr-FR")}
                  </td>
                  <td style={{ padding: "8px 12px", fontSize: 10, color: "var(--text-secondary)", maxWidth: 220, overflow: "hidden" }}>
                    {a.acheteursPrincipaux.slice(0, 3).join(" · ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {maxPages > 1 && (
        <div style={{ padding: "8px 16px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 12px", color: "var(--text-secondary)", fontSize: 11, cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.4 : 1, fontFamily: "inherit" }}>
            ← Précédent
          </button>
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
            Page {page + 1} / {maxPages} — {sorted.length} entreprises
          </span>
          <button onClick={() => setPage((p) => Math.min(maxPages - 1, p + 1))} disabled={page >= maxPages - 1}
            style={{ background: "none", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 12px", color: "var(--text-secondary)", fontSize: 11, cursor: page >= maxPages - 1 ? "default" : "pointer", opacity: page >= maxPages - 1 ? 0.4 : 1, fontFamily: "inherit" }}>
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{value}</div>
    </div>
  );
}
