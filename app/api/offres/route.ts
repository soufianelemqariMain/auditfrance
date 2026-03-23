import { NextRequest, NextResponse } from "next/server";

const FT_TOKEN_URL =
  "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire";
const FT_OFFRES_URL =
  "https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search";

// ─── Token cache (shared in serverless instance) ──────────────────────────────
let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(clientId: string, clientSecret: string): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry - 30_000) return cachedToken;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "api_offresdemploiv2 o2dsoffre",
  });
  const res = await fetch(FT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`FT token HTTP ${res.status}: ${text}`);
  }
  const json = await res.json();
  cachedToken = json.access_token;
  tokenExpiry = Date.now() + json.expires_in * 1000;
  return cachedToken!;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Offre {
  id: string;
  titre: string;
  lieuTravail: string;
  typeContrat: string;
  salaire: string;
  urlOffre: string;
  dateCreation: string;
}

export interface EmployeurEntry {
  nom: string;
  offres: Offre[];
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const commune = searchParams.get("commune");
  const dept = searchParams.get("dept");

  if (!commune && !dept) {
    return NextResponse.json(
      { error: "Fournissez ?commune=CODE_INSEE ou ?dept=CODE" },
      { status: 400 }
    );
  }

  const clientId = process.env.FRANCE_TRAVAIL_CLIENT_ID?.trim();
  const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return NextResponse.json({
      employeurs: [],
      total: 0,
      source: "unavailable",
      message: "Configurez FRANCE_TRAVAIL_CLIENT_ID et FRANCE_TRAVAIL_CLIENT_SECRET",
    });
  }

  try {
    const token = await getToken(clientId, clientSecret);

    const params = new URLSearchParams({ range: "0-149" });
    if (commune) params.set("commune", commune);
    if (dept) params.set("departement", dept);

    const res = await fetch(`${FT_OFFRES_URL}?${params}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) throw new Error(`FT offres HTTP ${res.status}`);
    const json = await res.json();
    const items: Array<{
      id?: string;
      intitule?: string;
      entreprise?: { nom?: string };
      lieuTravail?: { libelle?: string };
      typeContratLibelle?: string;
      typeContrat?: string;
      salaire?: { libelle?: string };
      dateCreation?: string;
    }> = json.resultats ?? [];

    // Group offers by employer
    const map = new Map<string, EmployeurEntry>();
    for (const item of items) {
      const nom = item.entreprise?.nom?.trim() || "Employeur non précisé";
      const offre: Offre = {
        id: item.id ?? "",
        titre: item.intitule ?? "Poste non précisé",
        lieuTravail: item.lieuTravail?.libelle ?? "",
        typeContrat: item.typeContratLibelle ?? item.typeContrat ?? "",
        salaire: item.salaire?.libelle ?? "",
        urlOffre: item.id
          ? `https://candidat.francetravail.fr/offres/recherche/detail/${item.id}`
          : "",
        dateCreation: item.dateCreation ?? "",
      };
      if (map.has(nom)) {
        map.get(nom)!.offres.push(offre);
      } else {
        map.set(nom, { nom, offres: [offre] });
      }
    }

    const employeurs = [...map.entries()]
      .sort((a, b) => b[1].offres.length - a[1].offres.length)
      .map(([, v]) => v);

    return NextResponse.json({
      employeurs,
      total: items.length,
      source: "france_travail",
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({
      employeurs: [],
      total: 0,
      source: "unavailable",
      error: String(err instanceof Error ? err.message : err),
    });
  }
}
