import { NextResponse } from "next/server";
import { DEPT_REGIONAL_PRESS } from "@/lib/regional-rss";

export const revalidate = 3600; // cache per-department for 1 hour

/**
 * Decode a Google News article URL to the actual publisher URL.
 * Works for old-format protobufs (pre-2023). Falls back to googleUrl for new format.
 */
function decodeGoogleNewsUrl(googleUrl: string): string {
  if (!googleUrl.includes("news.google.com")) return googleUrl;
  try {
    const parsed = new URL(googleUrl);
    const segments = parsed.pathname.split("/");
    const encoded = segments[segments.length - 1];
    if (!encoded || encoded.length < 10) return googleUrl;
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padding = (4 - (normalized.length % 4)) % 4;
    const buf = Buffer.from(normalized + "=".repeat(padding), "base64");
    const httpIdx = buf.indexOf(Buffer.from("http"));
    if (httpIdx < 0) return googleUrl;
    let end = httpIdx;
    while (end < buf.length && buf[end] >= 0x20 && buf[end] <= 0x7e) end++;
    const decoded = buf.slice(httpIdx, end).toString("utf-8");
    return decoded.startsWith("http") ? decoded : googleUrl;
  } catch {
    return googleUrl;
  }
}

export const runtime = "nodejs";

/**
 * Follow the Google News redirect using an RSS-reader User-Agent.
 * Google serves a 302 → real article URL for RSS reader clients.
 * Returns the resolved URL, or the original if resolution fails.
 */
async function resolveGoogleNewsRedirect(url: string): Promise<string> {
  if (!url.includes("news.google.com")) return url;
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RSS reader/1.0)" },
      signal: AbortSignal.timeout(5000),
    });
    if (res.url && !res.url.includes("news.google.com")) return res.url;
  } catch { /* ignore */ }
  return url;
}

/**
 * Publisher domain → RSS feed URL for major French outlets.
 * Fallback: reverse-lookup article URLs from Google News items via title matching.
 */
const PUBLISHER_RSS: Record<string, string> = {
  "lemonde.fr":        "https://www.lemonde.fr/rss/une.xml",
  "lefigaro.fr":       "https://www.lefigaro.fr/rss/figaro_actualites.xml",
  "leparisien.fr":     "https://feeds.leparisien.fr/leparisien/rss",
  "liberation.fr":     "https://www.liberation.fr/arc/outboundfeeds/rss/",
  "bfmtv.com":         "https://www.bfmtv.com/rss/info/flux-rss/flux-toutes-les-actualites/",
  "francetvinfo.fr":   "https://www.francetvinfo.fr/titres.rss",
  "20minutes.fr":      "https://www.20minutes.fr/feeds/rss/actu",
  "rfi.fr":            "https://www.rfi.fr/fr/rss",
  "france24.com":      "https://www.france24.com/fr/rss",
  "ouest-france.fr":   "https://www.ouest-france.fr/rss/une",
  "ladepeche.fr":      "https://www.ladepeche.fr/rss.xml",
  "midilibre.fr":      "https://www.midilibre.fr/rss.xml",
  "leprogres.fr":      "https://www.leprogres.fr/rss",
  "ledauphine.com":    "https://www.ledauphine.com/rss",
  "charentelibre.fr":  "https://www.charentelibre.fr/rss.xml",
  "varmatin.com":      "https://www.varmatin.com/rss.xml",
};

interface Article {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  description?: string;
  /** Publisher homepage URL extracted from <source url=""> (internal, used for resolution) */
  _publisherUrl?: string;
}

function extractTag(xml: string, tag: string): string {
  const open = `<${tag}`;
  const close = `</${tag}>`;
  const start = xml.indexOf(open);
  if (start === -1) return "";
  const contentStart = xml.indexOf(">", start);
  if (contentStart === -1) return "";
  const end = xml.indexOf(close, contentStart);
  if (end === -1) return "";
  let content = xml.slice(contentStart + 1, end).trim();
  if (content.startsWith("<![CDATA[") && content.endsWith("]]>")) {
    content = content.slice(9, -3).trim();
  }
  return content;
}

