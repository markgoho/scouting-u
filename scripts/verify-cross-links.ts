/**
 * Cross-site DRG Link Verification Script
 *
 * Verifies that all cross-site references and shortcodes (related-guide, cross-link,
 * drg/related-guide, drg/cross-link, and raw markdown links) between Scouting University
 * and Merit Badge University resolve to valid endpoints, rank/merit-badge slugs,
 * guide sub-pages, field guides, and leadership pages.
 *
 * Usage:
 *   bun run verify:cross-links
 *   MBU_PATH="../mbu" bun run verify:cross-links
 */

import { Glob } from "bun";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

interface LinkReference {
  sourceRepo: "scouting-u" | "mbu";
  sourceFile: string;
  line: number;
  rawText: string;
  kind: "related-guide" | "cross-link" | "markdown-link";
  targetType?: "badge" | "rank" | "custom-url";
  slug?: string;
  req?: string;
  mode?: string;
  url?: string;
}

interface ValidationFailure {
  reference: LinkReference;
  reason: string;
}

const SCOUTING_U_ROOT = process.cwd();
const MBU_ROOT = resolve(process.env["MBU_PATH"] || join(SCOUTING_U_ROOT, "..", "mbu"));

const HAS_MBU = existsSync(MBU_ROOT) && existsSync(join(MBU_ROOT, "hugo"));

// Known rank slugs in Scouting University
const KNOWN_RANKS = new Set([
  "scout",
  "tenderfoot",
  "second-class",
  "first-class",
  "star",
  "life",
  "eagle",
]);

// Collect known merit badge slugs from MBU if present, or fallback set
const KNOWN_BADGES = new Set<string>();

if (HAS_MBU) {
  const mbDataDir = join(MBU_ROOT, "hugo", "data", "merit-badges", "scouts-bsa");
  if (existsSync(mbDataDir)) {
    const glob = new Glob("*.json");
    for (const file of glob.scanSync(mbDataDir)) {
      KNOWN_BADGES.add(file.replace(/\.json$/, ""));
    }
  }
  const mbContentDir = join(MBU_ROOT, "hugo", "content", "merit-badges");
  if (existsSync(mbContentDir)) {
    const glob = new Glob("*/_index.md");
    for (const file of glob.scanSync(mbContentDir)) {
      const slug = file.split("/")[0];
      if (slug && slug !== "eagle-required") {
        KNOWN_BADGES.add(slug);
      }
    }
  }
}

// Fallback to essential badges if MBU repo not mounted
if (KNOWN_BADGES.size === 0) {
  [
    "camping",
    "citizenship-in-society",
    "citizenship-in-the-community",
    "citizenship-in-the-nation",
    "citizenship-in-the-world",
    "communication",
    "cooking",
    "cycling",
    "emergency-preparedness",
    "environmental-science",
    "family-life",
    "first-aid",
    "fish-and-wildlife-management",
    "geocaching",
    "hiking",
    "lifesaving",
    "mammal-study",
    "nature",
    "orienteering",
    "personal-fitness",
    "personal-management",
    "pioneering",
    "plant-science",
    "scouting-heritage",
    "soil-and-water-conservation",
    "sustainability",
    "swimming",
    "weather",
    "wilderness-survival",
  ].forEach(b => KNOWN_BADGES.add(b));
}

function parseShortcodeAttributes(attrStr: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /([a-zA-Z0-9_-]+)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(attrStr)) !== null) {
    attrs[match[1]!] = match[2]!;
  }
  return attrs;
}

