"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";

interface PoliticianVideo {
  politician: string;
  party: string;
  color: string;
  videoTitle: string;
  videoUrl: string;
  publishedAt: string;
}

const PARTY_COLOR: Record<string, string> = {
  RN:          "#003189",
  LFI:         "#cc2529",
  Horizons:    "#0ea5e9",
  Renaissance: "#f59e0b",
  Reconquête:  "#1e3a8a",
  "Indép.":    "#dc2626",
  PS:          "#e05c2d",
};

export default function CorpusPolitiquePanel() {
  const setAnalyserInput = useAppStore((s) => s.setAnalyserInput);
  const [videos, setVideos] = useState<PoliticianVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/corpus-politique")
      .then((r) => r.json())
      .then((data) => setVideos(data.videos ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: "1px solid var(--border)" }}>
      {/* Header */}
      <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          🗳️ Corpus Politique 2027
        </span>
      </div>

      {/* Videos */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: "20px 10px", fontSize: 9, color: "var(--border)", textAlign: "center" }}>
            Chargement…
          </div>
        ) : videos.length === 0 ? (
          <div style={{ padding: "20px 10px", fontSize: 9, color: "var(--border)", textAlign: "center" }}>
            Aucune vidéo disponible
          </div>
        ) : (
          <div style={{ padding: "4px 0" }}>
            {videos.map((v, i) => (
              <div
                key={i}
                style={{ padding: "7px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{
                      fontSize: 8, padding: "1px 4px", borderRadius: 2,
                      background: (PARTY_COLOR[v.party] ?? "#6b7280") + "33",
                      color: PARTY_COLOR[v.party] ?? "#6b7280",
                      fontWeight: 700, flexShrink: 0,
                    }}>{v.party}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-primary)" }}>{v.politician}</span>
                  </div>
                  <span style={{ fontSize: 8, color: "var(--border)", flexShrink: 0 }}>{v.publishedAt}</span>
                </div>
                <div style={{ fontSize: 9, color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: 5 }}>
                  {v.videoTitle.length > 80 ? v.videoTitle.slice(0, 80) + "…" : v.videoTitle}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={() => setAnalyserInput(v.videoUrl)}
                    style={{
                      fontSize: 8, padding: "2px 7px", borderRadius: 2,
                      border: "1px solid var(--border)",
                      background: "transparent",
                      color: "var(--accent-blue)",
                      cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    → Analyser
                  </button>
                  <a
                    href={v.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 8, color: "var(--border)", textDecoration: "none" }}
                  >
                    ↗ YouTube
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "4px 10px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <span style={{ fontSize: 8, color: "var(--border)" }}>
          YouTube RSS · Candidats 2027 · Cliquez pour analyser
        </span>
      </div>
    </div>
  );
}
