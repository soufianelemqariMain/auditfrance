import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 3600; // 1 hour cache

export interface PoliticianVideo {
  politician: string;
  party: string;
  color: string;
  videoTitle: string;
  videoUrl: string;
  publishedAt: string; // ISO date string YYYY-MM-DD
}

// Hardcoded verified channel IDs — bypasses fragile handle-to-ID page scraping
const CANDIDATES = [
  { name: "Marine Le Pen",      party: "RN",          color: "#003189", channelId: "UC_V06vsTq2GrhIhS3Ssp2jQ" },
  { name: "Jean-Luc Mélenchon", party: "LFI",         color: "#cc2529", channelId: "UCk-_PEY3iC6DIGJKuoEe9bw" },
  { name: "Jordan Bardella",    party: "RN",          color: "#003189", channelId: "UCTwPBaKeAGB2rcf8FjrELhw" },
  { name: "Édouard Philippe",   party: "Horizons",    color: "#0ea5e9", channelId: "UCoDttl6w1T-Stuw_pvNOvLA" },
  { name: "Gabriel Attal",      party: "Renaissance", color: "#f59e0b", channelId: "UCOcDPuYTuxoRBtfmTBXtqBA" },
  { name: "Éric Zemmour",       party: "Reconquête",  color: "#1e3a8a", channelId: "UC--TqtD8MCXEAoOBGH62sRw" },
  { name: "François Ruffin",    party: "Indép.",      color: "#dc2626", channelId: "UCIQGSp79vVch0vO3Efqif_w" },
  { name: "Raphaël Glucksmann", party: "PS",          color: "#e05c2d", channelId: "UCFkJQynKi4CrOUk6RUq680A" },
];

async function fetchLatestVideos(
  candidate: (typeof CANDIDATES)[0],
  maxVideos = 3
): Promise<PoliticianVideo[]> {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${candidate.channelId}`;
    const res = await fetch(rssUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(6000),
    });
    const xml = await res.text();

    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, maxVideos);
    const videos: PoliticianVideo[] = [];

    for (const [, entry] of entries) {
      const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
      const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
      if (!titleMatch || !videoIdMatch) continue;

      const rawTitle = titleMatch[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
      const videoId = videoIdMatch[1].trim();
      const publishedAt = publishedMatch
        ? publishedMatch[1].slice(0, 10)
        : new Date().toISOString().slice(0, 10);

      videos.push({
        politician: candidate.name,
        party: candidate.party,
        color: candidate.color,
        videoTitle: rawTitle,
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        publishedAt,
      });
    }

    return videos;
  } catch {
    return [];
  }
}

export async function GET() {
  const results = await Promise.all(CANDIDATES.map((c) => fetchLatestVideos(c, 3)));
  // Flatten, sort by date desc, return latest video per candidate (first in list)
  const videos = results.flatMap((list) => list.slice(0, 1));
  return NextResponse.json({ videos });
}
