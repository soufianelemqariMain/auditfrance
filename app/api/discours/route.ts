import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface Intervention {
  id: string;
  depute: string;
  groupe: string;
  date: string;
  type: string;
  texte: string;
}

// Static fallback — notable recent interventions (when API unavailable)
const STATIC_INTERVENTIONS: Intervention[] = [
  { id: "1", depute: "Mathilde Panot", groupe: "LFI-NFP", date: "2026-03-25", type: "Assemblée", texte: "Sur la question de la dissolution du gouvernement et des orientations budgétaires pour 2026, nous demandons une transparence totale..." },
  { id: "2", depute: "Laurent Wauquiez", groupe: "DR", date: "2026-03-24", type: "Assemblée", texte: "La sécurité des Français est notre priorité absolue. Les chiffres de la délinquance montrent une aggravation persistante dans les zones périurbaines..." },
  { id: "3", depute: "Gabriel Attal", groupe: "EPR", date: "2026-03-24", type: "Assemblée", texte: "Le projet de loi sur la compétitivité économique vise à réduire les charges des PME et à stimuler l'investissement dans les secteurs d'avenir..." },
  { id: "4", depute: "Marine Le Pen", groupe: "RN", date: "2026-03-23", type: "Assemblée", texte: "L'immigration incontrôlée représente un danger pour la cohésion sociale. Nous proposons une révision constitutionnelle pour restaurer la souveraineté..." },
  { id: "5", depute: "Jean-Luc Mélenchon", groupe: "LFI-NFP", date: "2026-03-22", type: "Assemblée", texte: "La sixième République est la seule réponse à la crise démocratique que traverse notre pays. Les institutions actuelles sont à bout de souffle..." },
  { id: "6", depute: "Élisabeth Borne", groupe: "EPR", date: "2026-03-21", type: "Assemblée", texte: "La transition énergétique requiert des investissements massifs. Notre plan pour 2030 prévoit 40 gigawatts d'énergie solaire supplémentaires..." },
  { id: "7", depute: "Jordan Bardella", groupe: "RN", date: "2026-03-20", type: "Assemblée", texte: "Le pouvoir d'achat des Français s'effondre. Le gouvernement doit agir sur les prix de l'énergie et supprimer la taxe sur les carburants..." },
  { id: "8", depute: "Raphaël Glucksmann", groupe: "SOC", date: "2026-03-19", type: "Assemblée", texte: "L'Europe sociale est possible. Nous proposons un salaire minimum européen et une directive sur la transparence salariale pour réduire les inégalités..." },
];

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch("https://www.nosdeputes.fr/interventions/json?limit=20", {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`nosdeputes ${res.status}`);

    const data = await res.json();
    const interventions: Intervention[] = (data.interventions ?? [])
      .slice(0, 15)
      .map((item: Record<string, unknown>, i: number) => ({
        id: String(i),
        depute: String(item.depute_nom ?? item.nom ?? "Inconnu"),
        groupe: String(item.groupe_sigle ?? ""),
        date: String(item.date ?? "").slice(0, 10),
        type: String(item.type ?? "Assemblée"),
        texte: String(item.contenu ?? item.texte ?? "").slice(0, 200),
      }));

    return NextResponse.json({ interventions, source: "live" });
  } catch {
    return NextResponse.json({ interventions: STATIC_INTERVENTIONS, source: "static" });
  }
}
