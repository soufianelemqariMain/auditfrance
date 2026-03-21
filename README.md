<div align="center">

# Audit France

**A real-time civic intelligence dashboard for democratic checks and balances**

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Deploy with Vercel](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/soufianelemqariMain/auditfrance)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/soufianelemqariMain/auditfrance/issues)

[Live demo](https://auditfrance.vercel.app) · [Report a bug](https://github.com/soufianelemqariMain/auditfrance/issues) · [Request a feature](https://github.com/soufianelemqariMain/auditfrance/issues)

</div>

---

## What this is

A mission control for French democracy. One screen. Everything that matters.

Inspired by [worldmonitor.app](https://worldmonitor.app) — massive kudos for the concept. They applied it to Polymarket predictions. We applied it to something that actually affects people's lives: **who holds power, who spends public money, and whether they're doing their job**.

Big respect to the French open data ecosystem — the agents from data.gouv.fr, BOAMP, nosdeputes.fr, DECP, OFGL — who made it possible to build something like this without a single proprietary database or data deal. The state publishing its own receipts. That's the move.

---

## What it does

### Interactive national map

Click any of France's 101 departments. Get the full picture instantly:

| Tab | What's inside |
|---|---|
| **Aperçu** | Population, area, density, prefecture — the basics |
| **Élus** | Regional council president + all deputies with live activity scores |
| **Appels d'offres** | Active public procurement tenders — live from BOAMP |
| **Budget** | Departmental spending breakdown (OFGL ratios) |

### Live bottom bar

| Panel | Source | Refresh |
|---|---|---|
| News feed | BFM, France Info, Le Monde, Le Figaro, RFI, France 24 | 5 min |
| Live TV | France 24, BFM TV, CNews, LCP | Stream |
| Sous-actifs | nosdeputes.fr synthese | 1 hour |
| AO ouverts | BOAMP OpenDataSoft | 15 min |
| CAC 40 | Yahoo Finance (~40 companies) | 60 sec |

### National audit page (`/audit`)

| Tab | Source | Content |
|---|---|---|
| **Budget PLF** | budget.gouv.fr | PLF 2025 by ministry |
| **Marchés attribués** | DECP | Top contractors by public procurement volume |
| **Marchés ouverts** | BOAMP | All active tenders, filterable by department |
| **Subventions** | data-subventions.beta.gouv.fr | Grants awarded + open funding programs |

---

## Data sources

All data is pulled live from official French government APIs. No private database. No scraping. No bullshit.

| Data | API | Cache |
|---|---|---|
| Awarded contracts | [DECP v3 — data.economie.gouv.fr](https://data.economie.gouv.fr) | 15 min |
| Open tenders | [BOAMP — boamp-datadila.opendatasoft.com](https://boamp-datadila.opendatasoft.com) | 15 min |
| State grants | [data-subventions.beta.gouv.fr](https://data-subventions.beta.gouv.fr) | 20 min |
| Funding programs | [aides-territoires.beta.gouv.fr](https://aides-territoires.beta.gouv.fr) | 20 min |
| Deputy activity | [nosdeputes.fr](https://www.nosdeputes.fr) | 1 hour |
| News | RSS (BFM, Le Monde, France Info, Le Figaro, RFI, France 24) | 5 min |
| Stocks | Yahoo Finance | 60 sec |

---

## Stack

- **[Next.js 16](https://nextjs.org)** — App Router, server API routes
- **[React 19](https://react.dev)** — UI
- **[TypeScript](https://www.typescriptlang.org)** — end-to-end types
- **[MapLibre GL](https://maplibre.org)** — interactive map
- **[Zustand](https://zustand-demo.pmnd.rs)** — client state
- **[Tailwind CSS](https://tailwindcss.com)** — utility styles

---

## Run locally

```bash
git clone https://github.com/soufianelemqariMain/auditfrance.git
cd auditfrance
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). No API keys required to get something running.

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/soufianelemqariMain/auditfrance)

---

## Contribute

Open source contributions are welcome and encouraged.

The architecture is deliberately modular — every panel and every API route is isolated. Adding a new data source is usually a single file. No global state, no framework magic to fight.

**Good first issues:**
- Add a new data source to the department panel
- Improve the deputy activity scoring algorithm
- Add a regional news feed filtered by department
- Mobile responsiveness
- More market data sources (beyond BOAMP)
- Dark/light theme toggle

**To contribute:**

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-thing`
3. Make your changes
4. Push: `git push origin feature/your-thing`
5. Open a PR

One feature per PR. Follow the existing style (TypeScript, inline styles with CSS variables). If you're touching a data source, document what you're fetching and why.

---

## License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

Built on public data, for the public interest.<br>
Because transparency isn't a feature — it's the whole point.

</div>
