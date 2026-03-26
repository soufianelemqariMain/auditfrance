import { NextResponse } from "next/server";
import { DEPT_REGIONAL_PRESS } from "@/lib/regional-rss";

/**
 * Decode a Google News article URL to the actual publisher URL.
 * Google News RSS links are base64-encoded protobufs containing the real URL.
 * This avoids network round-trips (Google blocks server-side redirects).
 */
function decodeGoogleNewsUrl(googleUrl: string): string {
  if (!googleUrl.includes("news.google.com")) return googleUrl;
  try {
    const parsed = new URL(googleUrl);
    const segments = parsed.pathname.split("/");
    const encoded = segments[segments.length - 1];
    if (!encoded || encoded.length < 10) return googleUrl;

    // Google News uses standard base64 with URL-safe chars; pad as needed
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padding = (4 - (normalized.length % 4)) % 4;
    const buf = Buffer.from(normalized + "=".repeat(padding), "base64");

    // Find first occurrence of "http" in the decoded bytes
    const httpIdx = buf.indexOf(Buffer.from("http"));
    if (httpIdx < 0) return googleUrl;

    // Extract until first non-printable/non-URL byte
    let end = httpIdx;
    while (end < buf.length && buf[end] >= 0x20 && buf[end] <= 0x7e) end++;

    const decoded = buf.slice(httpIdx, end).toString("utf-8");
    return decoded.startsWith("http") ? decoded : googleUrl;
  } catch {
    return googleUrl;
  }
}

export const runtime = "nodejs";

interface Article {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
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
  // Strip CDATA wrapper
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
    // <source> tag inside item holds the actual outlet (Google News, etc.)
    const itemSource = extractTag(item, "source") || sourceName;
    // Strip " - Outlet Name" suffix that Google News appends to titles
    const title = rawTitle.replace(/ - [^-]{2,40}$/, "").trim();
    if (title && link) {
      items.push({ title, url: link, source: itemSource, publishedAt: pubDate });
    }
  }
  return items;
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

  // Try each outlet in order, return first with articles
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
      if (rawArticles.length > 0) {
        // Decode Google News encoded URLs to actual publisher article URLs
        const articles = rawArticles.map((a) => ({ ...a, url: decodeGoogleNewsUrl(a.url) }));
        return NextResponse.json({ articles, source: outlet.name, code }, {
          headers: { "Cache-Control": "public, s-maxage=600" },
        });
      }
    } catch {
      // Try next outlet
    }
  }
  return NextResponse.json({ articles: [], code });
}
