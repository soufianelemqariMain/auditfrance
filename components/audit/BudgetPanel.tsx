"use client";

import { useState } from "react";
import { BUDGET, fmtBudget } from "@/lib/auditData";

type BudgetView = "treemap" | "barres";

export default function BudgetPanel() {
  const [view, setView] = useState<BudgetView>("treemap");
  const [search, setSearch] = useState("");
  const [showHorsRemb, setShowHorsRemb] = useState(true);

  const filtered = BUDGET.missions.filter((m) => {
    if (showHorsRemb && m.name === "Remboursements et dégrèvements") return false;
    if (search) {
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.ministry.toLowerCase().includes(q);
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => b.cp - a.cp);
  const totalCP = filtered.reduce((s, m) => s + m.cp, 0);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Controls */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {/* View tabs */}
        <div style={{ display: "flex", gap: 3, background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 6, padding: 3 }}>
          {(["treemap", "barres"] as BudgetView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: "4px 12px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                fontFamily: "inherit",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                background: view === v ? "var(--accent-blue)" : "transparent",
                color: view === v ? "#fff" : "var(--text-secondary)",
                transition: "all 0.15s",
              }}
            >
              {v}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Filtrer missions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            fontSize: 11,
            padding: "4px 10px",
            outline: "none",
            fontFamily: "inherit",
            width: 160,
          }}
        />

        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--text-secondary)", cursor: "pointer", userSelect: "none" }}>
          <input
            type="checkbox"
            checked={showHorsRemb}
            onChange={(e) => setShowHorsRemb(e.target.checked)}
            style={{ accentColor: "var(--accent-blue)" }}
          />
          Hors remboursements
        </label>

        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-secondary)" }}>
          Total affiché:{" "}
          <strong style={{ color: "var(--accent-yellow)" }}>
            {fmtBudget(totalCP)}
          </strong>
        </span>
      </div>

      {/* View */}
      <div style={{ flex: 1, overflow: "auto", padding: "12px 16px" }}>
        {view === "treemap" && <TreemapView missions={sorted} total={totalCP} />}
        {view === "barres" && <BarView missions={sorted} total={totalCP} />}
      </div>
    </div>
  );
}

function TreemapView({ missions, total }: { missions: typeof BUDGET.missions; total: number }) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 4,
          width: "100%",
        }}
      >
        {missions.map((m) => {
          const pct = (m.cp / total) * 100;
          const isHovered = hovered === m.name;
          return (
            <div
              key={m.name}
              onMouseEnter={() => setHovered(m.name)}
              onMouseLeave={() => setHovered(null)}
              style={{
                borderRadius: 6,
                padding: "10px 10px",
                background: m.color + "22",
                border: `1px solid ${m.color}55`,
                cursor: "pointer",
                transition: "all 0.15s",
                transform: isHovered ? "translateY(-2px)" : undefined,
                outline: isHovered ? `1px solid ${m.color}` : undefined,
                minHeight: 70,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: "#ffffffcc", lineHeight: 1.3 }}>
                {m.name}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", fontFamily: "var(--font-mono)", marginTop: 4 }}>
                  {fmtBudget(m.cp)}
                </div>
                <div style={{ fontSize: 10, color: "#ffffff66", fontFamily: "var(--font-mono)" }}>
                  {pct.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BarView({ missions, total }: { missions: typeof BUDGET.missions; total: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {missions.map((m, i) => {
        const pct = (m.cp / total) * 100;
        return (
          <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 22, fontSize: 11, color: "var(--text-secondary)", textAlign: "right", flexShrink: 0, fontFamily: "var(--font-mono)" }}>
              {i + 1}
            </div>
            <div style={{ width: 180, fontSize: 11, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>
              {m.name}
            </div>
            <div style={{ flex: 1, height: 22, background: "rgba(255,255,255,0.04)", borderRadius: 3, overflow: "hidden" }}>
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: m.color,
                  opacity: 0.8,
                  borderRadius: 3,
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 6,
                  transition: "width 0.5s ease",
                  minWidth: "fit-content",
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
                  {fmtBudget(m.cp)}
                </span>
              </div>
            </div>
            <div style={{ width: 50, textAlign: "right", fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
              {pct.toFixed(1)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}
