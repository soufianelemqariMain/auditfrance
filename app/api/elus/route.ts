import { NextRequest, NextResponse } from "next/server";

// nosdeputes.fr synthese endpoint — includes full activity stats
const SYNTHESE_URL = "https://www.nosdeputes.fr/synthese/data/json";
const BULK_URL = "https://www.nosdeputes.fr/deputes/json";

interface DeputeRaw {
  id: number;
  nom: string;
  nom_de_famille: string;
  prenom: string;
  num_deptmt: string;
  nom_circo: string;
  num_circo: number;
  groupe_sigle: string;
  mandat_debut: string;
  mandat_fin: string;
  ancien_depute?: boolean;
  nb_mandats: number;
  slug: string;
  url_an: string;
  url_nosdeputes: string;
  profession?: string;
  twitter?: string;
  // Activity stats (from synthese)
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
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getAllDeputies(): Promise<DeputeRaw[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) return cache.deputes;

  // Try synthese first (includes full activity stats)
  try {
    const res = await fetch(SYNTHESE_URL, {
      headers: { "User-Agent": "AuditFrance/1.0" },
      signal: AbortSignal.timeout(12000),
    });
    if (res.ok) {
      const json = await res.json();
      // nosdeputes.fr currently covers 16th legislature (2022-2024); include all mandates
      const deputes: DeputeRaw[] = (json.deputes as Array<{ depute: DeputeRaw }>)
        .map((d) => d.depute);
      cache = { deputes, fetchedAt: Date.now() };
      return deputes;
    }
  } catch {
    // fallthrough to bulk
  }

  // Fallback to bulk (no activity stats)
  const res = await fetch(BULK_URL, {
    headers: { "User-Agent": "AuditFrance/1.0" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`nosdeputes.fr HTTP ${res.status}`);
  const json = await res.json();
  const deputes: DeputeRaw[] = (json.deputes as Array<{ depute: DeputeRaw }>)
    .map((d) => d.depute);
  cache = { deputes, fetchedAt: Date.now() };
  return deputes;
}

function computeScore(d: DeputeRaw): number {
  const mois = d.nb_mois ?? 1;
  const presence = (d.semaines_presence ?? 0) / mois;
  const interventions = ((d.hemicycle_interventions ?? 0) + (d.commission_interventions ?? 0)) / mois;
  const amendments = ((d.amendements_proposes ?? 0) + (d.amendements_adoptes ?? 0) * 3) / mois;
  const questions = ((d.questions_ecrites ?? 0) + (d.questions_orales ?? 0) * 2) / mois;
  const props = ((d.propositions_ecrites ?? 0) + (d.rapports ?? 0) * 5) / mois;
  // Weighted score (0-100)
  return Math.min(100, Math.round(presence * 2 + interventions * 0.5 + amendments * 1 + questions * 0.3 + props * 2));
}

export async function GET(request: NextRequest) {
  const dept = request.nextUrl.searchParams.get("dept");
  if (!dept) return NextResponse.json({ error: "dept param required" }, { status: 400 });

  try {
    const all = await getAllDeputies();
    const query = dept.toUpperCase();
    const filtered = all.filter((d) => {
      const dCode = String(d.num_deptmt || "").padStart(2, "0").toUpperCase();
      return dCode === query.padStart(2, "0");
    });

    return NextResponse.json({
      dept,
      count: filtered.length,
      legislature: "16ème (2022-2024) — nosdeputes.fr",
      deputes: filtered.map((d) => ({
        nom: d.nom_de_famille,
        prenom: d.prenom,
        groupe: d.groupe_sigle,
        circo: d.nom_circo,
        numCirco: d.num_circo,
        nbMandats: d.nb_mandats,
        profession: d.profession ?? null,
        mandatDebut: d.mandat_debut,
        url: `https://www.nosdeputes.fr/${d.slug}`,
        urlAN: d.url_an,
        twitter: d.twitter ?? null,
        score: computeScore(d),
        activite: {
          presenceSemaines: d.semaines_presence ?? null,
          interventionsHemicycle: d.hemicycle_interventions ?? null,
          interventionsCommission: d.commission_interventions ?? null,
          amendementsProposes: d.amendements_proposes ?? null,
          amendementsAdoptes: d.amendements_adoptes ?? null,
          questionsEcrites: d.questions_ecrites ?? null,
          questionsOrales: d.questions_orales ?? null,
          propositionsEcrites: d.propositions_ecrites ?? null,
          rapports: d.rapports ?? null,
          nbMois: d.nb_mois ?? null,
        },
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err), deputes: [] },
      { status: 500 }
    );
  }
}
