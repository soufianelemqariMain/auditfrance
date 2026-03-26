async function resolveGoogleUrl(url: string): Promise<string> {
  if (!url.includes("news.google.com")) return url;
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(3000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; InfoVerif/1.0)" },
    });
    return res.url && res.url !== url ? res.url : url;
  } catch {
    return url;
  }
}

export interface RssItem {
  id: string;
  source: string;
  title: string;
  url: string;
  publishedAt: string;
}

/**
 * Extracts the text content of the first occurrence of an XML tag.
 * Handles both <tag>content</tag> and CDATA sections.
 */
function extractTag(xml: string, tag: string): string {
  const openTag = `<${tag}`;
  const closeTag = `</${tag}>`;

  const start = xml.indexOf(openTag);
  if (start === -1) return "";

  const contentStart = xml.indexOf(">", start);
  if (contentStart === -1) return "";

  const end = xml.indexOf(closeTag, contentStart);
  if (end === -1) return "";

  let content = xml.slice(contentStart + 1, end).trim();

  // Strip CDATA wrapper if present
  if (content.startsWith("<![CDATA[") && content.endsWith("]]>")) {
    content = content.slice(9, -3).trim();
  }

  return content;
}

/**
 * Splits the XML string into individual <item> blocks.
 */
function extractItems(xml: string): string[] {
  const items: string[] = [];
  let cursor = 0;

  while (cursor < xml.length) {
    const start = xml.indexOf("<item", cursor);
    if (start === -1) break;

    const end = xml.indexOf("</item>", start);
    if (end === -1) break;

    items.push(xml.slice(start, end + "</item>".length));
    cursor = end + "</item>".length;
  }

  return items;
}

/**
 * Generates a stable short ID from a URL + title string using Node's Buffer.
 */
function makeId(url: string, title: string): string {
  const raw = `${url}|${title}`;
  return Buffer.from(raw).toString("base64").replace(/[^A-Za-z0-9]/g, "").slice(0, 16);
}

/**
 * Fetches an RSS feed and returns up to 10 parsed items.
 * Runs server-side only (uses Node fetch + Buffer).
 * Returns [] on any error.
 */
export async function parseRssFeed(
  url: string,
  sourceName: string
): Promise<RssItem[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "FranceMonitor/1.0 RSS Reader",
          Accept: "application/rss+xml, application/xml, text/xml, */*",
        },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      console.warn(`[rss-parser] HTTP ${response.status} for ${url}`);
      return [];
    }

    const xml = await response.text();
    const rawItems = extractItems(xml);

    const results: RssItem[] = [];

    for (const itemXml of rawItems.slice(0, 10)) {
      const title = extractTag(itemXml, "title") || "(sans titre)";

      // <link> in RSS 2.0 can be a text node or an Atom-style self-closing tag;
      // try <link> text node first, then fall back to href attribute.
      let link = extractTag(itemXml, "link");
      if (!link) {
        const hrefMatch = itemXml.match(/href=["']([^"']+)["']/);
        link = hrefMatch ? hrefMatch[1] : "";
      }

      const pubDate = extractTag(itemXml, "pubDate") || new Date().toUTCString();

      // Normalise pubDate to ISO 8601
      let publishedAt: string;
      try {
        publishedAt = new Date(pubDate).toISOString();
      } catch {
        publishedAt = new Date().toISOString();
      }

      results.push({
        id: makeId(link || url, title),
        source: sourceName,
        title,
        url: await resolveGoogleUrl(link),
        publishedAt,
      });
    }

    return results;
  } catch (err) {
    console.warn(`[rss-parser] Failed to fetch or parse ${url}:`, err);
    return [];
  }
}
