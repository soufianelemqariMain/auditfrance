"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";

interface CorpStatement {
  company: string;
  sector: string;
  date: string;
  claim: string;
  color: string;
}

// Recent French corporate statements and claims — verifiable by InfoVerif
const STATEMENTS: CorpStatement[] = [
  {
    company: "TotalEnergies",
    sector: "Énergie",
    date: "2026-03",
    claim: "TotalEnergies affirme être en bonne voie pour atteindre la neutralité carbone en 2050, avec une réduction de 40% de ses émissions opérationnelles depuis 2015.",
    color: "#f97316",
  },
  {
    company: "LVMH",
    sector: "Luxe",
    date: "2026-03",
    claim: "LVMH déclare que 90% de ses matières premières stratégiques sont sourced de manière responsable et traçable selon ses standards environnementaux.",
    color: "#a78bfa",
  },
  {
    company: "Carrefour",
    sector: "Distribution",
    date: "2026-03",
    claim: "Carrefour annonce avoir réduit ses prix de 5 à 15% sur plus de 1 500 produits du quotidien dans le cadre de son plan anti-inflation.",
    color: "#3b82f6",
  },
  {
    company: "Renault",
    sector: "Automobile",
    date: "2026-02",
    claim: "Renault affirme que sa Renault 5 électrique atteint une autonomie réelle de plus de 400 km en conditions de conduite mixte en hiver.",
    color: "#eab308",
  },
  {
    company: "BNP Paribas",
    sector: "Finance",
    date: "2026-02",
    claim: "BNP Paribas déclare avoir réduit de 50% son exposition aux énergies fossiles non conventionnelles depuis 2017 et finance la transition énergétique à hauteur de 200 Md€.",
    color: "#22c55e",
  },
  {
    company: "Orange",
    sector: "Télécoms",
    date: "2026-02",
    claim: "Orange affirme couvrir 99% de la population française en 4G et être en avance sur son déploiement 5G avec plus de 18 000 antennes actives.",
    color: "#ef4444",
  },
  {
    company: "Engie",
    sector: "Énergie",
    date: "2026-01",
    claim: "Engie déclare que ses offres d'énergie renouvelable couvrent 100% des besoins de ses clients entreprises abonnés à ses contrats verts certifiés.",
    color: "#06b6d4",
  },
  {
    company: "Sanofi",
    sector: "Santé",
    date: "2026-01",
    claim: "Sanofi annonce un taux de réussite de 94% en phase 3 pour son nouveau traitement contre les maladies inflammatoires chroniques, supérieur aux standards actuels.",
    color: "#8b5cf6",
  },
];

const SECTOR_COLOR: Record<string, string> = {
  "Énergie": "#f97316",
  "Luxe": "#a78bfa",
  "Distribution": "#3b82f6",
  "Automobile": "#eab308",
  "Finance": "#22c55e",
  "Télécoms": "#ef4444",
  "Santé": "#8b5cf6",
};

export default function TransparencePanel() {
  const setAnalyserInput = useAppStore((s) => s.setAnalyserInput);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: "1px solid var(--border)" }}>
      {/* Header */}
      <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          🏢 Corpus Entreprises
        </span>
      </div>

      {/* Statements */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ padding: "4px 0" }}>
          {STATEMENTS.map((s, i) => (
            <div
              key={i}
              style={{ padding: "7px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{
                    fontSize: 8, padding: "1px 4px", borderRadius: 2,
                    background: (SECTOR_COLOR[s.sector] ?? "#6b7280") + "22",
                    color: SECTOR_COLOR[s.sector] ?? "#6b7280",
                    fontWeight: 700, flexShrink: 0,
                  }}>{s.sector}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-primary)" }}>{s.company}</span>
                </div>
                <span style={{ fontSize: 8, color: "var(--border)", flexShrink: 0 }}>{s.date}</span>
              </div>
              <div style={{ fontSize: 9, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 5 }}>
                {s.claim}
              </div>
              <button
                onClick={() => setAnalyserInput(s.claim)}
                style={{
                  fontSize: 8, padding: "2px 7px", borderRadius: 2,
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--accent-blue)",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                → Vérifier
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "4px 10px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <span style={{ fontSize: 8, color: "var(--border)" }}>Déclarations publiques · Cliquez pour vérifier</span>
      </div>
    </div>
  );
}
