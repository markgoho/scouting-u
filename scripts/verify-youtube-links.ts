/**
 * Verify all YouTube video links in DRG rank guide files.
 *
 * Uses YouTube's official oEmbed API to check whether each YouTube video ID
 * actually resolves to a real, embeddable video.
 *
 * Detects three states:
 *   - working: video exists and is embeddable
 *   - embed_disabled: video exists but embedding is disabled (shows
 *     "Video unavailable" when embedded, but watchable on YouTube directly)
 *   - broken: video does not exist, is private, or has been removed
 *
 * Usage:
 *   bun run verify:youtube-links
 *   RANK_SLUGS="scout,tenderfoot" bun run verify:youtube-links
 */

import { Glob } from "bun";
import { verifyYoutubeVideo } from "./lib/verify-youtube-video.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VideoEntry {
  file: string;
  line: number;
  videoId: string;
  url: string;
  shortcodeTitle: string;
}

type VideoStatus = "working" | "embed_disabled" | "broken";

interface VerificationResult extends VideoEntry {
  status: VideoStatus;
  oembedTitle?: string;
}

// ---------------------------------------------------------------------------
// YouTube ID extraction
// ---------------------------------------------------------------------------

/** Extract a YouTube video ID from a URL, or return null. */
function extractVideoId(url: string): string | null {
  const vMatch = url.match(/[?&]v=([^&\s"]+)/);
  if (vMatch?.[1] !== undefined) return vMatch[1];

  const shortMatch = url.match(/youtu\.be\/([^?\s"]+)/);
  if (shortMatch?.[1] !== undefined) return shortMatch[1];

  const shortsMatch = url.match(/youtube\.com\/shorts\/([^?\s"]+)/);
  if (shortsMatch?.[1] !== undefined) return shortsMatch[1];

  const embedMatch = url.match(/youtube\.com\/embed\/([^?\s"]+)/);
  if (embedMatch?.[1] !== undefined) return embedMatch[1];

  return null;
}

// ---------------------------------------------------------------------------
// File scanning
// ---------------------------------------------------------------------------

/** Scan markdown files for YouTube URLs inside drg/video and drg/external-link shortcodes. */
async function scanFiles(globPattern: string): Promise<VideoEntry[]> {
  const entries: VideoEntry[] = [];

  const urlRegex =
    /url="(https?:\/\/(?:www\.)?(?:youtube\.com\/watch[^"]*|youtu\.be\/[^"]*|youtube\.com\/shorts\/[^"]*|youtube\.com\/embed\/[^"]*))"?/g;
  const titleRegex = /title="([^"]+)"/;

  const glob = new Glob(globPattern);
  for await (const path of glob.scan({ cwd: ".", absolute: true })) {
    const content = await Bun.file(path).text();
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      let match: RegExpExecArray | null;

      urlRegex.lastIndex = 0;
      while ((match = urlRegex.exec(line)) !== null) {
        const url = match[1]!;
        const videoId = extractVideoId(url);
        if (!videoId) continue;

        const context = lines
          .slice(Math.max(0, i - 3), Math.min(lines.length, i + 3))
          .join("\n");
        const titleMatch = context.match(titleRegex);

        entries.push({
          file: path,
          line: i + 1,
          videoId,
          url,
          shortcodeTitle: titleMatch?.[1] ?? "(no title found)",
        });
      }
    }
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const rankSlugs = process.env["RANK_SLUGS"]?.split(",").map(s => s.trim());

  let globPattern: string;
  if (rankSlugs && rankSlugs.length > 0) {
    globPattern = `hugo/content/scouts-bsa/ranks/{${rankSlugs.join(",")}}/guide/**/*.md`;
  } else {
    globPattern = "hugo/content/scouts-bsa/ranks/*/guide/**/*.md";
  }

  console.log(`Scanning: ${globPattern}\n`);

  const entries = await scanFiles(globPattern);
  const uniqueIds = [...new Set(entries.map(e => e.videoId))];

  console.log(
    `Found ${entries.length} YouTube references (${uniqueIds.length} unique video IDs)\n`,
  );

  const verificationCache = new Map<
    string,
    { status: VideoStatus; title?: string }
  >();

  let verified = 0;
  for (const videoId of uniqueIds) {
    const result = await verifyYoutubeVideo({ videoId });
    verificationCache.set(videoId, result);
    verified++;

    if (verified % 10 === 0) {
      process.stdout.write(
        `  Verified ${verified}/${uniqueIds.length} unique IDs...\r`,
      );
    }

    await Bun.sleep(200);
  }
  console.log(`  Verified ${verified}/${uniqueIds.length} unique IDs.   \n`);

  const results: VerificationResult[] = entries.map(entry => {
    const cached = verificationCache.get(entry.videoId)!;
    return {
      ...entry,
      status: cached.status,
      oembedTitle: cached.title,
    };
  });

  const broken = results.filter(r => r.status === "broken");
  const embedDisabled = results.filter(r => r.status === "embed_disabled");
  const working = results.filter(r => r.status === "working");

  console.log("=".repeat(80));
  console.log("RESULTS");
  console.log("=".repeat(80));

  if (broken.length > 0) {
    console.log(`\nBROKEN (${broken.length} references):\n`);
    for (const r of broken) {
      const relPath = r.file.replace(process.cwd() + "/", "");
      console.log(`  ${relPath}:${r.line}`);
      console.log(`    Video ID: ${r.videoId}`);
      console.log(`    Title:    ${r.shortcodeTitle}`);
      console.log(`    URL:      ${r.url}`);
      console.log();
    }
  }

  if (embedDisabled.length > 0) {
    console.log(`\nEMBED DISABLED (${embedDisabled.length} references):\n`);
    console.log(
      `    These videos exist and are watchable on YouTube, but embedding`,
    );
    console.log(
      `    is disabled by the uploader. They show "Video unavailable" when`,
    );
    console.log(`    embedded. Consider switching from {{< drg/video >}} to`);
    console.log(`    {{< drg/external-link >}} for these.\n`);
    for (const r of embedDisabled) {
      const relPath = r.file.replace(process.cwd() + "/", "");
      console.log(`  ${relPath}:${r.line}`);
      console.log(`    Video ID: ${r.videoId}`);
      console.log(`    Title:    ${r.shortcodeTitle}`);
      console.log(`    URL:      ${r.url}`);
      console.log();
    }
  }

  if (working.length > 0) {
    console.log(`\nWORKING (${working.length} references):\n`);
    for (const r of working) {
      const relPath = r.file.replace(process.cwd() + "/", "");
      const titleMatch =
        r.oembedTitle === r.shortcodeTitle ? "match" : `≠ "${r.oembedTitle}"`;
      console.log(`  ${relPath}:${r.line}`);
      console.log(`    Video ID: ${r.videoId}  |  Title: ${titleMatch}`);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80));
  console.log(`  Total references: ${results.length}`);
  console.log(`  Unique video IDs: ${uniqueIds.length}`);
  console.log(`  Working:          ${working.length}`);
  console.log(`  Embed disabled:   ${embedDisabled.length}`);
  console.log(`  Broken:           ${broken.length}`);

  const problematic = [...broken, ...embedDisabled];
  if (problematic.length > 0) {
    const byRank = new Map<string, { broken: number; embedDisabled: number }>();
    for (const r of problematic) {
      const rankMatch = r.file.match(/scouts-bsa\/ranks\/([^/]+)\//);
      const rank = rankMatch?.[1] ?? "unknown";
      if (!byRank.has(rank)) byRank.set(rank, { broken: 0, embedDisabled: 0 });
      const counts = byRank.get(rank)!;
      if (r.status === "broken") counts.broken++;
      else counts.embedDisabled++;
    }
    console.log("\n  Issues by rank:");
    for (const [rank, counts] of byRank) {
      const parts: string[] = [];
      if (counts.broken > 0) parts.push(`${counts.broken} broken`);
      if (counts.embedDisabled > 0)
        parts.push(`${counts.embedDisabled} embed disabled`);
      console.log(`    ${rank}: ${parts.join(", ")}`);
    }
  }

  console.log();

  if (broken.length > 0) {
    process.exit(1);
  }
}

main();
