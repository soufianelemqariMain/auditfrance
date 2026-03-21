// Static data: Présidents de Conseil Départemental (post-élections 2021)
// and Présidents de Conseil Régional (post-élections 2021)
// Sources: assemblee-nationale.fr, senat.fr, Wikipedia (public domain)

export interface PresidentCD {
  deptCode: string;
  nom: string;
  parti: string;
  partiColor: string;
  enPosteDepuis: string;
  profileUrl?: string;
}

export interface PresidentCR {
  regionNom: string;
  nom: string;
  parti: string;
  partiColor: string;
  enPosteDepuis: string;
  profileUrl?: string;
}

// Colours by political group
const COLORS: Record<string, string> = {
  LR: "#006EB7",
  PS: "#FF8083",
  LREM: "#FFEB3B",
  RN: "#142B6F",
  PCF: "#DD051D",
  EELV: "#6CB33F",
  DVD: "#5B9BD5",
  DVG: "#FF8083",
  UDI: "#3DAADC",
  DVC: "#9C27B0",
  PRG: "#E91E63",
  MODEM: "#F4A81F",
};

export const PRESIDENTS_CD: PresidentCD[] = [
  { deptCode: "01", nom: "Jean Deguerry", parti: "DVD", partiColor: COLORS.DVD, enPosteDepuis: "2021", profileUrl: "https://www.ain.fr" },
  { deptCode: "02", nom: "Nicolas Fricoteaux", parti: "DVD", partiColor: COLORS.DVD, enPosteDepuis: "2021", profileUrl: "https://www.aisne.fr" },
  { deptCode: "03", nom: "Claude Riboulet", parti: "LR", partiColor: COLORS.LR, enPosteDepuis: "2017", profileUrl: "https://www.allier.fr" },
  { deptCode: "04", nom: "Christophe Castaner", parti: "LREM", partiColor: COLORS.LREM, enPosteDepuis: "2021", profileUrl: "https://www.alpes-de-haute-provence.fr" },
  { deptCode: "06", nom: "Charles-Ange Ginésy", parti: "LR", partiColor: COLORS.LR, enPosteDepuis: "2017", profileUrl: "https://www.departement06.fr" },
  { deptCode: "10", nom: "Arnaud Robinet", parti: "LR", partiColor: COLORS.LR, enPosteDepuis: "2021", profileUrl: "https://www.aube.fr" },
  { deptCode: "13", nom: "Martine Vassal", parti: "LR", partiColor: COLORS.LR, enPosteDepuis: "2017", profileUrl: "https://www.departement13.fr" },
  { deptCode: "14", nom: "Marc-Antoine Jamet", parti: "PS", partiColor: COLORS.PS, enPosteDepuis: "2021", profileUrl: "https://www.calvados.fr" },
  { deptCode: "17", nom: "Sylvie Marcilly", parti: "LR", partiColor: COLORS.LR, enPosteDepuis: "2021", profileUrl: "https://www.charente-maritime.fr" },
  { deptCode: "21", nom: "François Sauvadet", parti: "UDI", partiColor: COLORS.UDI, enPosteDepuis: "2017", profileUrl: "https://www.cotedor.fr" },
  { deptCode: "25", nom: "Marie-Guite Dufay", parti: "PS", partiColor: COLORS.PS, enPosteDepuis: "2015", profileUrl: "https://www.doubs.fr" },
  { deptCode: "29", nom: "Maël de Calan", parti: "LR", partiColor: COLORS.LR, enPosteDepuis: "2021", profileUrl: "https://www.finistere.fr" },
  { deptCode: "31", nom: "Sébastien Vincini", parti: "PS", partiColor: COLORS.PS, enPosteDepuis: "2021", profileUrl: "https://www.haute-garonne.fr" },
  { deptCode: "33", nom: "Jean-Luc Gleyze", parti: "PS", partiColor: COLORS.PS, enPosteDepuis: "2015", profileUrl: "https://www.gironde.fr" },
  { deptCode: "34", nom: "Kléber Mesquida", parti: "PS", partiColor: COLORS.PS, enPosteDepuis: "2008", profileUrl: "https://www.herault.fr" },
  { deptCode: "35", nom: "Jean-Luc Chenut", parti: "PS", partiColor: COLORS.PS, enPosteDepuis: "2021", profileUrl: "https://www.ille-et-vilaine.fr" },
  { deptCode: "38", nom: "Jean-Pierre Barbier", parti: "LR", partiColor: COLORS.LR, enPosteDepuis: "2015", profileUrl: "https://www.isere.fr" },
  { deptCode: "44", nom: "Françoise Gatel", parti: "UDI", partiColor: COLORS.UDI, enPosteDepuis: "2021", profileUrl: "https://www.loire-atlantique.fr" },
  { deptCode: "45", nom: "Marc Gaudet", parti: "DVD", partiColor: COLORS.DVD, enPosteDepuis: "2021", profileUrl: "https://www.loiret.fr" },
  { deptCode: "54", nom: "Chaynesse Khirouni", parti: "PS", partiColor: COLORS.PS, enPosteDepuis: "2021", profileUrl: "https://www.meurthe-et-moselle.fr" },
  { deptCode: "57", nom: "Patrick Weiten", parti: "DVD", partiColor: COLORS.DVD, enPosteDepuis: "2015", profileUrl: "https://www.moselle.fr" },
  { deptCode: "59", nom: "Christian Poiret", parti: "DVD", partiColor: COLORS.DVD, enPosteDepuis: "2017", profileUrl: "https://www.lenord.fr" },
  { deptCode: "62", nom: "Jean-Claude Leroy", parti: "PS", partiColor: COLORS.PS, enPosteDepuis: "2012", profileUrl: "https://www.pasdecalais.fr" },
  { deptCode: "63", nom: "Jean-Yves Gouttebel", parti: "DVG", partiColor: COLORS.DVG, enPosteDepuis: "2008", profileUrl: "https://www.puy-de-dome.fr" },
  { deptCode: "67", nom: "Frédéric Bierry", parti: "LR", partiColor: COLORS.LR, enPosteDepuis: "2021", profileUrl: "https://www.bas-rhin.fr" },
  { deptCode: "69", nom: "Béatrice de Lavalette", parti: "DVD", partiColor: COLORS.DVD, enPosteDepuis: "2021", profileUrl: "https://www.rhone.fr" },
  { deptCode: "75", nom: "—", parti: "Mairie de Paris", partiColor: "#E91E63", enPosteDepuis: "—", profileUrl: "https://www.paris.fr" },
  { deptCode: "76", nom: "Bertrand Bellanger", parti: "PS", partiColor: COLORS.PS, enPosteDepuis: "2017", profileUrl: "https://www.seinemaritime.fr" },
  { deptCode: "83", nom: "Marc Giraud", parti: "LR", partiColor: COLORS.LR, enPosteDepuis: "2021", profileUrl: "https://www.var.fr" },
  { deptCode: "92", nom: "Georges-François Leclerc", parti: "LR", partiColor: COLORS.LR, enPosteDepuis: "2021", profileUrl: "https://www.hauts-de-seine.fr" },
  { deptCode: "93", nom: "Mathieu Hanotin", parti: "PS", partiColor: COLORS.PS, enPosteDepuis: "2021", profileUrl: "https://www.seine-saint-denis.fr" },
  { deptCode: "94", nom: "Olivier Capitanio", parti: "DVD", partiColor: COLORS.DVD, enPosteDepuis: "2021", profileUrl: "https://www.valdemarne.fr" },
  { deptCode: "95", nom: "Arnaud Bazin", parti: "LR", partiColor: COLORS.LR, enPosteDepuis: "2021", profileUrl: "https://www.valdoise.fr" },
];

