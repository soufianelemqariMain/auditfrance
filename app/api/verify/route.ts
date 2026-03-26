import { NextResponse } from "next/server";

export const maxDuration = 60;

const INFOVERIF_URL =
  process.env.INFOVERIF_BACKEND_URL ?? "https://infoveriforg-production.up.railway.app";

/**
 * For Google News URLs, use Jina Reader to fetch the article content directly.
 * Returns { content, resolvedUrl } — content is the article text (markdown),
 * resolvedUrl is the actual publisher URL if Jina resolved the redirect.
 * Both may be null if Jina fails or content is too thin.
 */
async function fetchGoogleNewsContent(url: string): Promise<{ content: string | null; resolvedUrl: string | null }> {
  if (!url.includes("news.google.com")) return { content: null, resolvedUrl: null };
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: { Accept: "application/json", "X-Return-Format": "markdown" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return { content: null, resolvedUrl: null };
    const json = await res.json();
    const rawUrl: unknown = json?.data?.url ?? json?.url;
    const rawContent: unknown = json?.data?.content ?? json?.content;
    const resolvedUrl =
      typeof rawUrl === "string" && rawUrl.startsWith("http") && !rawUrl.includes("news.google.com")
        ? rawUrl
        : null;
    // Need at least ~300 chars of real article text
    const content =
      typeof rawContent === "string" && rawContent.trim().length > 300
        ? rawContent.trim()
        : null;
    return { content, resolvedUrl };
  } catch {
    return { content: null, resolvedUrl: null };
  }
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

  try {
    let res: Response;

    if (isUrl) {
      // For Google News URLs: extract article content via Jina (handles JS redirects)
      // then analyze the text directly; fall back to URL analysis with resolved URL.
      if (rawInput.includes("news.google.com")) {
        const { content, resolvedUrl } = await fetchGoogleNewsContent(rawInput);
        if (content) {
          const form = new FormData();
          form.append("text", content);
          form.append("platform", "article");
          form.append("language", "fr");
          res = await fetch(`${INFOVERIF_URL}/analyze-text`, {
            method: "POST",
            headers: { "X-Api-Key": apiKey },
            body: form,
            signal: AbortSignal.timeout(55000),
          });
          if (res.ok) {
            const data = await res.json();
            return NextResponse.json({ ...data, _input_type: "url" });
          }
          // Backend error — fall through to error handling below
        }
        // No content from Jina — try the resolved URL or fall back to original
        const urlToAnalyze = resolvedUrl ?? rawInput;
        const urlForm = new FormData();
        urlForm.append("url", urlToAnalyze);
        urlForm.append("platform", "unknown");
        res = await fetch(`${INFOVERIF_URL}/analyze-url`, {
          method: "POST",
          headers: { "X-Api-Key": apiKey },
          body: urlForm,
          signal: AbortSignal.timeout(55000),
        });
      } else {
        const urlForm = new FormData();
        urlForm.append("url", rawInput);
        urlForm.append("platform", "unknown");
        res = await fetch(`${INFOVERIF_URL}/analyze-url`, {
          method: "POST",
          headers: { "X-Api-Key": apiKey },
          body: urlForm,
          signal: AbortSignal.timeout(55000),
        });
      }
    } else {
      const form = new FormData();
      form.append("text", rawInput);
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
