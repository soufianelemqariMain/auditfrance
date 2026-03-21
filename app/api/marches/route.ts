import { NextRequest, NextResponse } from "next/server";
import { DEPT_SEARCH_TERMS } from "@/lib/deptData";

const DECP_API =
  "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/decp-v3-marches-valides/records";

// Cache per dept: 15 min
const cache = new Map<string, { data: object; ts: number }>();
const CACHE_TTL = 15 * 60 * 1000;

export async function GET(request: NextRequest) {
  const dept = request.nextUrl.searchParams.get("dept");
  if (!dept) return NextResponse.json({ error: "dept param required" }, { status: 400 });

  const key = dept.padStart(2, "0").toUpperCase();

  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    return NextResponse.json(hit.data);
  }

  try {
    // Strategy 1: filter by lieu_execution_code_departement (most precise, dept code 2 chars)
    // Strategy 2: filter by acheteur_nom LIKE "%term%" (name-based fallback)
    // We try strategy 1 first, fall back if < 5 results

    const fields =
      "titulaire_denominationsociale_1,titulaire_siret_1,montant,acheteur_nom,objet,datenotification,procedure,lieu_execution_code_departement,cpv";

    // Strategy 1 — dept code filter
    const url1 = `${DECP_API}?select=${fields}&where=lieu_execution_code_departement%3D%22${key}%22%20AND%20montant%3E25000&order_by=montant%20DESC&limit=50`;
    let results = await fetchDecp(url1);

    // Strategy 2 — name-based if dept-code filter is thin
    if (results.length < 5) {
      const terms = DEPT_SEARCH_TERMS[key.replace(/^0/, "")] ?? DEPT_SEARCH_TERMS[key] ?? [];
      if (terms.length > 0) {
        const whereTerms = terms
          .slice(0, 3)
          .map((t) => `acheteur_nom LIKE "%25${encodeURIComponent(t)}%25"`)
          .join(" OR ");
        const url2 = `${DECP_API}?select=${fields}&where=(${whereTerms})%20AND%20montant%3E25000&order_by=montant%20DESC&limit=50`;
        const results2 = await fetchDecp(url2);
        // Merge, deduplicate by objet+montant
        const seen = new Set(results.map((r) => `${r.objet}|${r.montant}`));
        for (const r of results2) {
          const id = `${r.objet}|${r.montant}`;
          if (!seen.has(id)) {
            seen.add(id);
            results.push(r);
          }
        }
        // Re-sort merged
        results.sort((a, b) => b.montant - a.montant);
      }
    }

    const data = {
      dept: key,
      count: results.length,
      source: "DECP data.economie.gouv.fr",
      marches: results.slice(0, 50),
    };
    cache.set(key, { data, ts: Date.now() });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err), marches: [] },
      { status: 500 }
    );
  }
}

interface DecpRecord {
  titulaire_denominationsociale_1?: string;
  titulaire_siret_1?: string;
  montant?: number;
  acheteur_nom?: string;
  objet?: string;
  datenotification?: string;
  procedure?: string;
  cpv?: string;
  lieu_execution_code_departement?: string;
}

interface MarcheOut {
  titulaire: string;
  siret: string;
  montant: number;
  acheteur: string;
  objet: string;
  date: string;
  procedure: string;
  cpv: string;
}

async function fetchDecp(url: string): Promise<MarcheOut[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "AuditFrance/1.0" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`DECP HTTP ${res.status}`);
  const json = await res.json();
  const records: DecpRecord[] = json.results ?? [];
  return records.map((r) => ({
    titulaire: r.titulaire_denominationsociale_1 || "Titulaire non renseigné",
    siret: r.titulaire_siret_1 || "",
    montant: Number(r.montant) || 0,
    acheteur: r.acheteur_nom || "",
    objet: r.objet || "",
    date: r.datenotification || "",
    procedure: r.procedure || "",
    cpv: r.cpv || "",
  }));
}
