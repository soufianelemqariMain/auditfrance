"use client";

import { useState, useEffect } from "react";
import OffresTab from "./OffresTab";

interface MaireInfo {
  nom: string;
  prenom: string;
  csp: string;
  mandatDebut: string;
}

interface BudgetYear {
  annee: number;
  depFonctHab: number;
  recFonctHab: number;
  detteEncHab: number;
  epargneBruteHab: number;
}

interface CommuneData {
  commune: {
    code: string;
    nom: string;
    population: number;
    surface: number;
    codeDepartement: string;
    nomDepartement: string;
    codeRegion: string;
  };
  maire: MaireInfo | null;
  budget: BudgetYear[] | null;
  elections2026Pending: boolean;
}

interface Props {
  code: string;
  nom: string;
  onClose: () => void;
}

export default function CommunePanel({ code, nom, onClose }: Props) {
  const [tab, setTab] = useState<"apercu" | "maire" | "budget" | "marches" | "recrutement">("apercu");
  const [data, setData] = useState<CommuneData | null>(null);
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    setStatus("loading");
    setData(null);
    fetch(`/api/commune/${code}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setStatus("done"); })
      .catch(() => setStatus("error"));
  }, [code]);

  const commune = data?.commune;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: 600,
        height: "100%",
        background: "var(--bg-panel)",
        borderLeft: "1px solid var(--border)",
        zIndex: 25,
        display: "flex",
        flexDirection: "column",
        boxShadow: "-8px 0 30px rgba(0,0,0,0.5)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
          background: "var(--bg-secondary)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              {commune?.nom ?? nom}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
              Commune{" "}
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-blue)" }}>{code}</span>
              {commune && (
                <span style={{ marginLeft: 8 }}>· {commune.nomDepartement} ({commune.codeDepartement})</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              fontSize: 14,
              cursor: "pointer",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginTop: 10, overflowX: "auto" }}>
          {(["apercu", "maire", "budget", "marches", "recrutement"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "5px 12px",
                fontSize: 10,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                borderBottom: tab === t ? "2px solid var(--accent-blue)" : "2px solid transparent",
                background: "transparent",
                color: tab === t ? "var(--text-primary)" : "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
            >
              {t === "apercu" ? "Aperçu" : t === "maire" ? "Maire" : t === "budget" ? "Budget" : t === "marches" ? "Marchés" : "Recrutement"}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "auto", padding: "14px 16px" }}>
        {status === "loading" && (
          <div style={{ fontSize: 11, color: "var(--text-secondary)", padding: "20px 0" }}>
            Chargement…
          </div>
        )}
        {status === "error" && (
          <div style={{ fontSize: 11, color: "#ef4444", padding: "20px 0" }}>
            Erreur lors du chargement de la commune {code}.
          </div>
        )}
        {status === "done" && data && (
          <>
            {tab === "apercu" && <ApercuTab commune={data.commune} />}
            {tab === "maire" && (
              <MaireTab
                maire={data.maire}
                elections2026Pending={data.elections2026Pending}
                communeNom={data.commune.nom}
              />
            )}
            {tab === "budget" && <BudgetTab budget={data.budget} communeNom={data.commune.nom} code={code} />}
            {tab === "marches" && <MarchesTab commune={data.commune} />}
            {tab === "recrutement" && <OffresTab commune={code} />}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Aperçu tab ───────────────────────────────────────────────────────────────
function ApercuTab({ commune }: { commune: CommuneData["commune"] }) {
  const density = commune.surface > 0
    ? Math.round(commune.population / (commune.surface / 100))
    : 0;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <StatCard label="Population" value={fmtPop(commune.population)} accent="var(--accent-blue)" />
        <StatCard label="Superficie" value={`${(commune.surface / 100).toFixed(1)} km²`} accent="var(--accent-yellow)" />
        <StatCard label="Densité" value={`${density.toLocaleString("fr-FR")} hab/km²`} accent="var(--accent-red)" />
        <StatCard label="Département" value={`${commune.nomDepartement}`} accent="#22c55e" />
      </div>

      <div style={{ background: "rgba(0,85,164,0.08)", border: "1px solid rgba(0,85,164,0.2)", borderRadius: 6, padding: "10px 12px", marginBottom: 14, fontSize: 12 }}>
        <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Identité</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <InfoRow label="Commune" value={commune.nom} />
          <InfoRow label="Code INSEE" value={commune.code} mono />
          <InfoRow label="Département" value={`${commune.nomDepartement} (${commune.codeDepartement})`} />
          <InfoRow label="Code région" value={commune.codeRegion} mono />
        </div>
      </div>

      <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 8, letterSpacing: "0.05em" }}>
        Sources : geo.api.gouv.fr · INSEE
      </div>
    </div>
  );
}

// ─── Maire tab ────────────────────────────────────────────────────────────────
function MaireTab({
  maire,
  elections2026Pending,
  communeNom,
}: {
  maire: MaireInfo | null;
  elections2026Pending: boolean;
  communeNom: string;
}) {
  return (
    <div>
      {/* 2026 election results pending banner */}
      {elections2026Pending && (
        <div
          style={{
            background: "rgba(234,179,8,0.1)",
            border: "1px solid rgba(234,179,8,0.35)",
            borderRadius: 5,
            padding: "8px 10px",
            marginBottom: 14,
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          <span style={{ fontSize: 13 }}>⏳</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#eab308", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
              Municipales 2026 — résultats en attente
            </div>
            <div style={{ fontSize: 10, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Les résultats officiels du 2e tour (22 mars 2026) seront publiés dès mise en ligne par le Ministère de l'Intérieur.{" "}
              <a
                href="https://www.resultats-elections.interieur.gouv.fr/municipales2026/index.html"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent-blue)" }}
              >
                → resultats-elections.interieur.gouv.fr
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Current maire from RNE */}
      <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
        Maire en exercice · Répertoire National des Élus (RNE)
      </div>

      {maire ? (
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--border)",
            borderRadius: 5,
            padding: "10px 12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                {maire.prenom} {maire.nom}
              </div>
              {maire.csp && (
                <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 2 }}>
                  {maire.csp}
                </div>
              )}
            </div>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 3,
                background: "rgba(34,197,94,0.12)",
                color: "#22c55e",
                border: "1px solid rgba(34,197,94,0.3)",
                flexShrink: 0,
              }}
            >
              MAIRE
            </span>
          </div>
          {maire.mandatDebut && (
            <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 6 }}>
              Mandat depuis le {fmtDate(maire.mandatDebut)}
            </div>
          )}
          <div style={{ marginTop: 8 }}>
            <a
              href={`https://www.resultats-elections.interieur.gouv.fr/municipales2026/index.html`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 10, color: "var(--accent-blue)", textDecoration: "none" }}
            >
              → Vérifier les résultats 2026
            </a>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: "var(--text-secondary)", padding: "12px 0" }}>
          Aucun·e maire trouvé·e dans le RNE pour {communeNom} (code {" "}
          <span style={{ fontFamily: "var(--font-mono)" }}>—</span>).
          <div style={{ marginTop: 8 }}>
            <a
              href="https://www.data.gouv.fr/fr/datasets/repertoire-national-des-elus-1/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--accent-blue)", fontSize: 10 }}
            >
              → Consulter le RNE sur data.gouv.fr
            </a>
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 14, letterSpacing: "0.05em" }}>
        Sources : RNE — Ministère de l'Intérieur · data.gouv.fr
      </div>
    </div>
  );
}

