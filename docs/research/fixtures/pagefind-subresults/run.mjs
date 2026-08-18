/**
 * Throwaway proof for research ticket #12.
 *
 * Builds three Pagefind indexes over synthetic Scouts BSA rank data and
 * reports (a) what ends up in each fragment and (b) how big each index is.
 *
 *   route1  — one HTML page per rank, each requirement an id-bearing <h3>
 *   route2a — one HTML page per requirement (real URLs on disk)
 *   route2b — route1's HTML pages, plus one addCustomRecord per requirement
 *
 * Run:  cd docs/research/fixtures/pagefind-subresults && node run.mjs
 * Needs: npm i pagefind@1.5.2  (or run from the repo root where it is a devDep)
 */
import * as pagefind from "pagefind";
import { mkdirSync, rmSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const build = join(here, ".build");
rmSync(build, { recursive: true, force: true });

// ---------------------------------------------------------------- synthetic data
// The REAL Scouts BSA shape: 7 ranks, 147 requirements total.
// (Set SYNTHETIC_22=1 to rerun at 22 ranks x 40 reqs = 880, as a headroom
// datapoint for the other three programs. That number is NOT the MVP index.)
const REAL_RANKS = [
  ["scout", "Scout", 20],
  ["tenderfoot", "Tenderfoot", 27],
  ["second-class", "Second Class", 37],
  ["first-class", "First Class", 38],
  ["star", "Star", 10],
  ["life", "Life", 8],
  ["eagle", "Eagle", 7],
];

const SHAPE = process.env.SYNTHETIC_22
  ? Array.from({ length: 22 }, (_, r) => [`rank-${r + 1}`, `Rank ${r + 1}`, 40])
  : REAL_RANKS;

const RANKS = SHAPE.map(([slug, name, count]) => ({
  slug,
  name,
  reqs: Array.from({ length: count }, (_, i) => ({
    num: `${Math.floor(i / 4) + 1}${"abcd"[i % 4]}`,
    text:
      `Requirement ${i + 1} for ${name}. ` +
      `Cook a meal over a fire, demonstrate first aid, tie a bowline, and ` +
      `explain the outdoor code to your patrol leader before the next campout. ` +
      `Discuss what you learned with your Scoutmaster and record it in your handbook.`,
  })),
}));

const TOTAL_REQS = RANKS.reduce((n, r) => n + r.reqs.length, 0);

const dirFor = (variant, ...parts) => join(build, variant, ...parts);
const write = (p, body) => {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, body);
};

const page = (title, inner, extraHead = "") =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title>${extraHead}</head><body><nav>nav</nav>${inner}</body></html>`;

// route1 + route2b share the same HTML: one page per rank.
for (const variant of ["route1", "route2b"]) {
  for (const rank of RANKS) {
    const body = `<main data-pagefind-body>
      <h1 data-pagefind-meta="title:${rank.name}" data-pagefind-filter="rank:${rank.name}">${rank.name}</h1>
      <ol>${rank.reqs
        .map(
          r =>
            `<li><h3 id="${r.num}">${r.num}</h3><p>${r.text}</p></li>`,
        )
        .join("")}</ol>
    </main>`;
    write(
      dirFor(variant, "scouts-bsa/ranks", rank.slug, "requirements/index.html"),
      page(rank.name, body),
    );
  }
}

// route2a: one page per requirement.
for (const rank of RANKS) {
  for (const r of rank.reqs) {
    const body = `<main data-pagefind-body>
      <h1 data-pagefind-meta="title:${rank.name} ${r.num}" data-pagefind-filter="rank:${rank.name}">${rank.name} ${r.num}</h1>
      <p>${r.text}</p>
    </main>`;
    write(
      dirFor(
        "route2a",
        "scouts-bsa/ranks",
        rank.slug,
        "requirements",
        r.num,
        "index.html",
      ),
      page(`${rank.name} ${r.num}`, body),
    );
  }
}

// ---------------------------------------------------------------- index builds
const dirSize = d =>
  readdirSync(d, { withFileTypes: true }).reduce(
    (n, e) =>
      n +
      (e.isDirectory()
        ? dirSize(join(d, e.name))
        : statSync(join(d, e.name)).size),
    0,
  );
const countFiles = d =>
  readdirSync(d, { withFileTypes: true }).reduce(
    (n, e) => n + (e.isDirectory() ? countFiles(join(d, e.name)) : 1),
    0,
  );

async function buildIndex(variant, { customRecords = false } = {}) {
  const { index } = await pagefind.createIndex();
  const { page_count } = await index.addDirectory({ path: dirFor(variant) });
  let extra = 0;
  if (customRecords) {
    for (const rank of RANKS) {
      for (const r of rank.reqs) {
        await index.addCustomRecord({
          // A fragment URL, pointing back at the rank page's anchor.
          url: `/scouts-bsa/ranks/${rank.slug}/requirements/#${r.num}`,
          content: r.text,
          language: "en",
          meta: { title: `${r.num}`, rank: rank.name, req: r.num },
          filters: { rank: [rank.name] },
        });
        extra++;
      }
    }
  }
  const out = join(build, `${variant}-index`);
  await index.writeFiles({ outputPath: out });
  const frag = join(out, "fragment");
  return {
    variant,
    page_count,
    custom_records: extra,
    fragments: countFiles(frag),
    fragment_bytes: dirSize(frag),
    index_bytes: dirSize(join(out, "index")),
    total_bytes: dirSize(out),
    out,
  };
}

const results = [];
results.push(await buildIndex("route1"));
results.push(await buildIndex("route2a"));
results.push(await buildIndex("route2b", { customRecords: true }));

const kb = n => `${(n / 1024).toFixed(1)} KiB`;
console.log(
  `\n=== index size (${RANKS.length} ranks, ${TOTAL_REQS} requirements)`,
);
for (const r of results) {
  console.log(
    `${r.variant.padEnd(8)} pages=${String(r.page_count).padStart(4)} ` +
      `custom=${String(r.custom_records).padStart(4)} ` +
      `fragments=${String(r.fragments).padStart(4)} ` +
      `fragment=${kb(r.fragment_bytes).padStart(11)} ` +
      `index=${kb(r.index_bytes).padStart(11)} ` +
      `total=${kb(r.total_bytes).padStart(11)}`,
  );
}

// ---------------------------------------------------------------- behaviour probes
// Hand-written fixtures, each isolating one behaviour question:
//   site-a  anchor eligibility, region boundaries, inline-meta gotcha
//   site-b  NESTED data-pagefind-body + region-local meta/filter escape
//   site-c  SIBLING data-pagefind-body with no outer wrapper + long meta value
for (const site of ["site-a", "site-b", "site-c"]) {
  const { index: probe } = await pagefind.createIndex();
  const { page_count } = await probe.addDirectory({ path: join(here, site) });
  const probeOut = join(build, `${site}-index`);
  await probe.writeFiles({ outputPath: probeOut });
  console.log(
    `\n=== ${site}: page_count=${page_count} -> ${probeOut}`,
  );
  console.log(`    node dump-fragment.mjs .build/${site}-index`);
  console.log(`    node search.mjs .build/${site}-index cook`);
}
