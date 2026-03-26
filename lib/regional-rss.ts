export interface RegionalOutlet {
  name: string;
  rssUrl: string;
}

// Google News RSS — department-specific query (always works, gives actual local news)
function gnews(query: string): RegionalOutlet {
  return {
    name: "Google Actualités",
    rssUrl: `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=fr&gl=FR&ceid=FR:fr`,
  };
}

// Verified-working regional papers (tested March 2026)
const DEPECHE  = { name: "La Dépêche du Midi",  rssUrl: "https://www.ladepeche.fr/rss.xml" };
const MIDILIBRE = { name: "Midi Libre",           rssUrl: "https://www.midilibre.fr/rss.xml" };
const LEPROGRES = { name: "Le Progrès",           rssUrl: "https://www.leprogres.fr/rss" };
const DAUPHINE  = { name: "Le Dauphiné Libéré",  rssUrl: "https://www.ledauphine.com/rss" };
const CHARENTE  = { name: "Charente Libre",       rssUrl: "https://www.charentelibre.fr/rss.xml" };
const VARMATIN  = { name: "Var-Matin",            rssUrl: "https://www.varmatin.com/rss.xml" };

export const DEPT_REGIONAL_PRESS: Record<string, RegionalOutlet[]> = {
  // Ain
  "01": [LEPROGRES, gnews("Ain Bourg-en-Bresse")],
  // Aisne
  "02": [gnews("Aisne Laon Saint-Quentin")],
  // Allier
  "03": [gnews("Allier Moulins Vichy")],
  // Alpes-de-Haute-Provence
  "04": [gnews("Alpes-de-Haute-Provence Digne-les-Bains")],
  // Hautes-Alpes
  "05": [DAUPHINE, gnews("Hautes-Alpes Gap Briançon")],
  // Alpes-Maritimes
  "06": [gnews("Alpes-Maritimes Nice Cannes")],
  // Ardèche
  "07": [DAUPHINE, gnews("Ardèche Privas")],
  // Ardennes
  "08": [gnews("Ardennes Charleville-Mézières")],
  // Ariège
  "09": [DEPECHE, gnews("Ariège Foix")],
  // Aube
  "10": [gnews("Aube Troyes")],
  // Aude
  "11": [MIDILIBRE, gnews("Aude Carcassonne Narbonne")],
  // Aveyron
  "12": [DEPECHE, gnews("Aveyron Rodez")],
  // Bouches-du-Rhône
  "13": [gnews("Bouches-du-Rhône Marseille Aix-en-Provence")],
  // Calvados
  "14": [gnews("Calvados Caen")],
  // Cantal
  "15": [gnews("Cantal Aurillac")],
  // Charente
  "16": [CHARENTE, gnews("Charente Angoulême")],
  // Charente-Maritime
  "17": [gnews("Charente-Maritime La Rochelle Rochefort")],
  // Cher
  "18": [gnews("Cher Bourges")],
  // Corrèze
  "19": [gnews("Corrèze Tulle Brive-la-Gaillarde")],
  // Corse-du-Sud
  "2A": [gnews("Corse Ajaccio")],
  // Haute-Corse
  "2B": [gnews("Haute-Corse Bastia Corte")],
  // Côte-d'Or
  "21": [gnews("Côte-d'Or Dijon")],
  // Côtes-d'Armor
  "22": [gnews("Côtes-d'Armor Saint-Brieuc")],
  // Creuse
  "23": [gnews("Creuse Guéret")],
  // Dordogne
  "24": [gnews("Dordogne Périgueux Bergerac")],
  // Doubs
  "25": [gnews("Doubs Besançon Montbéliard")],
  // Drôme
  "26": [DAUPHINE, gnews("Drôme Valence Romans-sur-Isère")],
  // Eure
  "27": [gnews("Eure Évreux")],
  // Eure-et-Loir
  "28": [gnews("Eure-et-Loir Chartres")],
  // Finistère
  "29": [gnews("Finistère Brest Quimper")],
  // Gard
  "30": [MIDILIBRE, gnews("Gard Nîmes Alès")],
  // Haute-Garonne
  "31": [DEPECHE, gnews("Haute-Garonne Toulouse")],
  // Gers
  "32": [DEPECHE, gnews("Gers Auch")],
  // Gironde
  "33": [gnews("Gironde Bordeaux")],
  // Hérault
  "34": [MIDILIBRE, gnews("Hérault Montpellier Béziers")],
  // Ille-et-Vilaine
  "35": [gnews("Ille-et-Vilaine Rennes")],
  // Indre
  "36": [gnews("Indre Châteauroux")],
  // Indre-et-Loire
  "37": [gnews("Indre-et-Loire Tours")],
  // Isère
  "38": [DAUPHINE, gnews("Isère Grenoble")],
  // Jura
  "39": [LEPROGRES, gnews("Jura Lons-le-Saunier")],
  // Landes
  "40": [gnews("Landes Mont-de-Marsan Dax")],
  // Loir-et-Cher
  "41": [gnews("Loir-et-Cher Blois")],
  // Loire
  "42": [LEPROGRES, gnews("Loire Saint-Étienne")],
  // Haute-Loire
  "43": [gnews("Haute-Loire Le Puy-en-Velay")],
  // Loire-Atlantique
  "44": [gnews("Loire-Atlantique Nantes")],
  // Loiret
  "45": [gnews("Loiret Orléans")],
  // Lot
  "46": [DEPECHE, gnews("Lot Cahors")],
  // Lot-et-Garonne
  "47": [gnews("Lot-et-Garonne Agen")],
  // Lozère
  "48": [MIDILIBRE, gnews("Lozère Mende")],
  // Maine-et-Loire
  "49": [gnews("Maine-et-Loire Angers")],
  // Manche
  "50": [gnews("Manche Cherbourg Saint-Lô")],
  // Marne
  "51": [gnews("Marne Reims Châlons-en-Champagne")],
  // Haute-Marne
  "52": [gnews("Haute-Marne Chaumont")],
  // Mayenne
  "53": [gnews("Mayenne Laval")],
  // Meurthe-et-Moselle
  "54": [gnews("Meurthe-et-Moselle Nancy")],
  // Meuse
  "55": [gnews("Meuse Bar-le-Duc")],
  // Morbihan
  "56": [gnews("Morbihan Vannes Lorient")],
  // Moselle
  "57": [gnews("Moselle Metz Thionville")],
  // Nièvre
  "58": [gnews("Nièvre Nevers")],
  // Nord
  "59": [gnews("Nord Lille Roubaix Tourcoing")],
  // Oise
  "60": [gnews("Oise Beauvais Compiègne")],
  // Orne
  "61": [gnews("Orne Alençon")],
  // Pas-de-Calais
  "62": [gnews("Pas-de-Calais Arras Calais Boulogne")],
  // Puy-de-Dôme
  "63": [gnews("Puy-de-Dôme Clermont-Ferrand")],
  // Pyrénées-Atlantiques
  "64": [gnews("Pyrénées-Atlantiques Pau Bayonne")],
  // Hautes-Pyrénées
  "65": [DEPECHE, gnews("Hautes-Pyrénées Tarbes Lourdes")],
  // Pyrénées-Orientales
  "66": [MIDILIBRE, gnews("Pyrénées-Orientales Perpignan")],
  // Bas-Rhin
  "67": [gnews("Bas-Rhin Strasbourg")],
  // Haut-Rhin
  "68": [gnews("Haut-Rhin Mulhouse Colmar")],
  // Rhône
  "69": [LEPROGRES, gnews("Rhône Lyon")],
  // Haute-Saône
  "70": [gnews("Haute-Saône Vesoul")],
  // Saône-et-Loire
  "71": [LEPROGRES, gnews("Saône-et-Loire Mâcon Chalon-sur-Saône")],
  // Sarthe
  "72": [gnews("Sarthe Le Mans")],
  // Savoie
  "73": [DAUPHINE, gnews("Savoie Chambéry")],
  // Haute-Savoie
  "74": [DAUPHINE, gnews("Haute-Savoie Annecy")],
  // Paris
  "75": [gnews("Paris actualités")],
  // Seine-Maritime
  "76": [gnews("Seine-Maritime Rouen Le Havre")],
  // Seine-et-Marne
  "77": [gnews("Seine-et-Marne Melun Meaux")],
  // Yvelines
  "78": [gnews("Yvelines Versailles")],
  // Deux-Sèvres
  "79": [gnews("Deux-Sèvres Niort")],
  // Somme
  "80": [gnews("Somme Amiens")],
  // Tarn
  "81": [DEPECHE, gnews("Tarn Albi Castres")],
  // Tarn-et-Garonne
  "82": [DEPECHE, gnews("Tarn-et-Garonne Montauban")],
  // Var
  "83": [VARMATIN, gnews("Var Toulon Fréjus")],
  // Vaucluse
  "84": [gnews("Vaucluse Avignon")],
  // Vendée
  "85": [gnews("Vendée La Roche-sur-Yon")],
  // Vienne
  "86": [gnews("Vienne Poitiers")],
  // Haute-Vienne
  "87": [gnews("Haute-Vienne Limoges")],
  // Vosges
  "88": [gnews("Vosges Épinal")],
  // Yonne
  "89": [gnews("Yonne Auxerre")],
  // Territoire de Belfort
  "90": [gnews("Territoire de Belfort")],
  // Essonne
  "91": [gnews("Essonne Évry Corbeil")],
  // Hauts-de-Seine
  "92": [gnews("Hauts-de-Seine Nanterre Boulogne")],
  // Seine-Saint-Denis
  "93": [gnews("Seine-Saint-Denis Bobigny Saint-Denis")],
  // Val-de-Marne
  "94": [gnews("Val-de-Marne Créteil")],
  // Val-d'Oise
  "95": [gnews("Val-d'Oise Cergy Pontoise")],
  // National fallback
  "default": [gnews("France actualités")],
};
