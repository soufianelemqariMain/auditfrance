<div align="center">

# Audit France

**Le tableau de bord de transparence publique française — en temps réel**

[![Licence MIT](https://img.shields.io/badge/licence-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Deploy with Vercel](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/soufianelemqariMain/auditfrance)
[![PRs bienvenues](https://img.shields.io/badge/PRs-bienvenues-brightgreen.svg)](https://github.com/soufianelemqariMain/auditfrance/issues)

[Démo live](https://auditfrance.vercel.app) · [Signaler un bug](https://github.com/soufianelemqariMain/auditfrance/issues) · [Proposer une fonctionnalité](https://github.com/soufianelemqariMain/auditfrance/issues)

</div>

---

## C'est quoi

Un outil citoyen. Une seule interface. Tout ce qui compte sur l'efficacité de l'État français — les marchés publics, les budgets, les élus, les appels d'offres, les subventions — agrégé en temps réel depuis les données officielles.

L'idée de départ : si l'État publie ses propres données, pourquoi ne pas les rendre lisibles pour tout le monde ? C'est ça la transparence. Pas un discours. Pas un rapport. Une interface.

Merci à l'écosystème open data français — data.gouv.fr, BOAMP, nosdeputes.fr, DECP, OFGL — qui rend ce genre d'outil possible sans une seule base de données privée ni un seul accord commercial.

---

## Ce que ça fait

### Carte nationale interactive

Cliquez sur l'un des 101 départements français. Le tableau de bord s'affiche instantanément :

| Onglet | Contenu |
|---|---|
| **Aperçu** | Population, superficie, densité, préfecture |
| **Élus** | Président du conseil régional + tous les députés avec leur score d'activité en direct |
| **Appels d'offres** | Marchés publics actifs — flux live depuis BOAMP |
| **Budget** | Ventilation des dépenses départementales (ratios OFGL) |

### Barre de veille en bas d'écran

| Panneau | Source | Rafraîchissement |
|---|---|---|
| Fil d'actu | BFM, France Info, Le Monde, Le Figaro, RFI, France 24 | 5 min |
| TV en direct | France 24, BFM TV, CNews, LCP | Stream |
| Sous-actifs | nosdeputes.fr synthèse | 1 heure |
| AO ouverts | BOAMP OpenDataSoft | 15 min |
| CAC 40 | Yahoo Finance (~40 sociétés) | 60 sec |

### Page audit national (`/audit`)

| Onglet | Source | Contenu |
|---|---|---|
| **Budget PLF** | budget.gouv.fr | PLF 2025 par ministère |
| **Marchés attribués** | DECP | Top prestataires par volume de commande publique |
| **Marchés ouverts** | BOAMP | Tous les appels d'offres actifs, filtrables par département |
| **Subventions** | data-subventions.beta.gouv.fr | Subventions attribuées + programmes de financement ouverts |

---

## Sources de données

Tout est tiré en direct depuis les APIs officielles de l'État français. Pas de base privée. Pas de scraping. Pas de triche.

| Données | API | Cache |
|---|---|---|
| Marchés attribués | [DECP v3 — data.economie.gouv.fr](https://data.economie.gouv.fr) | 15 min |
| Appels d'offres ouverts | [BOAMP — boamp-datadila.opendatasoft.com](https://boamp-datadila.opendatasoft.com) | 15 min |
| Subventions de l'État | [data-subventions.beta.gouv.fr](https://data-subventions.beta.gouv.fr) | 20 min |
| Programmes de financement | [aides-territoires.beta.gouv.fr](https://aides-territoires.beta.gouv.fr) | 20 min |
| Activité des députés | [nosdeputes.fr](https://www.nosdeputes.fr) | 1 heure |
| Actualités | RSS (BFM, Le Monde, France Info, Le Figaro, RFI, France 24) | 5 min |
| Bourse | Yahoo Finance | 60 sec |

---

## Stack technique

- **[Next.js 16](https://nextjs.org)** — App Router, routes API serveur
- **[React 19](https://react.dev)** — Interface
- **[TypeScript](https://www.typescriptlang.org)** — Types de bout en bout
- **[MapLibre GL](https://maplibre.org)** — Carte interactive
- **[Zustand](https://zustand-demo.pmnd.rs)** — État client
- **[Tailwind CSS](https://tailwindcss.com)** — Styles utilitaires

---

## Lancer en local

```bash
git clone https://github.com/soufianelemqariMain/auditfrance.git
cd auditfrance
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). Aucune clé API requise pour démarrer.

### Déployer sur Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/soufianelemqariMain/auditfrance)

---

## Inspiré de worldmonitor.app — et ce qu'on fait différemment

Ce projet s'inspire de [worldmonitor.app](https://worldmonitor.app), un tableau de bord de surveillance mondiale qui centralise données géopolitiques, économiques et médiatiques à l'échelle internationale.

**Merci à eux.**

Là où worldmonitor est global, Audit France est volontairement local et citoyen :

| | worldmonitor.app | Audit France |
|---|---|---|
| **Périmètre** | Monde entier | France uniquement |
| **Focus** | Géopolitique, macro-économie, actualités mondiales | Transparence publique française : marchés, élus, subventions, budgets |
| **Sources** | Données internationales | APIs officielles de l'État français exclusivement |
| **Granularité** | Pays | Département (101 territoires), commune |
| **Usage** | Veille stratégique | Contrôle citoyen de l'action publique |

Le pari ici : aller plus loin dans le détail institutionnel français — pas juste suivre les nouvelles, mais lire les contrats, suivre les députés vote par vote, voir où part l'argent public commune par commune.

---

## Contribuer

Les contributions sont bienvenues. L'architecture est volontairement modulaire — chaque panneau et chaque route API est isolé. Ajouter une nouvelle source de données, c'est généralement un seul fichier.

**Bonnes premières issues :**
- Ajouter une nouvelle source de données au panneau département
- Améliorer l'algorithme de scoring d'activité des élus
- Ajouter un fil d'actu régional filtré par département
- Responsive mobile
- Nouvelles sources de marchés publics (au-delà de BOAMP)
- Mode sombre / clair

**Pour contribuer :**

1. Forker le repo
2. Créer une branche : `git checkout -b feature/ma-contribution`
3. Faire les modifications
4. Pousser : `git push origin feature/ma-contribution`
5. Ouvrir une PR

Une fonctionnalité par PR. TypeScript obligatoire. Variables CSS pour les styles. Si vous touchez à une source de données, documentez ce que vous récupérez et pourquoi.

---

## Licence

MIT — voir [LICENSE](LICENSE).

---

<div align="center">

Construit sur des données publiques, pour l'intérêt général.<br>
Parce que l'efficacité de l'État, ça se mesure. Et ça se publie.

</div>
