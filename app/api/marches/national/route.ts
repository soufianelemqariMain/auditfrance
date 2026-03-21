import { NextResponse } from "next/server";

const DECP_API =
  "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/decp-v3-marches-valides/records";

const SECTOR_RULES: [RegExp, string][] = [
  [/vinci|bouygues|eiffage|colas|eurovia|spie|construction|bâtiment|génie civil/i, "BTP"],
  [/thales|airbus|naval group|mbda|safran|nexter|dassault/i, "Défense / Aéronautique"],
  [/capgemini|sopra|atos|accenture|cgi|ibm|oracle|microsoft/i, "IT / Conseil"],
  [/deloitte|ernst|mckinsey|kpmg|pwc|bcg/i, "Conseil / Audit"],
  [/engie|edf|dalkia|veolia|suez/i, "Énergie / Environnement"],
  [/orange|sfr|bouygues telecom|free/i, "Télécom"],
  [/sodexo|elior|compass/i, "Restauration collective"],
];

// Module-level cache (survives warm serverless instances, resets on cold start)
let cache: { data: MarchesNationalData; ts: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 min

interface Attributaire {
  nom: string;
  siret: string;
  montantTotal: number;
  nbMarches: number;
  secteur: string;
  acheteursPrincipaux: string[];
}

interface MarchesNationalData {
  totalMontant: number;
  totalMarches: number;
  periodeLabel: string;
  attributaires: Attributaire[];
  fetchedAt: string;
}

export async function GET(): Promise<NextResponse> {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  const byCompany: Record<
    string,
    Omit<Attributaire, "secteur" | "acheteursPrincipaux"> & { buyers: Record<string, number> }
  > = {};
  let totalMontant = 0;
  let apiTotalCount = 0;
  const PAGE_SIZE = 100;
  const MAX_PAGES = 20;

  for (let p = 0; p < MAX_PAGES; p++) {
    const params = new URLSearchParams({
      select: "titulaire_denominationsociale_1,titulaire_siret_1,montant,acheteur_nom",
      where: "montant>25000",
      order_by: "montant DESC",
      limit: String(PAGE_SIZE),
      offset: String(p * PAGE_SIZE),
    });

    try {
      const res = await fetch(`${DECP_API}?${params}`, {
        headers: { "User-Agent": "FranceMonitor/1.0" },
        signal: AbortSignal.timeout(15000),
        next: { revalidate: 0 },
      });
      if (!res.ok) break;

      const json = await res.json();
      if (!json.results?.length) break;
      if (p === 0 && json.total_count) apiTotalCount = json.total_count;

      for (const r of json.results as Record<string, unknown>[]) {
        const name = String(r.titulaire_denominationsociale_1 ?? "").trim();
        if (!name || name === "Inconnu") continue;
        const montant = Number(r.montant) || 0;
        totalMontant += montant;

        if (!byCompany[name]) {
          byCompany[name] = {
            nom: name,
            siret: String(r.titulaire_siret_1 ?? ""),
            montantTotal: 0,
            nbMarches: 0,
            buyers: {},
          };
        }
        byCompany[name].montantTotal += montant;
        byCompany[name].nbMarches++;
        const buyer = String(r.acheteur_nom ?? "").trim();
        if (buyer) byCompany[name].buyers[buyer] = (byCompany[name].buyers[buyer] ?? 0) + montant;
      }

      if (json.results.length < PAGE_SIZE) break;
    } catch {
      break;
    }
  }

  const attributaires: Attributaire[] = Object.values(byCompany)
    .map(({ buyers, ...rest }) => {
      const acheteursPrincipaux = Object.entries(buyers)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([n]) => n);
      let secteur = "N/A";
      for (const [re, sec] of SECTOR_RULES) {
        if (re.test(rest.nom)) { secteur = sec; break; }
      }
      return { ...rest, secteur, acheteursPrincipaux };
    })
    .sort((a, b) => b.montantTotal - a.montantTotal);

  const data: MarchesNationalData = {
    totalMontant,
    totalMarches: apiTotalCount,
    periodeLabel: "Live — DECP data.economie.gouv.fr",
    attributaires,
    fetchedAt: new Date().toISOString(),
  };

  cache = { data, ts: Date.now() };
  return NextResponse.json(data);
}
