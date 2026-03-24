import { NextRequest, NextResponse } from "next/server";

// data.gouv.fr — Municipales 2026 résultats second tour communes
const CSV_URL =
  "https://static.data.gouv.fr/resources/elections-municipales-2026-resultats-du-scond-tour/20260323-180124/municipales-2026-resultats-communes-2026-03-23-16h14.csv";

export interface ListeResult {
  numPanneau: string;
  nomTete: string;
  prenomTete: string;
  nuance: string;
  libelleAbr: string;
  libelle: string;
  voix: number;
  pctVoixExprim: number;
  elu: boolean;
  siegesCM: number;
  siegesCC: number;
}

export interface CommuneElections {
  codeCommune: string;
  libCommune: string;
  inscrits: number;
  votants: number;
  pctVotants: number;
  abstentions: number;
  pctAbstentions: number;
  exprimes: number;
  blancs: number;
  nuls: number;
  listes: ListeResult[];
  source: string;
}

// In-memory cache (server-side, shared across requests)
let _cache: Map<string, CommuneElections> | null = null;
let _cacheTs = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h — election results don't change

function parseFr(s: string): number {
  if (!s || s.trim() === "") return 0;
  return parseFloat(s.trim().replace(",", ".")) || 0;
}

function parseIntFr(s: string): number {
  if (!s || s.trim() === "") return 0;
  return parseInt(s.replace(/\s/g, "").replace(/\u00a0/g, ""), 10) || 0;
}

function clean(s: string): string {
  return s.trim().replace(/^"(.*)"$/, "$1");
}

async function loadData(): Promise<Map<string, CommuneElections>> {
  if (_cache && Date.now() - _cacheTs < CACHE_TTL) return _cache;

  const res = await fetch(CSV_URL, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`data.gouv.fr HTTP ${res.status}`);
  const text = await res.text();

  const lines = text.split(/\r?\n/);
  const map = new Map<string, CommuneElections>();

  // Skip header (line 0)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const cols = line.split(";").map(clean);
    if (cols.length < 18) continue;

    const codeCommune = cols[2];
    if (!codeCommune) continue;

    // Parse lists — each list block is 13 columns starting at index 18
    const listes: ListeResult[] = [];
    for (let j = 18; j + 12 < cols.length; j += 13) {
      if (!cols[j] || !cols[j + 6]) continue; // empty panneau or list label = no more lists
      listes.push({
        numPanneau: cols[j],
        nomTete: cols[j + 1],
        prenomTete: cols[j + 2],
        nuance: cols[j + 4],
        libelleAbr: cols[j + 5],
        libelle: cols[j + 6],
        voix: parseIntFr(cols[j + 7]),
        pctVoixExprim: parseFr(cols[j + 9]),
        elu: cols[j + 10]?.trim() !== "" && cols[j + 10]?.trim() !== "0",
        siegesCM: parseIntFr(cols[j + 11]),
        siegesCC: parseIntFr(cols[j + 12]),
      });
    }

    map.set(codeCommune, {
      codeCommune,
      libCommune: cols[3],
      inscrits: parseIntFr(cols[4]),
      votants: parseIntFr(cols[5]),
      pctVotants: parseFr(cols[6]),
      abstentions: parseIntFr(cols[7]),
      pctAbstentions: parseFr(cols[8]),
      exprimes: parseIntFr(cols[9]),
      blancs: parseIntFr(cols[12]),
      nuls: parseIntFr(cols[15]),
      listes,
      source: "data.gouv.fr — Municipales 2026 T2 (23 mars 2026)",
    });
  }

  _cache = map;
  _cacheTs = Date.now();
  return map;
}

export async function GET(req: NextRequest) {
  const commune = req.nextUrl.searchParams.get("commune");
  if (!commune) {
    return NextResponse.json({ error: "Paramètre commune manquant" }, { status: 400 });
  }

  try {
    const data = await loadData();
    const result = data.get(commune);
    if (!result) {
      return NextResponse.json(
        { error: "Commune non trouvée dans les résultats du 2e tour", commune },
        { status: 404 }
      );
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err) },
      { status: 500 }
    );
  }
}
