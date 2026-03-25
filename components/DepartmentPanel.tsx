"use client";

import { useState, useEffect } from "react";
import { getDeptInfo, fmtPop } from "@/lib/deptData";
import { getPresidentCR } from "@/lib/elusData";
import OffresTab from "./OffresTab";

interface Props {
  code: string;
  nom: string;
  onClose: () => void;
  onCommuneClick?: (code: string, nom: string) => void;
}

function fmtDate(s: string): string {
  if (!s) return "—";
  return s.slice(0, 10);
}

export default function DepartmentPanel({ code, nom, onClose, onCommuneClick }: Props) {
  const info = getDeptInfo(code);
  const [tab, setTab] = useState<"apercu" | "budget" | "elus" | "recrutement">("apercu");

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
        <div style={{ display: "flex", gap: 0, marginTop: 10, overflowX: "auto" }}>
          {(["apercu", "elus", "budget", "recrutement"] as const).map((t) => (
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
              {t === "apercu" ? "Aperçu" : t === "elus" ? "Élus" : t === "budget" ? "Budget" : "Offres d'emploi"}
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
        {tab === "budget" && (
          <BudgetTab code={code} nom={nom} />
        )}
        {tab === "recrutement" && <OffresTab dept={code} />}
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

      <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 8, letterSpacing: "0.05em" }}>
        Sources : INSEE · OFGL · DECP · Wikipedia
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
  nbMandats: number | null;
  profession: string | null;
  mandatDebut: string;
  url: string;
  urlAN: string | null;
  twitter: string | null;
  score: number | null;
  activite: DeputeActivite;
}

function ElusTab({ code, region }: { code: string; region: string }) {
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

  // 17th legislature groups
  const GROUPE_COLORS: Record<string, string> = {
    RN: "#1F3A8A", EPR: "#FF7900", "LFI-NFP": "#CC0000", SOC: "#FF8083",
    DR: "#003189", EcoS: "#6CB33F", Dem: "#F4A81F", HOR: "#3DAADC",
    LIOT: "#78716c", GDR: "#DD051D", UDR: "#7C3AED", NI: "#555555",
    // Legacy
    LFI: "#CC0000", RE: "#FFEB3B", LR: "#006EB7",
  };

  return (
    <div>
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
          {status === "done" && <span style={{ fontSize: 9, color: "#22c55e" }}>● {legislature || "assemblee-nationale.fr"}</span>}
          {status === "error" && <span style={{ fontSize: 9, color: "#ef4444" }} title={errMsg}>● erreur</span>}
        </div>

        {status === "done" && deputes.length === 0 && (
          <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
            Aucun·e député·e trouvé·e. <a href="https://www.assemblee-nationale.fr/dyn/deputes" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)" }}>→ Assemblée Nationale</a>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {deputes.map((d, i) => {
            const gc = GROUPE_COLORS[d.groupe] ?? "#555";
            const score = d.score ?? null;
            const scoreColor = score === null ? "var(--text-secondary)" : score >= 60 ? "#22c55e" : score >= 35 ? "#eab308" : "#ef4444";
            const qo = d.activite?.questionsOrales ?? null;
            return (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 5, padding: "10px 10px" }}>
                {/* Name + group + score */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{d.prenom} {d.nom}</div>
                    <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 1 }}>
                      Circ. {d.numCirco} · {d.circo}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: gc + "22", color: gc, border: `1px solid ${gc}44` }}>{d.groupe}</span>
                    {score !== null && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ fontSize: 9, color: "var(--text-secondary)" }}>Activité</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: scoreColor, fontFamily: "var(--font-mono)" }}>{score}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity stats */}
                {qo !== null && (
                  <div style={{ marginTop: 6, display: "flex", gap: 12 }}>
                    <MiniStat label="Questions orales" value={qo} unit="" color="#a855f7" />
                  </div>
                )}

                {/* Links */}
                <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                  <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "var(--accent-blue)", textDecoration: "none" }}>→ Profil AN</a>
                </div>
              </div>
            );
          })}
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

      <div style={{ marginTop: 14, fontSize: 10, color: "var(--text-secondary)", letterSpacing: "0.05em" }}>
        Sources : OFGL · data.gouv.fr · DGCL collectivités-locales.gouv.fr
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

// --- Communes tab ---
interface CommuneItem {
  code: string;
  nom: string;
  population: number;
}

function CommunesTab({
  code,
  onCommuneClick,
}: {
  code: string;
  onCommuneClick?: (code: string, nom: string) => void;
}) {
  const [communes, setCommunes] = useState<CommuneItem[]>([]);
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [query, setQuery] = useState("");

  useEffect(() => {
    setStatus("loading");
    fetch(
      `https://geo.api.gouv.fr/departements/${code}/communes?fields=code,nom,population&limit=500`
    )
      .then((r) => r.json())
      .then((data: CommuneItem[]) => {
        setCommunes(data.sort((a, b) => (b.population ?? 0) - (a.population ?? 0)));
        setStatus("done");
      })
      .catch(() => setStatus("error"));
  }, [code]);

  const filtered = query.length >= 1
    ? communes.filter((c) => c.nom.toLowerCase().includes(query.toLowerCase()))
    : communes;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Search */}
      <div style={{ marginBottom: 8, flexShrink: 0 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrer…"
          style={{
            width: "100%",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "5px 8px",
            fontSize: 11,
            color: "var(--text-primary)",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Status */}
      {status === "loading" && (
        <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Chargement…</div>
      )}
      {status === "error" && (
        <div style={{ fontSize: 11, color: "#ef4444" }}>Erreur lors du chargement des communes.</div>
      )}

      {/* List */}
      {status === "done" && (
        <>
          <div style={{ fontSize: 10, color: "var(--text-secondary)", marginBottom: 6, flexShrink: 0 }}>
            {filtered.length} commune{filtered.length !== 1 ? "s" : ""}
            {query && ` pour « ${query} »`}
          </div>
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3 }}>
            {filtered.map((c) => (
              <button
                key={c.code}
                onClick={() => onCommuneClick?.(c.code, c.nom)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 8px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  cursor: onCommuneClick ? "pointer" : "default",
                  textAlign: "left",
                  gap: 8,
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
              >
                <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-primary)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.nom}
                </span>
                <span style={{ fontSize: 10, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
                  {c.population > 0 ? fmtPop(c.population) : c.code}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


