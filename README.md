<div align="center">

# 🔍 InfoVerif

### Surveillance médiatique & vérification de contenu — France, en temps réel

*Carte de France live. Actualités par département. Analyse DISARM. Vidéos des candidats 2027. TV en direct.*

[![Licence MIT](https://img.shields.io/badge/licence-MIT-22c55e.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Deploy with Vercel](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/soufianelemqariMain/auditfrance)
[![Support on GitHub](https://img.shields.io/badge/Support-%E2%9D%A4-red?logo=github)](https://github.com/sponsors/soufianelemqariMain)

[**→ infoverif.org**](https://www.infoverif.org) &nbsp;·&nbsp; [Signaler un bug](https://github.com/soufianelemqariMain/auditfrance/issues) &nbsp;·&nbsp; [Proposer une fonctionnalité](https://github.com/soufianelemqariMain/auditfrance/issues) &nbsp;·&nbsp; [❤️ Nous soutenir](https://github.com/sponsors/soufianelemqariMain)

</div>

---

## Ce que c'est

InfoVerif est un tableau de bord de surveillance médiatique pour la France. L'interface combine une carte interactive des 101 départements avec des outils d'analyse de contenu en temps réel : détection de propagande et désinformation via le framework DISARM, flux d'actualités locales live, vidéos des candidats à la présidentielle 2027, interventions à l'Assemblée Nationale, et TV française en direct.

Tout est gratuit, open source, sans compte, sans tracking.

---

## Ce que tu vois en ouvrant l'application

### 🗺️ Carte de France interactive

- **Shooting stars** — quand une actualité se déclenche, une ligne SVG bleu électrique part du bord de la carte vers le département concerné
- **Pulse markers** — les marqueurs de département pulsent à chaque événement d'actu
- **Toast notifications** — 550ms après la shooting star, une notification apparaît en bas à gauche avec le nom de l'outlet et le titre de l'article

**Clic sur un département :**
- 5 actualités locales live (Google News RSS, URLs réelles décodées — plus de redirections `news.google.com`)
- Statistiques locales

**Clic sur une commune :**
- Données statistiques de la commune

### 📰 Bandeau Breaking News

Ticker horizontal sous la navbar, mise à jour toutes les 30 secondes. Ne répète jamais un titre déjà affiché. Badge `BREAKING` rouge, défilement droite-à-gauche (240s).

---

### Panneaux bas (50% de l'écran)

| Panneau | Largeur | Ce que ça fait |
|---|---|---|
| **🔍 Analyser un contenu** | ~32% | Colle une URL, un texte, un discours, une vidéo YouTube → analyse DISARM complète |
| **📡 Infos en direct** | 18% | Radar live des 25 dernières actus issues des shooting stars |
| **🎬 Vidéos Politique** | 12% | YouTube RSS · 8 candidats 2027 · groupés Aujourd'hui / Cette semaine / Récentes |
| **🏛️ Discours & AN** | 15% | Interventions live à l'Assemblée Nationale |
| **📺 TV Direct** | 23% | Flux HLS de chaînes françaises en direct |

---

### 🏛️ Vérification citoyenne — Élus & Déclarations politiques

InfoVerif permet à n'importe quel citoyen de vérifier ce que disent les élus et les candidats.

**Interventions à l'Assemblée Nationale (live)**
- Discours et interventions des députés récupérés en direct depuis assemblee-nationale.fr
- Chaque intervention affiche : député, groupe politique, type (discours / question / amendement), extrait
- Bouton **→ Analyser** : envoie le texte complet du discours (proxied via `/api/speech` avec contexte des interventions précédentes) au moteur DISARM pour détection de propagande, manipulation, techniques rhétoriques

**Vidéos des candidats 2027**
- Dernières vidéos YouTube de chaque candidat, analysables en un clic
- Le bouton **→ Analyser** passe l'URL YouTube directement à InfoVerif — le backend extrait et analyse le contenu audio/vidéo

**Saisie libre**
- Colle n'importe quelle déclaration politique, discours, interview, tweet, post TikTok — le moteur détecte les techniques de manipulation et produit un rapport DISARM complet

---

### 🔍 Analyser un contenu — Détection DISARM

Colle n'importe quoi : URL, article de presse, discours politique, post réseau social, vidéo YouTube. Le moteur envoie au backend Railway (Mistral + embeddings custom) et retourne :

| Sortie | Description |
|---|---|
| **Score d'influence** | 0–100, niveau : Faible / Modéré / Élevé / Critique |
| **Scores détaillés** | Propagande · Désinformation · Complotisme |
| **Verdict** | Label spécifique + résumé |
| **Techniques DISARM** | Code DISARM, mécanisme cognitif, sévérité, confiance, extrait |
| **Red flags** | Synthèse des signaux d'alerte |
| **Stratégie de manipulation** | Description du schéma détecté |
| **Nuance** | Note de contre-balancement |
| **Correction suggérée** | Au lieu de X, dire Y — parce que Z |
| **À vérifier** | Liste de claims prioritaires à fact-checker |
| **Recommandations** | Actions concrètes |
| **Badges** | `audience_targeted` · `urgency_framing` · `viewpoint_balance` · `pattern_tags` |

Supporte : texte libre · URLs d'articles · vidéos YouTube · import de fichiers `.txt`

---

### 🎬 Vidéos Politique 2027

YouTube RSS des 8 principaux candidats à la présidentielle 2027, channel IDs vérifiés :

| Candidat | Parti |
|---|---|
| Marine Le Pen | RN |
| Jean-Luc Mélenchon | LFI |
| Jordan Bardella | RN |
| Édouard Philippe | Horizons |
| Gabriel Attal | Renaissance |
| Éric Zemmour | Reconquête |
| François Ruffin | Indép. |
| Raphaël Glucksmann | PS |

Le bouton **→ Analyser** envoie l'URL YouTube directement au moteur InfoVerif (analysé via yt-dlp côté backend). Les vidéos sont groupées par : **Aujourd'hui** · **Cette semaine** · **Récentes**. Cache 1h.

---

## Sources de données

| Données | Source | Cache |
|---|---|---|
| Actualités locales | Google News RSS (par département) | 5 min |
| Actualités nationales (bandeau) | Google News RSS | 30 s |
| Analyse DISARM | Backend Railway (Mistral + embeddings custom) | Temps réel |
| Vidéos politiques | YouTube RSS (channel IDs directs) | 1 h |
| Interventions AN | assemblee-nationale.fr | Live |
| TV directe | Flux HLS (chaînes publiques françaises) | Continu |

---

## Stack technique

- **[Next.js 15](https://nextjs.org)** — App Router, routes API serveur
- **[React 19](https://react.dev)** — Interface réactive
- **[TypeScript](https://www.typescriptlang.org)** — Typage bout en bout
- **[MapLibre GL](https://maplibre.org)** — Carte vectorielle interactive
- **[Zustand](https://zustand-demo.pmnd.rs)** — Store partagé carte ↔ panneaux
- **[hls.js](https://github.com/video-dev/hls.js)** — Lecture des streams TV
- **[Vercel](https://vercel.com)** — Déploiement frontend
- **[Railway](https://railway.app)** — Backend analyse DISARM (FastAPI + Mistral + embeddings custom)
- **[Vercel Analytics](https://vercel.com/analytics)** — Usage anonymisé

**Backend repo** : 🔒 Private — available to [GitHub Sponsors](https://github.com/sponsors/soufianelemqariMain). Sponsors get access to the full FastAPI backend (DISARM pipeline, Mistral AI, fact-checking engine).

---

## Lancer en local

```bash
git clone https://github.com/soufianelemqariMain/auditfrance.git
cd auditfrance
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Variables d'environnement

Crée un fichier `.env.local` :

```env
# Backend DISARM (Railway) — requis pour l'analyse de contenu
INFOVERIF_API_URL=https://...railway.app
INFOVERIF_API_KEY=...
```

Sans ces variables, le panneau Analyser retournera une erreur de connexion. Toutes les autres fonctionnalités (carte, actualités, vidéos, TV) fonctionnent sans configuration.

### Déployer sur Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/soufianelemqariMain/auditfrance)

---

## Architecture

L'architecture est volontairement modulaire. Chaque panneau est un composant React isolé. Chaque source de données est une route API Next.js indépendante. Ajouter une fonctionnalité = généralement un composant + une route.

```
app/
  page.tsx                  # Layout principal + AnalyserPanel inline
  api/
    verify/                 # Proxy vers backend Railway (DISARM)
    dept-news/[code]/        # Google News RSS par département
    news/                   # Actualités nationales (bandeau)
    corpus-politique/        # YouTube RSS candidats 2027
    discours/                # Interventions AN
    speech/                  # Proxy speech complet + contexte

components/
  Map.tsx                   # Carte MapLibre + shooting stars + toasts
  NewsBandeau.tsx            # Ticker breaking news
  NewsTickerPanel.tsx        # Radar live shooting stars
  CorpusPolitiquePanel.tsx   # Vidéos politique 2027
  DiscoursPanel.tsx          # Interventions AN
  TVPanel.tsx                # TV HLS direct
  DepartmentPanel.tsx        # Panneau département
  CommunePanel.tsx           # Panneau commune

lib/
  store.ts                  # Zustand : analyserInput, radarNewsItems
```

---

## Inspiration

InfoVerif s'inscrit dans la lignée de projets comme **[WorldMonitor](https://worldmonitor.app)**, qui cartographie les événements géopolitiques mondiaux en temps réel.

Là où WorldMonitor surveille les conflits, les crises diplomatiques et les dynamiques de pouvoir à l'échelle internationale, InfoVerif se concentre sur **la transparence de l'information en France** : actualités locales par département, discours politiques, candidats à la présidentielle 2027, et détection de désinformation dans les médias français.

Deux angles complémentaires, deux missions distinctes :

| | WorldMonitor | InfoVerif |
|---|---|---|
| **Focus** | Géopolitique mondiale | Actualités & politique française |
| **Utilisateurs** | Analystes, diplomates, journalistes internationaux | Citoyens français, journalistes locaux |
| **Objectif** | Cartographier les événements géopolitiques | Vérifier les discours, détecter la propagande |
| **Données** | Conflits, crises, mouvements géopolitiques | Médias locaux, élus, candidats 2027 |

---

## Soutenir le projet

InfoVerif est gratuit, open source, et maintenu bénévolement. Si l'outil vous est utile, vous pouvez nous soutenir via GitHub Sponsors :

[![❤️ Sponsor InfoVerif](https://img.shields.io/badge/Sponsor-❤️-red?logo=github&style=for-the-badge)](https://github.com/sponsors/soufianelemqariMain)

Chaque contribution aide à maintenir les serveurs, améliorer les fonctionnalités, et garder l'outil accessible à tous.

---

## Licence

MIT — voir [LICENSE](LICENSE).

---

<div align="center">

*Vérifier. Comprendre. Décider.*

**[→ infoverif.org](https://www.infoverif.org)**

</div>
