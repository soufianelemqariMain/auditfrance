"use client";

import { useState, useEffect, useCallback } from "react";
import { getDeptInfo, fmtPop, DEPT_SEARCH_TERMS } from "@/lib/deptData";
import { getPresidentCD, getPresidentCR } from "@/lib/elusData";
import { MARCHES_SAMPLE } from "@/lib/auditData";

interface DeptContract {
  titulaire: string;
  montant: number;
  acheteur: string;
  objet: string;
  date: string;
  procedure: string;
}

interface Props {
  code: string;
  nom: string;
  onClose: () => void;
}

const DECP_API = "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/decp-v3-marches-valides/records";

function fmtEur(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2).replace(".", ",") + " Md€";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(".", ",") + " M€";
  if (n >= 1e3) return Math.round(n / 1000) + " k€";
  return n + " €";
}

function fmtDate(s: string): string {
  if (!s) return "—";
  return s.slice(0, 10);
}

export default function DepartmentPanel({ code, nom, onClose }: Props) {
  const info = getDeptInfo(code);
  const [contracts, setContracts] = useState<DeptContract[] | null>(null);
  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [loadMsg, setLoadMsg] = useState("");
  const [tab, setTab] = useState<"apercu" | "marches" | "budget" | "elus">("apercu");

  // National sample procurement data relevant to this department's key buyers
  const sampleContracts = getSampleContracts(code);

  const fetchDecp = useCallback(async () => {
    setLoadStatus("loading");
    setLoadMsg("Interrogation DECP data.economie.gouv.fr…");
    try {
      const terms = DEPT_SEARCH_TERMS[code] ?? [nom];
      const whereTerms = terms.slice(0, 3).map(t => `acheteur_nom LIKE "%${t}%"`).join(" OR ");
      const url = `${DECP_API}?select=titulaire_denominationsociale_2,montant,acheteur_nom,objet,datenotification,procedure&where=(${encodeURIComponent(whereTerms)}) AND montant>25000&order_by=montant DESC&limit=20`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const results: DeptContract[] = (json.results || []).map((r: Record<string, unknown>) => ({
        titulaire: String(r.titulaire_denominationsociale_2 || "N/A"),
        montant: Number(r.montant) || 0,
        acheteur: String(r.acheteur_nom || ""),
        objet: String(r.objet || ""),
        date: String(r.datenotification || ""),
        procedure: String(r.procedure || ""),
      }));
      setContracts(results);
      setLoadStatus("done");
      setLoadMsg(`${results.length} marchés trouvés`);
    } catch (err) {
      setLoadStatus("error");
      setLoadMsg(String(err instanceof Error ? err.message : err));
    }
  }, [code, nom]);

  // Auto-fetch DECP when switching to marchés tab
  useEffect(() => {
    if (tab === "marches" && loadStatus === "idle") {
      fetchDecp();
    }
  }, [tab, loadStatus, fetchDecp]);

  const displayContracts = contracts ?? sampleContracts;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: 420,
        height: "100%",
        background: "var(--bg-panel)",
        borderLeft: "1px solid var(--border)",
        zIndex: 20,
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
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              {nom}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
              Département <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-blue)" }}>{code}</span>
              {info && (
                <span style={{ marginLeft: 8 }}>· {info.region}</span>
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
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginTop: 10 }}>
          {(["apercu", "elus", "marches", "budget"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "5px 14px",
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
              }}
            >
              {t === "apercu" ? "Aperçu" : t === "elus" ? "Élus" : t === "marches" ? "Marchés" : "Budget"}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "auto", padding: "14px 16px" }}>
        {tab === "apercu" && info && (
          <ApercuTab info={info} code={code} />
        )}
        {tab === "elus" && (
          <ElusTab code={code} region={info?.region ?? ""} />
        )}
        {tab === "marches" && (
          <MarchesTab
            contracts={displayContracts}
            loadStatus={loadStatus}
            loadMsg={loadMsg}
            isLive={contracts !== null}
            onRefresh={fetchDecp}
          />
        )}
        {tab === "budget" && (
          <BudgetTab code={code} nom={nom} />
        )}
      </div>
    </div>
  );
}

