/**
 * Decodes Pagefind .pf_fragment files (gzip + a "pagefind_dcd" prefix) and
 * prints url / meta / filters / anchors, plus the sub-results that
 * pagefind.js would calculate from them.
 *
 * The sub-result derivation below is a faithful transcription of
 * `calculate_sub_results` in the generated pagefind.js — reproduced here only
 * so the anchor filter can be exercised without a browser.
 *
 * Usage: node dump-fragment.mjs <index-dir>
 */
import { gunzipSync } from "node:zlib";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.argv[2], "fragment");
for (const file of readdirSync(dir)) {
  const raw = gunzipSync(readFileSync(join(dir, file))).toString("utf8");
  const frag = JSON.parse(raw.slice(raw.indexOf("{")));
  console.log("===", file);
  console.log("url:     ", frag.url);
  console.log("meta:    ", frag.meta);
  console.log("filters: ", frag.filters);
  console.log("anchors:");
  for (const a of frag.anchors) {
    console.log(
      `   <${a.element} id="${a.id}"> text=${JSON.stringify(a.text ?? null)} @${a.location}`,
    );
  }
  // pagefind.js keeps only headings that carry non-blank text.
  const kept = frag.anchors.filter(
    a => /h\d/i.test(a.element) && a.text?.length && /\S/.test(a.text),
  );
  console.log(
    "anchors that can become sub-results:",
    kept.map(a => `${a.element}#${a.id}`),
  );
  console.log("word_count:", frag.word_count);
  console.log();
}
