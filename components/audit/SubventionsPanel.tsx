"use client";

import { useState, useEffect } from "react";

// --- Attribuées types ---
interface Subvention {
  siret: string;
  nom: string;
  montant: number;
  annee: number;
  dispositif: string;
  ministere: string;
}

// --- Ouvertes types ---
interface Aide {
  id: number;
  name: string;
  description: string;
  url: string;
  categories: string[];
  financers: string[];
  submission_deadline: string | null;
  start_date: string | null;
}

type SubTab = "attribuees" | "ouvertes";

function fmtEur(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2).replace(".", ",") + " Md€";
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(".", ",") + " M€";
  if (n >= 1e3) return Math.round(n / 1000) + " k€";
  return n + " €";
}

export default function SubventionsPanel() {
  const [subtab, setSubtab] = useState<SubTab>("attribuees");

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Sub-tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0, background: "rgba(255,255,255,0.01)" }}>
        {([
          { key: "attribuees", label: "Subventions attribuées" },
          { key: "ouvertes", label: "Appels à projets ouverts" },
        ] as { key: SubTab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSubtab(key)}
            style={{
              padding: "8px 16px",
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              borderBottom: subtab === key ? "2px solid var(--accent-green)" : "2px solid transparent",
              background: "transparent",
              color: subtab === key ? "var(--accent-green)" : "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              transition: "all 0.15s",
              fontFamily: "inherit",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "hidden" }}>
        {subtab === "attribuees" ? <AttribueesTab /> : <OuvertesTab />}
      </div>
    </div>
  );
}