function extractReferencesFromContent(
  content: string,
  filePath: string,
  sourceRepo: "scouting-u" | "mbu",
): LinkReference[] {
  const references: LinkReference[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNum = i + 1;

    // 1. Shortcode matches: {{< related-guide ... >}} or {{< drg/related-guide ... >}}
    const relatedGuideRegex = /{{\s*<\s*(?:drg\/)?related-guide\s+([^>]+?)\s*\/?>\s*}}/g;
    let match: RegExpExecArray | null;
    while ((match = relatedGuideRegex.exec(line)) !== null) {
      const attrs = parseShortcodeAttributes(match[1]!);
      const badge = attrs["badge"];
      const rank = attrs["rank"];
      const type = attrs["type"];
      const slug = attrs["slug"] || badge || rank;
      const req = attrs["req"] || attrs["req_number"];
      const mode = attrs["mode"] || "guide";
      const customUrl = attrs["url"] || attrs["href"];

      references.push({
        sourceRepo,
        sourceFile: filePath,
        line: lineNum,
        rawText: match[0],
        kind: "related-guide",
        targetType: customUrl ? "custom-url" : badge || type === "badge" || type === "merit-badge" ? "badge" : rank || type === "rank" ? "rank" : undefined,
        slug,
        req,
        mode,
        url: customUrl,
      });
    }

    // 2. Shortcode matches: {{< cross-link ... >}} or {{< drg/cross-link ... >}}
    const crossLinkRegex = /{{\s*<\s*(?:drg\/)?cross-link\s+([^>]+?)\s*\/?>\s*}}/g;
    while ((match = crossLinkRegex.exec(line)) !== null) {
      const attrs = parseShortcodeAttributes(match[1]!);
      const badge = attrs["badge"];
      const rank = attrs["rank"];
      const type = attrs["type"];
      const slug = attrs["slug"] || badge || rank;
      const req = attrs["req"] || attrs["req_number"];
      const mode = attrs["mode"] || "guide";
      const customUrl = attrs["url"] || attrs["href"];

      references.push({
        sourceRepo,
        sourceFile: filePath,
        line: lineNum,
        rawText: match[0],
        kind: "cross-link",
        targetType: customUrl ? "custom-url" : badge || type === "badge" || type === "merit-badge" ? "badge" : rank || type === "rank" ? "rank" : undefined,
        slug,
        req,
        mode,
        url: customUrl,
      });
    }

    // 3. Raw markdown links: [text](url) pointing to cross-site destinations
    const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[a-zA-Z0-9_\-/]+)\)/g;
    while ((match = mdLinkRegex.exec(line)) !== null) {
      const href = match[2]!;
      if (
        href.includes("merit-badge.university") ||
        href.includes("scouting.university") ||
        (sourceRepo === "scouting-u" && href.startsWith("/merit-badges/")) ||
        (sourceRepo === "mbu" && href.startsWith("/scouts-bsa/"))
      ) {
        references.push({
          sourceRepo,
          sourceFile: filePath,
          line: lineNum,
          rawText: match[0],
          kind: "markdown-link",
          targetType: "custom-url",
          url: href,
        });
      }
    }
  }

  return references;
}

