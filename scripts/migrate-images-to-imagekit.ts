/**
 * Upload DRG guide images to ImageKit and record dimensions + cache-version
 * hashes. Trimmed port of mbu/scripts/migrate-images-to-imagekit.ts — this
 * repo only has DRG guide images (no emblems, no site hero/OG images), so
 * the --only switch and hugo/data/badge-images.json sidecar don't apply;
 * each rank's own guide/images.json carries its width/height/v fields.
 *
 * Uploads to the same shared ImageKit account mbu uses
 * (https://ik.imagekit.io/doulacoop), under a distinct /su-assets/ prefix
 * so object paths never collide with mbu's /mbu-assets/ or doula.coop's own
 * folders. See docs/adr for the image delivery decision record.
 *
 * Usage:
 *   bun scripts/migrate-images-to-imagekit.ts --dry-run
 *   bun scripts/migrate-images-to-imagekit.ts
 *   bun scripts/migrate-images-to-imagekit.ts --skip-existing
 *   RANK_SLUGS="scout,star" bun scripts/migrate-images-to-imagekit.ts
 */

import { createHash } from "node:crypto";
import path from "node:path";
import { Glob } from "bun";
import ImageKit, { toFile } from "@imagekit/nodejs";
import sharp from "sharp";
import { loadEnvFromRepoRoot } from "./lib/load-env-from-repo-root.ts";

await loadEnvFromRepoRoot();

const RANKS_DIRECTORY = path.resolve("hugo/content/scouts-bsa/ranks");
const PREFIX = "/su-assets";
const IMAGEKIT_ENDPOINT = "https://ik.imagekit.io/doulacoop";

interface Args {
  dryRun: boolean;
  skipExisting: boolean;
}

function parseArguments(): Args {
  const argv = process.argv.slice(2);
  const args: Args = { dryRun: false, skipExisting: false };
  for (const arg of argv) {
    if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--skip-existing") {
      args.skipExisting = true;
    }
  }
  return args;
}

const args = parseArguments();

const rankSlugFilter = process.env.RANK_SLUGS
  ? new Set(process.env.RANK_SLUGS.split(",").map(s => s.trim()))
  : undefined;

async function discoverRankSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  for await (const entry of new Glob("*/guide/images.json").scan(RANKS_DIRECTORY)) {
    slugs.push(entry.split("/")[0]!);
  }
  return rankSlugFilter ? slugs.filter(slug => rankSlugFilter.has(slug)) : slugs;
}

if (!process.env.IMAGEKIT_PRIVATE_KEY) {
  console.error("IMAGEKIT_PRIVATE_KEY is not set");
  process.exit(1);
}

const client = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

let uploaded = 0;
let skipped = 0;
let failed = 0;

async function fileExistsOnImageKit(folder: string, fileName: string): Promise<boolean> {
  const response = await fetch(`${IMAGEKIT_ENDPOINT}${folder}/${fileName}`, { method: "HEAD" });
  return response.ok;
}

async function sha256Of(filePath: string): Promise<string> {
  const buffer = await Bun.file(filePath).arrayBuffer();
  return createHash("sha256").update(Buffer.from(buffer)).digest("hex").slice(0, 8);
}

async function uploadFile({
  filePath,
  folder,
  fileName,
}: {
  filePath: string;
  folder: string;
  fileName: string;
}): Promise<{ width: number; height: number; v: string } | undefined> {
  const metadata = await sharp(filePath).metadata();
  if (metadata.width === undefined || metadata.height === undefined) {
    console.error(`  ✗ ${folder}/${fileName}: could not read dimensions`);
    failed++;
    return undefined;
  }
  const v = await sha256Of(filePath);

  if (args.skipExisting && (await fileExistsOnImageKit(folder, fileName))) {
    console.log(`  · skip (exists) ${folder}/${fileName}`);
    skipped++;
    return { width: metadata.width, height: metadata.height, v };
  }

  if (args.dryRun) {
    console.log(`  would upload ${folder}/${fileName} (${metadata.width}x${metadata.height})`);
    uploaded++;
    return { width: metadata.width, height: metadata.height, v };
  }

  try {
    const bunFile = Bun.file(filePath);
    const file = await toFile(await bunFile.arrayBuffer(), fileName);
    await client.files.upload({
      file,
      fileName,
      folder,
      useUniqueFileName: false,
      overwriteFile: true,
    });
    console.log(`  ✓ ${folder}/${fileName} (${metadata.width}x${metadata.height})`);
    uploaded++;
    return { width: metadata.width, height: metadata.height, v };
  } catch (error) {
    console.error(`  ✗ ${folder}/${fileName}: ${error instanceof Error ? error.message : error}`);
    failed++;
    return undefined;
  }
}

async function migrateRank(slug: string): Promise<void> {
  const imagesJsonPath = path.join(RANKS_DIRECTORY, slug, "guide", "images.json");
  const manifest = JSON.parse(await Bun.file(imagesJsonPath).text()) as {
    images: Array<{ id: string; file: string; description: string; width?: number; height?: number; v?: string }>;
  };

  let changed = false;
  const imagesDirectory = path.join(RANKS_DIRECTORY, slug, "guide", "images");

  for (const entry of manifest.images) {
    const pngPath = path.join(imagesDirectory, `${entry.id}.png`);
    if (!(await Bun.file(pngPath).exists())) {
      console.error(`  ✗ ${slug}: missing ${entry.id}.png referenced in images.json`);
      failed++;
      continue;
    }
    const result = await uploadFile({
      filePath: pngPath,
      folder: `${PREFIX}/scouts-bsa/ranks/${slug}/guide`,
      fileName: entry.id,
    });
    if (result && !args.dryRun) {
      entry.width = result.width;
      entry.height = result.height;
      entry.v = result.v;
      changed = true;
      // Freshly generated PNGs are staging files, not committed masters —
      // upload-and-delete, same as mbu's pipeline.
      await Bun.file(pngPath).delete();
    }
  }

  if (changed) {
    await Bun.write(imagesJsonPath, JSON.stringify(manifest, null, 2) + "\n");
  }
}

async function main(): Promise<void> {
  const slugs = await discoverRankSlugs();
  for (const slug of slugs) {
    console.log(`\n=== ${slug} ===`);
    await migrateRank(slug);
  }

  console.log(`\nDone. uploaded=${uploaded} skipped=${skipped} failed=${failed}`);
  if (failed > 0) {
    process.exit(1);
  }
}

await main();
