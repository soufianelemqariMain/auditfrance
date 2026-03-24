import { NextResponse } from "next/server";

const INFOVERIF_URL = "https://infoveriforg-production.up.railway.app";

export async function POST(request: Request): Promise<NextResponse> {
  const apiKey = process.env.INFOVERIF_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "INFOVERIF_API_KEY not configured" }, { status: 503 });
  }

  let body: { input?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const input = (body.input ?? "").trim();
  if (!input) {
    return NextResponse.json({ error: "input is required" }, { status: 400 });
  }

  const isUrl = /^https?:\/\//i.test(input);

  try {
    let res: Response;

    if (isUrl) {
      res = await fetch(`${INFOVERIF_URL}/analyze-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
        body: JSON.stringify({ url: input, platform: "web" }),
        signal: AbortSignal.timeout(30000),
      });
    } else {
      const form = new FormData();
      form.append("text", input);
      form.append("platform", "text");
      form.append("language", "fr");
      res = await fetch(`${INFOVERIF_URL}/analyze-text`, {
        method: "POST",
        headers: { "X-Api-Key": apiKey },
        body: form,
        signal: AbortSignal.timeout(30000),
      });
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Infoverif error ${res.status}`, detail: errText },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ ...data, _input_type: isUrl ? "url" : "text" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Request failed" },
      { status: 502 }
    );
  }
}
