"use client";

import { useState, useEffect } from "react";

interface Consultation {
  id: string;
  objet: string;
  acheteur: string;
  typeMarche: string;
  departement: string;
  dateParution: string;
  dateLimite: string;
  url: string;
}

function fmtDate(s: string): string {
  if (!s) return "—";
  return s.slice(0, 10);
}

function daysLeft(dateLimite: string): { n: number; label: string; color: string } | null {
  if (!dateLimite) return null;
  const d = new Date(dateLimite);
  if (isNaN(d.getTime())) return null;
  const n = Math.ceil((d.getTime() - Date.now()) / 86400000);
  const color = n <= 3 ? "#ef4444" : n <= 7 ? "#eab308" : "#22c55e";
  return { n, label: n === 1 ? "1 jour" : `${n} jours`, color };
}

export default function ConsultationsPanel() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("");

  async function fetchData() {
    setStatus("loading");
    setErrMsg("");
    try {
      const res = await fetch("/api/consultations");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setConsultations(json.consultations ?? []);
      setTotal(json.total ?? 0);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrMsg(String(err instanceof Error ? err.message : err));
    }
  }

  useEffect(() => { fetchData(); }, []);

  const filtered = consultations.filter((c) => {
    const q = search.toLowerCase();
    const matchQ = !q || c.objet.toLowerCase().includes(q) || c.acheteur.toLowerCase().includes(q);
    const matchDept = !dept || c.departement.includes(dept);
    return matchQ && matchDept;
  });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Status bar */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
        <div style={{
          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
          background: status === "done" ? "#22c55e" : status === "loading" ? "#eab308" : status === "error" ? "#ef4444" : "var(--border)",
          boxShadow: status === "done" ? "0 0 6px rgba(34,197,94,0.5)" : undefined,
        }} />
        <span style={{ fontSize: 11, color: "var(--text-secondary)", flex: 1 }}>
          {status === "loading" && "Chargement BOAMP…"}
          {status === "done" && `${filtered.length} appels d'offres ouverts — BOAMP`}
          {status === "error" && `Erreur : ${errMsg}`}
          {status === "idle" && "Appels d'offres en cours — BOAMP"}
        </span>

        <input
          type="text"
          placeholder="Chercher objet / acheteur…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 11, padding: "4px 10px", outline: "none", fontFamily: "inherit", width: 180 }}
        />
        <input
          type="text"
          placeholder="Dépt (ex: 75)"
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 11, padding: "4px 10px", outline: "none", fontFamily: "inherit", width: 100 }}
        />

        <button
          onClick={fetchData}
          disabled={status === "loading"}
          style={{
            background: "var(--accent-blue)",
            color: "#fff",
            border: "none",
            padding: "5px 12px",
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            cursor: status === "loading" ? "default" : "pointer",
            fontFamily: "inherit",
            opacity: status === "loading" ? 0.6 : 1,
          }}
        >
          {status === "loading" ? "Chargement…" : "↻ Rafraîchir"}
        </button>
      </div>

      {/* Stats row */}
      <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 24, flexShrink: 0 }}>
        <Stat label="Total BOAMP actifs" value={total.toLocaleString("fr-FR")} />
        <Stat label="Résultats filtrés" value={filtered.length.toLocaleString("fr-FR")} />
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
        {status === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[1,2,3,4,5].map((n) => (
              <div key={n} style={{ height: 72, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 5 }} />
            ))}
          </div>
        )}

        {status === "done" && filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: "var(--text-secondary)" }}>
            Aucun appel d'offres correspondant
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map((c) => {
            const remaining = daysLeft(c.dateLimite);
            return (
              <div
                key={c.id}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border)",
                  borderRadius: 5,
                  padding: "10px 12px",
                  cursor: c.url ? "pointer" : "default",
                }}
                onClick={() => c.url && window.open(c.url, "_blank", "noopener,noreferrer")}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.35 }}>
                      {c.objet || "Objet non précisé"}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 3 }}>
                      {c.acheteur}
                      {c.departement && <span style={{ marginLeft: 8, fontFamily: "var(--font-mono)", color: "var(--accent-blue)" }}>Dépt {c.departement}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    {remaining && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: remaining.color, fontFamily: "var(--font-mono)" }}>
                        J-{remaining.n}
                      </span>
                    )}
                    {c.typeMarche && (
                      <span style={{ fontSize: 9, padding: "1px 6px", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: 3, letterSpacing: "0.05em" }}>
                        {c.typeMarche.slice(0, 20)}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 5, fontSize: 10, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                  <span>Publié {fmtDate(c.dateParution)}</span>
                  {c.dateLimite && <span>Limite {fmtDate(c.dateLimite)}</span>}
                  {c.url && <span style={{ color: "var(--accent-blue)" }}>→ BOAMP</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
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
