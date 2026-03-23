import { NextRequest, NextResponse } from "next/server";

// ─── RNE Maires in-memory cache ───────────────────────────────────────────────
// The Répertoire National des Élus (RNE) maires CSV is ~10MB.
// We download it once per server lifetime (24h TTL) and index by INSEE commune code.
interface MaireInfo {
  nom: string;
  prenom: string;
  csp: string;
  mandatDebut: string;
}

let mairesIndex: Map<string, MaireInfo> | null = null;
let mairesIndexTs = 0;
const MAIRES_TTL = 24 * 60 * 60 * 1000; // 24 h

async function getMairesIndex(): Promise<Map<string, MaireInfo>> {
  if (mairesIndex && Date.now() - mairesIndexTs < MAIRES_TTL) return mairesIndex;

  // 1. Fetch dataset metadata from data.gouv.fr to get the current CSV download URL
  const metaRes = await fetch(
    "https://www.data.gouv.fr/api/1/datasets/repertoire-national-des-elus-1/",
    { signal: AbortSignal.timeout(12000), next: { revalidate: 0 } }
  );
  if (!metaRes.ok) throw new Error(`data.gouv.fr meta HTTP ${metaRes.status}`);
  const metaJson = await metaRes.json();

  // Resources list — find the maires CSV (title contains "maires" or "maire")
  const resources: Array<{ title: string; url: string; format?: string }> =
    metaJson.resources ?? [];
  const mairesResource = resources.find(
    (r) => /maire/i.test(r.title) && !/conseiller/i.test(r.title)
  );
  if (!mairesResource?.url) throw new Error("RNE maires resource URL not found");

  // 2. Download the CSV
  const csvRes = await fetch(mairesResource.url, {
    signal: AbortSignal.timeout(45000),
    next: { revalidate: 0 },
  });
  if (!csvRes.ok) throw new Error(`RNE CSV HTTP ${csvRes.status}`);
  const csvText = await csvRes.text();

  // 3. Parse — RNE uses semicolons as delimiter, may be wrapped in double-quotes
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) throw new Error("RNE CSV appears empty");

  const rawHeaders = lines[0].split(";").map((h) => h.replace(/^"|"$/g, "").trim().toLowerCase());

  const col = (keyword: string) =>
    rawHeaders.findIndex((h) => h.includes(keyword));

  const codeCol = col("code de la commune");
  const nomCol = col("nom de l");
  const prenomCol = col("prénom");
  const cspCol = col("catégorie socio");
  const mandatCol = col("début du mandat");

  const map = new Map<string, MaireInfo>();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(";").map((c) => c.replace(/^"|"$/g, "").trim());
    const code = cols[codeCol];
    if (!code || code.length < 4) continue;
    map.set(code, {
      nom: cols[nomCol] ?? "",
      prenom: cols[prenomCol] ?? "",
      csp: cols[cspCol] ?? "",
      mandatDebut: (cols[mandatCol] ?? "").slice(0, 10),
    });
  }

  mairesIndex = map;
  mairesIndexTs = Date.now();
  return map;
}

// ─── Per-commune response cache (15 min) ──────────────────────────────────────
interface CommuneData {
  commune: {
    code: string;
    nom: string;
    population: number;
    surface: number;
    codeDepartement: string;
    nomDepartement: string;
    codeRegion: string;
  };
  maire: MaireInfo | null;
  budget: BudgetYear[] | null;
  elections2026Pending: boolean;
}

interface BudgetYear {
  annee: number;
  depFonctHab: number;
  recFonctHab: number;
  detteEncHab: number;
  epargneBruteHab: number;
}

const communeCache = new Map<string, { data: CommuneData; ts: number }>();
const COMMUNE_TTL = 15 * 60 * 1000; // 15 min

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code_insee: string }> }
) {
  const { code_insee } = await params;
  const code = code_insee.trim();

  const cached = communeCache.get(code);
  if (cached && Date.now() - cached.ts < COMMUNE_TTL) {
    return NextResponse.json(cached.data);
  }

  const [communeResult, mairesResult, budgetResult] = await Promise.allSettled([
    // Geo API — commune metadata
    fetch(
      `https://geo.api.gouv.fr/communes?code=${code}&fields=code,nom,population,surface,codeDepartement,nomDepartement,codeRegion&boost=population`,
      { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } }
    ).then((r) => r.json()),

    // RNE maires index
    getMairesIndex(),

    // OFGL — communal budget per capita (last 5 years)
    fetch(
      `https://data.ofgl.fr/api/explore/v2.1/catalog/datasets/ofgl-base-communes/records?where=insee_com%3D%22${code}%22&select=exer%2Cdep_fonct_hab%2Crec_fonct_hab%2Cdette_encours_hab%2Cepargne_brute_hab&order_by=exer%20desc&limit=5`,
      { signal: AbortSignal.timeout(10000), next: { revalidate: 0 } }
    ).then((r) => r.json()),
  ]);

  // Commune metadata
  const geoArray =
    communeResult.status === "fulfilled" ? (communeResult.value as unknown[]) : [];
  const geo = Array.isArray(geoArray) && geoArray.length > 0
    ? (geoArray[0] as Record<string, unknown>)
    : null;

  if (!geo) {
    return NextResponse.json(
      { error: `Commune ${code} introuvable`, code },
      { status: 404 }
    );
  }

  // Mayor
  const index = mairesResult.status === "fulfilled" ? mairesResult.value : null;
  const maire = index ? (index.get(code) ?? null) : null;

  // Budget
  let budget: BudgetYear[] | null = null;
  if (budgetResult.status === "fulfilled") {
    const ofglJson = budgetResult.value as { results?: Record<string, unknown>[] };
    if (Array.isArray(ofglJson.results) && ofglJson.results.length > 0) {
      budget = ofglJson.results.map((r) => ({
        annee: Number(r.exer ?? 0),
        depFonctHab: Number(r.dep_fonct_hab ?? 0),
        recFonctHab: Number(r.rec_fonct_hab ?? 0),
        detteEncHab: Number(r.dette_encours_hab ?? 0),
        epargneBruteHab: Number(r.epargne_brute_hab ?? 0),
      }));
    }
  }

  const data: CommuneData = {
    commune: {
      code,
      nom: String(geo.nom ?? ""),
      population: Number(geo.population ?? 0),
      surface: Number(geo.surface ?? 0),
      codeDepartement: String(geo.codeDepartement ?? ""),
      nomDepartement: String(geo.nomDepartement ?? ""),
      codeRegion: String(geo.codeRegion ?? ""),
    },
    maire,
    budget,
    // 2026 municipales results not yet published by the Ministère de l'Intérieur
    elections2026Pending: true,
  };

  communeCache.set(code, { data, ts: Date.now() });
  return NextResponse.json(data);
}
