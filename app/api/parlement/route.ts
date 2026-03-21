import { NextResponse } from "next/server";
import { parseRssFeed, RssItem } from "@/lib/rss-parser";

// Assemblée Nationale & Sénat RSS feeds for current parliamentary work
const AN_FEEDS = [
  { url: "https://www.assemblee-nationale.fr/dyn/rss/actualites.rss", name: "Assemblée Nationale" },
  { url: "https://www.assemblee-nationale.fr/dyn/rss/textes-adoptes.rss", name: "AN — Textes adoptés" },
  { url: "https://www.assemblee-nationale.fr/rss/articles.rss", name: "AN — Articles" },
];

const SENAT_FEEDS = [
  { url: "https://www.senat.fr/rss/travaux-senat.rss", name: "Sénat" },
  { url: "https://www.senat.fr/flux-rss/rss-travaux-senat.rss", name: "Sénat — Travaux" },
  { url: "https://www.senat.fr/rss/seances.rss", name: "Sénat — Séances" },
];

interface CacheEntry { items: ParlItem[]; fetchedAt: number }
let cache: CacheEntry | null = null;
const CACHE_TTL = 20 * 60 * 1000; // 20 min

export interface ParlItem extends RssItem {
  chamber: "AN" | "Sénat";
}

async function fetchParlement(): Promise<ParlItem[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) return cache.items;

  // Try all feeds concurrently, use whichever return results
  const allFeeds = [
    ...AN_FEEDS.map((f) => ({ ...f, chamber: "AN" as const })),
    ...SENAT_FEEDS.map((f) => ({ ...f, chamber: "Sénat" as const })),
  ];

  const results = await Promise.allSettled(
    allFeeds.map((f) => parseRssFeed(f.url, f.name).then((items) =>
      items.map((item) => ({ ...item, chamber: f.chamber } as ParlItem))
    ))
  );

  const items: ParlItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") items.push(...r.value);
  }

  // Deduplicate by title prefix, sort newest first
  const seen = new Set<string>();
  const deduped = items.filter((it) => {
    const key = it.title.slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduped.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const final = deduped.slice(0, 40);
  cache = { items: final, fetchedAt: Date.now() };
  return final;
}

export async function GET() {
  try {
    const items = await fetchParlement();
    return NextResponse.json({
      items,
      total: items.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err instanceof Error ? err.message : err), items: [] },
      { status: 500 }
    );
  }
}