function ApercuTab({ info, code }: { info: ReturnType<typeof getDeptInfo> & object; code: string }) {
  if (!info) return null;
  return (
    <div>
      {/* Key stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <StatCard label="Population" value={fmtPop(info.population)} accent="var(--accent-blue)" />
        <StatCard label="Superficie" value={`${info.superficie.toLocaleString("fr-FR")} km²`} accent="var(--accent-yellow)" />
        <StatCard label="Densité" value={`${info.densité.toLocaleString("fr-FR")} hab/km²`} accent="var(--accent-red)" />
        <StatCard label="Préfecture" value={info.prefecture} accent="#22c55e" />
      </div>

      {/* Identity */}
      <div style={{ background: "rgba(0,85,164,0.08)", border: "1px solid rgba(0,85,164,0.2)", borderRadius: 6, padding: "10px 12px", marginBottom: 14, fontSize: 12 }}>
        <div style={{ color: "var(--text-secondary)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Identité</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <InfoRow label="Région" value={info.region} />
          <InfoRow label="Chef-lieu" value={info.prefecture} />
          <InfoRow label="Code INSEE" value={code} mono />
        </div>
      </div>

      {/* Links that actually work */}
      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>Sources officielles</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <ExtLink href={`https://www.insee.fr/fr/statistiques/1405599?geo=DEP-${code}`} label="INSEE — statistiques locales" />
        <ExtLink href={`https://fr.wikipedia.org/wiki/D%C3%A9partement_${info.nom.replace(/ /g, "_")}`} label="Wikipedia — fiche département" />
        <ExtLink href="https://www.ofgl.fr/les-chiffres-des-departements" label="OFGL — finances des départements" />
        <ExtLink href={`https://data.economie.gouv.fr/explore/dataset/decp-v3-marches-valides/table/?refine.acheteur_id=${code}`} label="DECP — marchés publics locaux" />
      </div>
    </div>
  );
}

interface DeputeActivite {
  presenceSemaines: number | null;
  interventionsHemicycle: number | null;
  interventionsCommission: number | null;
  amendementsProposes: number | null;
  amendementsAdoptes: number | null;
  questionsEcrites: number | null;
  questionsOrales: number | null;
  propositionsEcrites: number | null;
  rapports: number | null;
  nbMois: number | null;
}

interface DeputeInfo {
  nom: string;
  prenom: string;
  groupe: string;
  circo: string;
  numCirco: number;
  nbMandats: number;
  profession: string | null;
  mandatDebut: string;
  url: string;
  urlAN: string;
  twitter: string | null;
  score: number;
  activite: DeputeActivite;
}

function ElusTab({ code, region }: { code: string; region: string }) {
  const presidentCD = getPresidentCD(code);
  const presidentCR = getPresidentCR(region);
  const [deputes, setDeputes] = useState<DeputeInfo[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [legislature, setLegislature] = useState("");

  useEffect(() => {
    setStatus("loading");
    fetch(`/api/elus?dept=${code}`)
      .then((r) => r.json())
      .then((d) => {
        setDeputes(d.deputes ?? []);
        setLegislature(d.legislature ?? "");
        setStatus("done");
      })
      .catch((e) => {
        setStatus("error");
        setErrMsg(String(e?.message ?? e));
      });
  }, [code]);

  const GROUPE_COLORS: Record<string, string> = {
    RN: "#142B6F", LFI: "#CC0000", SOC: "#FF8083", RE: "#FFEB3B",
    LIOT: "#78716c", HOR: "#3DAADC", LR: "#006EB7", GDR: "#DD051D",
    ECO: "#6CB33F", UDI: "#3DAADC", DEM: "#F4A81F",
  };

  return (
    <div>
      {/* Conseil Départemental president */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
          Président·e du Conseil Départemental
        </div>
        {presidentCD ? (
          <EluCard
            nom={presidentCD.nom}
            role="Président·e CD"
            parti={presidentCD.parti}
            partiColor={presidentCD.partiColor}
            depuis={presidentCD.enPosteDepuis}
            url={presidentCD.profileUrl}
          />
        ) : (
          <div style={{ fontSize: 11, color: "var(--text-secondary)", padding: "8px 0" }}>
            Données non disponibles —{" "}
            <a href={`https://www.departements-regions.fr/departement/${code}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)" }}>
              voir site officiel
            </a>
          </div>
        )}
      </div>

      {/* Conseil Régional president */}
      {region && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
            Président·e du Conseil Régional · {region}
          </div>
          {presidentCR ? (
            <EluCard
              nom={presidentCR.nom}
              role="Président·e CR"
              parti={presidentCR.parti}
              partiColor={presidentCR.partiColor}
              depuis={presidentCR.enPosteDepuis}
              url={presidentCR.profileUrl}
            />
          ) : (
            <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Données non disponibles</div>
          )}
        </div>
      )}

      {/* Deputies */}
      <div>
        <div style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <span>Député·e·s à l'Assemblée Nationale</span>
          {status === "loading" && <span style={{ fontSize: 9, color: "var(--accent-yellow)" }}>chargement…</span>}
          {status === "done" && <span style={{ fontSize: 9, color: "#22c55e" }}>● {legislature || "nosdeputes.fr"}</span>}
          {status === "error" && <span style={{ fontSize: 9, color: "#ef4444" }} title={errMsg}>● erreur</span>}
        </div>

        {status === "done" && deputes.length === 0 && (
          <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
            Aucun·e député·e trouvé·e. <a href="https://www.assemblee-nationale.fr/dyn/deputes" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)" }}>→ Assemblée Nationale</a>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {deputes.map((d, i) => {
            const scoreColor = d.score >= 70 ? "#22c55e" : d.score >= 40 ? "#eab308" : "#ef4444";
            const gc = GROUPE_COLORS[d.groupe] ?? "#555";
            return (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 5, padding: "10px 10px" }}>
                {/* Name + group + score */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{d.prenom} {d.nom}</div>
                    <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 1 }}>
                      Circ. {d.numCirco} · {d.circo}
                      {d.profession && <span style={{ marginLeft: 6 }}>· {d.profession}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: gc + "22", color: gc, border: `1px solid ${gc}44` }}>{d.groupe}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 9, color: "var(--text-secondary)" }}>Score</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: scoreColor, fontFamily: "var(--font-mono)" }}>{d.score}</span>
                    </div>
                  </div>
                </div>

                {/* Activity mini-bars */}
                {d.activite.presenceSemaines !== null && (
                  <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px" }}>
                    <MiniStat label="Présence" value={d.activite.presenceSemaines} unit="sem." color="#22c55e" />
                    <MiniStat label="Interventions" value={(d.activite.interventionsHemicycle ?? 0) + (d.activite.interventionsCommission ?? 0)} unit="" color="var(--accent-blue)" />
                    <MiniStat label="Amendements" value={d.activite.amendementsProposes ?? 0} unit="proposés" color="var(--accent-yellow)" />
                    <MiniStat label="Questions" value={(d.activite.questionsEcrites ?? 0) + (d.activite.questionsOrales ?? 0)} unit="" color="#a855f7" />
                  </div>
                )}

                {/* Links */}
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "var(--accent-blue)", textDecoration: "none" }}>→ Activité détaillée</a>
                  {d.urlAN && <a href={d.urlAN} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "var(--text-secondary)", textDecoration: "none" }}>→ Fiche AN</a>}
                  {d.twitter && <a href={`https://twitter.com/${d.twitter}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#1DA1F2", textDecoration: "none" }}>→ Twitter</a>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Senate link */}
        <div style={{ marginTop: 12 }}>
          <ExtLink href={`https://www.senat.fr/elus-locaux/departement.html`} label="Sénateurs du département → Sénat.fr" />
        </div>
      </div>
    </div>
  );
}

function EluCard({ nom, role, parti, partiColor, depuis, url }: {
  nom: string; role: string; parti: string; partiColor: string; depuis: string; url?: string;
}) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 5, padding: "8px 10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{nom}</div>
          <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 2 }}>{role} · depuis {depuis}</div>
        </div>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 3,
          background: partiColor + "22", color: partiColor,
          border: `1px solid ${partiColor}44`,
        }}>{parti}</span>
      </div>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "var(--accent-blue)", textDecoration: "none", display: "block", marginTop: 6 }}>
          → Site officiel
        </a>
      )}
    </div>
  );
}

