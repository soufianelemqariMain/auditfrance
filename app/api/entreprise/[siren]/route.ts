import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

interface SirenData {
  unite_legale?: {
    denomination?: string;
    sigle?: string;
    categorie_juridique_libelle?: string;
    activite_principale_libelle?: string;
    etat_administratif?: string;
    date_creation?: string;
    tranche_effectif_salarie_libelle?: string;
  };
  adresse?: {
    libelle_voie?: string;
    libelle_commune?: string;
    code_postal?: string;
  };
}

interface MarchesResult {
  total_count?: number;
  results?: Array<{
    montant?: number;
    acheteur?: { nom?: string };
    objet?: string;
    dateNotification?: string;
  }>;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ siren: string }> }
): Promise<NextResponse> {
  const { siren } = await params;

  if (!/^\d{9}$/.test(siren)) {
    return NextResponse.json({ error: "SIREN invalide (9 chiffres attendus)" }, { status: 400 });
  }

  // Fetch company info + marchés in parallel
  const [sirenRes, marchesRes] = await Promise.allSettled([
    fetch(`https://api.insee.fr/entreprises/sirene/V3.11/siren/${siren}`, {
      signal: AbortSignal.timeout(8000),
    }),
    fetch(
      `https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/decp-augmente/records?where=siretEtablissementAttributaire%20like%20%22${siren}%25%22&limit=100&select=montant,acheteur,objet,dateNotification`,
      { signal: AbortSignal.timeout(8000) }
    ),
  ]);

  // SIREN data (INSEE API)
  let company: SirenData | null = null;
  if (sirenRes.status === "fulfilled" && sirenRes.value.ok) {
    const raw = await sirenRes.value.json();
    company = raw.uniteLegale ?? null;
  }

  // Marchés publics (DECP)
  let marches: MarchesResult | null = null;
  let totalMontant = 0;
  let marchesCount = 0;
  if (marchesRes.status === "fulfilled" && marchesRes.value.ok) {
    marches = await marchesRes.value.json();
    marchesCount = marches?.total_count ?? 0;
    totalMontant = (marches?.results ?? []).reduce((sum, m) => sum + (m.montant ?? 0), 0);
  }

  // Subventions (data-subventions)
  let subventions: { total_count?: number; results?: Array<{ montant_total?: number }> } | null = null;
  let totalSubventions = 0;
  try {
    const subRes = await fetch(
      `https://api.data-subventions.beta.gouv.fr/association/search?rna=${siren}&limit=50`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (subRes.ok) {
      subventions = await subRes.json();
      totalSubventions = (subventions?.results ?? []).reduce(
        (sum: number, s) => sum + (s.montant_total ?? 0),
        0
      );
    }
  } catch {
    // Subventions API optional — not all SIRENs are associations
  }

  // Build alert flags
  const alerts: string[] = [];
  const ul = (company as { unite_legale?: SirenData["unite_legale"] })?.unite_legale;
  if (ul?.etat_administratif === "C") alerts.push("Entreprise cessée / radiée");
  if (marchesCount > 50) alerts.push("Volume élevé de marchés publics");
  if (totalMontant > 10_000_000) alerts.push(`Montants marchés > 10M€ (${(totalMontant / 1_000_000).toFixed(1)}M€)`);

  return NextResponse.json({
    siren,
    company,
    marches: {
      count: marchesCount,
      totalMontant,
      recent: (marches?.results ?? []).slice(0, 5),
    },
    subventions: {
      total: totalSubventions,
      count: subventions?.total_count ?? 0,
    },
    alerts,
  });
}
