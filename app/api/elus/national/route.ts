import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

interface DeputyRecord {
  id: string;
  prenom: string;
  nom: string;
  region: string;
  departement: string;
  numCirco: string;
  profession: string;
  groupeComplet: string;
  groupeAbrege: string;
  questionsOrales: number;
  votesParticipes: number;
  score: number;
}

interface ScoresFile {
  deputies: Record<string, DeputyRecord>;
  generatedAt: string;
  sources: string[];
}

let scoresCache: ScoresFile | null = null;

async function loadScores(): Promise<ScoresFile> {
  if (scoresCache) return scoresCache;
  const filePath = path.join(process.cwd(), "public", "deputy-scores.json");
  const raw = await readFile(filePath, "utf-8");
  scoresCache = JSON.parse(raw) as ScoresFile;
  return scoresCache;
}

export async function GET() {
  try {
    const data = await loadScores();
    const all = Object.values(data.deputies);

    // Bottom 15 by score (least active first)
    const bottom = all
      .sort((a, b) => a.score - b.score)
      .slice(0, 15);

    return NextResponse.json({
      deputes: bottom.map((d) => ({
        nom: `${d.prenom} ${d.nom}`,
        groupe: d.groupeAbrege || "NI",
        dept: d.departement,
        circo: `${d.departement} · circ. ${d.numCirco}`,
        score: d.score,
        questionsOrales: d.questionsOrales,
        votesParticipes: d.votesParticipes,
        url: `https://www.assemblee-nationale.fr/dyn/deputes/PA${d.id}`,
      })),
      total: all.length,
      legislature: "17ème (depuis 2024)",
      generatedAt: data.generatedAt,
      sources: data.sources,
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err), deputes: [] },
      { status: 500 }
    );
  }
}
