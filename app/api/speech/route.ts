import { NextResponse } from "next/server";

export const runtime = "nodejs";

const AN_HEADERS = {
  "X-Requested-With": "XMLHttpRequest",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

function stripHtml(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(request: Request): Promise<NextResponse | Response> {
  const { searchParams } = new URL(request.url);
  const session = searchParams.get("session");
  const id = searchParams.get("id");

  if (!session || !id) {
    return NextResponse.json({ error: "Missing session or id params" }, { status: 400 });
  }

  // Only allow assemblee-nationale.fr URLs
  if (!session.startsWith("https://www.assemblee-nationale.fr/")) {
    return NextResponse.json({ error: "Invalid session URL" }, { status: 400 });
  }

  let html: string;
  try {
    const res = await fetch(session, {
      headers: AN_HEADERS,
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    html = await res.text();
  } catch {
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 502 });
  }

  // Find the specific crs-inter block by ID
  const parts = html.split(/(?=<div\s+id="\d+"\s+class="crs-inter)/);
  const block = parts.find((p) => new RegExp(`^<div\\s+id="${id}"`).test(p));

  if (!block) {
    return NextResponse.json({ error: "Intervention not found" }, { status: 404 });
  }

  // Extract speaker
  const orateurM = block.match(/class="orateur"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/);
  const speaker = orateurM ? orateurM[1].trim() : "Orateur inconnu";

  // Extract role
  const roleM = block.match(/class="italique"[^>]*>([\s\S]*?)<\/span>/);
  const role = roleM ? stripHtml(roleM[1]).replace(/^,\s*/, "").trim() : "";

  // Extract ALL speech paragraphs (no truncation)
  const paragraphs: string[] = [];
  const textRe = /<p class="">\s*<span>([\s\S]+?)<\/span>\s*<\/p>/g;
  let m: RegExpExecArray | null;
  while ((m = textRe.exec(block)) !== null) {
    const t = stripHtml(m[1]);
    if (t.length > 20) paragraphs.push(t);
  }

  if (paragraphs.length === 0) {
    return NextResponse.json({ error: "No speech text found" }, { status: 404 });
  }

  const texte = paragraphs.join("\n\n");
  const sourceUrl = `${session}#${id}`;

  const page = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>${speaker} — Assemblée nationale</title></head>
<body>
<h1>${speaker}</h1>
${role ? `<p><em>${role}</em></p>` : ""}
<p>Source : <a href="${sourceUrl}">${sourceUrl}</a></p>
<article>
${paragraphs.map((p) => `<p>${p}</p>`).join("\n")}
</article>
</body>
</html>`;

  return new Response(page, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
