import { parseRssFeed, RssItem } from "@/lib/rss-parser";

export const revalidate = 1800; // 30 min cache

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

const FEEDS: { url: string; name: string }[] = [
  {
    url: "https://www.bfmtv.com/rss/info/flux-rss/flux-toutes-les-actualites/",
    name: "BFM TV",
  },
  {
    url: "https://www.francetvinfo.fr/titres.rss",
    name: "France Info",
  },
  {
    url: "https://www.lemonde.fr/rss/une.xml",
    name: "Le Monde",
  },
  {
    url: "https://www.lefigaro.fr/rss/figaro_actualites.xml",
    name: "Le Figaro",
  },
  {
    url: "https://www.rfi.fr/fr/rss",
    name: "RFI",
  },
  {
    url: "https://www.france24.com/fr/rss",
    name: "France 24",
  },
];

export async function GET(_request: Request): Promise<Response> {
  const results = await Promise.allSettled(
    FEEDS.map((feed) => parseRssFeed(feed.url, feed.name))
  );

  const allItems: RssItem[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      allItems.push(...result.value);
    }
  }

  // Sort by publishedAt descending, take first 60
  allItems.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const items = allItems.slice(0, 60);

  return new Response(
    JSON.stringify({
      items,
      total: items.length,
      fetchedAt: new Date().toISOString(),
    }),
    { status: 200, headers: CORS_HEADERS }
  );
}