function parseRSS(xml: string, sourceName: string): Article[] {
  const items: Article[] = [];
  const itemOpen = "<item>";
  const itemClose = "</item>";
  let searchFrom = 0;
  while (items.length < 5) {
    const start = xml.indexOf(itemOpen, searchFrom);
    if (start === -1) break;
    const end = xml.indexOf(itemClose, start);
    if (end === -1) break;
    const item = xml.slice(start + itemOpen.length, end);
    searchFrom = end + itemClose.length;

    const rawTitle = extractTag(item, "title");
    const link = extractTag(item, "link") || extractTag(item, "guid");
    const pubDate = extractTag(item, "pubDate");
    const itemSource = extractTag(item, "source") || sourceName;
    const title = rawTitle.replace(/ - [^-]{2,40}$/, "").trim();

    // Extract publisher homepage URL from <source url="https://..."> attribute
    const sourceUrlMatch = item.match(/<source[^>]+url=["']([^"']+)["']/);
    const publisherUrl = sourceUrlMatch ? sourceUrlMatch[1] : undefined;

    // Extract plain-text description snippet (may be thin for gnews feeds)
    const rawDesc = extractTag(item, "description");
    const description = rawDesc
      ? rawDesc.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;|&#\d+;/g, " ").replace(/\s+/g, " ").trim().slice(0, 600) || undefined
      : undefined;

    if (title && link) {
      items.push({ title, url: link, source: itemSource, publishedAt: pubDate, description, _publisherUrl: publisherUrl });
    }
  }
  return items;
}

/**
 * Given a publisher homepage URL and article title, attempt to find the
 * actual article URL by fetching the publisher's RSS and matching titles.
 * Returns null if not found within 2.5s.
 */
async function resolveViaPublisherRss(publisherUrl: string, title: string): Promise<string | null> {
  try {
    const domain = new URL(publisherUrl).hostname.replace(/^www\./, "");
    const rssFeedUrl = PUBLISHER_RSS[domain];
    if (!rssFeedUrl) return null;

    const res = await fetch(rssFeedUrl, {
      signal: AbortSignal.timeout(2500),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; InfoVerif/1.0)" },
    });
    if (!res.ok) return null;
    const xml = await res.text();

    // Normalise title for fuzzy matching (ignore accents/punctuation)
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
    const normTitle = norm(title);
    const titleWords = normTitle.split(" ").filter((w) => w.length > 3);

    const articles = parseRSS(xml, "");
    for (const a of articles) {
      if (a.url.includes("news.google.com")) continue;
      const normArticleTitle = norm(a.title);
      const matches = titleWords.filter((w) => normArticleTitle.includes(w));
      if (titleWords.length > 0 && matches.length / titleWords.length >= 0.55) {
        return a.url;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const outlets = DEPT_REGIONAL_PRESS[code] ?? DEPT_REGIONAL_PRESS["default"] ?? [];

  if (outlets.length === 0) {
    return NextResponse.json({ articles: [], code });
  }

  for (const outlet of outlets) {
    try {
      const res = await fetch(outlet.rssUrl, {
        signal: AbortSignal.timeout(6000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; InfoVerif/1.0)" },
        redirect: "follow",
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const rawArticles = parseRSS(xml, outlet.name);
      if (rawArticles.length === 0) continue;

      // Step 1: proto-decode (instant, no network — works for old-format URLs)
      const decoded = rawArticles.map((a) => ({ ...a, url: decodeGoogleNewsUrl(a.url) }));

      // Step 2: RSS-reader redirect follow — Google returns 302 → real URL for this UA
      const redirectResolved = await Promise.all(
        decoded.map(async (a) => {
          if (!a.url.includes("news.google.com")) return a;
          const realUrl = await resolveGoogleNewsRedirect(a.url);
          return { ...a, url: realUrl };
        })
      );

      // Step 3: for any still on news.google.com, fall back to publisher RSS lookup
      const resolved = await Promise.all(
        redirectResolved.map(async (a) => {
          if (!a.url.includes("news.google.com") || !a._publisherUrl) return a;
          const realUrl = await resolveViaPublisherRss(a._publisherUrl, a.title);
          return realUrl ? { ...a, url: realUrl } : a;
        })
      );

      // Strip internal field before returning
      const articles = resolved.map(({ _publisherUrl: _, ...rest }) => rest);
      return NextResponse.json({ articles, source: outlet.name, code }, {
        headers: { "Cache-Control": "public, s-maxage=600" },
      });
    } catch {
      // Try next outlet
    }
  }
  return NextResponse.json({ articles: [], code });
}