function resolveScoutingUUrlToFile(urlPath: string): string | null {
  // Normalize path
  let path = urlPath.replace(/^https?:\/\/[^/]+/, "");
  path = path.split("#")[0]!;
  if (path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  if (!path.startsWith("/")) {
    path = "/" + path;
  }

  const hugoContent = join(SCOUTING_U_ROOT, "hugo", "content");

  // Candidates to test
  const relative = path.replace(/^\//, "");
  const candidates = [
    join(hugoContent, relative, "_index.md"),
    join(hugoContent, relative, "index.md"),
    join(hugoContent, `${relative}.md`),
    join(hugoContent, relative, "req.md"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function resolveMbuUrlToFile(urlPath: string): string | null {
  if (!HAS_MBU) return null;

  let path = urlPath.replace(/^https?:\/\/[^/]+/, "");
  path = path.split("#")[0]!;
  if (path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  if (!path.startsWith("/")) {
    path = "/" + path;
  }

  const hugoContent = join(MBU_ROOT, "hugo", "content");

  const relative = path.replace(/^\//, "");
  const candidates = [
    join(hugoContent, relative, "_index.md"),
    join(hugoContent, relative, "index.md"),
    join(hugoContent, `${relative}.md`),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function validateReference(ref: LinkReference): string | null {
  // 1. Custom URL resolution
  if (ref.url) {
    const cleanUrl = ref.url.replace(/^https?:\/\/[^/]+/, "");
    if (cleanUrl.startsWith("/merit-badges/")) {
      if (HAS_MBU) {
        const resolved = resolveMbuUrlToFile(cleanUrl);
        if (!resolved) {
          return `MBU route "${cleanUrl}" does not resolve to an existing content file in MBU.`;
        }
      }
      return null;
    } else if (cleanUrl.startsWith("/scouts-bsa/") || cleanUrl.startsWith("/ranks/")) {
      const resolved = resolveScoutingUUrlToFile(cleanUrl);
      if (!resolved) {
        return `Scouting University route "${cleanUrl}" does not resolve to an existing content file in Scouting U.`;
      }
      return null;
    } else if (cleanUrl.startsWith("/search/")) {
      return null;
    }
  }

  // 2. Merit Badge Target
  if (ref.targetType === "badge" || (ref.slug && KNOWN_BADGES.has(ref.slug))) {
    const badgeSlug = ref.slug;
    if (!badgeSlug) {
      return `Missing merit badge slug in shortcode.`;
    }
    if (!KNOWN_BADGES.has(badgeSlug)) {
      return `Unknown merit badge slug "${badgeSlug}".`;
    }

    if (HAS_MBU && ref.req) {
      if (ref.mode === "guide" || !ref.mode) {
        // Guide subpage check
        const guideReqFile = join(MBU_ROOT, "hugo", "content", "merit-badges", badgeSlug, "guide", `req${ref.req}.md`);
        const guideIndex = join(MBU_ROOT, "hugo", "content", "merit-badges", badgeSlug, "guide", `_index.md`);
        if (!existsSync(guideReqFile) && !existsSync(guideIndex)) {
          return `MBU merit badge guide requirement file "req${ref.req}.md" or guide _index.md does not exist for "${badgeSlug}".`;
        }
      }
    }
    return null;
  }

  // 3. Rank Target
  if (ref.targetType === "rank" || (ref.slug && KNOWN_RANKS.has(ref.slug))) {
    const rankSlug = ref.slug;
    if (!rankSlug) {
      return `Missing rank slug in shortcode.`;
    }
    if (!KNOWN_RANKS.has(rankSlug)) {
      return `Unknown rank slug "${rankSlug}". Expected one of: ${[...KNOWN_RANKS].join(", ")}`;
    }

    if (ref.req) {
      if (ref.mode === "guide" || !ref.mode) {
        const guideReqFile = join(
          SCOUTING_U_ROOT,
          "hugo",
          "content",
          "scouts-bsa",
          "ranks",
          rankSlug,
          "guide",
          `req${ref.req}.md`,
        );
        const guideIndex = join(
          SCOUTING_U_ROOT,
          "hugo",
          "content",
          "scouts-bsa",
          "ranks",
          rankSlug,
          "guide",
          `_index.md`,
        );
        if (!existsSync(guideReqFile) && !existsSync(guideIndex)) {
          return `Scouting U rank guide requirement file "req${ref.req}.md" does not exist under ranks/${rankSlug}/guide/.`;
        }
      } else if (ref.mode === "requirements") {
        const reqFile = join(
          SCOUTING_U_ROOT,
          "hugo",
          "content",
          "scouts-bsa",
          "ranks",
          rankSlug,
          "requirements",
          "index.md",
        );
        if (!existsSync(reqFile)) {
          return `Scouting U rank requirements index does not exist for rank "${rankSlug}".`;
        }
      }
    }
    return null;
  }

  if (!ref.url && !ref.slug) {
    return `Shortcode is missing target slug or url attribute: ${ref.rawText}`;
  }

  return null;
}

async function collectRepoReferences(
  repoRoot: string,
  sourceRepo: "scouting-u" | "mbu",
): Promise<LinkReference[]> {
  const contentDir = join(repoRoot, "hugo", "content");
  if (!existsSync(contentDir)) return [];

  const references: LinkReference[] = [];
  const glob = new Glob("**/*.md");

  for (const relPath of glob.scanSync(contentDir)) {
    const fullPath = join(contentDir, relPath);
    const content = readFileSync(fullPath, "utf-8");
    const refs = extractReferencesFromContent(content, fullPath, sourceRepo);
    references.push(...refs);
  }

  return references;
}

async function main() {
  console.log("================================================================================");
  console.log("CROSS-SITE DRG LINK VERIFICATION");
  console.log("================================================================================");
  console.log(`Scouting U root : ${SCOUTING_U_ROOT}`);
  console.log(`MBU root        : ${MBU_ROOT} ${HAS_MBU ? "(found)" : "(not found - using fallback badge list)"}`);
  console.log();

  const scoutingURefs = await collectRepoReferences(SCOUTING_U_ROOT, "scouting-u");
  let mbuRefs: LinkReference[] = [];
  if (HAS_MBU) {
    mbuRefs = await collectRepoReferences(MBU_ROOT, "mbu");
  }

  const allRefs = [...scoutingURefs, ...mbuRefs];
  const failures: ValidationFailure[] = [];

  for (const ref of allRefs) {
    const error = validateReference(ref);
    if (error) {
      failures.push({ reference: ref, reason: error });
    }
  }

  const scoutingUFailures = failures.filter(f => f.reference.sourceRepo === "scouting-u");
  const mbuFailures = failures.filter(f => f.reference.sourceRepo === "mbu");

  if (failures.length > 0) {
    console.error(`FAILED: Found ${failures.length} invalid cross-site references:\n`);

    if (scoutingUFailures.length > 0) {
      console.error(`--- Scouting University Issues (${scoutingUFailures.length}) ---`);
      for (const f of scoutingUFailures) {
        const rel = f.reference.sourceFile.replace(SCOUTING_U_ROOT + "/", "");
        console.error(`  ${rel}:${f.reference.line}`);
        console.error(`    Raw   : ${f.reference.rawText}`);
        console.error(`    Error : ${f.reason}\n`);
      }
    }

    if (mbuFailures.length > 0) {
      console.error(`--- Merit Badge University Issues (${mbuFailures.length}) ---`);
      for (const f of mbuFailures) {
        const rel = f.reference.sourceFile.replace(MBU_ROOT + "/", "");
        console.error(`  ${rel}:${f.reference.line}`);
        console.error(`    Raw   : ${f.reference.rawText}`);
        console.error(`    Error : ${f.reason}\n`);
      }
    }

    process.exit(1);
  }

  console.log("SUMMARY");
  console.log("--------------------------------------------------------------------------------");
  console.log(`  Scouting U cross-references scanned: ${scoutingURefs.length}`);
  if (HAS_MBU) {
    console.log(`  MBU cross-references scanned       : ${mbuRefs.length}`);
  }
  console.log(`  Total cross-site links validated   : ${allRefs.length}`);
  console.log(`  Failures                           : 0`);
  console.log("================================================================================");
  console.log("All cross-site DRG links and shortcodes verified successfully!");
}

void main();
