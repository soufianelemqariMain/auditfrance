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

interface VideoWithTiming extends PoliticianVideo {
  isToday: boolean;
  isThisWeek: boolean;
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

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function tagTiming(v: PoliticianVideo): VideoWithTiming {
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = getWeekStart();
  return {
    ...v,
    isToday: v.publishedAt === today,
    isThisWeek: v.publishedAt >= weekStart && v.publishedAt <= today,
  };
}

export default function CorpusPolitiquePanel() {
  const setAnalyserInput = useAppStore((s) => s.setAnalyserInput);
  const [videos, setVideos] = useState<VideoWithTiming[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/corpus-politique")
      .then((r) => r.json())
      .then((data) => setVideos((data.videos ?? []).map(tagTiming)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const todayVideos = videos.filter((v) => v.isToday);
  const weekVideos = videos.filter((v) => v.isThisWeek && !v.isToday);
  const olderVideos = videos.filter((v) => !v.isThisWeek);

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
              {todayVideos.length} auj.
            </span>
          )}
        </div>
      </div>

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
            {todayVideos.length > 0 && (
              <Section label="Aujourd'hui" color="#86efac" bg="rgba(34,197,94,0.05)">
                {todayVideos.map((v, i) => (
                  <VideoRow key={`t-${i}`} v={v} dateLabel="auj." dateColor="#86efac" setAnalyserInput={setAnalyserInput} />
                ))}
              </Section>
            )}

            {weekVideos.length > 0 && (
              <Section label="Cette semaine" color="#38bdf8" bg="rgba(56,189,248,0.03)">
                {weekVideos.map((v, i) => (
                  <VideoRow key={`w-${i}`} v={v} dateLabel={v.publishedAt.slice(5)} dateColor="#38bdf8" setAnalyserInput={setAnalyserInput} />
                ))}
              </Section>
            )}

            {olderVideos.length > 0 && (
              <Section label="Récentes" color="var(--border)" bg="rgba(255,255,255,0.01)">
                {olderVideos.map((v, i) => (
                  <VideoRow key={`o-${i}`} v={v} dateLabel={v.publishedAt.slice(5)} dateColor="var(--border)" setAnalyserInput={setAnalyserInput} />
                ))}
              </Section>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: "4px 10px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <span style={{ fontSize: 8, color: "var(--border)" }}>
          YouTube · Candidats 2027 · Cliquez pour analyser
        </span>
      </div>
    </div>
  );
}

function Section({ label, color, bg, children }: { label: string; color: string; bg: string; children: React.ReactNode }) {
  return (
    <>
      <div style={{ padding: "3px 10px", fontSize: 8, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.08em", background: bg }}>
        {label}
      </div>
      {children}
    </>
  );
}

function VideoRow({
  v,
  dateLabel,
  dateColor,
  setAnalyserInput,
}: {
  v: PoliticianVideo;
  dateLabel: string;
  dateColor: string;
  setAnalyserInput: (url: string) => void;
}) {
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
        <span style={{ fontSize: 8, color: dateColor, flexShrink: 0 }}>{dateLabel}</span>
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
