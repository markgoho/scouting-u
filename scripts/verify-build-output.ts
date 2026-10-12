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
 *
 * 4. HTML or template code in the LLM text outputs (scouting-u#126, #129).
 *    Every index.md, llms.txt, and llms-full.txt must be plain Markdown: no
 *    HTML tag and no unrendered "{{". A tag means synced HTML skipped
 *    text/markdown-text.md; Hugo does not fail on either.
 */
import { Glob } from "bun";

const PUBLIC_DIR = "hugo/public";
const STRIPPED_HTML = "<!-- raw HTML omitted -->";
const REQUIREMENT_HEADING = /<(h3|h4)\s+id="[^"]*"[^>]*>([\s\S]*?)<\/\1>/g;
const HTML_TAG = /<[a-zA-Z/!]/;
const TEXT_OUTPUTS = ["**/*.md", "llms.txt", "llms-full.txt"];
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

let textOutputs = 0;
for (const pattern of TEXT_OUTPUTS) {
  for await (const file of new Glob(pattern).scan(PUBLIC_DIR)) {
    textOutputs++;
    const text = await Bun.file(`${PUBLIC_DIR}/${file}`).text();
    text.split("\n").forEach((line, i) => {
      if (HTML_TAG.test(line)) failures.push(`${file}:${i + 1}: HTML tag in text output`);
      if (line.includes("{{")) failures.push(`${file}:${i + 1}: "{{" in text output`);
    });
  }
}
if (textOutputs === 0) {
  failures.push("no LLM text outputs (index.md, llms.txt, llms-full.txt) found");
}

if (failures.length > 0) {
  console.error(`Build output verification failed:\n${failures.join("\n")}`);
  process.exit(1);
}

console.log(`Build output verified: no stripped HTML, no blank requirement headings, all JSON-LD valid, ${textOutputs} text outputs plain.`);

