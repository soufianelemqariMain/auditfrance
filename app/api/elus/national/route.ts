import { NextResponse } from "next/server";

const SYNTHESE_URL = "https://www.nosdeputes.fr/synthese/data/json";

interface DeputeRaw {
  nom_de_famille: string;
  prenom: string;
  num_deptmt: string;
  nom_circo: string;
  groupe_sigle: string;
  slug: string;
  url_an: string;
  semaines_presence?: number;
  hemicycle_interventions?: number;
  commission_interventions?: number;
  amendements_proposes?: number;
  amendements_adoptes?: number;
  questions_ecrites?: number;
  questions_orales?: number;
  propositions_ecrites?: number;
  rapports?: number;
  nb_mois?: number;
}

interface CacheEntry { deputes: DeputeRaw[]; fetchedAt: number }
let cache: CacheEntry | null = null;
const CACHE_TTL = 60 * 60 * 1000;

function computeScore(d: DeputeRaw): number {
  const mois = d.nb_mois ?? 1;
  const presence = (d.semaines_presence ?? 0) / mois;
  const interventions = ((d.hemicycle_interventions ?? 0) + (d.commission_interventions ?? 0)) / mois;
  const amendments = ((d.amendements_proposes ?? 0) + (d.amendements_adoptes ?? 0) * 3) / mois;
  const questions = ((d.questions_ecrites ?? 0) + (d.questions_orales ?? 0) * 2) / mois;
  const props = ((d.propositions_ecrites ?? 0) + (d.rapports ?? 0) * 5) / mois;
  return Math.min(100, Math.round(presence * 2 + interventions * 0.5 + amendments * 1 + questions * 0.3 + props * 2));
}

export async function GET() {
  try {
    if (!cache || Date.now() - cache.fetchedAt > CACHE_TTL) {
      const res = await fetch(SYNTHESE_URL, {
        headers: { "User-Agent": "AuditFrance/1.0" },
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) throw new Error(`nosdeputes.fr HTTP ${res.status}`);
      const json = await res.json();
      const deputes: DeputeRaw[] = (json.deputes as Array<{ depute: DeputeRaw }>).map((d) => d.depute);
      cache = { deputes, fetchedAt: Date.now() };
    }

    const scored = cache.deputes
      .filter((d) => !!(d.nb_mois && d.nb_mois > 0))
      .map((d) => ({ ...d, score: computeScore(d) }))
      .sort((a, b) => a.score - b.score) // ascending = worst first
      .slice(0, 15);

    return NextResponse.json({
      deputes: scored.map((d) => ({
        nom: `${d.prenom} ${d.nom_de_famille}`,
        groupe: d.groupe_sigle,
        dept: d.num_deptmt,
        circo: d.nom_circo,
        score: d.score,
        url: `https://www.nosdeputes.fr/${d.slug}`,
        urlAN: d.url_an,
      })),
      total: cache.deputes.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err), deputes: [] },
      { status: 500 }
    );
  }
}
