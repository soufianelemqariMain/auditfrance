import { NextResponse } from "next/server";

// France Travail (ex Pôle Emploi) API
// Credentials obtained free at https://francetravail.io/
// Set env vars: FRANCE_TRAVAIL_CLIENT_ID + FRANCE_TRAVAIL_CLIENT_SECRET
const FT_TOKEN_URL =
  "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire";
const FT_OFFRES_URL =
  "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search";

// ─── Token cache ──────────────────────────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(clientId: string, clientSecret: string): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry - 30_000) return cachedToken;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "api_offresdemploiv2",
  });

  const res = await fetch(FT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`FT token HTTP ${res.status}`);
  const json = await res.json();
  cachedToken = json.access_token;
  tokenExpiry = Date.now() + json.expires_in * 1000;
  return cachedToken!;
}

// ─── Results cache ────────────────────────────────────────────────────────────
interface EmployerEntry {
  nom: string;
  offres: number;
  secteur: string;
  localisation: string;
}

interface RecrutementData {
  topEmployeurs: EmployerEntry[];
  totalOffres: number;
  fetchedAt: string;
  source: "france_travail" | "unavailable";
}

let resultsCache: { data: RecrutementData; ts: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 min

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET(): Promise<NextResponse> {
  if (resultsCache && Date.now() - resultsCache.ts < CACHE_TTL) {
    return NextResponse.json(resultsCache.data);
  }

  const clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID;
  const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({
      topEmployeurs: [],
      totalOffres: 0,
      fetchedAt: new Date().toISOString(),
      source: "unavailable",
      message:
        "Configurez FRANCE_TRAVAIL_CLIENT_ID et FRANCE_TRAVAIL_CLIENT_SECRET dans .env.local (inscription gratuite sur francetravail.io)",
    });
  }

  try {
    const token = await getToken(clientId, clientSecret);

    // Fetch up to 150 CDI offers (max per request), ordered by creation date
    const params = new URLSearchParams({
      typeContrat: "CDI",
      range: "0-149",
      sort: "1", // sort by date desc
    });

    const res = await fetch(`${FT_OFFRES_URL}?${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`FT offres HTTP ${res.status}`);
    const json = await res.json();

    // Count offers per employer
    const offreItems: Array<{
      entreprise?: { nom?: string };
      secteurActiviteLibelle?: string;
      lieuTravail?: { libelle?: string };
    }> = json.resultats ?? [];

    const totalOffres: number = json.Content?.range
      ? parseInt((json.Content.range as string).split("/")[1] ?? "0", 10)
      : offreItems.length;

    const employerMap = new Map<
      string,
      { offres: number; secteur: string; localisation: string }
    >();

    for (const item of offreItems) {
      const nom = item.entreprise?.nom?.trim();
      if (!nom) continue;
      const existing = employerMap.get(nom);
      if (existing) {
        existing.offres++;
      } else {
        employerMap.set(nom, {
          offres: 1,
          secteur: item.secteurActiviteLibelle ?? "",
          localisation: item.lieuTravail?.libelle ?? "",
        });
      }
    }

    // Sort by offer count descending, take top 20
    const topEmployeurs: EmployerEntry[] = [...employerMap.entries()]
      .sort((a, b) => b[1].offres - a[1].offres)
      .slice(0, 20)
      .map(([nom, v]) => ({ nom, ...v }));

    const data: RecrutementData = {
      topEmployeurs,
      totalOffres,
      fetchedAt: new Date().toISOString(),
      source: "france_travail",
    };

    resultsCache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({
      topEmployeurs: [],
      totalOffres: 0,
      fetchedAt: new Date().toISOString(),
      source: "unavailable",
      error: String(err instanceof Error ? err.message : err),
    });
  }
}
