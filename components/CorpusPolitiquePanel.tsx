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
  isToday: boolean;
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

  const todayVideos = videos.filter((v) => v.isToday);
  const otherVideos = videos.filter((v) => !v.isToday);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", borderLeft: "1px solid var(--border)" }}>
      {/* Header */}
      <div style={{ padding: "6px 10px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            🎬 Vidéos Politique
          </span>
          {todayVideos.length > 0 && (
            <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 2, background: "rgba(34,197,94,0.15)", color: "#86efac", fontWeight: 700 }}>
              {todayVideos.length} aujourd&apos;hui
            </span>
          )}
        </div>
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
            {/* Today's videos first */}
            {todayVideos.length > 0 && (
              <>
                <div style={{ padding: "3px 10px", fontSize: 8, fontWeight: 700, color: "#86efac", textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(34,197,94,0.05)" }}>
                  Publiées aujourd&apos;hui
                </div>
                {todayVideos.map((v, i) => (
                  <VideoRow key={`today-${i}`} v={v} setAnalyserInput={setAnalyserInput} />
                ))}
              </>
            )}
            {/* Older videos */}
            {otherVideos.length > 0 && (
              <>
                {todayVideos.length > 0 && (
                  <div style={{ padding: "3px 10px", fontSize: 8, fontWeight: 700, color: "var(--border)", textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(255,255,255,0.02)" }}>
                    Récentes
                  </div>
                )}
                {otherVideos.map((v, i) => (
                  <VideoRow key={`other-${i}`} v={v} setAnalyserInput={setAnalyserInput} />
                ))}
              </>
            )}
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

function VideoRow({ v, setAnalyserInput }: { v: PoliticianVideo; setAnalyserInput: (url: string) => void }) {
  return (
    <div style={{ padding: "7px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
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
        <span style={{ fontSize: 8, color: v.isToday ? "#86efac" : "var(--border)", flexShrink: 0 }}>
          {v.isToday ? "auj." : v.publishedAt}
        </span>
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
  );
}
