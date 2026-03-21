"use client";

import { useEffect, useState } from "react";

interface DeputeScore {
  nom: string;
  groupe: string;
  dept: string;
  circo: string;
  score: number;
  url: string;
  urlAN: string;
}

interface Consultation {
  id: string;
  objet: string;
  acheteur: string;
  dateLimite: string;
  url: string;
}

const GROUPE_COLORS: Record<string, string> = {
  RN: "#142B6F", LFI: "#CC0000", SOC: "#FF8083", RE: "#FFEB3B",
  LIOT: "#78716c", HOR: "#3DAADC", LR: "#006EB7", GDR: "#DD051D",
  ECO: "#6CB33F", UDI: "#3DAADC", DEM: "#F4A81F",
};

function daysLeft(dateLimite: string): { n: number; color: string } | null {
  if (!dateLimite) return null;
  const d = new Date(dateLimite);
  if (isNaN(d.getTime())) return null;
  const n = Math.ceil((d.getTime() - Date.now()) / 86400000);
  return { n, color: n <= 3 ? "#ef4444" : n <= 7 ? "#eab308" : "#22c55e" };
}

export default function ParlementPanel() {
  const [tab, setTab] = useState<"deputes" | "marches">("deputes");
  const [deputes, setDeputes] = useState<DeputeScore[]>([]);
  const [deputesStatus, setDeputesStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [marchesItems, setMarchesItems] = useState<Consultation[]>([]);
  const [marchesStatus, setMarchesStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [totalDeputes, setTotalDeputes] = useState(0);

  async function loadDeputes() {
    setDeputesStatus("loading");
    try {
      const res = await fetch("/api/elus/national");
      const json = await res.json();
      setDeputes(json.deputes ?? []);
      setTotalDeputes(json.total ?? 0);
      setDeputesStatus("done");
    } catch {
      setDeputesStatus("error");
    }
  }

  async function loadMarches() {
    setMarchesStatus("loading");
    try {
      const res = await fetch("/api/consultations");
      const json = await res.json();
      setMarchesItems((json.consultations ?? []).slice(0, 15));
      setMarchesStatus("done");
    } catch {
      setMarchesStatus("error");
    }
  }

  useEffect(() => {
    loadDeputes();
    loadMarches();
  }, []);

  const activeStatus = tab === "deputes" ? deputesStatus : marchesStatus;

  return (
    <div style={{ background: "var(--bg-panel)", borderLeft: "1px solid var(--border)", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent-blue)" }}>
            PARLEMENT
          </span>
          {activeStatus === "loading" && <span style={{ fontSize: 9, color: "var(--accent-yellow)" }}>chargement…</span>}
          {activeStatus === "done" && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 4px rgba(34,197,94,0.6)" }} />}
          {activeStatus === "error" && <span style={{ fontSize: 9, color: "#ef4444" }}>erreur</span>}
        </div>
        <button
          onClick={() => { loadDeputes(); loadMarches(); }}
          title="Rafraîchir"
          style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 10, padding: "2px 6px", cursor: "pointer", fontFamily: "inherit" }}
        >↻</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <TabBtn active={tab === "deputes"} onClick={() => setTab("deputes")} color="#ef4444">
          ⚠ Sous-actifs
        </TabBtn>
        <TabBtn active={tab === "marches"} onClick={() => setTab("marches")} color="var(--accent-blue)">
          📋 AO ouverts
        </TabBtn>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {tab === "deputes" && (
          <DeputesTab deputes={deputes} status={deputesStatus} total={totalDeputes} />
        )}
        {tab === "marches" && (
          <MarchesTab items={marchesItems} status={marchesStatus} />
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "4px 10px", borderTop: "1px solid var(--border)", fontSize: 9, color: "var(--text-secondary)", flexShrink: 0 }}>
        <a href="https://www.nosdeputes.fr" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)", textDecoration: "none" }}>nosdeputes.fr</a>
        {" · "}
        <a href="https://www.boamp.fr" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)", textDecoration: "none" }}>BOAMP</a>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, color, children }: { active: boolean; onClick: () => void; color: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, background: "transparent", border: "none",
        borderBottom: active ? `2px solid ${color}` : "2px solid transparent",
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
        fontSize: 10, padding: "5px 4px", cursor: "pointer",
        fontFamily: "inherit", letterSpacing: "0.05em", fontWeight: active ? 700 : 400,
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function DeputesTab({ deputes, status, total }: { deputes: DeputeScore[]; status: string; total: number }) {
  if (status === "loading") {
    return <div style={{ padding: 12, fontSize: 10, color: "var(--text-secondary)" }}>Chargement nosdeputes.fr…</div>;
  }
  if (status === "error") {
    return (
      <div style={{ padding: 12, fontSize: 10, color: "var(--text-secondary)" }}>
        Données indisponibles. <a href="https://www.nosdeputes.fr" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)" }}>→ nosdeputes.fr</a>
      </div>
    );
  }
  return (
    <div>
      <div style={{ padding: "6px 10px", fontSize: 9, color: "var(--text-secondary)", borderBottom: "1px solid var(--border)", letterSpacing: "0.08em" }}>
        15 DÉPUTÉ·E·S LES MOINS ACTIF·VE·S · sur {total} au total
      </div>
      {deputes.map((d, i) => {
        const gc = GROUPE_COLORS[d.groupe] ?? "#555";
        const scoreColor = d.score <= 10 ? "#ef4444" : d.score <= 25 ? "#eab308" : "#f97316";
        return (
          <div
            key={i}
            style={{ padding: "5px 10px", borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "background 0.1s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            onClick={() => window.open(d.url, "_blank", "noopener,noreferrer")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.nom}
                </div>
                <div style={{ fontSize: 9, color: "var(--text-secondary)", marginTop: 1 }}>
                  Dépt {d.dept} · {d.circo}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 2, background: gc + "22", color: gc, border: `1px solid ${gc}44` }}>
                  {d.groupe}
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: scoreColor, fontFamily: "var(--font-mono)", minWidth: 24, textAlign: "right" }}>
                  {d.score}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MarchesTab({ items, status }: { items: Consultation[]; status: string }) {
  if (status === "loading") {
    return <div style={{ padding: 12, fontSize: 10, color: "var(--text-secondary)" }}>Chargement BOAMP…</div>;
  }
  if (status === "error") {
    return (
      <div style={{ padding: 12, fontSize: 10, color: "var(--text-secondary)" }}>
        Données indisponibles. <a href="https://www.boamp.fr" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-blue)" }}>→ BOAMP</a>
      </div>
    );
  }
  if (items.length === 0) {
    return <div style={{ padding: 12, fontSize: 10, color: "var(--text-secondary)" }}>Aucun appel d'offres actif.</div>;
  }
  return (
    <div>
      <div style={{ padding: "6px 10px", fontSize: 9, color: "var(--text-secondary)", borderBottom: "1px solid var(--border)", letterSpacing: "0.08em" }}>
        APPELS D'OFFRES OUVERTS — NATIONAL
      </div>
      {items.map((c) => {
        const rem = daysLeft(c.dateLimite);
        return (
          <div
            key={c.id}
            style={{ padding: "5px 10px", borderBottom: "1px solid var(--border)", cursor: c.url ? "pointer" : "default", transition: "background 0.1s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            onClick={() => c.url && window.open(c.url, "_blank", "noopener,noreferrer")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.objet || "Objet non précisé"}
              </div>
              {rem && <span style={{ fontSize: 9, fontWeight: 700, color: rem.color, fontFamily: "var(--font-mono)", flexShrink: 0 }}>J-{rem.n}</span>}
            </div>
            <div style={{ fontSize: 9, color: "var(--text-secondary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {c.acheteur}
            </div>
          </div>
        );
      })}
    </div>
  );
}
