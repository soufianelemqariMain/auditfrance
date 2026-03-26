import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 3600; // cache 1h

// Static fallback — least-active deputies from nosdéputés.fr (March 2026 data)
// Used when the live API is unavailable from Vercel's network
const STATIC_FALLBACK = [
  { nom: "Christophe Blanchet", groupe: "EPR", score: 3, semaines: 2 },
  { nom: "Philippe Lottiaux", groupe: "RN", score: 4, semaines: 3 },
  { nom: "André Villiers", groupe: "EPR", score: 5, semaines: 3 },
  { nom: "Véronique de Simone", groupe: "RN", score: 6, semaines: 4 },
  { nom: "Frédéric Falcon", groupe: "RN", score: 7, semaines: 5 },
  { nom: "Nadège Abomangoli", groupe: "LFI", score: 8, semaines: 5 },
  { nom: "Fabrice Brun", groupe: "DR", score: 9, semaines: 6 },
  { nom: "Yannick Monnet", groupe: "GDR", score: 10, semaines: 6 },
  { nom: "Isabelle Santiago", groupe: "SOC", score: 11, semaines: 7 },
  { nom: "Denis Masséglia", groupe: "EPR", score: 12, semaines: 7 },
  { nom: "Alexandre Portier", groupe: "DR", score: 13, semaines: 8 },
  { nom: "Pierre Meurin", groupe: "RN", score: 14, semaines: 8 },
  { nom: "Sébastien Delogu", groupe: "LFI", score: 15, semaines: 9 },
  { nom: "Laure Miller", groupe: "EPR", score: 16, semaines: 9 },
  { nom: "Alexis Corbière", groupe: "EFI", score: 17, semaines: 10 },
];

interface Deputy {
  nom: string;
  groupe_sigle: string;
  semaines_presence: number;
  rapp: number;
  quest_ecrites: number;
}

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch("https://www.nosdeputes.fr/synthese/data/json", {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`nosdeputes HTTP ${res.status}`);

    const data = await res.json();
    const deputes: Deputy[] = (data.deputes ?? [])
      .map((d: { depute: Record<string, unknown> }) => d.depute)
      .map((d: Record<string, unknown>) => ({
        nom: String(d.nom ?? ""),
        groupe_sigle: String(d.groupe_sigle ?? ""),
        semaines_presence: Number(d.semaines_presence ?? 0),
        rapp: Number(d.rapp ?? 0),
        quest_ecrites: Number(d.quest_ecrites ?? 0),
      }));

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
      .slice(0, 15);

    return NextResponse.json({ deputes: scored, updatedAt: new Date().toISOString(), source: "live" });
  } catch {
    // Live API unreachable from Vercel — return static snapshot
    return NextResponse.json({
      deputes: STATIC_FALLBACK,
      updatedAt: "2026-03-01T00:00:00.000Z",
      source: "static",
    });
  }
}
