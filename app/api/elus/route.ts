import { NextRequest, NextResponse } from "next/server";

// Official AN open data — 17th legislature (2024-present)
const AN_CSV_URL =
  "https://data.assemblee-nationale.fr/static/openData/repository/17/amo/deputes_actifs_csv_opendata/liste_deputes_libre_office.csv";

// Map dept code → official dept name (as it appears in the AN CSV)
const DEPT_CODE_TO_NAME: Record<string, string> = {
  "01": "Ain", "02": "Aisne", "03": "Allier", "04": "Alpes-de-Haute-Provence",
  "05": "Hautes-Alpes", "06": "Alpes-Maritimes", "07": "Ardèche", "08": "Ardennes",
  "09": "Ariège", "10": "Aube", "11": "Aude", "12": "Aveyron",
  "13": "Bouches-du-Rhône", "14": "Calvados", "15": "Cantal", "16": "Charente",
  "17": "Charente-Maritime", "18": "Cher", "19": "Corrèze",
  "2A": "Corse-du-Sud", "2B": "Haute-Corse",
  "21": "Côte-d'Or", "22": "Côtes-d'Armor", "23": "Creuse",
  "24": "Dordogne", "25": "Doubs", "26": "Drôme", "27": "Eure",
  "28": "Eure-et-Loir", "29": "Finistère", "30": "Gard", "31": "Haute-Garonne",
  "32": "Gers", "33": "Gironde", "34": "Hérault", "35": "Ille-et-Vilaine",
  "36": "Indre", "37": "Indre-et-Loire", "38": "Isère", "39": "Jura",
  "40": "Landes", "41": "Loir-et-Cher", "42": "Loire", "43": "Haute-Loire",
  "44": "Loire-Atlantique", "45": "Loiret", "46": "Lot", "47": "Lot-et-Garonne",
  "48": "Lozère", "49": "Maine-et-Loire", "50": "Manche", "51": "Marne",
  "52": "Haute-Marne", "53": "Mayenne", "54": "Meurthe-et-Moselle", "55": "Meuse",
  "56": "Morbihan", "57": "Moselle", "58": "Nièvre", "59": "Nord",
  "60": "Oise", "61": "Orne", "62": "Pas-de-Calais", "63": "Puy-de-Dôme",
  "64": "Pyrénées-Atlantiques", "65": "Hautes-Pyrénées", "66": "Pyrénées-Orientales",
  "67": "Bas-Rhin", "68": "Haut-Rhin", "69": "Rhône", "70": "Haute-Saône",
  "71": "Saône-et-Loire", "72": "Sarthe", "73": "Savoie", "74": "Haute-Savoie",
  "75": "Paris", "76": "Seine-Maritime", "77": "Seine-et-Marne", "78": "Yvelines",
  "79": "Deux-Sèvres", "80": "Somme", "81": "Tarn", "82": "Tarn-et-Garonne",
  "83": "Var", "84": "Vaucluse", "85": "Vendée", "86": "Vienne",
  "87": "Haute-Vienne", "88": "Vosges", "89": "Yonne", "90": "Territoire de Belfort",
  "91": "Essonne", "92": "Hauts-de-Seine", "93": "Seine-Saint-Denis",
  "94": "Val-de-Marne", "95": "Val-d'Oise",
  "971": "Guadeloupe", "972": "Martinique", "973": "Guyane",
  "974": "La Réunion", "976": "Mayotte",
};

interface Deputy {
  identifiant: string;
  prenom: string;
  nom: string;
  region: string;
  departement: string;
  numCirco: string;
  profession: string;
  groupeComplet: string;
  groupeAbrege: string;
}

interface CacheEntry { deputes: Deputy[]; fetchedAt: number }
let cache: CacheEntry | null = null;
const CACHE_TTL = 2 * 60 * 60 * 1000;

function parseCSV(text: string): Deputy[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const sep = lines[0].includes(";") ? ";" : ",";
  return lines.slice(1).map((line) => {
    const v = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    return {
      identifiant: v[0] ?? "",
      prenom: v[1] ?? "",
      nom: v[2] ?? "",
      region: v[3] ?? "",
      departement: v[4] ?? "",
      numCirco: v[5] ?? "",
      profession: v[6] ?? "",
      groupeComplet: v[7] ?? "",
      groupeAbrege: v[8] ?? "",
    };
  }).filter((d) => d.identifiant && d.nom);
}

async function getAllDeputies(): Promise<Deputy[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) return cache.deputes;

  const res = await fetch(AN_CSV_URL, {
    headers: { "User-Agent": "AuditFrance/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`AN CSV HTTP ${res.status}`);
  const text = await res.text();
  const deputes = parseCSV(text);
  cache = { deputes, fetchedAt: Date.now() };
  return deputes;
}

function matchesDept(csvDept: string, code: string): boolean {
  const normalized = csvDept.trim();
  const paddedCode = code.toUpperCase().padStart(2, "0");

  // If the CSV dept field looks like a numeric code (e.g. "59" or "2A")
  if (/^\d{1,3}$|^2[AB]$/i.test(normalized)) {
    return normalized.toUpperCase().padStart(2, "0") === paddedCode;
  }

  // Otherwise match by name
  const expected = DEPT_CODE_TO_NAME[paddedCode] ?? DEPT_CODE_TO_NAME[code.toUpperCase()];
  if (!expected) return false;
  return normalized.toLowerCase() === expected.toLowerCase();
}

export async function GET(request: NextRequest) {
  const dept = request.nextUrl.searchParams.get("dept");
  if (!dept) return NextResponse.json({ error: "dept param required" }, { status: 400 });

  try {
    const all = await getAllDeputies();
    const filtered = all.filter((d) => matchesDept(d.departement, dept));

    return NextResponse.json({
      dept,
      count: filtered.length,
      legislature: "17ème (2024) — assemblee-nationale.fr",
      deputes: filtered.map((d) => ({
        nom: d.nom,
        prenom: d.prenom,
        groupe: d.groupeAbrege || "NI",
        circo: d.departement,
        numCirco: parseInt(d.numCirco, 10) || 0,
        nbMandats: null,
        profession: d.profession || null,
        mandatDebut: "2024-07-07",
        url: `https://www.assemblee-nationale.fr/dyn/deputes/${d.identifiant}`,
        urlAN: null,
        twitter: null,
        score: null, // No activity scoring for 17th legislature yet
        activite: {
          presenceSemaines: null,
          interventionsHemicycle: null,
          interventionsCommission: null,
          amendementsProposes: null,
          amendementsAdoptes: null,
          questionsEcrites: null,
          questionsOrales: null,
          propositionsEcrites: null,
          rapports: null,
          nbMois: null,
        },
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err), deputes: [] },
      { status: 500 }
    );
  }
}
