// AuditFrance — PLF 2026 budget (Projet de Loi de Finances 2026)
// Source : données PLF 2026 déposé à l'AN en octobre 2025
// Live DECP procurement data is fetched server-side via /api/marches

export const BUDGET = {
  year: 2026,
  totalCP: 484200,    // M€ CP — effort de consolidation budgétaire
  totalAE: 519800,
  totalRecettes: 352000,
  deficit: 132200,    // cible : ~4,1% du PIB
  note: "PLF 2026 — Projet déposé à l'Assemblée Nationale (oct. 2025)",
  missions: [
    { name: "Enseignement scolaire", ministry: "Éducation nationale", cp: 81200, ae: 81400, color: "#6366f1" },
    { name: "Remboursements et dégrèvements", ministry: "Économie et Finances", cp: 131000, ae: 131000, color: "#64748b" },
    { name: "Engagements financiers de l'État", ministry: "Économie et Finances", cp: 55200, ae: 55900, color: "#f97316" },
    { name: "Défense", ministry: "Armées", cp: 53500, ae: 60200, color: "#ef4444" }, // LPM +6%
    { name: "Recherche et enseignement supérieur", ministry: "Enseignement supérieur et Recherche", cp: 32100, ae: 32500, color: "#8b5cf6" },
    { name: "Solidarité, insertion et égalité des chances", ministry: "Solidarités", cp: 30800, ae: 30900, color: "#ec4899" },
    { name: "Sécurités", ministry: "Intérieur", cp: 24900, ae: 26500, color: "#f43f5e" },
    { name: "Écologie, développement et mobilité durables", ministry: "Transition écologique", cp: 22400, ae: 25800, color: "#22c55e" },
    { name: "Travail et emploi", ministry: "Travail", cp: 20100, ae: 20300, color: "#eab308" },
    { name: "Cohésion des territoires", ministry: "Logement et Territoires", cp: 18200, ae: 18200, color: "#06b6d4" },
    { name: "Justice", ministry: "Justice", cp: 13500, ae: 15100, color: "#a855f7" },
    { name: "Gestion des finances publiques", ministry: "Économie et Finances", cp: 10100, ae: 10280, color: "#fbbf24" },
    { name: "Aide publique au développement", ministry: "Affaires étrangères", cp: 5100, ae: 6500, color: "#f59e0b" },
    { name: "Administration territoriale de l'État", ministry: "Intérieur", cp: 4700, ae: 4860, color: "#94a3b8" },
    { name: "Relations avec les collectivités territoriales", ministry: "Intérieur", cp: 4420, ae: 4640, color: "#14b8a6" },
    { name: "Agriculture et alimentation", ministry: "Agriculture", cp: 4350, ae: 4620, color: "#84cc16" },
    { name: "Culture", ministry: "Culture", cp: 4150, ae: 4230, color: "#d946ef" },
    { name: "Action extérieure de l'État", ministry: "Affaires étrangères", cp: 3380, ae: 3420, color: "#0ea5e9" },
    { name: "Immigration, asile et intégration", ministry: "Intérieur", cp: 2200, ae: 2270, color: "#fb7185" },
    { name: "Sport, jeunesse et vie associative", ministry: "Sports", cp: 1890, ae: 1910, color: "#fb923c" },
    { name: "Anciens combattants et mémoire", ministry: "Armées", cp: 1920, ae: 1920, color: "#78716c" },
  ],
};

