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

interface SpeakerBlock {
  id: string;
  speaker: string;
  role: string;
  paragraphs: string[];
}

function extractBlock(part: string): SpeakerBlock | null {
  const idM = part.match(/<div\s+id="(\d+)"/);
  if (!idM) return null;
  const id = idM[1];

  const orateurM = part.match(/class="orateur"[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/);
  const speaker = orateurM ? orateurM[1].trim() : "";
  if (!speaker) return null;

  const roleM = part.match(/class="italique"[^>]*>([\s\S]*?)<\/span>/);
  const role = roleM ? stripHtml(roleM[1]).replace(/^,\s*/, "").trim() : "";

  const paragraphs: string[] = [];
  const textRe = /<p class="">\s*<span>([\s\S]+?)<\/span>\s*<\/p>/g;
  let m: RegExpExecArray | null;
  while ((m = textRe.exec(part)) !== null) {
    const t = stripHtml(m[1]);
    if (t.length > 20) paragraphs.push(t);
  }

  return { id, speaker, role, paragraphs };
}

function renderBlock(b: SpeakerBlock, session: string, isMain: boolean): string {
  const anchor = `${session}#${b.id}`;
  return `<section${isMain ? ' class="main-intervention"' : ""}>
<h2><a href="${anchor}">${b.speaker}</a>${b.role ? ` <em>(${b.role})</em>` : ""}</h2>
${b.paragraphs.map((p) => `<p>${p}</p>`).join("\n")}
</section>`;
}

export async function GET(request: Request): Promise<NextResponse | Response> {
  const { searchParams } = new URL(request.url);
  const session = searchParams.get("session");
  const id = searchParams.get("id");
  // context=N: include up to N preceding interventions for exchange context (default 2)
  const contextN = Math.min(parseInt(searchParams.get("context") ?? "2", 10), 5);

  if (!session || !id) {
    return NextResponse.json({ error: "Missing session or id params" }, { status: 400 });
  }

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

  // Split into crs-inter blocks and extract only those with speakers
  const rawParts = html.split(/(?=<div\s+id="\d+"\s+class="crs-inter)/);
  const blocks: SpeakerBlock[] = [];
  for (const part of rawParts) {
    if (!part.includes('class="orateur"')) continue;
    const b = extractBlock(part);
    if (b && b.paragraphs.length > 0) blocks.push(b);
  }

  const mainIdx = blocks.findIndex((b) => b.id === id);
  if (mainIdx === -1) {
    return NextResponse.json({ error: "Intervention not found" }, { status: 404 });
  }

  const mainBlock = blocks[mainIdx];

  // Include up to contextN preceding speaker blocks for exchange context
  const startIdx = Math.max(0, mainIdx - contextN);
  const contextBlocks = blocks.slice(startIdx, mainIdx);

  const sections = [
    ...contextBlocks.map((b) => renderBlock(b, session, false)),
    renderBlock(mainBlock, session, true),
  ].join("\n\n");

  const title = `${mainBlock.speaker} — Assemblée nationale`;
  const hasContext = contextBlocks.length > 0;

  const page = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>${title}</title></head>
<body>
<h1>${title}</h1>
${hasContext ? `<p><em>Contexte : ${contextBlocks.length} intervention(s) précédente(s) incluse(s) pour le fil de la délibération.</em></p>` : ""}
<p>Source : <a href="${session}#${id}">${session}#${id}</a></p>
${sections}
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
