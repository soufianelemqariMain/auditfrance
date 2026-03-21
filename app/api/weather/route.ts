import { NextResponse } from "next/server";

// Météo-France publishes departmental vigilance XML — no API key required
// https://vigilance.meteofrance.fr/data/frcgrd20.xml
// Vig levels: 1=vert, 2=jaune, 3=orange, 4=rouge

const VIGILANCE_URL = "https://vigilance.meteofrance.fr/data/frcgrd20.xml";

interface DeptVigilance {
  dept: string;      // "01", "75", etc.
  level: number;     // 1–4
  color: string;     // "vert" | "jaune" | "orange" | "rouge"
  phenomenon?: string;
}

interface CacheEntry { alerts: DeptVigilance[]; fetchedAt: number }
let cache: CacheEntry | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 min

const LEVEL_COLOR: Record<number, string> = {
  1: "vert",
  2: "jaune",
  3: "orange",
  4: "rouge",
};

function parseVigilanceXml(xml: string): DeptVigilance[] {
  const alerts: DeptVigilance[] = [];
  // Match patterns like: val="01" vig="2" or val="75" vig="3"
  const re = /val="(\d+[AB]?)"\s+[^>]*vig="(\d+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const dept = m[1].padStart(2, "0");
    const level = parseInt(m[2], 10);
    if (level >= 2) {
      // Only surface yellow+ vigilance
      alerts.push({
        dept,
        level,
        color: LEVEL_COLOR[level] ?? "vert",
      });
    }
  }
  return alerts;
}

async function fetchVigilance(): Promise<DeptVigilance[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) return cache.alerts;

  try {
    const res = await fetch(VIGILANCE_URL, {
      headers: { "User-Agent": "AuditFrance/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const alerts = parseVigilanceXml(xml);
    cache = { alerts, fetchedAt: Date.now() };
    return alerts;
  } catch {
    // Fallback: return empty — UI will handle gracefully
    if (cache) return cache.alerts; // stale cache is better than nothing
    return [];
  }
}

export async function GET() {
  const alerts = await fetchVigilance();
  return NextResponse.json({
    alerts,
    source: "Météo-France vigilance météorologique",
    url: "https://vigilance.meteofrance.fr/",
    fetchedAt: new Date().toISOString(),
  });
}
