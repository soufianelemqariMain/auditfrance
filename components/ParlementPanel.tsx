"use client";

import { useEffect, useState } from "react";

interface ParlItem {
  id: string;
  source: string;
  title: string;
  url: string;
  publishedAt: string;
  chamber: "AN" | "Sénat";
}

export default function ParlementPanel() {
  const [items, setItems] = useState<ParlItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [fetchedAt, setFetchedAt] = useState<string>("");

  async function load() {
    setStatus("loading");
    try {
      const res = await fetch("/api/parlement");
      const json = await res.json();
      setItems(json.items ?? []);
      setFetchedAt(json.fetchedAt ?? "");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => { load(); }, []);

  const anItems = items.filter((i) => i.chamber === "AN");
  const senatItems = items.filter((i) => i.chamber === "Sénat");

  return (
    <div
      style={{
        background: "var(--bg-panel)",
        borderLeft: "1px solid var(--border)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--accent-blue)",
            }}
          >
            PARLEMENT
          </span>
          {status === "loading" && (
            <span style={{ fontSize: 9, color: "var(--accent-yellow)" }}>chargement…</span>
          )}
          {status === "done" && (
            <span
              style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#22c55e",
                display: "inline-block",
                boxShadow: "0 0 4px rgba(34,197,94,0.6)",
              }}
            />
          )}
          {status === "error" && (
            <span style={{ fontSize: 9, color: "#ef4444" }}>hors ligne</span>
          )}
        </div>
        <button
          onClick={load}
          title="Rafraîchir"
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            fontSize: 10,
            padding: "2px 6px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ↻
        </button>
      </div>

      {/* Body — split AN / Sénat */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 0 }}>
        {/* AN section */}
        <SectionBlock
          label="AN"
          labelColor="#0055A4"
          items={anItems.length > 0 ? anItems : fallbackAN}
          showFallback={anItems.length === 0 && status === "done"}
        />
        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", flexShrink: 0 }} />
        {/* Sénat section */}
        <SectionBlock
          label="SÉNAT"
          labelColor="#8B1A1A"
          items={senatItems.length > 0 ? senatItems : fallbackSenat}
          showFallback={senatItems.length === 0 && status === "done"}
        />
      </div>

      {/* Footer */}
      {fetchedAt && (
        <div
          style={{
            padding: "4px 10px",
            borderTop: "1px solid var(--border)",
            fontSize: 9,
            color: "var(--text-secondary)",
            flexShrink: 0,
          }}
        >
          {new Date(fetchedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          {" · "}
          <a
            href="https://www.assemblee-nationale.fr"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent-blue)", textDecoration: "none" }}
          >
            AN
          </a>
          {" / "}
          <a
            href="https://www.senat.fr"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#8B1A1A", textDecoration: "none" }}
          >
            Sénat
          </a>
        </div>
      )}
    </div>
  );
}

function SectionBlock({
  label,
  labelColor,
  items,
  showFallback,
}: {
  label: string;
  labelColor: string;
  items: ParlItem[];
  showFallback: boolean;
}) {
  return (
    <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: "4px 10px",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: labelColor,
          textTransform: "uppercase",
          borderBottom: `1px solid ${labelColor}33`,
          flexShrink: 0,
          background: `${labelColor}0a`,
        }}
      >
        {label}
        {showFallback && (
          <span style={{ fontWeight: 400, color: "var(--text-secondary)", marginLeft: 6 }}>
            — liens directs
          </span>
        )}
      </div>
      <ul
        style={{
          listStyle: "none",
          flex: 1,
          overflowY: "auto",
          margin: 0,
          padding: "4px 0",
        }}
      >
        {items.slice(0, 8).map((item) => (
          <li key={item.id} style={{ padding: "3px 10px" }}>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                fontSize: 10,
                color: "var(--text-primary)",
                textDecoration: "none",
                lineHeight: 1.35,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={item.title}
            >
              {item.title}
            </a>
            <div style={{ fontSize: 9, color: "var(--text-secondary)", marginTop: 1 }}>
              {item.source} · {fmtDate(item.publishedAt)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

// Fallback links when RSS is unavailable — top-level pages only (sub-pages vary by legislature)
const fallbackAN: ParlItem[] = [
  { id: "an1", chamber: "AN", source: "Assemblée Nationale", publishedAt: new Date().toISOString(), title: "Actualités — Assemblée Nationale", url: "https://www.assemblee-nationale.fr/actualites/" },
  { id: "an2", chamber: "AN", source: "Assemblée Nationale", publishedAt: new Date().toISOString(), title: "Travaux législatifs en cours", url: "https://www.assemblee-nationale.fr/travaux-legislatifs/textes-en-discussion.asp" },
  { id: "an3", chamber: "AN", source: "nosdeputes.fr", publishedAt: new Date().toISOString(), title: "Activité des député·e·s — nosdeputes.fr", url: "https://www.nosdeputes.fr" },
  { id: "an4", chamber: "AN", source: "Assemblée Nationale", publishedAt: new Date().toISOString(), title: "Flux RSS indisponible — voir AN", url: "https://www.assemblee-nationale.fr" },
];

const fallbackSenat: ParlItem[] = [
  { id: "s1", chamber: "Sénat", source: "Sénat", publishedAt: new Date().toISOString(), title: "Actualités du Sénat", url: "https://www.senat.fr/actualites-senatoriales/" },
  { id: "s2", chamber: "Sénat", source: "Sénat", publishedAt: new Date().toISOString(), title: "Travaux parlementaires", url: "https://www.senat.fr/travaux-parlementaires/" },
  { id: "s3", chamber: "Sénat", source: "nossenateurs.fr", publishedAt: new Date().toISOString(), title: "Activité des sénateurs — nossenateurs.fr", url: "https://www.nossenateurs.fr" },
  { id: "s4", chamber: "Sénat", source: "Sénat", publishedAt: new Date().toISOString(), title: "Flux RSS indisponible — voir Sénat", url: "https://www.senat.fr" },
];
