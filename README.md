# France Monitor

A real-time intelligence dashboard for France — public finances, procurement, open RFPs, subsidies, elected officials, and live news — built with Next.js 16 and React 19.

## What it does

### Live Dashboard (`/`)

An operator-style map interface with panels:

- **France map** — click any department to open a detail panel
- **Department panel** — population, elected officials (deputies, conseil régional president), live DECP public contracts, budget estimates
- **News feed** — live headlines from BFM TV, France Info, Le Monde, Le Figaro, RFI, France 24 (refreshes every 5 min)
- **AI Brief** — Mistral-powered daily intelligence brief synthesized from live headlines (requires `MISTRAL_API_KEY`)
- **CAC 40 panel** — stock ticker
- **Vigipirate badge** — current security alert level
- **TV / Webcam panels** — live French broadcast and public webcams

### Audit Page (`/audit`)

Four tabs giving full visibility into French public spending:

| Tab | Source | What it shows |
|---|---|---|
| **Budget PLF** | budget.gouv.fr | National budget breakdown by ministry — PLF 2025 |
| **Marchés attribués** | DECP (data.economie.gouv.fr) | Awarded public contracts >25 000€, aggregated by company with sector classification |
| **Marchés ouverts** | BOAMP (boamp-datadila.opendatasoft.com) | Active tenders still accepting bids — filter by keyword or department |
| **Subventions** | data-subventions.beta.gouv.fr + aides-territoires.beta.gouv.fr | Awarded state subsidies and currently open grant programs |

## Data sources

| Data | API |
|---|---|
| Public contracts (awarded) | `data.economie.gouv.fr` — DECP v3 marchés validés |
| Open tenders | `boamp-datadila.opendatasoft.com` — BOAMP dataset |
| State subsidies | `api.data-subventions.beta.gouv.fr` |
| Open grant programs | `aides-territoires.beta.gouv.fr` |
| Deputies | `nosdeputes.fr` |
| News | RSS feeds (BFM, France Info, Le Monde, Le Figaro, RFI, France 24) |
| AI brief | Mistral API (`mistral-small-latest`) |

All DECP and BOAMP calls go through server-side Next.js routes with in-memory caching (15–30 min TTL) to avoid hitting public API rate limits from the browser.

## Setup

```bash
cd apps/francemonitor
npm install
```

Create `.env.local`:

```env
MISTRAL_API_KEY=your_key_here
```

Run locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

Hosted on Vercel. Add `MISTRAL_API_KEY` in the Vercel project environment variables to enable the AI brief panel.

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript**
- **Zustand** for client state
- **Tailwind CSS** (utility classes)
- No database — all data fetched live from public French government APIs
