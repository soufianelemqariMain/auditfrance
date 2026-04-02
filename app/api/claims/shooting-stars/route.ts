import { NextResponse } from "next/server";

const BACKEND = process.env.INFOVERIF_BACKEND_URL ?? "https://infoveriforg-production.up.railway.app";

export async function GET(): Promise<NextResponse> {
  try {
    const res = await fetch(`${BACKEND}/api/claims/shooting-stars`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
  }
}
