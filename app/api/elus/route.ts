import { NextRequest, NextResponse } from "next/server";

// nosdeputes.fr public API — no key required, returns current legislature deputies
const NOSDEPUTES_URL = "https://www.nosdeputes.fr/deputes/json";

interface Deputy {
  nom: string;
  nom_de_famille: string;
  prenom: string;
  groupe_sigle: string;
  parti_ratt_financier?: string;
  num_deptmt: string;
  nom_circo: string;
  url_an: string;
  slug: string;
  nb_mandats: number;
  twitter?: string;
  sites_web?: Array<{ site: string }>;
  emails?: Array<{ email: string }>;
}

interface RawDeputy {
  depute: Deputy;
}

// Cache fetched deputies for 1 hour to avoid hammering the API
let cache: { deputies: Deputy[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000;

async function getAllDeputies(): Promise<Deputy[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.deputies;
  }
  const res = await fetch(NOSDEPUTES_URL, {
    headers: { "User-Agent": "AuditFrance/1.0" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`nosdeputes.fr HTTP ${res.status}`);
  const json = await res.json();
  const deputies: Deputy[] = (json.deputes as RawDeputy[]).map((d) => d.depute);
  cache = { deputies, fetchedAt: Date.now() };
  return deputies;
}

export async function GET(request: NextRequest) {
  const dept = request.nextUrl.searchParams.get("dept");
  if (!dept) {
    return NextResponse.json({ error: "dept param required" }, { status: 400 });
  }

  try {
    const all = await getAllDeputies();
    // nosdeputes uses numeric dept codes (e.g. "75", "2A")
    const filtered = all.filter((d) => {
      const dCode = String(d.num_deptmt || "").padStart(2, "0").toUpperCase();
      const query = dept.padStart(2, "0").toUpperCase();
      return dCode === query;
    });

    return NextResponse.json({
      dept,
      count: filtered.length,
      deputes: filtered.map((d) => ({
        nom: d.nom,
        prenom: d.prenom,
        groupe: d.groupe_sigle,
        circo: d.nom_circo,
        nbMandats: d.nb_mandats,
        url: `https://www.nosdeputes.fr/${d.slug}`,
        urlAN: d.url_an,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err), deputes: [] },
      { status: 500 }
    );
  }
}