// ─── Budget tab ───────────────────────────────────────────────────────────────
function BudgetTab({
  budget,
  communeNom,
  code,
}: {
  budget: BudgetYear[] | null;
  communeNom: string;
  code: string;
}) {
  if (!budget || budget.length === 0) {
    return (
      <div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", padding: "12px 0" }}>
          Données budgétaires OFGL non disponibles pour {communeNom}.
        </div>
        <a
          href={`https://data.ofgl.fr/explore/dataset/ofgl-base-communes/table/?refine.insee_com=${code}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 10, color: "var(--accent-blue)", textDecoration: "none" }}
        >
          → Consulter sur data.ofgl.fr
        </a>
      </div>
    );
  }

  const latest = budget[0];
  const fmt = (n: number) => n > 0 ? `${Math.round(n).toLocaleString("fr-FR")} €/hab` : "—";

  return (
    <div>
      <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 10, lineHeight: 1.5 }}>
        Données OFGL {latest.annee} — comptes de gestion des communes.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <StatCard label={`Dépenses fonct. (${latest.annee})`} value={fmt(latest.depFonctHab)} accent="var(--accent-red)" />
        <StatCard label={`Recettes fonct. (${latest.annee})`} value={fmt(latest.recFonctHab)} accent="var(--accent-blue)" />
        <StatCard label="Épargne brute" value={fmt(latest.epargneBruteHab)} accent="#22c55e" />
        <StatCard label="Dette encours" value={fmt(latest.detteEncHab)} accent="var(--accent-yellow)" />
      </div>

      {budget.length > 1 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
            Évolution dépenses/recettes (€/hab)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[...budget].reverse().map((y) => (
              <div key={y.annee} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-secondary)", width: 32, flexShrink: 0 }}>
                  {y.annee}
                </span>
                <BudgetBar value={y.depFonctHab} max={budget[budget.length - 1].depFonctHab * 1.5} color="var(--accent-red)" />
                <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-secondary)", width: 60, flexShrink: 0, textAlign: "right" }}>
                  {Math.round(y.depFonctHab).toLocaleString("fr-FR")} €
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 8, letterSpacing: "0.05em" }}>
        Sources : OFGL · data.ofgl.fr · DGFiP
      </div>
    </div>
  );
}

// ─── Marchés tab ──────────────────────────────────────────────────────────────
function MarchesTab({ commune }: { commune: CommuneData["commune"] }) {
  const boampUrl = `https://www.boamp.fr/pages/avis/?q=code_departement:${commune.codeDepartement}`;
  const decpUrl = `https://data.gouv.fr/fr/datasets/donnees-essentielles-des-contrats-de-la-commande-publique/`;

  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.6 }}>
        Marchés publics de la commune de {commune.nom}. Consultez le BOAMP pour les appels d'offres
        du département <strong>{commune.nomDepartement}</strong>, ou les données DECP pour les contrats
        déjà conclus.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <ExtLink href={boampUrl} label={`Appels d'offres — dépt ${commune.codeDepartement} (BOAMP)`} />
        <ExtLink href={decpUrl} label="Données essentielles marchés publics (DECP)" />
        <ExtLink
          href={`https://www.data.gouv.fr/fr/search/?q=${encodeURIComponent(commune.nom)}&type=dataset`}
          label={`Données ouvertes — ${commune.nom}`}
        />
      </div>

      <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 14, letterSpacing: "0.05em" }}>
        Sources : BOAMP · DECP · data.gouv.fr
      </div>
    </div>
  );
}

// ─── Utility components ───────────────────────────────────────────────────────
function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--border)",
        borderRadius: 5,
        padding: "8px 10px",
        borderTop: `2px solid ${accent}`,
      }}
    >
      <div style={{ fontSize: 9, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
        {value}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>{label}</span>
      <span style={{ color: "var(--text-primary)", fontSize: 11, fontFamily: mono ? "var(--font-mono)" : undefined }}>
        {value}
      </span>
    </div>
  );
}

function BudgetBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ flex: 1, height: 14, background: "rgba(255,255,255,0.04)", borderRadius: 3, overflow: "hidden" }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          opacity: 0.75,
          borderRadius: 3,
          minWidth: 2,
        }}
      />
    </div>
  );
}

function ExtLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        color: "var(--accent-blue)",
        fontSize: 11,
        textDecoration: "none",
        padding: "6px 8px",
        border: "1px solid rgba(0,85,164,0.3)",
        borderRadius: 4,
      }}
    >
      <span>→</span>
      <span>{label}</span>
    </a>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtPop(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k`;
  return String(n);
}

function fmtDate(s: string): string {
  if (!s) return "—";
  const parts = s.slice(0, 10).split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return s.slice(0, 10);
}
