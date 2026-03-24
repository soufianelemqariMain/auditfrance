import { NextResponse } from "next/server";
import { parseRssFeed } from "@/lib/rss-parser";

// Auth note: requires INFOVERIF_API_KEY to be a long-lived service token.
// The Infoverif engineer needs to enable X-Api-Key or service account Bearer auth on the backend.
// Until then, set INFOVERIF_API_KEY to a valid Clerk session token for manual testing.
const INFOVERIF_URL = "https://infoveriforg-production.up.railway.app";

const FEEDS = [
  { url: "https://www.bfmtv.com/rss/info/flux-rss/flux-toutes-les-actualites/", name: "BFM TV" },
  { url: "https://www.francetvinfo.fr/titres.rss", name: "France Info" },
  { url: "https://www.lemonde.fr/rss/une.xml", name: "Le Monde" },
  { url: "https://www.lefigaro.fr/rss/figaro_actualites.xml", name: "Le Figaro" },
  { url: "https://www.rfi.fr/fr/rss", name: "RFI" },
  { url: "https://www.france24.com/fr/rss", name: "France 24" },
];

const ARTICLES_PER_SOURCE = 2;
const CACHE_TTL = 30 * 60 * 1000; // 30 min

interface InfoverifTechnique {
  id: string;
  name: string;
  tactic: string;
  confidence: number;
  excerpt?: string;
}

interface InfoverifResult {
  id?: string;
  propaganda_score: number;
  conspiracy_score: number;
  misinfo_score: number;
  overall_influence: number;
  verdict_level: "low" | "medium" | "high" | "critical";
  techniques?: InfoverifTechnique[];
  summary?: string;
}

export interface ScoredArticle {
  id: string;
  source: string;
  title: string;
  url: string;
  publishedAt: string;
  propaganda_score: number;
  misinfo_score: number;
  overall_influence: number;
  verdict_level: string;
  techniques: string[];
  summary?: string;
}

export interface SourceScore {
  name: string;
  articlesAnalyzed: number;
  avgInfluence: number;
  avgPropaganda: number;
  avgMisinfo: number;
  maxVerdictLevel: string;
}

interface CacheData {
  articles: ScoredArticle[];
  sources: SourceScore[];
  fetchedAt: string;
  total: number;
}

let cache: { data: CacheData; ts: number } | null = null;

async function analyzeUrl(url: string, apiKey: string): Promise<InfoverifResult | null> {
  try {
    const res = await fetch(`${INFOVERIF_URL}/analyze-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ url, platform: "web" }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return await res.json() as InfoverifResult;
  } catch {
    return null;
  }
}

const VERDICT_ORDER: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 };

export async function GET(): Promise<NextResponse> {
  const apiKey = process.env.INFOVERIF_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ configured: false, articles: [], sources: [], total: 0, fetchedAt: new Date().toISOString() });
  }

  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json({ configured: true, ...cache.data });
  }

  // Fetch RSS feeds
  const feedResults = await Promise.allSettled(
    FEEDS.map((f) => parseRssFeed(f.url, f.name))
  );

  // Pick top N articles per source
  const articlesToScore: { id: string; source: string; title: string; url: string; publishedAt: string }[] = [];
  for (const result of feedResults) {
    if (result.status === "fulfilled") {
      articlesToScore.push(...result.value.slice(0, ARTICLES_PER_SOURCE));
    }
  }

  // Analyze in parallel (capped at 12 total)
  const scored = await Promise.allSettled(
    articlesToScore.slice(0, 12).map(async (article) => {
      if (!article.url) return null;
      const infoverif = await analyzeUrl(article.url, apiKey);
      if (!infoverif) return null;
      const scored: ScoredArticle = {
        ...article,
        propaganda_score: infoverif.propaganda_score ?? 0,
        misinfo_score: infoverif.misinfo_score ?? 0,
        overall_influence: infoverif.overall_influence ?? 0,
        verdict_level: infoverif.verdict_level ?? "low",
        techniques: (infoverif.techniques ?? []).slice(0, 3).map((t) => t.name),
        summary: infoverif.summary,
      };
      return scored;
    })
  );

  const articles: ScoredArticle[] = scored
    .filter((r): r is PromiseFulfilledResult<ScoredArticle | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((a): a is ScoredArticle => a !== null)
    .sort((a, b) => b.overall_influence - a.overall_influence);

  // Aggregate per source
  const bySource: Record<string, ScoredArticle[]> = {};
  for (const a of articles) {
    bySource[a.source] = bySource[a.source] ?? [];
    bySource[a.source].push(a);
  }

  const sources: SourceScore[] = Object.entries(bySource).map(([name, arts]) => {
    const n = arts.length;
    const maxVerdict = arts.reduce((max, a) =>
      (VERDICT_ORDER[a.verdict_level] ?? 0) > (VERDICT_ORDER[max] ?? 0) ? a.verdict_level : max,
      "low"
    );
    return {
      name,
      articlesAnalyzed: n,
      avgInfluence: arts.reduce((s, a) => s + a.overall_influence, 0) / n,
      avgPropaganda: arts.reduce((s, a) => s + a.propaganda_score, 0) / n,
      avgMisinfo: arts.reduce((s, a) => s + a.misinfo_score, 0) / n,
      maxVerdictLevel: maxVerdict,
    };
  }).sort((a, b) => b.avgInfluence - a.avgInfluence);

  const data: CacheData = {
    articles,
    sources,
    fetchedAt: new Date().toISOString(),
    total: articles.length,
  };

  cache = { data, ts: Date.now() };
  return NextResponse.json({ configured: true, ...data });
}
