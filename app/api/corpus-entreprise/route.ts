import { NextResponse } from "next/server";

export const runtime = "nodejs";
// Cache for 30 minutes — live data, refreshed periodically
export const revalidate = 1800;

interface CorpStatement {
  company: string;
  sector: string;
  color: string;
  date: string;
  claim: string;
  sourceUrl: string;
  sourceOutlet: string;
  sourceOutletDomain: string;
}

const COMPANIES: Array<{ name: string; sector: string; color: string; query: string }> = [
  { name: "TotalEnergies", sector: "Énergie",      color: "#f97316", query: "TotalEnergies annonce OR déclare OR résultats" },
  { name: "LVMH",          sector: "Luxe",          color: "#a78bfa", query: "LVMH annonce OR résultats OR stratégie" },
  { name: "BNP Paribas",   sector: "Finance",       color: "#22c55e", query: "BNP Paribas annonce OR résultats OR bilan" },
  { name: "Sanofi",        sector: "Santé",         color: "#8b5cf6", query: "Sanofi annonce OR essai clinique OR résultats" },
  { name: "Renault",       sector: "Automobile",    color: "#eab308", query: "Renault annonce OR électrique OR résultats" },
  { name: "Orange",        sector: "Télécoms",      color: "#ef4444", query: "Orange France annonce OR réseau 5G" },
  { name: "Carrefour",     sector: "Distribution",  color: "#3b82f6", query: "Carrefour annonce OR prix OR bilan" },
  { name: "Engie",         sector: "Énergie",       color: "#06b6d4", query: "Engie annonce OR renouvelable OR résultats" },
];

function parseRSSDate(rssDate: string): string {
  try {
    const d = new Date(rssDate);
    return d.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function cleanTitle(title: string): string {
  // Strip CDATA markers and leading/trailing whitespace
  return title.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

async function fetchCompanyStatement(
  company: typeof COMPANIES[0]
): Promise<CorpStatement | null> {
  try {
    const q = encodeURIComponent(company.query);
    const url = `https://news.google.com/rss/search?q=${q}&hl=fr&gl=FR&ceid=FR:fr`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(6000),
    });
    const xml = await res.text();

    // Extract first <item>
    const itemMatch = xml.match(/<item>([\s\S]*?)<\/item>/);
    if (!itemMatch) return null;
    const item = itemMatch[1];

    const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = item.match(/<link>(https:\/\/[^<]+)<\/link>/);
    const sourceMatch = item.match(/<source[^>]*url="([^"]+)"[^>]*>([^<]+)</);
    const dateMatch = item.match(/<pubDate>([^<]+)<\/pubDate>/);

    if (!titleMatch || !linkMatch) return null;

    const rawTitle = cleanTitle(titleMatch[1]);
    // Strip " - OutletName" suffix from title if present
    const claim = rawTitle.replace(/\s+[-–]\s+[^-–]+$/, "").trim() || rawTitle;

    return {
      company: company.name,
      sector: company.sector,
      color: company.color,
      date: dateMatch ? parseRSSDate(dateMatch[1]) : new Date().toISOString().slice(0, 10),
      claim,
      sourceUrl: linkMatch[1],
      sourceOutlet: sourceMatch ? sourceMatch[2].trim() : "Presse",
      sourceOutletDomain: sourceMatch ? sourceMatch[1] : "",
    };
  } catch {
    return null;
  }
}

const STATIC_STATEMENTS: CorpStatement[] = [
  { company: "TotalEnergies", sector: "Énergie", color: "#f97316", date: "2026-03", claim: "TotalEnergies affirme être en bonne voie pour atteindre la neutralité carbone en 2050, avec une réduction de 40% de ses émissions opérationnelles depuis 2015.", sourceUrl: "https://totalenergies.com", sourceOutlet: "TotalEnergies", sourceOutletDomain: "https://totalenergies.com" },
  { company: "LVMH", sector: "Luxe", color: "#a78bfa", date: "2026-03", claim: "LVMH déclare que 90% de ses matières premières stratégiques sont sourcées de manière responsable et traçable.", sourceUrl: "https://www.lvmh.fr", sourceOutlet: "LVMH", sourceOutletDomain: "https://www.lvmh.fr" },
  { company: "BNP Paribas", sector: "Finance", color: "#22c55e", date: "2026-02", claim: "BNP Paribas déclare avoir réduit de 50% son exposition aux énergies fossiles non conventionnelles depuis 2017.", sourceUrl: "https://group.bnpparibas", sourceOutlet: "BNP Paribas", sourceOutletDomain: "https://group.bnpparibas" },
];

export async function GET() {
  const results = await Promise.all(COMPANIES.map(fetchCompanyStatement));
  const statements = results.filter((s): s is CorpStatement => s !== null);

  if (statements.length < 2) {
    return NextResponse.json({ statements: STATIC_STATEMENTS, source: "static" });
  }

  return NextResponse.json({ statements, source: "live" });
}
