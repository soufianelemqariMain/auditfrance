import { NextResponse } from "next/server";

// BOAMP via OpenDataSoft — all French public procurement notices
const BOAMP_API =
  "https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records";

let cache: { data: ConsultationsData; ts: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 min

interface Consultation {
  id: string;
  objet: string;
  acheteur: string;
  typeMarche: string;
  departement: string;
  dateParution: string;
  dateLimite: string;
  url: string;
}

interface ConsultationsData {
  total: number;
  consultations: Consultation[];
  fetchedAt: string;
}

export async function GET(): Promise<NextResponse> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  // Filter for active tenders: deadline in the future, initial publication state
  const today = new Date().toISOString().slice(0, 10);
  const params = new URLSearchParams({
    select: "idweb,objet,nomacheteur,type_marche,code_departement,dateparution,datelimitereponse,url_avis",
    where: `datelimitereponse>"${today}" AND etat="INITIAL"`,
    order_by: "dateparution DESC",
    limit: "100",
  });

  try {
    const res = await fetch(`${BOAMP_API}?${params}`, {
      headers: { "User-Agent": "FranceMonitor/1.0" },
      signal: AbortSignal.timeout(15000),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `BOAMP HTTP ${res.status}`, consultations: [], total: 0, fetchedAt: new Date().toISOString() },
        { status: 200 }
      );
    }

    const json = await res.json();
    const consultations: Consultation[] = (json.results ?? []).map(
      (r: Record<string, unknown>) => ({
        id: String(r.idweb ?? ""),
        objet: String(r.objet ?? "").trim().slice(0, 200),
        acheteur: String(r.nomacheteur ?? "").trim(),
        typeMarche: Array.isArray(r.type_marche)
          ? (r.type_marche as string[]).join(", ")
          : String(r.type_marche ?? ""),
        departement: Array.isArray(r.code_departement)
          ? (r.code_departement as string[]).join(", ")
          : String(r.code_departement ?? ""),
        dateParution: String(r.dateparution ?? "").slice(0, 10),
        dateLimite: String(r.datelimitereponse ?? "").slice(0, 10),
        url: String(r.url_avis ?? ""),
      })
    );

    const data: ConsultationsData = {
      total: json.total_count ?? consultations.length,
      consultations,
      fetchedAt: new Date().toISOString(),
    };

    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      {
        error: String(err instanceof Error ? err.message : err),
        consultations: [],
        total: 0,
        fetchedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
