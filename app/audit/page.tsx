"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import BudgetPanel from "@/components/audit/BudgetPanel";
import MarchesPanel from "@/components/audit/MarchesPanel";
import { BUDGET } from "@/lib/auditData";

type AuditTab = "budget" | "marches";

export default function AuditPage() {
  const [tab, setTab] = useState<AuditTab>("budget");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-primary)", overflow: "hidden" }}>
      <Navbar />

      {/* Section header */}
      <div style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", padding: "0 16px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 0 }}>
          {([
            { key: "budget", label: `Budget PLF ${BUDGET.year}` },
            { key: "marches", label: "Marchés Publics DECP" },
          ] as { key: AuditTab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: "10px 18px",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                border: "none",
                borderBottom: tab === key ? "2px solid var(--accent-blue)" : "2px solid transparent",
                fontFamily: "inherit",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                background: "transparent",
                color: tab === key ? "var(--text-primary)" : "var(--text-secondary)",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Summary stats */}
        <div style={{ display: "flex", gap: 20, fontSize: 11, color: "var(--text-secondary)" }}>
          <span>
            Dépenses:{" "}
            <strong style={{ color: "var(--accent-red)", fontFamily: "var(--font-mono)" }}>492 Md€</strong>
          </span>
          <span>
            Recettes:{" "}
            <strong style={{ color: "var(--accent-blue)", fontFamily: "var(--font-mono)" }}>349 Md€</strong>
          </span>
          <span>
            Déficit:{" "}
            <strong style={{ color: "var(--accent-yellow)", fontFamily: "var(--font-mono)" }}>-142 Md€</strong>
          </span>
          <a
            href="https://www.budget.gouv.fr/files/uploads/2024/09/Projet-de-loi-de-finances-pour-2025-1.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent-blue)", textDecoration: "none", border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 3, fontSize: 10 }}
          >
            → PLF 2025 PDF
          </a>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {tab === "budget" && <BudgetPanel />}
        {tab === "marches" && <MarchesPanel />}
      </div>
    </div>
  );
}
