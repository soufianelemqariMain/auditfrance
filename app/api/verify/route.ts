import { NextResponse } from "next/server";

export const maxDuration = 60;

interface EnrichedAnalysis {
  narrative_schema?: {
    hero?: string;
    villain?: string;
    victim?: string;
    quest?: string;
    summary?: string;
  };
  rhetoric_analysis?: {
    ethos?: string;
    logos?: string;
    pathos?: string;
    dominant_device?: string;
  };
  communication_intent?: string;
  audience_vectors?: string[];
  framing_analysis?: string;
}

async function enrichWithNarrativeAnalysis(
  summary: string,
  techniques: Array<{ name: string; tactic?: string }>,
  inputText: string,
): Promise<EnrichedAnalysis> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!anthropicKey) return {};

  const techniquesList = techniques.map((t) => `- ${t.name}${t.tactic ? ` (${t.tactic})` : ""}`).join("\n");
  const prompt = `Tu es expert en analyse rhétorique et narratologique pour des professionnels de la communication.

Analyse ce contenu médiatique et fournis une analyse structurée en JSON.

Résumé DISARM: ${summary || "(non fourni)"}
Techniques détectées:
${techniquesList || "(aucune)"}
Texte/URL analysé: ${inputText.slice(0, 500)}

Réponds UNIQUEMENT avec un JSON valide (pas de markdown) avec cette structure exacte:
{
  "narrative_schema": {
    "hero": "qui est présenté comme le héros/sauveur",
    "villain": "qui est présenté comme la menace/antagoniste",
    "victim": "qui est présenté comme victime",
    "quest": "quel est l'enjeu narratif central",
    "summary": "résumé du schéma narratif en 1-2 phrases"
  },
  "rhetoric_analysis": {
    "ethos": "comment l'autorité/crédibilité est construite",
    "logos": "comment la logique/preuve est mobilisée",
    "pathos": "quelles émotions sont sollicitées",
    "dominant_device": "procédé rhétorique dominant (ex: appel à la peur, fausse dichotomie, etc.)"
  },
  "communication_intent": "intention communicationnelle principale en 1 phrase (ex: mobiliser contre, légitimer, discréditer...)",
  "audience_vectors": ["vecteur1", "vecteur2", "vecteur3"],
  "framing_analysis": "analyse du cadrage (framing) en 1-2 phrases: quelle réalité est construite et quelles alternatives sont occultées"
}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) return {};
    const json = await res.json();
    const text: string = json.content?.[0]?.text ?? "";
    return JSON.parse(text) as EnrichedAnalysis;
  } catch {
    return {};
  }
}

const INFOVERIF_URL =
  process.env.INFOVERIF_BACKEND_URL ?? "https://infoveriforg-production.up.railway.app";

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

  const input = (body.input ?? "").trim();
  if (!input) {
    return NextResponse.json({ error: "input is required" }, { status: 400 });
  }

  const isUrl = /^https?:\/\//i.test(input);

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

    // Secondary enrichment: narrative + rhetoric analysis (requires ANTHROPIC_API_KEY)
    const enriched = await enrichWithNarrativeAnalysis(
      data.summary ?? "",
      data.techniques ?? [],
      input,
    );

    return NextResponse.json({ ...data, ...enriched, _input_type: isUrl ? "url" : "text" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Request failed" },
      { status: 502 }
    );
  }
}
