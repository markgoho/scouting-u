/**
 * Runs a real Pagefind search against a built index and prints the
 * sub_results Pagefind itself calculates — no transcription, no browser.
 *
 * Usage: node search.mjs <index-dir> <query> [excerptLength]
 */
import { pathToFileURL } from "node:url";
import { join, resolve } from "node:path";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";

const dir = resolve(process.argv[2]);
const query = process.argv[3] ?? "cook";
const excerptLength = Number(process.argv[4] ?? 30);

// pagefind.js fetches its index over HTTP, so serve the built index locally.
const server = createServer((req, res) => {
  try {
    res.end(readFileSync(join(dir, req.url.split("?")[0])));
  } catch {
    res.statusCode = 404;
    res.end();
  }
}).listen(0);
const port = server.address().port;

const pagefind = await import(pathToFileURL(join(dir, "pagefind.js")).href);
await pagefind.options({
  basePath: `http://localhost:${port}/`,
  excerptLength,
});
await pagefind.init();

const search = await pagefind.search(query);
console.log(`query="${query}" excerptLength=${excerptLength} results=${search.results.length}\n`);
for (const r of search.results) {
  const d = await r.data();
  console.log("PAGE", d.url);
  console.log("  meta:   ", d.meta);
  console.log("  filters:", d.filters);
  console.log("  excerpt:", d.excerpt);
  console.log(`  sub_results (${d.sub_results.length}):`);
  for (const s of d.sub_results) {
    console.log(`    - title=${JSON.stringify(s.title)}`);
    console.log(`      url=${s.url}`);
    console.log(`      anchor=${s.anchor ? `<${s.anchor.element} id="${s.anchor.id}">` : "(none — page-level)"}`);
    console.log(`      keys=[${Object.keys(s).join(", ")}]`);
    console.log(`      excerpt=${s.excerpt}`);
  }
  console.log();
}
server.close();
