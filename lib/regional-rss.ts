export interface RegionalOutlet {
  name: string;
  rssUrl: string;
}

// Only verified-working RSS feeds (tested March 2026).
// Departments without a working regional feed fall through to the national fallback in the route.
const FIGARO = { name: "Le Figaro", rssUrl: "https://www.lefigaro.fr/rss/figaro_actualites.xml" };
const MONDE = { name: "Le Monde", rssUrl: "https://www.lemonde.fr/rss/une.xml" };
const DEPECHE = { name: "La Dépêche du Midi", rssUrl: "https://www.ladepeche.fr/rss.xml" };
const MIDILIBRE = { name: "Midi Libre", rssUrl: "https://www.midilibre.fr/rss.xml" };
const LEPROGRES = { name: "Le Progrès", rssUrl: "https://www.leprogres.fr/rss" };
const DAUPHINE = { name: "Le Dauphiné Libéré", rssUrl: "https://www.ledauphine.com/rss" };
const BFMTV = { name: "BFM TV", rssUrl: "https://www.bfmtv.com/rss/news-24-7/" };
const CHARENTELIBRE = { name: "Charente Libre", rssUrl: "https://www.charentelibre.fr/rss.xml" };
const VARMATIN = { name: "Var-Matin", rssUrl: "https://www.varmatin.com/rss.xml" };

export const DEPT_REGIONAL_PRESS: Record<string, RegionalOutlet[]> = {
  // Ain
  "01": [LEPROGRES, MONDE],
  // Aisne
  "02": [BFMTV, MONDE],
  // Allier
  "03": [MONDE],
  // Alpes-de-Haute-Provence
  "04": [MONDE],
  // Hautes-Alpes
  "05": [DAUPHINE, MONDE],
  // Alpes-Maritimes
  "06": [MONDE, FIGARO],
  // Ardèche
  "07": [DAUPHINE, MONDE],
  // Ardennes
  "08": [MONDE],
  // Ariège
  "09": [DEPECHE, MONDE],
  // Aube
  "10": [MONDE],
  // Aude
  "11": [MIDILIBRE, MONDE],
  // Aveyron
  "12": [DEPECHE, MONDE],
  // Bouches-du-Rhône
  "13": [MONDE, FIGARO],
  // Calvados
  "14": [MONDE],
  // Cantal
  "15": [MONDE],
  // Charente
  "16": [CHARENTELIBRE, MONDE],
  // Charente-Maritime
  "17": [MONDE],
  // Cher
  "18": [MONDE],
  // Corrèze
  "19": [MONDE],
  // Corse-du-Sud
  "2A": [MONDE],
  // Haute-Corse
  "2B": [MONDE],
  // Côte-d'Or
  "21": [MONDE, FIGARO],
  // Côtes-d'Armor
  "22": [MONDE],
  // Creuse
  "23": [MONDE],
  // Dordogne
  "24": [MONDE],
  // Doubs
  "25": [MONDE],
  // Drôme
  "26": [DAUPHINE, MONDE],
  // Eure
  "27": [MONDE],
  // Eure-et-Loir
  "28": [MONDE],
  // Finistère
  "29": [MONDE],
  // Gard
  "30": [MIDILIBRE, MONDE],
  // Haute-Garonne
  "31": [DEPECHE, MONDE],
  // Gers
  "32": [DEPECHE, MONDE],
  // Gironde
  "33": [MONDE, FIGARO],
  // Hérault
  "34": [MIDILIBRE, MONDE],
  // Ille-et-Vilaine
  "35": [MONDE],
  // Indre
  "36": [MONDE],
  // Indre-et-Loire
  "37": [MONDE],
  // Isère
  "38": [DAUPHINE, MONDE],
  // Jura
  "39": [LEPROGRES, MONDE],
  // Landes
  "40": [MONDE],
  // Loir-et-Cher
  "41": [MONDE],
  // Loire
  "42": [LEPROGRES, MONDE],
  // Haute-Loire
  "43": [MONDE],
  // Loire-Atlantique
  "44": [MONDE],
  // Loiret
  "45": [MONDE],
  // Lot
  "46": [DEPECHE, MONDE],
  // Lot-et-Garonne
  "47": [MONDE],
  // Lozère
  "48": [MIDILIBRE, MONDE],
  // Maine-et-Loire
  "49": [MONDE],
  // Manche
  "50": [MONDE],
  // Marne
  "51": [MONDE],
  // Haute-Marne
  "52": [MONDE],
  // Mayenne
  "53": [MONDE],
  // Meurthe-et-Moselle
  "54": [MONDE],
  // Meuse
  "55": [MONDE],
  // Morbihan
  "56": [MONDE],
  // Moselle
  "57": [MONDE],
  // Nièvre
  "58": [MONDE],
  // Nord
  "59": [BFMTV, MONDE],
  // Oise
  "60": [MONDE, FIGARO],
  // Orne
  "61": [MONDE],
  // Pas-de-Calais
  "62": [BFMTV, MONDE],
  // Puy-de-Dôme
  "63": [MONDE],
  // Pyrénées-Atlantiques
  "64": [MONDE],
  // Hautes-Pyrénées
  "65": [DEPECHE, MONDE],
  // Pyrénées-Orientales
  "66": [MIDILIBRE, MONDE],
  // Bas-Rhin
  "67": [MONDE, FIGARO],
  // Haut-Rhin
  "68": [MONDE],
  // Rhône
  "69": [LEPROGRES, MONDE],
  // Haute-Saône
  "70": [MONDE],
  // Saône-et-Loire
  "71": [LEPROGRES, MONDE],
  // Sarthe
  "72": [MONDE],
  // Savoie
  "73": [DAUPHINE, MONDE],
  // Haute-Savoie
  "74": [DAUPHINE, MONDE],
  // Paris
  "75": [FIGARO, MONDE],
  // Seine-Maritime
  "76": [MONDE, FIGARO],
  // Seine-et-Marne
  "77": [MONDE, FIGARO],
  // Yvelines
  "78": [MONDE, FIGARO],
  // Deux-Sèvres
  "79": [MONDE],
  // Somme
  "80": [BFMTV, MONDE],
  // Tarn
  "81": [DEPECHE, MONDE],
  // Tarn-et-Garonne
  "82": [DEPECHE, MONDE],
  // Var
  "83": [VARMATIN, MONDE],
  // Vaucluse
  "84": [MONDE],
  // Vendée
  "85": [MONDE],
  // Vienne
  "86": [MONDE],
  // Haute-Vienne
  "87": [MONDE],
  // Vosges
  "88": [MONDE],
  // Yonne
  "89": [MONDE],
  // Territoire de Belfort
  "90": [MONDE],
  // Essonne
  "91": [MONDE, FIGARO],
  // Hauts-de-Seine
  "92": [MONDE, FIGARO],
  // Seine-Saint-Denis
  "93": [BFMTV, MONDE],
  // Val-de-Marne
  "94": [MONDE, FIGARO],
  // Val-d'Oise
  "95": [MONDE, FIGARO],
  // National fallback
  "default": [BFMTV, MONDE],
};
