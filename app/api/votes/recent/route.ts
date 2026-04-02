import { NextResponse } from "next/server";

const BACKEND = process.env.INFOVERIF_BACKEND_URL ?? "https://infoveriforg-production.up.railway.app";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") ?? "20";
  try {
    const res = await fetch(`${BACKEND}/api/votes/recent?limit=${limit}`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ events: [] }, { status: 200 });
  }
}
