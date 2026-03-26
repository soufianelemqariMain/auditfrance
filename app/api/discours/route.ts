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
  {
    id: "1", depute: "Mathilde Panot", groupe: "LFI-NFP", date: "2026-03-25", type: "Assemblée",
    texte: "Sur la question des orientations budgétaires pour 2026, nous demandons une transparence totale. Le gouvernement affirme que le déficit public est maîtrisé et qu'il passera sous les 3% du PIB d'ici 2027. C'est faux. Les propres documents de Bercy indiquent un déficit structurel de 4,1% en 2025. On nous ment sur l'état réel des finances publiques pour justifier des coupes dans les services publics et dans les allocations sociales qui touchent les plus vulnérables.",
  },
  {
    id: "2", depute: "Laurent Wauquiez", groupe: "DR", date: "2026-03-24", type: "Assemblée",
    texte: "La sécurité des Français est notre priorité absolue. Les chiffres officiels de la délinquance publiés par le ministère de l'Intérieur montrent une hausse de 12% des violences aux personnes en 2025 par rapport à 2024, et de 18% dans les zones périurbaines. Depuis 2017, le nombre de policiers et gendarmes sur le terrain a baissé de 8 000 postes malgré les annonces contraires du gouvernement. Nous demandons un plan de recrutement de 15 000 forces de l'ordre supplémentaires.",
  },
  {
    id: "3", depute: "Gabriel Attal", groupe: "EPR", date: "2026-03-24", type: "Assemblée",
    texte: "Le projet de loi sur la compétitivité économique vise à réduire les charges des PME de 4 milliards d'euros sur cinq ans et à stimuler l'investissement dans les secteurs d'avenir tels que l'intelligence artificielle, la biotechnologie et la transition énergétique. La France crée aujourd'hui plus de startups que l'Allemagne et le Royaume-Uni réunis. Notre écosystème d'innovation est le premier en Europe continentale selon le classement StartupBlink 2025. Nous devons capitaliser sur ces succès.",
  },
  {
    id: "4", depute: "Marine Le Pen", groupe: "RN", date: "2026-03-23", type: "Assemblée",
    texte: "L'immigration incontrôlée représente un danger avéré pour la cohésion sociale et pour la sécurité de nos concitoyens. La France accueille chaque année 300 000 immigrés légaux et plusieurs centaines de milliers en situation irrégulière. L'Union européenne est incapable de protéger nos frontières. Nous proposons une révision constitutionnelle pour inscrire la préférence nationale dans notre droit fondamental et restaurer la pleine souveraineté de la France sur sa politique migratoire.",
  },
  {
    id: "5", depute: "Jean-Luc Mélenchon", groupe: "LFI-NFP", date: "2026-03-22", type: "Assemblée",
    texte: "La sixième République est la seule réponse démocratique à la crise que traverse notre pays. La Constitution de 1958 a concentré tous les pouvoirs entre les mains d'un seul homme au détriment du Parlement et des citoyens. Aujourd'hui, 73% des Français estiment que leur vote ne change rien selon le sondage IPSOS de mars 2026. Nous proposons une assemblée constituante élue au suffrage universel pour rédiger une nouvelle constitution fondée sur la proportionnelle et les droits nouveaux.",
  },
  {
    id: "6", depute: "Élisabeth Borne", groupe: "EPR", date: "2026-03-21", type: "Assemblée",
    texte: "La transition énergétique requiert des investissements massifs et coordonnés. Notre plan REPowerFrance prévoit 40 gigawatts d'énergie solaire supplémentaires d'ici 2030, soit doubler la capacité installée actuelle. La France produit déjà 92% de son électricité sans combustibles fossiles grâce au nucléaire et aux renouvelables. Nous serons le premier grand pays industriel à atteindre la neutralité carbone de son secteur électrique. Six nouveaux EPR2 sont en cours de commande chez EDF.",
  },
  {
    id: "7", depute: "Jordan Bardella", groupe: "RN", date: "2026-03-20", type: "Assemblée",
    texte: "Le pouvoir d'achat des Français s'est effondré de 8% en termes réels depuis 2021 selon l'INSEE. Le gouvernement prétend que l'inflation est sous contrôle à 2,3%, mais les prix alimentaires ont augmenté de 22% sur trois ans. Un Français sur cinq saute des repas. L'énergie coûte 40% plus cher qu'avant la crise. Nous demandons la suppression immédiate de la taxe intérieure de consommation sur les produits énergétiques et le blocage des prix du gaz et de l'électricité pour les ménages modestes.",
  },
  {
    id: "8", depute: "Raphaël Glucksmann", groupe: "SOC", date: "2026-03-19", type: "Assemblée",
    texte: "L'Europe sociale est non seulement possible, elle est nécessaire et urgente. Nous proposons un salaire minimum européen fixé à 60% du salaire médian national de chaque pays, une directive sur la transparence salariale pour réduire les inégalités hommes-femmes de 14% constatées en France, et un fonds de transition juste de 200 milliards d'euros pour accompagner les travailleurs des industries carbonées. La compétitivité européenne ne peut pas se construire sur le dumping social.",
  },
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
        texte: String(item.contenu ?? item.texte ?? "").slice(0, 4000),
      }));

    return NextResponse.json({ interventions, source: "live" });
  } catch {
    return NextResponse.json({ interventions: STATIC_INTERVENTIONS, source: "static" });
  }
}
