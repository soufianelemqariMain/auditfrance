<div align="center">

# 🇫🇷 Audit France

### Le tableau de bord de la République — en temps réel

*Marchés publics. Élus. Budgets. Appels d'offres. Sondages. Tout ce que l'État publie, rendu lisible.*

[![Licence MIT](https://img.shields.io/badge/licence-MIT-22c55e.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Deploy with Vercel](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/soufianelemqariMain/auditfrance)
[![GitHub Sponsors](https://img.shields.io/badge/Soutenir%20le%20projet-%E2%9D%A4-ff69b4?logo=github-sponsors)](https://github.com/sponsors/soufianelemqariMain)
[![PRs bienvenues](https://img.shields.io/badge/PRs-bienvenues-brightgreen.svg)](https://github.com/soufianelemqariMain/auditfrance/issues)

[**→ Démo live**](https://auditfrance.vercel.app) &nbsp;·&nbsp; [Signaler un bug](https://github.com/soufianelemqariMain/auditfrance/issues) &nbsp;·&nbsp; [Proposer une fonctionnalité](https://github.com/soufianelemqariMain/auditfrance/issues) &nbsp;·&nbsp; [Soutenir le projet ❤️](https://github.com/sponsors/soufianelemqariMain)

</div>

---

## Pourquoi ce projet existe

La transparence de l'État, c'est pas un concept. C'est des APIs. Des fichiers JSON. Des millions de lignes publiées chaque jour sur data.gouv.fr, BOAMP, DECP, nosdeputes.fr — et que personne ne lit parce qu'elles sont inaccessibles.

**Audit France, c'est la traduction de ces données brutes en quelque chose d'humain.**

Pas de compte à créer. Pas d'abonnement. Pas d'algorithme qui filtre ce que tu vois. Juste les données officielles de la République, présentées clairement, pour n'importe quel citoyen qui veut comprendre comment fonctionne l'État qui le gouverne.

L'argent public appartient au public. Les décisions publiques méritent d'être publiques. C'est tout.

---

## Ce que tu vois en ouvrant l'application

### 🗺️ Carte nationale — 101 départements, 35 000 communes

Clique sur n'importe quel département. En une seconde, tu accèdes à :

| Onglet | Ce que ça montre |
|---|---|
| **Aperçu** | Population, superficie, densité, préfecture |
| **Élus** | Président du conseil + tous les députés avec leur score d'activité parlementaire en direct |
| **Appels d'offres** | Marchés publics actifs du département — flux live BOAMP |
| **Budget** | Ventilation des dépenses départementales — ratios OFGL par habitant |
| **Communes** | Zoom sur n'importe quelle commune : maire, budget, marchés locaux |
| **Recrutement** | Offres CDI ouvertes dans le département — top recruteurs en temps réel |

### 📊 Barre de veille en temps réel

Six panneaux permanents en bas d'écran :

| Panneau | Ce que ça montre | Mise à jour |
|---|---|---|
| **Fil d'actu** | France Info, Le Monde, Le Figaro, RFI, France 24 | 5 min |
| **TV en direct** | France 24 · Arte · Euronews FR — stream HLS natif | Continu |
| **Sous-actifs** | Députés avec faible activité parlementaire | 1 heure |
| **AO ouverts** | Appels d'offres actifs (BOAMP) | 15 min |
| **CAC 40** | ~40 valeurs — cours en quasi-temps réel | 60 sec |
| **Recrutement** | Top recruteurs CDI nationaux — France Travail | 30 min |
| **Sondages 2027** | Intentions de vote présidentielle 2027 par candidat | Mensuel |

### 📋 Page Audit national (`/audit`)

| Onglet | Source | Contenu |
|---|---|---|
| **Budget PLF** | budget.gouv.fr | PLF par ministère |
| **Marchés attribués** | DECP | Top prestataires par volume de commande publique |
| **Marchés ouverts** | BOAMP | Tous les appels d'offres actifs, filtrables par département |
| **Subventions** | data-subventions.beta.gouv.fr | Subventions attribuées + programmes de financement ouverts |

---

## Sources de données

Tout vient des APIs officielles de l'État français. Aucune base privée. Aucun partenariat commercial. Aucun intermédiaire.

| Données | Source officielle | Cache |
|---|---|---|
| Marchés attribués | [DECP — data.economie.gouv.fr](https://data.economie.gouv.fr) | 15 min |
| Appels d'offres | [BOAMP — boamp-datadila.opendatasoft.com](https://boamp-datadila.opendatasoft.com) | 15 min |
| Subventions | [data-subventions.beta.gouv.fr](https://data-subventions.beta.gouv.fr) | 20 min |
| Aides territoires | [aides-territoires.beta.gouv.fr](https://aides-territoires.beta.gouv.fr) | 20 min |
| Activité des députés | [nosdeputes.fr](https://www.nosdeputes.fr) | 1 heure |
| Offres d'emploi CDI | [France Travail API](https://francetravail.io) | 30 min |
| Actualités | RSS (France Info, Le Monde, Le Figaro, RFI, France 24) | 5 min |
| Bourse | Yahoo Finance | 60 sec |
| Données électorales | data.gouv.fr | Statique |
| Budgets locaux | OFGL | Statique |

---

## Stack technique

- **[Next.js 16](https://nextjs.org)** — App Router, routes API serveur, rendu hybride
- **[React 19](https://react.dev)** — Interface réactive
- **[TypeScript](https://www.typescriptlang.org)** — Typage bout en bout
- **[MapLibre GL](https://maplibre.org)** — Carte vectorielle interactive
- **[Tailwind CSS](https://tailwindcss.com)** — Styles utilitaires
- **[hls.js](https://github.com/video-dev/hls.js)** — Lecture des streams TV
- **[Vercel](https://vercel.com)** — Déploiement et edge functions

Aucune base de données. Aucune infrastructure propre. Tout passe par les APIs publiques.

---

## Lancer en local

```bash
git clone https://github.com/soufianelemqariMain/auditfrance.git
cd auditfrance
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). **Aucune clé API requise pour démarrer** — la majorité des fonctionnalités marchent sans configuration.

### Variables d'environnement optionnelles

Crée un fichier `.env.local` pour activer les données enrichies :

```env
# Offres d'emploi CDI en temps réel (inscription gratuite sur francetravail.io)
FRANCE_TRAVAIL_CLIENT_ID=...
FRANCE_TRAVAIL_CLIENT_SECRET=...
```

### Déployer sur Vercel en un clic

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/soufianelemqariMain/auditfrance)

---

## Contribuer

L'architecture est volontairement modulaire. Chaque panneau est un composant isolé. Chaque source de données est une route API indépendante. Ajouter une nouvelle fonctionnalité, c'est généralement un seul fichier.

**Bonnes premières contributions :**
- Ajouter une nouvelle source de données au panneau département
- Améliorer le scoring d'activité des élus (votes, questions, rapports)
- Fil d'actu filtré par département
- Responsive mobile
- Nouvelles sources de marchés publics (au-delà de BOAMP)
- Historique et graphiques temporels

**Pour contribuer :**

1. Forker le repo
2. Créer une branche : `git checkout -b feature/ma-contribution`
3. Coder
4. Pousser : `git push origin feature/ma-contribution`
5. Ouvrir une PR

Une fonctionnalité par PR. TypeScript obligatoire. Variables CSS pour les styles. Si tu touches à une source de données, documente ce que tu récupères et pourquoi.

---

## Soutenir le projet ❤️

Audit France est gratuit, open source, sans publicité et sans collecte de données. Si l'outil t'est utile et que tu veux soutenir son développement :

**[→ Faire un don via GitHub Sponsors](https://github.com/sponsors/soufianelemqariMain)**

Chaque contribution aide à maintenir les intégrations API, améliorer la couverture des données et garder le projet vivant.

---

## Inspiré par worldmonitor.app

Ce projet s'inspire de [worldmonitor.app](https://worldmonitor.app), tableau de bord de surveillance mondiale qui centralise données géopolitiques, économiques et médiatiques à l'échelle internationale. Merci à eux pour l'inspiration.

Là où worldmonitor est global, Audit France est délibérément local et institutionnel :

| | worldmonitor.app | Audit France |
|---|---|---|
| **Périmètre** | Monde entier | France uniquement |
| **Focus** | Géopolitique, macro | Transparence publique : marchés, élus, subventions, budgets |
| **Sources** | Données internationales | APIs officielles françaises exclusivement |
| **Granularité** | Pays | Département, commune |

---

## Licence

MIT — voir [LICENSE](LICENSE). Fais-en ce que tu veux. Cite la source, c'est tout.

---

<div align="center">

*L'efficacité de l'État, ça se mesure. Et ça se publie.*

**[Démo live](https://auditfrance.vercel.app) · [GitHub Sponsors ❤️](https://github.com/sponsors/soufianelemqariMain)**

</div>
