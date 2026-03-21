<div align="center">

# Audit France

**Real-time intelligence dashboard for French public finances, procurement, and civic data**

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Deploy with Vercel](https://img.shields.io/badge/deploy-Vercel-black?logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/soufianelemqariMain/auditfrance)
[![Open Source](https://img.shields.io/badge/open%20source-%E2%9D%A4-red)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Live Demo](https://auditfrance.vercel.app) · [Report a Bug](https://github.com/soufianelemqariMain/auditfrance/issues) · [Request a Feature](https://github.com/soufianelemqariMain/auditfrance/issues)

</div>

---

## What is Audit France?

Audit France is an open-source intelligence dashboard that aggregates French public data into a single, real-time operator interface. Click any department on the map to instantly access:

- Who your elected officials are and their parliamentary activity scores
- Every public contract over €25,000 awarded in your department (live from DECP)
- Active procurement tenders still accepting bids (live from BOAMP)
- Open grant programs and subsidies available in your territory
- Local budget estimates based on official OFGL data

The national audit view covers the full picture: the PLF 2025 budget breakdown by ministry, the top 100 companies receiving public contracts, and a live feed of all ongoing procurement across France.

---

## Features

### Live Map Dashboard

| Panel | Source | Description |
|---|---|---|
| France map | GeoJSON | Click any of the 101 departments to open its intelligence panel |
| News feed | BFM, France Info, Le Monde, Le Figaro, RFI, France 24 | Live headlines, refreshed every 5 minutes |
| AI Brief | Mistral API | Daily intelligence brief synthesized from live news |
| CAC 40 | Yahoo Finance proxy | Live French stock market index |
| Parlement | AN + Sénat RSS | Latest parliamentary work from both chambers |

### Department Intelligence Panel

When you click a department on the map, you get 6 tabs:

| Tab | What it shows |
|---|---|
| **Aperçu** | Population, area, density, prefecture, regional links |
| **Élus** | Président du Conseil Régional + all deputies with activity scores |
| **Marchés att.** | Awarded public contracts >€25k — live from DECP |
| **AO ouverts** | Active tender notices still accepting bids — live from BOAMP |
| **Subventions** | Open grant programs available — live from aides-territoires.beta.gouv.fr |
| **Budget** | Departmental budget estimates (OFGL ratios) with official source links |

### National Audit Page (`/audit`)

Four tabs with full national visibility:

| Tab | Source | Description |
|---|---|---|
| **Budget PLF** | budget.gouv.fr | PLF 2025 breakdown by ministry |
| **Marchés attribués** | DECP | Top companies by public contract volume |
| **Marchés ouverts** | BOAMP | All active tender notices, filterable by dept |
| **Subventions** | data-subventions.beta.gouv.fr + aides-territoires | Awarded subsidies + open grant programs |

---

## Data Sources

All data is fetched live from official French government open data APIs — no database, no scraping.

| Data | API | Update frequency |
|---|---|---|
| Awarded contracts | [DECP v3 — data.economie.gouv.fr](https://data.economie.gouv.fr) | 15 min cache |
| Open tenders | [BOAMP — boamp-datadila.opendatasoft.com](https://boamp-datadila.opendatasoft.com) | 15 min cache |
| State subsidies | [data-subventions.beta.gouv.fr](https://data-subventions.beta.gouv.fr) | 20 min cache |
| Open grant programs | [aides-territoires.beta.gouv.fr](https://aides-territoires.beta.gouv.fr) | 20 min cache |
| Deputies activity | [nosdeputes.fr](https://www.nosdeputes.fr) | 1 hour cache |
| News | RSS (BFM, Le Monde, France Info, Le Figaro, RFI, France 24) | 5 min |
| AI brief | [Mistral API](https://mistral.ai) | On demand |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A free [Mistral API key](https://console.mistral.ai) (optional — enables the AI brief panel)

### Local setup

```bash
git clone https://github.com/soufianelemqariMain/auditfrance.git
cd auditfrance
npm install
```

Create `.env.local`:

```env
MISTRAL_API_KEY=your_key_here   # optional
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/soufianelemqariMain/auditfrance)

After deploying, add `MISTRAL_API_KEY` in your Vercel project's environment variables to enable the AI brief.

---

## Tech Stack

- **[Next.js 16](https://nextjs.org)** — App Router, server-side API routes
- **[React 19](https://react.dev)** — UI
- **[TypeScript](https://www.typescriptlang.org)** — type-safe throughout
- **[MapLibre GL](https://maplibre.org)** — interactive map
- **[Zustand](https://zustand-demo.pmnd.rs)** — client state
- **[Tailwind CSS](https://tailwindcss.com)** — utility styles

---

## Contributing

Contributions are very welcome. This project is designed to be easy to extend — each panel and API route is isolated.

**Good first issues:**
- Add a new data source to the department panel
- Improve the deputy activity scoring algorithm
- Add a regional news feed filtered by department
- Add a dark/light theme toggle
- Improve mobile responsiveness

**To contribute:**

1. Fork the repo
2. Create a branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Push: `git push origin feature/my-feature`
5. Open a pull request

Please keep PRs focused — one feature per PR. Follow the existing code style (TypeScript, inline styles matching the CSS variable system).

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
Built with public data, for the public interest.
</div>
