import { NextRequest, NextResponse } from "next/server";

// Subventions attribuées — data.subventions.beta.gouv.fr (open-data endpoint)
const SUBV_API =
  "https://api.data-subventions.beta.gouv.fr/open-data/etablissements-subventionnes";

// Subventions ouvertes — aides-territoires.beta.gouv.fr (live aid programs)
const AIDES_API = "https://aides-territoires.beta.gouv.fr/api/aids/";

let cacheAttrib: { data: SubventionsData; ts: number } | null = null;
let cacheOuvert: { data: AidesData; ts: number } | null = null;
const CACHE_TTL = 20 * 60 * 1000; // 20 min

interface Subvention {
  siret: string;
  nom: string;
  montant: number;
  annee: number;
  dispositif: string;
  ministere: string;
}

interface SubventionsData {
  total: number;
  subventions: Subvention[];
  fetchedAt: string;
  source: string;
}

interface Aide {
  id: number;
  name: string;
  description: string;
  url: string;
  categories: string[];
  financers: string[];
  submission_deadline: string | null;
  start_date: string | null;
}

interface AidesData {
  total: number;
  aides: Aide[];
  fetchedAt: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const type = request.nextUrl.searchParams.get("type") ?? "attribuees";

  if (type === "ouvertes") {
    if (cacheOuvert && Date.now() - cacheOuvert.ts < CACHE_TTL) {
      return NextResponse.json(cacheOuvert.data);
    }

    try {
      const params = new URLSearchParams({
        is_live: "true",
        per_page: "50",
        page: "1",
        // Limit to financial aid types
        aid_types: "grant",
      });
      const res = await fetch(`${AIDES_API}?${params}`, {
        headers: { "User-Agent": "FranceMonitor/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(12000),
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        return NextResponse.json({
          total: 0,
          aides: [],
          fetchedAt: new Date().toISOString(),
          error: `HTTP ${res.status}`,
        });
      }

      const json = await res.json();
      const aides: Aide[] = (json.results ?? []).map((r: Record<string, unknown>) => ({
        id: Number(r.id ?? 0),
        name: String(r.name ?? "").trim(),
        description: String(r.description ?? "")
          .replace(/<[^>]+>/g, " ")
          .trim()
          .slice(0, 300),
        url: String(r.url ?? ""),
        categories: Array.isArray(r.categories) ? (r.categories as string[]) : [],
        financers: Array.isArray(r.financers)
          ? (r.financers as Record<string, string>[]).map((f) => f.name ?? "")
          : [],
        submission_deadline: r.submission_deadline ? String(r.submission_deadline).slice(0, 10) : null,
        start_date: r.start_date ? String(r.start_date).slice(0, 10) : null,
      }));

      const data: AidesData = { total: json.count ?? aides.length, aides, fetchedAt: new Date().toISOString() };
      cacheOuvert = { data, ts: Date.now() };
      return NextResponse.json(data);
    } catch (err) {
      return NextResponse.json({
        total: 0,
        aides: [],
        fetchedAt: new Date().toISOString(),
        error: String(err instanceof Error ? err.message : err),
      });
    }
  }

  // type === "attribuees"
  if (cacheAttrib && Date.now() - cacheAttrib.ts < CACHE_TTL) {
    return NextResponse.json(cacheAttrib.data);
  }

  try {
    const res = await fetch(`${SUBV_API}?limit=100`, {
      headers: { "User-Agent": "FranceMonitor/1.0", Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
      next: { revalidate: 0 },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();
    const subventions: Subvention[] = (
      (json.data ?? json.results ?? json) as Record<string, unknown>[]
    )
      .slice(0, 200)
      .map((r) => ({
        siret: String(r.siret ?? r.siretEtablissement ?? ""),
        nom: String(r.denominationSociale ?? r.nomStructure ?? r.nom ?? "").trim(),
        montant: Number(r.montantTotal ?? r.montant ?? 0),
        annee: Number(r.exercice ?? r.annee ?? new Date().getFullYear()),
        dispositif: String(r.nomDispositif ?? r.dispositif ?? "").trim(),
        ministere: String(r.nomMinistere ?? r.ministere ?? "").trim(),
      }))
      .filter((s) => s.nom && s.montant > 0)
      .sort((a, b) => b.montant - a.montant);

    const data: SubventionsData = {
      total: json.total ?? subventions.length,
      subventions,
      fetchedAt: new Date().toISOString(),
      source: "data-subventions.beta.gouv.fr",
    };

    cacheAttrib = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({
      total: 0,
      subventions: [],
      fetchedAt: new Date().toISOString(),
      source: "data-subventions.beta.gouv.fr",
      error: String(err instanceof Error ? err.message : err),
    });
  }
}
