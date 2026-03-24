"use client";

import { useState, useEffect } from "react";
import type { SondagesData, Poll } from "@/app/api/sondages/route";

const PARTY_COLORS: Record<string, string> = {
  RN: "#002395",
  Horizons: "#0080FF",
  Renaissance: "#FFBE00",
  LFI: "#CC2443",
  PS: "#E75480",
  LR: "#0047AB",
  "Gauche": "#CC2443",
  "LFI/Gauche": "#CC2443",
};

function partyColor(party: string) {
  return PARTY_COLORS[party] ?? "#6b7280";
}

function ScoreBar({ score, max, color }: { score: number; max: number; color: string }) {
  return (
    <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${(score / max) * 100}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.4s" }} />
    </div>
  );
}

function ApprovalChart({ data }: { data: SondagesData["approvalMacron"] }) {
  const last12 = data.slice(-12);
  const maxVal = 100;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px 16px 6px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Popularité Macron — 12 derniers mois
        </div>
      </div>
      <div style={{ flex: 1, padding: "12px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {last12.map((pt) => {
          const [year, month] = pt.date.split("-");
          const label = new Date(Number(year), Number(month) - 1).toLocaleString("fr-FR", { month: "short", year: "2-digit" });
          return (
            <div key={pt.date} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 46, fontSize: 9, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>{label}</span>
              <div style={{ flex: 1, position: "relative", height: 14, display: "flex", alignItems: "center" }}>
                {/* disapproval bar (red, full width bg) */}
                <div style={{ position: "absolute", inset: 0, background: "rgba(239,68,68,0.12)", borderRadius: 2 }} />
                {/* approval bar (blue, partial) */}
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${(pt.approval / maxVal) * 100}%`,
                  background: "rgba(99,102,241,0.5)", borderRadius: 2,
                  transition: "width 0.3s"
                }} />
                <span style={{ position: "absolute", left: 4, fontSize: 9, color: "#a5b4fc", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                  {pt.approval}%
                </span>
                <span style={{ position: "absolute", right: 4, fontSize: 9, color: "#fca5a5", fontFamily: "var(--font-mono)" }}>
                  {pt.disapproval}%
                </span>
              </div>
            </div>
          );
        })}
        <div style={{ display: "flex", gap: 16, marginTop: 6, fontSize: 9, color: "var(--text-secondary)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, background: "rgba(99,102,241,0.5)", borderRadius: 1, display: "inline-block" }} />
            Approbation
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, background: "rgba(239,68,68,0.3)", borderRadius: 1, display: "inline-block" }} />
            Désapprobation
          </span>
          <span style={{ marginLeft: "auto" }}>Source : IFOP</span>
        </div>
      </div>
    </div>
  );
}

function PollCard({ poll }: { poll: Poll }) {
  const maxScore = Math.max(...poll.candidates.map((c) => c.score));
  return (
    <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>
            Tour {poll.round}
          </span>
          <span style={{ fontSize: 10, color: "var(--text-secondary)", marginLeft: 8 }}>
            {poll.pollster} / {poll.sponsor}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {poll.sampleSize && (
            <span style={{ fontSize: 9, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
              n={poll.sampleSize.toLocaleString("fr-FR")}
            </span>
          )}
          <span style={{ fontSize: 9, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            {new Date(poll.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" })}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {poll.candidates.map((c) => {
          const color = partyColor(c.party);
          return (
            <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 3,
                background: color + "22", color, border: `1px solid ${color}44`,
                flexShrink: 0, width: 64, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{c.party}</span>
              <span style={{ fontSize: 11, color: "var(--text-primary)", width: 140, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.name}
              </span>
              <ScoreBar score={c.score} max={maxScore} color={color} />
              <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "var(--font-mono)", width: 36, textAlign: "right", flexShrink: 0 }}>
                {c.score}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SondagesPanel() {
  const [data, setData] = useState<SondagesData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/sondages")
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return <div style={{ padding: 16, fontSize: 11, color: "var(--text-secondary)" }}>Erreur: {error}</div>;
  }

  if (!data) {
    return <div style={{ padding: 16, fontSize: 11, color: "var(--text-secondary)" }}>Chargement…</div>;
  }

  const round1Polls = data.polls2027.filter((p) => p.round === 1);
  const round2Polls = data.polls2027.filter((p) => p.round === 2);

  return (
    <div style={{ height: "100%", display: "flex", overflow: "hidden" }}>
      {/* Approval chart */}
      <div style={{ width: 280, flexShrink: 0, borderRight: "1px solid var(--border)", overflow: "hidden" }}>
        <ApprovalChart data={data.approvalMacron} />
      </div>

      {/* Polls */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "8px 16px 4px", borderBottom: "1px solid var(--border)", fontSize: 10, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.07em", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Sondages présidentiels 2027</span>
          <span style={{ fontWeight: 400, fontSize: 9 }}>Dernière mise à jour : {data.lastUpdated}</span>
        </div>

        <div style={{ display: "flex", height: "calc(100% - 33px)", overflow: "hidden" }}>
          {/* 1st round */}
          <div style={{ flex: 1, overflow: "auto", borderRight: "1px solid var(--border)" }}>
            <div style={{ padding: "6px 16px", fontSize: 10, fontWeight: 600, color: "var(--accent-blue)", textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              1er Tour
            </div>
            {round1Polls.map((p, i) => <PollCard key={i} poll={p} />)}
          </div>

          {/* 2nd round */}
          <div style={{ flex: 1, overflow: "auto" }}>
            <div style={{ padding: "6px 16px", fontSize: 10, fontWeight: 600, color: "var(--accent-yellow)", textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              2ème Tour
            </div>
            {round2Polls.map((p, i) => <PollCard key={i} poll={p} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
