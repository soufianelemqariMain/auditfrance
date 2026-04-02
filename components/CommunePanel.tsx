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
  const [tab, setTab] = useState<"apercu" | "recrutement">("apercu");
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
      className="dept-panel"
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
          {(["apercu", "recrutement"] as const).map((t) => (
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
              {t === "apercu" ? "Aperçu" : "Offres d'emploi"}
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
  code,
  maire,
  communeNom,
}: {
  code: string;
  maire: MaireInfo | null;
  communeNom: string;
}) {
  const [newMayor, setNewMayor] = useState<{ prenom: string; nom: string; liste: string; nuance: string } | null>(null);
  const [mayorStatus, setMayorStatus] = useState<"loading" | "done" | "none">("loading");

  useEffect(() => {
    fetch(`/api/elections/municipales2026?commune=${code}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) { setMayorStatus("none"); return; }
        const elected = (d.listes as ListeResult[]).find((l) => l.elu);
        if (elected) {
          setNewMayor({ prenom: elected.prenomTete, nom: elected.nomTete, liste: elected.libelleAbr || elected.libelle, nuance: elected.nuance });
          setMayorStatus("done");
        } else {
          setMayorStatus("none");
        }
      })
      .catch(() => setMayorStatus("none"));
  }, [code]);

  return (
    <div>
      {/* New mayor from 2026 elections */}
      <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
        Maire élu·e · Municipales 2026 — 2e tour
      </div>

      {mayorStatus === "loading" && (
        <div style={{ fontSize: 11, color: "var(--text-secondary)", padding: "8px 0" }}>Chargement…</div>
      )}

      {mayorStatus === "done" && newMayor && (
        <div
          style={{
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.35)",
            borderRadius: 5,
            padding: "10px 12px",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                {newMayor.prenom} {newMayor.nom}
              </div>
              {newMayor.liste && (
                <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 2 }}>
                  {newMayor.liste}
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
              ÉLU·E 2026
            </span>
          </div>
          <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 5 }}>
            Élu·e le 23 mars 2026
          </div>
        </div>
      )}

      {mayorStatus === "none" && (
        <div style={{ fontSize: 11, color: "var(--text-secondary)", padding: "8px 0 14px" }}>
          Pas de résultats du 2e tour disponibles pour cette commune.
        </div>
      )}

      {/* Previous maire from RNE */}
      {maire && (
        <>
          <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
            Maire précédent·e · RNE
          </div>
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--border)",
              borderRadius: 5,
              padding: "10px 12px",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              {maire.prenom} {maire.nom}
            </div>
            {maire.csp && (
              <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 2 }}>{maire.csp}</div>
            )}
            {maire.mandatDebut && (
              <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>
                Mandat depuis le {fmtDate(maire.mandatDebut)}
              </div>
            )}
          </div>
        </>
      )}

      <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 14, letterSpacing: "0.05em" }}>
        Sources : data.gouv.fr — Municipales 2026 T2 · RNE Ministère de l'Intérieur
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

// ─── Élections tab ────────────────────────────────────────────────────────────
interface ListeResult {
  numPanneau: string;
  nomTete: string;
  prenomTete: string;
  nuance: string;
  libelleAbr: string;
  libelle: string;
  voix: number;
  pctVoixExprim: number;
  elu: boolean;
  siegesCM: number;
  siegesCC: number;
}

interface ElectionsData {
  codeCommune: string;
  libCommune: string;
  inscrits: number;
  votants: number;
  pctVotants: number;
  abstentions: number;
  pctAbstentions: number;
  exprimes: number;
  blancs: number;
  nuls: number;
  listes: ListeResult[];
  source: string;
}

// Colour by political nuance code
const NUANCE_COLOR: Record<string, string> = {
  LDVD: "#1d4ed8", LDVG: "#dc2626", LDIVERS: "#6b7280", LDVC: "#6b7280",
  LRN: "#1d4ed8",  LFI: "#dc2626",  LPS: "#f97316",    LUG: "#dc2626",
  LUD: "#1d4ed8",  LMAJM: "#f59e0b", LMAJD: "#3b82f6", LAVENIR: "#0ea5e9",
};
function nuanceColor(nuance: string): string {
  return NUANCE_COLOR[nuance] ?? "#6b7280";
}

function ElectionsTab({ code, communeNom }: { code: string; communeNom: string }) {
  const [data, setData] = useState<ElectionsData | null>(null);
  const [status, setStatus] = useState<"loading" | "done" | "notfound" | "error">("loading");

  useEffect(() => {
    setStatus("loading");
    setData(null);
    fetch(`/api/elections/municipales2026?commune=${code}`)
      .then((r) => {
        if (r.status === 404) { setStatus("notfound"); return null; }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => { if (d) { setData(d); setStatus("done"); } })
      .catch(() => setStatus("error"));
  }, [code]);

  if (status === "loading") {
    return <div style={{ fontSize: 11, color: "var(--text-secondary)", padding: "20px 0" }}>Chargement des résultats…</div>;
  }
  if (status === "notfound") {
    return (
      <div style={{ fontSize: 11, color: "var(--text-secondary)", padding: "12px 0" }}>
        Pas de résultats du 2e tour pour {communeNom} — cette commune a peut-être été réglée au 1er tour ou n'a pas eu de scrutin.
        <div style={{ marginTop: 10 }}>
          <ExtLink href="https://www.resultats-elections.interieur.gouv.fr/municipales2026/index.html" label="→ Résultats officiels Intérieur" />
        </div>
      </div>
    );
  }
  if (status === "error" || !data) {
    return <div style={{ fontSize: 11, color: "#ef4444", padding: "12px 0" }}>Erreur lors du chargement des résultats.</div>;
  }

  const maxVoix = Math.max(...data.listes.map((l) => l.voix), 1);
  const participation = data.inscrits > 0 ? (data.votants / data.inscrits) * 100 : 0;

  return (
    <div>
      {/* Title */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
          Municipales 2026 — 2e tour
        </div>
        <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>23 mars 2026 · {communeNom}</div>
      </div>

      {/* Turnout stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
        <StatCard label="Inscrits" value={data.inscrits.toLocaleString("fr-FR")} accent="var(--accent-blue)" />
        <StatCard label="Votants" value={`${participation.toFixed(1)} %`} accent="#22c55e" />
        <StatCard label="Abstentions" value={`${data.pctAbstentions.toFixed(1)} %`} accent="var(--accent-yellow)" />
      </div>

      {/* Participation bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 9, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Participation</span>
          <span style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
            {data.votants.toLocaleString("fr-FR")} / {data.inscrits.toLocaleString("fr-FR")}
          </span>
        </div>
        <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${participation}%`, background: "#22c55e", borderRadius: 3 }} />
        </div>
      </div>

      {/* Lists results */}
      <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
        Résultats par liste
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.listes.map((liste) => {
          const color = nuanceColor(liste.nuance);
          return (
            <div key={liste.numPanneau} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${liste.elu ? color : "var(--border)"}`, borderRadius: 5, padding: "8px 10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 5 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>
                      {liste.prenomTete} {liste.nomTete}
                    </span>
                    {liste.libelleAbr && (
                      <span style={{ fontSize: 9, background: `${color}22`, color, border: `1px solid ${color}44`, borderRadius: 3, padding: "1px 5px", fontWeight: 600 }}>
                        {liste.libelleAbr}
                      </span>
                    )}
                    {liste.elu && (
                      <span style={{ fontSize: 9, background: "rgba(34,197,94,0.12)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 3, padding: "1px 5px", fontWeight: 700 }}>
                        ÉLU·E
                      </span>
                    )}
                  </div>
                  {liste.libelle && liste.libelle !== liste.libelleAbr && (
                    <div style={{ fontSize: 9, color: "var(--text-secondary)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {liste.libelle}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: "var(--font-mono)" }}>
                    {liste.pctVoixExprim.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 9, color: "var(--text-secondary)" }}>
                    {liste.voix.toLocaleString("fr-FR")} voix
                  </div>
                </div>
              </div>
              {/* Bar */}
              <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(liste.voix / maxVoix) * 100}%`, background: color, borderRadius: 2 }} />
              </div>
              {(liste.siegesCM > 0 || liste.siegesCC > 0) && (
                <div style={{ fontSize: 9, color: "var(--text-secondary)", marginTop: 5 }}>
                  {liste.siegesCM > 0 && `${liste.siegesCM} siège${liste.siegesCM > 1 ? "s" : ""} au CM`}
                  {liste.siegesCM > 0 && liste.siegesCC > 0 && " · "}
                  {liste.siegesCC > 0 && `${liste.siegesCC} siège${liste.siegesCC > 1 ? "s" : ""} au CC`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 9, color: "var(--text-secondary)", marginTop: 12, letterSpacing: "0.05em" }}>
        Source : {data.source}
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
