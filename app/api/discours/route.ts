import { NextResponse } from "next/server";

export const runtime = "nodejs";

const APP_BASE = "https://www.infoverif.org";

interface Intervention {
  id: string;
  depute: string;
  groupe: string;
  date: string;
  type: string;
  texte: string;
  url?: string;
  speechUrl?: string;
}

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
    texte: "Le projet de loi sur la compétitivité économique vise à réduire les charges des PME de 4 milliards d'euros sur cinq ans et à stimuler l'investissement dans les secteurs d'avenir tels que l'intelligence artificielle, la biotechnologie et la transition énergétique. La France crée aujourd'hui plus de startups que l'Allemagne et le Royaume-Uni réunis. Notre écosystème d'innovation est le premier en Europe continentale selon le classement StartupBlink 2025.",
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

const AN_BASE = "https://www.assemblee-nationale.fr";
const XHR_HEADERS = {
  "X-Requested-With": "XMLHttpRequest",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

function groupNameToCode(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("rassemblement national")) return "RN";
  if (n.includes("france insoumise")) return "LFI-NFP";
  if (n.includes("ensemble pour la république") || n.includes("renaissance")) return "EPR";
  if (n.includes("socialiste")) return "SOC";
  if (n.includes("droite républicaine") || n.includes("les républicains")) return "DR";
  if (n.includes("écologiste") || n.includes("verts")) return "EcoS";
  if (n.includes("démocrates")) return "Dem";
  if (n.includes("horizons")) return "HOR";
  if (n.includes("liot") || n.includes("libertés, indépendants")) return "LIOT";
  if (n.includes("gauche démocrate")) return "GDR";
  if (n.includes("union des droites")) return "UDR";
  return "NI";
}

async function fetchGroupCode(actorId: string, date: string): Promise<string> {
  try {
    const res = await fetch(
      `${AN_BASE}/dyn/embed/acteur-info-card/${actorId}?date=${encodeURIComponent(date + " 09:00:00")}`,
      { headers: XHR_HEADERS, signal: AbortSignal.timeout(3000), cache: "no-store" }
    );
    const html = await res.text();
    const m = html.match(/acteur-info-card-groupe[\s\S]*?<span[^>]*>([^<]+)<\/span>/);
    return m ? groupNameToCode(m[1].trim()) : "NI";
  } catch {
    return "NI";
  }
}
const MONTHS: Record<string, string> = {
  janvier: "01", fevrier: "02", "février": "02", mars: "03", avril: "04",
  mai: "05", juin: "06", juillet: "07", aout: "08", "août": "08",
  septembre: "09", octobre: "10", novembre: "11", decembre: "12", "décembre": "12",
};

async function fetchLatestSessionDate(): Promise<string | null> {
  const res = await fetch(
    `${AN_BASE}/dyn/api/agendas/seance-publique/getAvailableReunionDate`,
    { headers: XHR_HEADERS, signal: AbortSignal.timeout(5000), cache: "no-store" }
  );
  const dates: string[] = await res.json();
  // Dates sorted oldest→newest; find last date that's not in the future
  const today = new Date().toISOString().slice(0, 10);
  const past = dates.filter((d) => d <= today);
  return past[past.length - 1] ?? dates[dates.length - 1] ?? null;
}

