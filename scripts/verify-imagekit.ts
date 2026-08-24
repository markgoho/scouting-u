/**
 * HEAD-check every expected ImageKit URL for DRG guide images and report
 * 404s before anything is deleted from git. Trimmed port of
 * mbu/scripts/verify-imagekit.ts (no emblems/site images in this repo).
 *
 * Usage:
 *   bun scripts/verify-imagekit.ts
 */

import path from "node:path";
import { Glob } from "bun";
import { loadEnvFromRepoRoot } from "./lib/load-env-from-repo-root.ts";

await loadEnvFromRepoRoot();

const RANKS_DIRECTORY = path.resolve("hugo/content/scouts-bsa/ranks");
const PREFIX = "/su-assets";
const ENDPOINT = "https://ik.imagekit.io/doulacoop";

interface CheckResult {
  url: string;
  ok: boolean;
  status: number;
}

async function check(url: string): Promise<CheckResult> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return { url, ok: response.ok, status: response.status };
  } catch (error) {
    console.error(`  network error for ${url}: ${error instanceof Error ? error.message : error}`);
    return { url, ok: false, status: 0 };
  }
}

async function discoverRankSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  for await (const entry of new Glob("*/guide/images.json").scan(RANKS_DIRECTORY)) {
    slugs.push(entry.split("/")[0]!);
  }
  return slugs;
}

async function main(): Promise<void> {
  const failures: CheckResult[] = [];
  let total = 0;

  for (const slug of await discoverRankSlugs()) {
    console.log(`=== ${slug} ===`);
    const imagesJsonPath = path.join(RANKS_DIRECTORY, slug, "guide", "images.json");
    const manifest = JSON.parse(await Bun.file(imagesJsonPath).text()) as {
      images: Array<{ id: string; v?: string }>;
    };
    for (const entry of manifest.images) {
      if (!entry.v) {
        console.error(`  ✗ ${slug}/${entry.id}: no v hash in images.json — run bun run migrate:imagekit`);
        failures.push({ url: `${slug}/${entry.id}`, ok: false, status: 0 });
        total++;
        continue;
      }
      total++;
      const result = await check(
        `${ENDPOINT}/tr:w-800${PREFIX}/scouts-bsa/ranks/${slug}/guide/${entry.id}?v=${entry.v}`,
      );
      if (!result.ok) failures.push(result);
    }
  }

  console.log(`\nChecked ${total} URLs, ${failures.length} failed.`);
  for (const failure of failures) {
    console.log(`  ✗ [${failure.status}] ${failure.url}`);
  }

  if (failures.length > 0) {
    process.exit(1);
  }
}

await main();
