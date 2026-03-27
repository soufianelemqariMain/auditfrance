import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 1800; // 30 min cache

export interface PoliticianVideo {
  politician: string;
  party: string;
  color: string;
  videoTitle: string;
  videoUrl: string;
  publishedAt: string;
  isToday: boolean;
}

const CANDIDATES = [
  { name: "Marine Le Pen",        party: "RN",          color: "#003189", handle: "MarineLePen" },
  { name: "Jean-Luc Mélenchon",   party: "LFI",         color: "#cc2529", handle: "JLMelenchon" },
  { name: "Jordan Bardella",      party: "RN",          color: "#003189", handle: "JordanBardella" },
  { name: "Édouard Philippe",     party: "Horizons",    color: "#0ea5e9", handle: "EdouardPhilippe" },
  { name: "Gabriel Attal",        party: "Renaissance", color: "#f59e0b", handle: "GabrielAttal" },
  { name: "Éric Zemmour",         party: "Reconquête",  color: "#1e3a8a", handle: "EricZemmour" },
  { name: "François Ruffin",      party: "Indép.",      color: "#dc2626", handle: "FrancoisRuffin" },
  { name: "Raphaël Glucksmann",   party: "PS",          color: "#e05c2d", handle: "RaphaelGlucksmann" },
];

async function getChannelIdFromHandle(handle: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.youtube.com/@${handle}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    // Extract channelId from page data
    const m = html.match(/"channelId":"(UC[A-Za-z0-9_-]{22})"/);
    if (m) return m[1];
    // Fallback: look for externalId in page
    const m2 = html.match(/"externalId":"(UC[A-Za-z0-9_-]{22})"/);
    if (m2) return m2[1];
    return null;
  } catch {
    return null;
  }
}

async function fetchLatestVideo(
  candidate: (typeof CANDIDATES)[0]
): Promise<PoliticianVideo | null> {
  try {
    const channelId = await getChannelIdFromHandle(candidate.handle);
    if (!channelId) return null;

    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const rssRes = await fetch(rssUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(6000),
    });
    const xml = await rssRes.text();

    const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/);
    if (!entryMatch) return null;
    const entry = entryMatch[1];

    const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
    const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);

    if (!titleMatch || !videoIdMatch) return null;

    const rawTitle = titleMatch[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
    const videoId = videoIdMatch[1].trim();
    const today = new Date().toISOString().slice(0, 10);
    const publishedAt = publishedMatch
      ? publishedMatch[1].slice(0, 10)
      : today;

    return {
      politician: candidate.name,
      party: candidate.party,
      color: candidate.color,
      videoTitle: rawTitle,
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      publishedAt,
      isToday: publishedAt === today,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const results = await Promise.all(CANDIDATES.map(fetchLatestVideo));
  const videos = results.filter((v): v is PoliticianVideo => v !== null);
  return NextResponse.json({ videos });
}
