import { NextResponse } from "next/server";
import { DEPT_REGIONAL_PRESS } from "@/lib/regional-rss";

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

    const title = extractTag(item, "title");
    const link = extractTag(item, "link") || extractTag(item, "guid");
    const pubDate = extractTag(item, "pubDate");
    if (title && link) {
      items.push({ title, url: link, source: sourceName, publishedAt: pubDate });
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
      const articles = parseRSS(xml, outlet.name);
      if (articles.length > 0) {
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