export const MARCHES_SAMPLE = {
  totalMontant: 198400000000,
  totalMarches: 387420,
  periodeLabel: "2023-2024 (données demo — cliquez «Charger DECP» pour live)",
  attributaires: [
    { nom: "VINCI Construction", siret: "55210978100026", montantTotal: 8720000000, nbMarches: 2847, secteur: "BTP", acheteursPrincipaux: ["Min. Transports", "SNCF Réseau", "Île-de-France", "Paris"] },
    { nom: "Bouygues Bâtiment", siret: "57207848100036", montantTotal: 7340000000, nbMarches: 2156, secteur: "BTP", acheteursPrincipaux: ["Min. Armées", "AP-HP", "Auvergne-RA", "Grand Paris"] },
    { nom: "Eiffage Génie Civil", siret: "60957054500015", montantTotal: 6890000000, nbMarches: 1893, secteur: "BTP", acheteursPrincipaux: ["Min. Transports", "SNCF Réseau", "Grand Paris"] },
    { nom: "Thales", siret: "55212621500590", montantTotal: 5970000000, nbMarches: 1245, secteur: "Défense / Électronique", acheteursPrincipaux: ["Min. Armées", "DGA", "DGSI", "Min. Intérieur"] },
    { nom: "Capgemini Technology Services", siret: "34866748800042", montantTotal: 4250000000, nbMarches: 3421, secteur: "IT / Conseil", acheteursPrincipaux: ["Min. Intérieur", "Min. Finances", "DGFIP", "Pôle Emploi"] },
    { nom: "Airbus Defence & Space", siret: "78944166800017", montantTotal: 4120000000, nbMarches: 678, secteur: "Défense / Aéronautique", acheteursPrincipaux: ["Min. Armées", "DGA", "CNES", "ESA"] },
    { nom: "Veolia Environnement", siret: "40321003200045", montantTotal: 3870000000, nbMarches: 5210, secteur: "Environnement", acheteursPrincipaux: ["Métropoles", "Communes", "Syndicats des eaux"] },
    { nom: "Naval Group", siret: "44113380800035", montantTotal: 3560000000, nbMarches: 456, secteur: "Défense navale", acheteursPrincipaux: ["Min. Armées", "DGA", "Marine nationale"] },
    { nom: "Engie Solutions", siret: "55204689400032", montantTotal: 3420000000, nbMarches: 4523, secteur: "Énergie / Services", acheteursPrincipaux: ["AP-HP", "Universités", "Communes", "Régions"] },
    { nom: "Sopra Steria Group", siret: "32682006500039", montantTotal: 3180000000, nbMarches: 2754, secteur: "IT / Conseil", acheteursPrincipaux: ["Min. Armées", "Min. Intérieur", "CNAV", "Assurance Maladie"] },
    { nom: "Colas (groupe Bouygues)", siret: "55211165600028", montantTotal: 2670000000, nbMarches: 6789, secteur: "Routes / BTP", acheteursPrincipaux: ["Départements", "Communes", "Métropoles", "DIR"] },
    { nom: "Eurovia (groupe Vinci)", siret: "72505032700047", montantTotal: 2450000000, nbMarches: 5432, secteur: "Routes / BTP", acheteursPrincipaux: ["Départements", "Communes", "DIR"] },
    { nom: "Atos SE", siret: "32362360200021", montantTotal: 2540000000, nbMarches: 2187, secteur: "IT / Conseil", acheteursPrincipaux: ["Min. Finances", "Min. Justice", "CNAM", "DGFIP"] },
    { nom: "MBDA France", siret: "34730775400046", montantTotal: 2890000000, nbMarches: 234, secteur: "Défense / Missiles", acheteursPrincipaux: ["Min. Armées", "DGA"] },
    { nom: "Safran", siret: "56215002900061", montantTotal: 2340000000, nbMarches: 534, secteur: "Défense / Aéronautique", acheteursPrincipaux: ["Min. Armées", "DGA", "DGAC"] },
    { nom: "Orange Business Services", siret: "38012986600023", montantTotal: 2150000000, nbMarches: 3245, secteur: "Télécom / IT", acheteursPrincipaux: ["Min. Intérieur", "Min. Armées", "Éducation nationale"] },
    { nom: "Dassault Systèmes", siret: "32230687100013", montantTotal: 2890000000, nbMarches: 876, secteur: "Défense / Aéronautique", acheteursPrincipaux: ["Min. Armées", "DGA", "CNES"] },
    { nom: "Accenture France", siret: "73207656900035", montantTotal: 1980000000, nbMarches: 1534, secteur: "IT / Conseil", acheteursPrincipaux: ["Min. Santé", "Assurance Maladie", "France Travail"] },
    { nom: "Dalkia (groupe EDF)", siret: "45573021300122", montantTotal: 1340000000, nbMarches: 2567, secteur: "Énergie / Chauffage", acheteursPrincipaux: ["Communes", "Hôpitaux", "Universités"] },
    { nom: "Sodexo France", siret: "30174832000027", montantTotal: 1560000000, nbMarches: 2345, secteur: "Restauration collective", acheteursPrincipaux: ["Min. Armées", "Hôpitaux", "Universités"] },
  ],
};

export function fmtM(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(".", ",") + " Md€";
  if (n >= 1e6) return (n / 1e6).toFixed(0) + " M€";
  return Math.round(n / 1000) + " k€";
}

export function fmtBudget(cp: number): string {
  if (cp >= 1000) return (cp / 1000).toFixed(0) + " Md€";
  return cp + " M€";
}