function AttribueesTab() {
  const [subventions, setSubventions] = useState<Subvention[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [search, setSearch] = useState("");

  async function fetchData() {
    setStatus("loading");
    setErrMsg("");
    try {
      const res = await fetch("/api/subventions?type=attribuees");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setSubventions(json.subventions ?? []);
      setTotal(json.total ?? 0);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrMsg(String(err instanceof Error ? err.message : err));
    }
  }

  useEffect(() => { fetchData(); }, []);

  const filtered = subventions.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.nom.toLowerCase().includes(q) || s.dispositif.toLowerCase().includes(q) || s.ministere.toLowerCase().includes(q);
  });

  const totalMontant = filtered.reduce((acc, s) => acc + s.montant, 0);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
        <StatusDot status={status} />
        <span style={{ fontSize: 11, color: "var(--text-secondary)", flex: 1 }}>
          {status === "loading" && "Chargement data-subventions.beta.gouv.fr…"}
          {status === "done" && `${filtered.length} bénéficiaires — data-subventions.beta.gouv.fr`}
          {status === "error" && `Erreur : ${errMsg}`}
          {status === "idle" && "Subventions de l'État"}
        </span>
        <input
          type="text"
          placeholder="Chercher bénéficiaire…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 11, padding: "4px 10px", outline: "none", fontFamily: "inherit", width: 180 }}
        />
        <button onClick={fetchData} disabled={status === "loading"}
          style={{ background: "var(--accent-blue)", color: "#fff", border: "none", padding: "5px 12px", borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: status === "loading" ? "default" : "pointer", fontFamily: "inherit", opacity: status === "loading" ? 0.6 : 1 }}>
          {status === "loading" ? "Chargement…" : "↻ Rafraîchir"}
        </button>
      </div>

      <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 24, flexShrink: 0 }}>
        <Stat label="Total enregistrements" value={total.toLocaleString("fr-FR")} />
        <Stat label="Montant filtré" value={fmtEur(totalMontant)} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
        {status === "loading" && <SkeletonList />}

        {status === "done" && filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: "var(--text-secondary)" }}>
            Aucune subvention trouvée
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map((s, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 5, padding: "9px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{s.nom || "Bénéficiaire non renseigné"}</div>
                  <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 2 }}>
                    {s.dispositif || s.ministere || ""}
                    {s.siret && <span style={{ marginLeft: 8, fontFamily: "var(--font-mono)" }}>{s.siret}</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--accent-yellow)", fontFamily: "var(--font-mono)" }}>{fmtEur(s.montant)}</div>
                  {s.annee > 2000 && <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>{s.annee}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OuvertesTab() {
  const [aides, setAides] = useState<Aide[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [search, setSearch] = useState("");

  async function fetchData() {
    setStatus("loading");
    setErrMsg("");
    try {
      const res = await fetch("/api/subventions?type=ouvertes");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setAides(json.aides ?? []);
      setTotal(json.total ?? 0);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrMsg(String(err instanceof Error ? err.message : err));
    }
  }

  useEffect(() => { fetchData(); }, []);

  const filtered = aides.filter((a) => {
    const q = search.toLowerCase();
    return !q || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
  });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
        <StatusDot status={status} />
        <span style={{ fontSize: 11, color: "var(--text-secondary)", flex: 1 }}>
          {status === "loading" && "Chargement aides-territoires.beta.gouv.fr…"}
          {status === "done" && `${filtered.length} programmes ouverts — aides-territoires.beta.gouv.fr`}
          {status === "error" && `Erreur : ${errMsg}`}
          {status === "idle" && "Appels à projets et subventions ouverts"}
        </span>
        <input
          type="text"
          placeholder="Chercher programme…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 11, padding: "4px 10px", outline: "none", fontFamily: "inherit", width: 180 }}
        />
        <button onClick={fetchData} disabled={status === "loading"}
          style={{ background: "var(--accent-blue)", color: "#fff", border: "none", padding: "5px 12px", borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: status === "loading" ? "default" : "pointer", fontFamily: "inherit", opacity: status === "loading" ? 0.6 : 1 }}>
          {status === "loading" ? "Chargement…" : "↻ Rafraîchir"}
        </button>
      </div>

      <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 24, flexShrink: 0 }}>
        <Stat label="Programmes actifs" value={total.toLocaleString("fr-FR")} />
        <Stat label="Résultats filtrés" value={filtered.length.toLocaleString("fr-FR")} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
        {status === "loading" && <SkeletonList />}

        {status === "done" && filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: "var(--text-secondary)" }}>
            Aucun programme trouvé
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map((a) => (
            <div
              key={a.id}
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 5, padding: "10px 12px", cursor: a.url ? "pointer" : "default" }}
              onClick={() => a.url && window.open(a.url, "_blank", "noopener,noreferrer")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.35 }}>{a.name}</div>
                  {a.financers.length > 0 && (
                    <div style={{ fontSize: 10, color: "var(--accent-blue)", marginTop: 2 }}>{a.financers.slice(0, 3).join(" · ")}</div>
                  )}
                  {a.description && (
                    <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.4 }}>{a.description.slice(0, 140)}…</div>
                  )}
                </div>
                {a.submission_deadline && (
                  <div style={{ fontSize: 10, color: "var(--text-secondary)", flexShrink: 0, textAlign: "right" }}>
                    <div style={{ fontSize: 9, marginBottom: 2 }}>Clôture</div>
                    <div style={{ fontFamily: "var(--font-mono)", color: "var(--accent-yellow)" }}>{a.submission_deadline}</div>
                  </div>
                )}
              </div>
              {a.categories.length > 0 && (
                <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                  {a.categories.slice(0, 4).map((c, i) => (
                    <span key={i} style={{ fontSize: 9, padding: "1px 6px", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: 3 }}>{c}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  return (
    <div style={{
      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
      background: status === "done" ? "#22c55e" : status === "loading" ? "#eab308" : status === "error" ? "#ef4444" : "var(--border)",
      boxShadow: status === "done" ? "0 0 6px rgba(34,197,94,0.5)" : undefined,
    }} />
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

function SkeletonList() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[1,2,3,4].map((n) => (
        <div key={n} style={{ height: 68, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: 5 }} />
      ))}
    </div>
  );
}
