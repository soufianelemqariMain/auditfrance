import { NextResponse } from "next/server";

const BACKEND = process.env.INFOVERIF_BACKEND_URL ?? "https://infoveriforg-production.up.railway.app";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();
  for (const [k, v] of searchParams) params.set(k, v);

  const voterHeader = request.headers.get("X-Voter-Id");
  const headers: Record<string, string> = {};
  if (voterHeader) headers["X-Voter-Id"] = voterHeader;

  try {
    const res = await fetch(`${BACKEND}/api/claims?${params}`, { headers, cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
  }
}
