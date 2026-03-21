import Anthropic from "@anthropic-ai/sdk";
import { parseRssFeed } from "@/lib/rss-parser";

const QUICK_FEEDS: { url: string; name: string }[] = [
  {
    url: "https://www.bfmtv.com/rss/info/flux-rss/flux-toutes-les-actualites/",
    name: "BFM TV",
  },
  {
    url: "https://www.francetvinfo.fr/titres.rss",
    name: "France Info",
  },
  {
    url: "https://www.lemonde.fr/rss/une.xml",
    name: "Le Monde",
  },
];

const MOCK_INSIGHT = `Brief quotidien — France (données indisponibles)

La clé ANTHROPIC_API_KEY n'est pas configurée sur ce serveur. Ce texte est un exemple de brief simulé.

Situation générale : Aucune donnée temps réel disponible. Pour activer les briefs IA, veuillez définir la variable d'environnement ANTHROPIC_API_KEY dans votre fichier .env.local.

Recommandation : Contactez l'administrateur système pour configurer l'accès à l'API Anthropic.`;

export async function GET(_request: Request): Promise<Response> {
  // Fetch titles from 3 quick feeds in parallel
  const results = await Promise.allSettled(
    QUICK_FEEDS.map((feed) => parseRssFeed(feed.url, feed.name))
  );

  const titles: string[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const item of result.value) {
        titles.push(item.title);
      }
    }
  }

  const top20 = titles.slice(0, 20);

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(MOCK_INSIGHT, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const anthropic = new Anthropic({ apiKey });

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const userMessage =
    `Date du jour : ${today}\n\nTitres d'actualité :\n` +
    top20.map((t, i) => `${i + 1}. ${t}`).join("\n");

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = anthropic.messages.stream({
          model: "claude-sonnet-4-20250514",
          max_tokens: 300,
          system:
            "Tu es un analyste de renseignement français. Génère un brief quotidien concis (200 mots max) sur la situation en France basé sur les titres d'actualité fournis. Ton neutre, factuel, structuré. Commence par la date du jour.",
          messages: [{ role: "user", content: userMessage }],
        });

        for await (const event of messageStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(new TextEncoder().encode(event.delta.text));
          }
        }

        controller.close();
      } catch (err) {
        console.error("[insights] Anthropic stream error:", err);
        controller.enqueue(
          new TextEncoder().encode(
            "\n\n[Erreur lors de la génération du brief IA]"
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
