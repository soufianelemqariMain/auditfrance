"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface CommuneSuggestion {
  code: string;
  nom: string;
  population: number;
  codeDepartement: string;
}

interface Props {
  onSelect: (code: string, nom: string) => void;
}

export default function CommuneSearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CommuneSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&boost=population&limit=8&fields=code,nom,population,codeDepartement`,
        { signal: AbortSignal.timeout(5000) }
      );
      const data: CommuneSuggestion[] = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
      setOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 220);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (s: CommuneSuggestion) => {
    setQuery("");
    setSuggestions([]);
    setOpen(false);
    onSelect(s.code, s.nom);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", zIndex: 30 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: 4,
          overflow: "hidden",
          height: 28,
        }}
      >
        <span style={{ padding: "0 7px", fontSize: 11, color: "var(--text-secondary)", flexShrink: 0 }}>
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Commune…"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--text-primary)",
            fontSize: 11,
            padding: "0 8px 0 0",
            height: "100%",
            minWidth: 0,
          }}
        />
        {loading && (
          <span style={{ padding: "0 6px", fontSize: 9, color: "var(--accent-yellow)", flexShrink: 0 }}>
            …
          </span>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "var(--bg-panel)",
            border: "1px solid var(--border)",
            borderTop: "none",
            borderRadius: "0 0 4px 4px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {suggestions.map((s) => (
            <button
              key={s.code}
              onClick={() => handleSelect(s)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                padding: "7px 10px",
                background: "transparent",
                border: "none",
                borderBottom: "1px solid var(--border)",
                cursor: "pointer",
                textAlign: "left",
                gap: 8,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{s.nom}</div>
                <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>
                  Dépt {s.codeDepartement}
                  {s.population > 0 && ` · ${fmtPop(s.population)} hab.`}
                </div>
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontFamily: "var(--font-mono)",
                  color: "var(--accent-blue)",
                  flexShrink: 0,
                }}
              >
                {s.code}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function fmtPop(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} k`;
  return String(n);
}
