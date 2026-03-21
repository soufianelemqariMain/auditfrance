<div align="center">

# Audit France

**Tableau de bord open-source pour la transparence des finances publiques et la séparation des pouvoirs**

[![Licence MIT](https://img.shields.io/badge/licence-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Deploy with Vercel](https://img.shields.io/badge/déployer-Vercel-black?logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/soufianelemqariMain/auditfrance)
[![Open Source](https://img.shields.io/badge/open%20source-%E2%9D%A4-red)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-bienvenues-brightgreen.svg)](CONTRIBUTING.md)

[Démo live](https://auditfrance.vercel.app) · [Signaler un bug](https://github.com/soufianelemqariMain/auditfrance/issues) · [Proposer une fonctionnalité](https://github.com/soufianelemqariMain/auditfrance/issues)

</div>

---

## À propos

Audit France est un tableau de bord de veille civique inspiré de [worldmonitor.app](https://worldmonitor.app) — mais ancré dans la réalité française, avec une obsession pour la **transparence démocratique** et l'**équilibre des pouvoirs**.

Là où d'autres tableaux de bord agrègent de l'information générale, Audit France se concentre sur une question précise : **qui décide quoi, avec quel argent public, et au profit de qui ?**

Données officielles uniquement. Aucune base de données privée. Aucun scraping.

---

## Ce que ça fait

### Carte nationale interactive

Cliquez sur n'importe lequel des 101 départements pour accéder instantanément à son tableau de bord local :

| Onglet | Ce qu'il montre |
|---|---|
| **Aperçu** | Population, superficie, densité, préfecture, liens régionaux |
| **Élus** | Président·e du Conseil Régional + tous les député·e·s avec leurs scores d'activité parlementaire |
| **Appels d'offres** | Avis de marchés publics actifs encore ouverts aux candidatures — en direct depuis BOAMP |
| **Budget** | Estimations budgétaires du conseil départemental (ratios OFGL) avec liens vers les sources officielles |

### Flux d'information en temps réel

| Panneau | Source | Fréquence |
|---|---|---|
| Fil d'actualité | BFM, France Info, Le Monde, Le Figaro, RFI, France 24 | Toutes les 5 min |
| Brief IA | API Mistral | À la demande |
| CAC 40 | Yahoo Finance proxy | Temps réel |
| Parlement | RSS Assemblée Nationale + Sénat | En direct |

### Page audit national (`/audit`)

Quatre onglets pour une vision nationale complète :

| Onglet | Source | Contenu |
|---|---|---|
| **Budget PLF** | budget.gouv.fr | Répartition du PLF 2025 par ministère |
| **Marchés attribués** | DECP | Classement des entreprises par volume de marchés publics |
| **Marchés ouverts** | BOAMP | Tous les appels d'offres actifs, filtrables par département |
| **Subventions** | data-subventions.beta.gouv.fr + aides-territoires | Subventions attribuées + programmes de financement ouverts |

---

## Sources de données

Toutes les données sont récupérées en direct depuis les API officielles de l'État français — sans base de données, sans scraping.

| Donnée | API | Cache |
|---|---|---|
| Marchés attribués | [DECP v3 — data.economie.gouv.fr](https://data.economie.gouv.fr) | 15 min |
| Appels d'offres ouverts | [BOAMP — boamp-datadila.opendatasoft.com](https://boamp-datadila.opendatasoft.com) | 15 min |
| Subventions État | [data-subventions.beta.gouv.fr](https://data-subventions.beta.gouv.fr) | 20 min |
| Programmes de financement | [aides-territoires.beta.gouv.fr](https://aides-territoires.beta.gouv.fr) | 20 min |
| Activité des député·e·s | [nosdeputes.fr](https://www.nosdeputes.fr) | 1 heure |
| Actualité | RSS (BFM, Le Monde, France Info, Le Figaro, RFI, France 24) | 5 min |
| Brief IA | [API Mistral](https://mistral.ai) | À la demande |

---

## Stack technique

- **[Next.js 16](https://nextjs.org)** — App Router, routes API serveur
- **[React 19](https://react.dev)** — interface utilisateur
- **[TypeScript](https://www.typescriptlang.org)** — typage strict bout en bout
- **[MapLibre GL](https://maplibre.org)** — carte interactive
- **[Zustand](https://zustand-demo.pmnd.rs)** — état client
- **[Tailwind CSS](https://tailwindcss.com)** — styles utilitaires

---

## Lancer en local

### Prérequis

- Node.js 18+
- Une [clé API Mistral](https://console.mistral.ai) gratuite (optionnelle — active le brief IA)

### Installation

```bash
git clone https://github.com/soufianelemqariMain/auditfrance.git
cd auditfrance
npm install
```

Créer un `.env.local` :

```env
MISTRAL_API_KEY=votre_clé_ici   # optionnel
```

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Déployer sur Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/soufianelemqariMain/auditfrance)

Après déploiement, ajoutez `MISTRAL_API_KEY` dans les variables d'environnement Vercel pour activer le brief IA.

---

## Contribuer

Les contributions sont les bienvenues. Chaque panneau et chaque route API sont isolés — c'est facile à étendre.

**Bonnes premières issues :**
- Ajouter une nouvelle source de données au panneau département
- Améliorer l'algorithme de score d'activité des député·e·s
- Ajouter un flux d'actualité régional filtré par département
- Améliorer la responsivité mobile
- Ajouter un thème clair / sombre

**Pour contribuer :**

1. Forkez le dépôt
2. Créez une branche : `git checkout -b feature/ma-fonctionnalite`
3. Faites vos modifications
4. Poussez : `git push origin feature/ma-fonctionnalite`
5. Ouvrez une pull request

Une fonctionnalité par PR. Suivez le style existant (TypeScript, styles inline avec les variables CSS du système).

---

## Licence

MIT — voir [LICENSE](LICENSE) pour les détails.

---

<div align="center">
Construit avec des données publiques, dans l'intérêt général.
</div>
