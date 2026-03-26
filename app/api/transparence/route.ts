import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 3600; // cache 1h

interface Deputy {
  nom: string;
  groupe_sigle: string;
  activite: number; // participation rate 0-100
  semaines_presence: number;
  rapp: number; // reports written
  quest_ecrites: number;
}

export async function GET() {
  try {
    const res = await fetch(
      "https://www.nosdeputes.fr/synthese/data/json",
      { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) }
    );

    if (!res.ok) throw new Error(`nosdeputes HTTP ${res.status}`);

    const data = await res.json();
    const deputes: Deputy[] = (data.deputes ?? [])
      .map((d: { depute: Record<string, unknown> }) => d.depute)
      .map((d: Record<string, unknown>) => ({
        nom: String(d.nom ?? ""),
        groupe_sigle: String(d.groupe_sigle ?? ""),
        activite: Number(d.semaines_presence ?? 0),
        semaines_presence: Number(d.semaines_presence ?? 0),
        rapp: Number(d.rapp ?? 0),
        quest_ecrites: Number(d.quest_ecrites ?? 0),
      }));

    // Score = composite of weeks present (weight 60%) + questions/reports (40%)
    const maxPresence = Math.max(...deputes.map((d) => d.semaines_presence), 1);
    const maxActivity = Math.max(...deputes.map((d) => d.rapp + d.quest_ecrites), 1);

    const scored = deputes
      .map((d) => ({
        nom: d.nom,
        groupe: d.groupe_sigle,
        score: Math.round(
          (d.semaines_presence / maxPresence) * 60 +
          ((d.rapp + d.quest_ecrites) / maxActivity) * 40
        ),
        semaines: d.semaines_presence,
      }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 15); // 15 least active

    return NextResponse.json({ deputes: scored, updatedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "fetch failed" },
      { status: 502 }
    );
  }
}
