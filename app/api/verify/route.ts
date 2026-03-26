import { NextResponse } from "next/server";

export const maxDuration = 60;

const INFOVERIF_URL =
  process.env.INFOVERIF_BACKEND_URL ?? "https://infoveriforg-production.up.railway.app";

/** Resolve a Google News redirect URL to the actual article URL using Jina Reader. */
async function resolveGoogleNewsUrl(url: string): Promise<string> {
  if (!url.includes("news.google.com")) return url;
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return url;
    const json = await res.json();
    const resolved: unknown = json?.data?.url ?? json?.url;
    if (typeof resolved === "string" && resolved.startsWith("http") && !resolved.includes("news.google.com")) {
      return resolved;
    }
  } catch {
    // fallback to original URL
  }
  return url;
}

export async function POST(request: Request): Promise<NextResponse> {
  const apiKey = process.env.INFOVERIF_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "INFOVERIF_API_KEY not configured" }, { status: 503 });
  }

  let body: { input?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawInput = (body.input ?? "").trim();
  if (!rawInput) {
    return NextResponse.json({ error: "input is required" }, { status: 400 });
  }

  const isUrl = /^https?:\/\//i.test(rawInput);
  // Resolve Google News redirect URLs to actual article URLs before analysis
  const input = isUrl ? await resolveGoogleNewsUrl(rawInput) : rawInput;

  try {
    let res: Response;

    if (isUrl) {
      const urlForm = new FormData();
      urlForm.append("url", input);
      urlForm.append("platform", "unknown");
      res = await fetch(`${INFOVERIF_URL}/analyze-url`, {
        method: "POST",
        headers: { "X-Api-Key": apiKey },
        body: urlForm,
        signal: AbortSignal.timeout(55000),
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
        signal: AbortSignal.timeout(55000),
      });
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      // Try to extract a human-readable detail from FastAPI error body
      let detail = errText;
      try {
        const parsed = JSON.parse(errText);
        detail = parsed.detail ?? errText;
      } catch { /* raw text */ }
      // Surface user-friendly messages for common errors
      const detailStr = typeof detail === "string" ? detail : "";
      let userError = "Analyse impossible pour ce contenu.";
      if (res.status === 401 || res.status === 403) {
        userError = "Erreur d'authentification avec le serveur d'analyse.";
      } else if (res.status === 400 && /yt-dlp|audio|video download/i.test(detailStr)) {
        userError = "Vidéo non téléchargeable. Collez directement la transcription ou le texte du discours dans l'Analyser.";
      } else if (res.status === 400) {
        userError = `Contenu non analysable : ${detailStr.replace(/^analyze-url failed:\s*/i, "").slice(0, 120) || "format non supporté."}`;
      } else if (res.status >= 500) {
        userError = "Le serveur d'analyse est temporairement indisponible.";
      }
      return NextResponse.json({ error: userError }, { status: 200 }); // return 200 so UI renders error nicely
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
