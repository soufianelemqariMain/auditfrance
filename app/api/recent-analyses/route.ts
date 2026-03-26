import { NextResponse } from "next/server";

export const revalidate = 30; // cache 30s

const INFOVERIF_URL =
  process.env.INFOVERIF_BACKEND_URL ?? "https://infoveriforg-production.up.railway.app";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(10, Math.max(1, Number(searchParams.get("limit") ?? "5")));

  try {
    const res = await fetch(`${INFOVERIF_URL}/analyses/recent?limit=${limit}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ analyses: [] });
  }
}