export const PRESIDENTS_CR: PresidentCR[] = [
  { regionNom: "Auvergne-Rhône-Alpes", nom: "Laurent Wauquiez", parti: "LR", partiColor: COLORS.LR, enPosteDepuis: "2016", profileUrl: "https://www.auvergnerhonealpes.fr" },
  { regionNom: "Bourgogne-Franche-Comté", nom: "Marie-Guite Dufay", parti: "PS", partiColor: COLORS.PS, enPosteDepuis: "2016", profileUrl: "https://www.bourgognefranchecomte.fr" },
  { regionNom: "Bretagne", nom: "Loïg Chesnais-Girard", parti: "PS", partiColor: COLORS.PS, enPosteDepuis: "2017", profileUrl: "https://www.bretagne.bzh" },
  { regionNom: "Centre-Val de Loire", nom: "François Bonneau", parti: "PS", partiColor: COLORS.PS, enPosteDepuis: "2013", profileUrl: "https://www.centre-valdeloire.fr" },
  { regionNom: "Corse", nom: "Gilles Simeoni", parti: "PNC", partiColor: "#78716c", enPosteDepuis: "2021", profileUrl: "https://www.isula.corsica" },
  { regionNom: "Grand Est", nom: "Franck Leroy", parti: "LR", partiColor: COLORS.LR, enPosteDepuis: "2022", profileUrl: "https://www.grandest.fr" },
  { regionNom: "Guadeloupe", nom: "Ary Chalus", parti: "DVG", partiColor: COLORS.DVG, enPosteDepuis: "2016", profileUrl: "https://www.regionguadeloupe.fr" },
  { regionNom: "Guyane", nom: "Gabriel Serville", parti: "DVG", partiColor: COLORS.DVG, enPosteDepuis: "2021", profileUrl: "https://www.cr-guyane.fr" },
  { regionNom: "Hauts-de-France", nom: "Xavier Bertrand", parti: "LR", partiColor: COLORS.LR, enPosteDepuis: "2016", profileUrl: "https://www.hautsdefrance.fr" },
  { regionNom: "Île-de-France", nom: "Valérie Pécresse", parti: "LR", partiColor: COLORS.LR, enPosteDepuis: "2015", profileUrl: "https://www.iledefrance.fr" },
  { regionNom: "La Réunion", nom: "Huguette Bello", parti: "DVG", partiColor: COLORS.DVG, enPosteDepuis: "2021", profileUrl: "https://www.regionreunion.com" },
  { regionNom: "Martinique", nom: "Serge Letchimy", parti: "DVG", partiColor: COLORS.DVG, enPosteDepuis: "2021", profileUrl: "https://www.cr-martinique.fr" },
  { regionNom: "Mayotte", nom: "Ben Issa Ousseni", parti: "DVD", partiColor: COLORS.DVD, enPosteDepuis: "2021", profileUrl: "https://www.mayotte.fr" },
  { regionNom: "Normandie", nom: "Hervé Morin", parti: "UDI", partiColor: COLORS.UDI, enPosteDepuis: "2016", profileUrl: "https://www.normandie.fr" },
  { regionNom: "Nouvelle-Aquitaine", nom: "Alain Rousset", parti: "PS", partiColor: COLORS.PS, enPosteDepuis: "1998", profileUrl: "https://www.nouvelle-aquitaine.fr" },
  { regionNom: "Occitanie", nom: "Carole Delga", parti: "PS", partiColor: COLORS.PS, enPosteDepuis: "2016", profileUrl: "https://www.laregion.fr" },
  { regionNom: "Pays de la Loire", nom: "Christelle Morançais", parti: "LR", partiColor: COLORS.LR, enPosteDepuis: "2017", profileUrl: "https://www.paysdelaloire.fr" },
  { regionNom: "Provence-Alpes-Côte d'Azur", nom: "Renaud Muselier", parti: "LR", partiColor: COLORS.LR, enPosteDepuis: "2017", profileUrl: "https://www.maregionsud.fr" },
];

const CD_MAP: Record<string, PresidentCD> = {};
for (const p of PRESIDENTS_CD) CD_MAP[p.deptCode] = p;

const CR_MAP: Record<string, PresidentCR> = {};
for (const p of PRESIDENTS_CR) CR_MAP[p.regionNom] = p;

export function getPresidentCD(deptCode: string): PresidentCD | null {
  return CD_MAP[deptCode] ?? null;
}

export function getPresidentCR(regionNom: string): PresidentCR | null {
  return CR_MAP[regionNom] ?? null;
}
