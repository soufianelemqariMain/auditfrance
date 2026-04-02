import { NextResponse } from "next/server";

const BACKEND = process.env.INFOVERIF_BACKEND_URL ?? "https://infoveriforg-production.up.railway.app";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const voterHeader = request.headers.get("X-Voter-Id");
  if (!voterHeader) {
    return NextResponse.json({ error: "X-Voter-Id header required" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND}/api/claims/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Voter-Id": voterHeader },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
  }
}
