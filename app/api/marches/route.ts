import { NextRequest, NextResponse } from "next/server";
import { DEPT_SEARCH_TERMS } from "@/lib/deptData";

const DECP_API =
  "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/decp-v3-marches-valides/records";

// Only fields confirmed present in DECP v3
const FIELDS =
  "titulaire_denominationsociale_1,titulaire_siret_1,montant,acheteur_nom,objet,datenotification,procedure";

// Cache per dept: 15 min
const cache = new Map<string, { data: object; ts: number }>();
const CACHE_TTL = 15 * 60 * 1000;

export async function GET(request: NextRequest) {
  const dept = request.nextUrl.searchParams.get("dept");
  if (!dept) return NextResponse.json({ error: "dept param required" }, { status: 400 });

  const codePad = dept.padStart(2, "0");
  const codeNum = codePad.replace(/^0/, ""); // "01" → "1"

  const hit = cache.get(codePad);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return NextResponse.json(hit.data);

  // Resolve search terms for this department
  const terms = DEPT_SEARCH_TERMS[codeNum] ?? DEPT_SEARCH_TERMS[codePad] ?? [];

  const results: MarcheOut[] = [];
  const seen = new Set<string>();

  // Query DECP for each term independently — skip terms that error
  for (const term of terms.slice(0, 3)) {
    try {
      // Use q= for full-text search (avoids % encoding issues with LIKE in ODS v2.1)
      const params = new URLSearchParams({
        select: FIELDS,
        where: "montant>25000",
        q: term,
        order_by: "montant DESC",
        limit: "30",
      });
      const res = await fetch(`${DECP_API}?${params.toString()}`, {
        headers: { "User-Agent": "AuditFrance/1.0" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue; // DECP API error — skip this term
      const json = await res.json();
      for (const r of (json.results ?? []) as DecpRecord[]) {
        const m = mapRecord(r);
        const id = `${m.titulaire}|${m.montant}|${m.date.slice(0, 10)}`;
        if (!seen.has(id)) {
          seen.add(id);
          results.push(m);
        }
      }
    } catch {
      // Network timeout or parse error — continue with remaining terms
    }
  }

  results.sort((a, b) => b.montant - a.montant);

  const data = {
    dept: codePad,
    count: results.length,
    source: "DECP data.economie.gouv.fr",
    marches: results.slice(0, 50),
  };
  cache.set(codePad, { data, ts: Date.now() });
  return NextResponse.json(data);
}

interface DecpRecord {
  titulaire_denominationsociale_1?: string;
  titulaire_siret_1?: string;
  montant?: number;
  acheteur_nom?: string;
  objet?: string;
  datenotification?: string;
  procedure?: string;
}

interface MarcheOut {
  titulaire: string;
  siret: string;
  montant: number;
  acheteur: string;
  objet: string;
  date: string;
  procedure: string;
}

function mapRecord(r: DecpRecord): MarcheOut {
  return {
    titulaire: r.titulaire_denominationsociale_1 || "Titulaire non renseigné",
    siret: r.titulaire_siret_1 || "",
    montant: Number(r.montant) || 0,
    acheteur: r.acheteur_nom || "",
    objet: r.objet || "",
    date: r.datenotification || "",
    procedure: r.procedure || "",
  };
}