async function fetchSessionUrl(date: string): Promise<string | null> {
  const [year, month, day] = date.split("-");
  const dateFormatted = `${day}/${month}/${year}`;
  const url = `${AN_BASE}/dyn/17/comptes-rendus/seance?seance_date=${encodeURIComponent(dateFormatted)}`;
  const res = await fetch(url, { headers: XHR_HEADERS, signal: AbortSignal.timeout(8000), cache: "no-store" });
  const html = await res.text();
  // Find session URL (not PDF, not anchor)
  const match = html.match(/href="(\/dyn\/17\/comptes-rendus\/seance\/[^"#]+)(?<!\.pdf)"/);
  return match ? `${AN_BASE}${match[1]}` : null;
}

function extractDateFromSlug(url: string): string {
  const match = url.match(/(\d{1,2})-([a-z\u00e0-\u00ff]+)-(\d{4})(?:$|#)/);
  if (match) {
    const day = match[1].padStart(2, "0");
    const monthKey = match[2].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const month = MONTHS[monthKey] ?? MONTHS[match[2]] ?? "01";
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  return new Date().toISOString().slice(0, 10);
}

function stripHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

interface RawIntervention extends Intervention {
  actorId: string | null;
}

function parseRawInterventions(html: string, date: string, sessionUrl: string): RawIntervention[] {
  const results: RawIntervention[] = [];

  const parts = html.split(/(?=<div\s+id="\d+"\s+class="crs-inter)/);

  for (const part of parts) {
    if (!part.includes('class="orateur"')) continue;

    // Extract numeric ID
    const idM = part.match(/<div\s+id="(\d+)"/);
    const id = idM ? idM[1] : String(results.length + 1);

    // Extract speaker span (may have data-tipsy actor ID for deputies)
    const orateurM = part.match(/class="orateur"[^>]*>[\s\S]*?<span([^>]*)>([^<]+)<\/span>/);
    if (!orateurM) continue;
    const spanAttrs = orateurM[1];
    const speaker = orateurM[2].trim();

    if (!speaker) continue;
    // Skip president/procedural
    if (/[Pp]r[eé]sid[ei]/.test(speaker)) continue;

    // Extract actor ID from data-tipsy (present for deputies, absent for ministers)
    const actorM = spanAttrs.match(/data-tipsy=\/dyn\/embed\/acteur-info-card\/(PA\d+)/);
    const actorId = actorM ? actorM[1] : null;

    // Extract role from span.italique
    const roleM = part.match(/class="italique"[^>]*>([\s\S]*?)<\/span>/);
    const role = roleM ? stripHtml(roleM[1]).replace(/^,\s*/, "").trim() : "";

    // Extract speech text
    const textM = part.match(/<p class="">\s*<span>([\s\S]+?)<\/span>\s*<\/p>/);
    if (!textM) continue;

    const texte = stripHtml(textM[1]);
    if (texte.length < 80) continue;

    const isGovt = /ministre|secrétaire d'[ée]tat|Premier ministre|[Pp]r[ée]mier ministre/i.test(role);

    results.push({
      id,
      depute: speaker,
      groupe: isGovt ? "Gouvernement" : "",  // enriched below for deputies
      date,
      type: isGovt ? "Gouvernement" : "Assemblée",
      texte: texte.slice(0, 3000),
      url: `${sessionUrl}#${id}`,
      speechUrl: `${APP_BASE}/api/speech?session=${encodeURIComponent(sessionUrl)}&id=${id}`,
      actorId,
    });

    if (results.length >= 12) break;
  }

  return results;
}

async function enrichWithGroups(raw: RawIntervention[], date: string): Promise<Intervention[]> {
  return Promise.all(
    raw.map(async (item) => {
      const groupe = item.actorId
        ? await fetchGroupCode(item.actorId, date)
        : item.groupe || "NI";
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { actorId: _, ...rest } = item;
      return { ...rest, groupe };
    })
  );
}

export async function GET() {
  try {
    const date = await fetchLatestSessionDate();
    if (!date) throw new Error("no date");

    const sessionUrl = await fetchSessionUrl(date);
    if (!sessionUrl) throw new Error("no session url");

    const sessionDate = extractDateFromSlug(sessionUrl);

    const res = await fetch(sessionUrl, {
      headers: XHR_HEADERS,
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    const html = await res.text();

    const raw = parseRawInterventions(html, sessionDate, sessionUrl);
    if (raw.length < 2) throw new Error("too few");
    const interventions = await enrichWithGroups(raw, sessionDate);

    return NextResponse.json({ interventions, source: "live", sessionUrl });
  } catch {
    return NextResponse.json({ interventions: STATIC_INTERVENTIONS, source: "static" });
  }
}
