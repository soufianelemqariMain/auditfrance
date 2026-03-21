import { NextResponse } from "next/server";

// Official AN open data — 17th legislature (2024-present)
const AN_CSV_URL =
  "https://data.assemblee-nationale.fr/static/openData/repository/17/amo/deputes_actifs_csv_opendata/liste_deputes_libre_office.csv";

interface Deputy {
  identifiant: string;
  prenom: string;
  nom: string;
  region: string;
  departement: string;
  numCirco: string;
  profession: string;
  groupeComplet: string;
  groupeAbrege: string;
}

interface CacheEntry { deputes: Deputy[]; fetchedAt: number }
let cache: CacheEntry | null = null;
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

function parseCSV(text: string): Deputy[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  return lines.slice(1).map((line) => {
    const v = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    return {
      identifiant: v[0] ?? "",
      prenom: v[1] ?? "",
      nom: v[2] ?? "",
      region: v[3] ?? "",
      departement: v[4] ?? "",
      numCirco: v[5] ?? "",
      profession: v[6] ?? "",
      groupeComplet: v[7] ?? "",
      groupeAbrege: v[8] ?? "",
    };
  }).filter((d) => d.identifiant && d.nom);
}

async function fetchDeputies(): Promise<Deputy[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) return cache.deputes;

  const res = await fetch(AN_CSV_URL, {
    headers: { "User-Agent": "AuditFrance/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`AN CSV HTTP ${res.status}`);
  const text = await res.text();
  const deputes = parseCSV(text);
  cache = { deputes, fetchedAt: Date.now() };
  return deputes;
}

export async function GET() {
  try {
    const all = await fetchDeputies();

    // Proportional cross-section: 1 deputy per group cycling until 15
    const byGroup: Record<string, Deputy[]> = {};
    for (const d of all) {
      const g = d.groupeAbrege || "NI";
      if (!byGroup[g]) byGroup[g] = [];
      byGroup[g].push(d);
    }

    // Sort groups by size descending for representative sample
    const groups = Object.entries(byGroup).sort((a, b) => b[1].length - a[1].length);
    const sample: Deputy[] = [];
    let round = 0;
    while (sample.length < 15) {
      let added = false;
      for (const [, members] of groups) {
        if (sample.length >= 15) break;
        if (round < members.length) {
          sample.push(members[round]);
          added = true;
        }
      }
      if (!added) break;
      round++;
    }

    return NextResponse.json({
      deputes: sample.map((d) => ({
        nom: `${d.prenom} ${d.nom}`,
        groupe: d.groupeAbrege || "NI",
        dept: d.departement,
        circo: `${d.departement} · circ. ${d.numCirco}`,
        score: null, // No activity scoring available for 17th legislature
        url: `https://www.assemblee-nationale.fr/dyn/deputes/PA${d.identifiant}`,
      })),
      total: all.length,
      legislature: "17ème (depuis 2024)",
      source: "data.assemblee-nationale.fr",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err), deputes: [] },
      { status: 500 }
    );
  }
}
