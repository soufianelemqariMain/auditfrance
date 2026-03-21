import { NextResponse } from "next/server";

const SYNTHESE_URL = "https://www.nosdeputes.fr/synthese/data/json";

interface DeputeRaw {
  num_deptmt: string;
  ancien_depute?: boolean;
  mandat_fin?: string;
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

interface CacheEntry { stats: Record<string, DeptStat>; fetchedAt: number }
let cache: CacheEntry | null = null;
const CACHE_TTL = 60 * 60 * 1000;

export interface DeptStat {
  code: string;
  nbDeputes: number;
  scoreAvg: number; // 0-100
  presenceAvg: number;
  interventionsAvg: number;
  amendementsAvg: number;
  questionsAvg: number;
}

function computeRaw(d: DeputeRaw) {
  const mois = d.nb_mois ?? 1;
  return {
    presence: (d.semaines_presence ?? 0) / mois,
    interventions: ((d.hemicycle_interventions ?? 0) + (d.commission_interventions ?? 0)) / mois,
    amendements: ((d.amendements_proposes ?? 0) + (d.amendements_adoptes ?? 0) * 3) / mois,
    questions: ((d.questions_ecrites ?? 0) + (d.questions_orales ?? 0) * 2) / mois,
    props: ((d.propositions_ecrites ?? 0) + (d.rapports ?? 0) * 5) / mois,
  };
}

async function buildStats(): Promise<Record<string, DeptStat>> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) return cache.stats;

  const res = await fetch(SYNTHESE_URL, {
    headers: { "User-Agent": "AuditFrance/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const all: DeputeRaw[] = (json.deputes as Array<{ depute: DeputeRaw }>)
    .map((d) => d.depute);

  const byDept: Record<string, DeputeRaw[]> = {};
  for (const d of all) {
    const code = String(d.num_deptmt || "").padStart(2, "0").toUpperCase();
    if (!byDept[code]) byDept[code] = [];
    byDept[code].push(d);
  }

  const stats: Record<string, DeptStat> = {};
  for (const [code, deps] of Object.entries(byDept)) {
    const raws = deps.map(computeRaw);
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const presenceAvg = avg(raws.map((r) => r.presence));
    const interventionsAvg = avg(raws.map((r) => r.interventions));
    const amendementsAvg = avg(raws.map((r) => r.amendements));
    const questionsAvg = avg(raws.map((r) => r.questions));
    const propsAvg = avg(raws.map((r) => r.props));
    const scoreAvg = Math.min(100, Math.round(
      presenceAvg * 2 + interventionsAvg * 0.5 + amendementsAvg * 1 + questionsAvg * 0.3 + propsAvg * 2
    ));
    stats[code] = { code, nbDeputes: deps.length, scoreAvg, presenceAvg, interventionsAvg, amendementsAvg, questionsAvg };
  }

  cache = { stats, fetchedAt: Date.now() };
  return stats;
}

export async function GET() {
  try {
    const stats = await buildStats();
    const arr = Object.values(stats);
    const maxScore = Math.max(...arr.map((s) => s.scoreAvg), 1);
    // Normalize scores to 0-1
    const normalized = arr.map((s) => ({ ...s, norm: s.scoreAvg / maxScore }));
    return NextResponse.json({ depts: normalized, maxScore });
  } catch (err) {
    return NextResponse.json({ error: String(err instanceof Error ? err.message : err), depts: [] }, { status: 500 });
  }
}