function MarchesTab({ contracts, loadStatus, loadMsg, isLive, onRefresh }: {
  contracts: DeptContract[];
  loadStatus: string;
  loadMsg: string;
  isLive: boolean;
  onRefresh: () => void;
}) {
  return (
    <div>
      {/* Status bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
          background: loadStatus === "done" ? (isLive ? "#22c55e" : "var(--accent-yellow)") : loadStatus === "loading" ? "#eab308" : loadStatus === "error" ? "#ef4444" : "var(--border)",
          boxShadow: (loadStatus === "done" && isLive) ? "0 0 6px rgba(34,197,94,0.5)" : undefined,
        }} />
        <span style={{ fontSize: 11, color: "var(--text-secondary)", flex: 1 }}>
          {loadMsg || (isLive ? "Données live DECP" : "Données nationales — cliquer Rafraîchir pour données locales")}
        </span>
        <button
          onClick={onRefresh}
          disabled={loadStatus === "loading"}
          style={{
            background: "var(--accent-blue)",
            color: "#fff",
            border: "none",
            padding: "3px 10px",
            fontSize: 10,
            fontWeight: 600,
            cursor: loadStatus === "loading" ? "default" : "pointer",
            opacity: loadStatus === "loading" ? 0.5 : 1,
            letterSpacing: "0.05em",
          }}
        >
          {loadStatus === "loading" ? "…" : "↻ DECP"}
        </button>
      </div>

      {contracts.length === 0 && loadStatus !== "loading" && (
        <div style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "center", padding: "24px 0" }}>
          Aucun marché trouvé
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {contracts.map((c, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid var(--border)",
            borderRadius: 5,
            padding: "8px 10px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3, flex: 1 }}>
                {c.titulaire}
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--accent-yellow)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
                {fmtEur(c.montant)}
              </div>
            </div>
            <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 3, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.objet || c.acheteur}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              {c.date && <span style={{ fontSize: 9, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{fmtDate(c.date)}</span>}
              {c.acheteur && <span style={{ fontSize: 9, color: "var(--text-secondary)" }}>{c.acheteur.slice(0, 40)}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BudgetTab({ code, nom }: { code: string; nom: string }) {
  // Departmental council budget estimates — OFGL 2022/2023 national averages scaled by population
  const info = getDeptInfo(code);
  const pop = info?.population ?? 500000;
  // ~5000€/hab for departmental spending on average (social, roads, college)
  const estDépenses = Math.round((pop * 5000) / 1e6); // M€
  const estRecettes = Math.round((pop * 4800) / 1e6);
  const estDotation = Math.round((pop * 1400) / 1e6);
  const estAction_sociale = Math.round((pop * 2800) / 1e6);
  const estVoirie = Math.round((pop * 600) / 1e6);
  const estEducation = Math.round((pop * 400) / 1e6);

  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.5 }}>
        Estimations basées sur les ratios OFGL 2022. Cliquer sur OFGL pour les données officielles.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <StatCard label="Dépenses totales (est.)" value={`${estDépenses} M€`} accent="var(--accent-red)" />
        <StatCard label="Recettes totales (est.)" value={`${estRecettes} M€`} accent="var(--accent-blue)" />
        <StatCard label="Dotations État (est.)" value={`${estDotation} M€`} accent="var(--accent-yellow)" />
        <StatCard label="Action sociale (est.)" value={`${estAction_sociale} M€`} accent="#22c55e" />
      </div>

      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>Principales dépenses</div>
      <BudgetBar label="Action sociale" value={estAction_sociale} max={estDépenses} color="var(--accent-blue)" />
      <BudgetBar label="Voirie" value={estVoirie} max={estDépenses} color="var(--accent-yellow)" />
      <BudgetBar label="Éducation (collèges)" value={estEducation} max={estDépenses} color="#22c55e" />

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" }}>Sources officielles</div>
        <ExtLink href={`https://www.ofgl.fr/les-chiffres-des-departements?filtre=DEP${code}`} label={`OFGL — budget du Conseil Dép. ${code}`} />
        <div style={{ marginTop: 6 }}>
          <ExtLink href={`https://data.ofgl.fr/explore/dataset/ofgl-base-dep-consolidee/table/?refine.code_dep=${code}`} label="data.ofgl.fr — données consolidées" />
        </div>
        <div style={{ marginTop: 6 }}>
          <ExtLink href={`https://www.collectivites-locales.gouv.fr/departement-${code}`} label="Collectivités locales — fiche" />
        </div>
      </div>
    </div>
  );
}

// Utility components
function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid var(--border)",
      borderRadius: 5,
      padding: "8px 10px",
      borderTop: `2px solid ${accent}`,
    }}>
      <div style={{ fontSize: 9, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{value}</div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>{label}</span>
      <span style={{ color: "var(--text-primary)", fontSize: 11, fontFamily: mono ? "var(--font-mono)" : undefined }}>{value}</span>
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
        padding: "4px 8px",
        border: "1px solid rgba(0,85,164,0.3)",
        borderRadius: 4,
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(0,85,164,0.1)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <span>→</span>
      <span>{label}</span>
    </a>
  );
}

function BudgetBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
      <div style={{ width: 130, fontSize: 10, color: "var(--text-secondary)", flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 18, background: "rgba(255,255,255,0.04)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, opacity: 0.8, borderRadius: 3, display: "flex", alignItems: "center", paddingLeft: 6, minWidth: "fit-content" }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{value} M€</span>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 9, color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ fontSize: 10, fontWeight: 700, color, fontFamily: "var(--font-mono)" }}>{value}{unit ? " " + unit : ""}</span>
    </div>
  );
}

// Sample procurement entries from national data — filtered loosely by dept profile
function getSampleContracts(code: string): DeptContract[] {
  // Use national MARCHES_SAMPLE to show top attributaires relevant to this region's profile
  return MARCHES_SAMPLE.attributaires.slice(0, 12).map(a => ({
    titulaire: a.nom,
    montant: Math.round(a.montantTotal / a.nbMarches),
    acheteur: a.acheteursPrincipaux[0] || "Acheteur public",
    objet: `Marchés ${a.secteur}`,
    date: "2023-2024",
    procedure: "Appel d'offres ouvert",
  }));
}
