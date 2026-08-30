/**
 * Post-build assertions against hugo/public.
 *
 * These guard failures that do not fail a build: Hugo exits 0 while content
 * silently disappears from the page. Both checks here come from real bugs.
 *
 * 1. Stripped raw HTML. Rank requirement text is pre-rendered HTML, not
 *    markdown, so uni-theme's node dict carries `text_format: "html"`
 *    (ADR 0010). If that ever stops reaching the theme's text partials, they
 *    fall back to markdownify, goldmark drops every raw tag, and Hugo emits
 *    an HTML comment in its place -- 188 of them the first time, taking every
 *    <sup> footnote marker and <ul> list with them. scouting-u is the only
 *    consumer exercising that path; mbu is markdown throughout, so nothing
 *    upstream would catch a regression here.
 *
 * 2. Blank requirement headings. Pagefind's Route A sub-results need the id
 *    on an h1-h6 with real text (scouting-u#35, uni-theme's CONTRACT.md). A
 *    blank one yields an unusable sub-result title rather than an error.
 *
 * 3. Missing or invalid JSON-LD. Every HTML page must emit Schema.org JSON-LD
 *    structured data with valid syntax and required context/type fields.
 */
import { Glob } from "bun";

const PUBLIC_DIR = "hugo/public";
const STRIPPED_HTML = "<!-- raw HTML omitted -->";
const REQUIREMENT_HEADING = /<(h3|h4)\s+id="[^"]*"[^>]*>([\s\S]*?)<\/\1>/g;
const JSON_LD_SCRIPT = /<script type=["']?application\/ld\+json["']?>([\s\S]*?)<\/script>/gi;

const failures: string[] = [];

for await (const file of new Glob("**/*.html").scan(PUBLIC_DIR)) {
  const html = await Bun.file(`${PUBLIC_DIR}/${file}`).text();

  const stripped = html.split(STRIPPED_HTML).length - 1;
  if (stripped > 0) {
    failures.push(`${file}: ${stripped} stripped raw HTML marker(s)`);
  }

  for (const [, , inner] of html.matchAll(REQUIREMENT_HEADING)) {
    if (inner.replace(/<[^>]*>/g, "").trim() === "") {
      failures.push(`${file}: blank requirement heading`);
      break;
    }
  }

  const jsonLdMatches = [...html.matchAll(JSON_LD_SCRIPT)];
  if (jsonLdMatches.length === 0) {
    failures.push(`${file}: missing application/ld+json structured data`);
  } else {
    for (const [, scriptContent] of jsonLdMatches) {
      try {
        const parsed = JSON.parse(scriptContent.trim());
        if (!parsed["@context"] || (!parsed["@type"] && !parsed["@graph"])) {
          failures.push(`${file}: JSON-LD object missing @context or @type/@graph`);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        failures.push(`${file}: invalid JSON in JSON-LD script: ${message}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error(`Build output verification failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log("Build output verified: no stripped HTML, no blank requirement headings, all JSON-LD valid.");

