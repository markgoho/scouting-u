/**
 * Structural checks for a scaffolded/authored Digital Requirements Guide.
 * Trimmed from mbu's three verify-drg-* scripts: rank data has no
 * resources/subrequirement_mode/is_option, so the resource- and
 * mode-driven checks those scripts run don't apply here.
 *
 * Usage: RANK_SLUG=<slug> bun run verify:drg
 */
import { Glob } from "bun";
import { join } from "node:path";

type RankRequirement = {
  req_id: string;
  path: string;
  short: string;
  children?: RankRequirement[];
};

type RankData = {
  title: string;
  slug: string;
  requirements: RankRequirement[];
};

const RANK_SLUG = process.env["RANK_SLUG"];

if (RANK_SLUG === undefined || RANK_SLUG === "") {
  throw new Error("RANK_SLUG is required");
}

const rankDataPath = join(
  process.cwd(),
  "hugo",
  "data",
  "ranks",
  "scouts-bsa",
  `${RANK_SLUG}.json`,
);
const guideDirectory = join(
  process.cwd(),
  "hugo",
  "content",
  "scouts-bsa",
  "ranks",
  RANK_SLUG,
  "guide",
);

const FORBIDDEN_VOCABULARY = ["data.json", "scaffold-drg", "verify-drg", "JSON"];

void verifyDrg();

async function verifyDrg(): Promise<void> {
  const rank = JSON.parse(
    await Bun.file(rankDataPath).text(),
  ) as RankData;

  const structuralFailures: string[] = [];
  const placeholderFailures: string[] = [];
  const vocabularyFailures: string[] = [];

  const pageFiles = await collectGuidePageFiles();
  const pages = await Promise.all(
    pageFiles.map(async file => ({
      file,
      content: await Bun.file(file).text(),
    })),
  );

  checkRequirementCoverage({ rank, pages, failures: structuralFailures });
  checkGuideNavAndChain({ pages, failures: structuralFailures });
  checkPlaceholders({ pages, failures: placeholderFailures });
  checkVocabulary({ pages, failures: vocabularyFailures });
  await checkImages({ pages, failures: structuralFailures });

  report({ structuralFailures, placeholderFailures, vocabularyFailures });
}

async function collectGuidePageFiles(): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of new Glob("**/*.md").scan(guideDirectory)) {
    files.push(join(guideDirectory, entry));
  }
  return files;
}

type GuidePageFile = { file: string; content: string };

function pageSlugFromFile(file: string): string {
  const relative = file.slice(guideDirectory.length + 1);
  if (relative === "_index.md") {
    return "";
  }
  if (relative === join("print", "index.md")) {
    return "print";
  }
  return relative.replace(/\.md$/, "");
}

function extractScalarField({
  content,
  key,
}: {
  content: string;
  key: string;
}): string | undefined {
  const match = new RegExp(`^${key}: "((?:[^"\\\\]|\\\\.)*)"$`, "m").exec(content);
  if (match?.[1] === undefined) {
    return undefined;
  }
  return match[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}

function extractGuideNavUrls({ content }: { content: string }): string[] {
  return [...content.matchAll(/^\s+url: "([^"]*)"$/gm)].map(match => match[1]!);
}

function extractAnchorIds({ content }: { content: string }): string[] {
  return [...content.matchAll(/\{#([0-9][0-9a-zA-Z]*)\}/g)].map(match => match[1]!);
}

function collectAllRequirementPaths({
  rank,
}: {
  rank: RankData;
}): string[] {
  const paths: string[] = [];
  const visit = (requirement: RankRequirement): void => {
    paths.push(requirement.path);
    for (const child of requirement.children ?? []) {
      visit(child);
    }
  };
  for (const requirement of rank.requirements) {
    visit(requirement);
  }
  return paths;
}

function checkRequirementCoverage({
  rank,
  pages,
  failures,
}: {
  rank: RankData;
  pages: GuidePageFile[];
  failures: string[];
}): void {
  const pageReqNumbers = new Set(
    pages
      .map(page => extractScalarField({ content: page.content, key: "req_number" }))
      .filter((value): value is string => value !== undefined),
  );
  const anchoredIds = new Set(pages.flatMap(page => extractAnchorIds({ content: page.content })));

  for (const path of collectAllRequirementPaths({ rank })) {
    const dotsRemoved = path.split(".").join("");
    if (!pageReqNumbers.has(dotsRemoved) && !anchoredIds.has(dotsRemoved)) {
      failures.push(
        `Requirement ${path} has no guide page (req_number) and no {#${dotsRemoved}} anchor in any page.`,
      );
    }
  }
}

function checkGuideNavAndChain({
  pages,
  failures,
}: {
  pages: GuidePageFile[];
  failures: string[];
}): void {
  const indexPage = pages.find(page => pageSlugFromFile(page.file) === "");
  if (indexPage === undefined) {
    failures.push("No _index.md found in the guide directory.");
    return;
  }

  const knownSlugs = new Set(pages.map(page => pageSlugFromFile(page.file)));
  const urlToSlug = (url: string): string => {
    const trimmed = url.replace(/\/guide\/?$/, "/guide/").split("/guide/")[1] ?? "";
    return trimmed.replace(/\/$/, "");
  };

  for (const url of extractGuideNavUrls({ content: indexPage.content })) {
    const slug = urlToSlug(url);
    if (!knownSlugs.has(slug)) {
      failures.push(`guide_nav entry "${url}" does not resolve to a generated page.`);
    }
  }

  const nonPrintPages = pages.filter(page => pageSlugFromFile(page.file) !== "print");
  const bySlug = new Map(nonPrintPages.map(page => [pageSlugFromFile(page.file), page]));

  let current: GuidePageFile | undefined = indexPage;
  const visited = new Set<string>();
  while (current !== undefined) {
    const slug = pageSlugFromFile(current.file);
    if (visited.has(slug)) {
      failures.push(`prev/next chain has a cycle at "${slug}".`);
      break;
    }
    visited.add(slug);
    const nextUrl = extractScalarField({ content: current.content, key: "next" });
    if (nextUrl === undefined) {
      break;
    }
    const nextSlug = urlToSlug(nextUrl);
    current = bySlug.get(nextSlug) ?? pages.find(page => pageSlugFromFile(page.file) === nextSlug);
    if (current === undefined) {
      failures.push(`"${slug}"'s next ("${nextUrl}") does not resolve to a generated page.`);
    }
  }

  for (const slug of bySlug.keys()) {
    if (!visited.has(slug)) {
      failures.push(`"${slug}" is unreachable by following the prev/next chain from _index.md.`);
    }
  }
}

function checkPlaceholders({
  pages,
  failures,
}: {
  pages: GuidePageFile[];
  failures: string[];
}): void {
  for (const page of pages) {
    const count = (page.content.match(/\[PLACEHOLDER:/g) ?? []).length;
    if (count > 0) {
      failures.push(
        `${pageSlugFromFile(page.file) || "_index"}: ${count} placeholder marker(s) remain -- expected for a freshly scaffolded guide, fill in before publishing.`,
      );
    }
  }
}

function checkVocabulary({
  pages,
  failures,
}: {
  pages: GuidePageFile[];
  failures: string[];
}): void {
  for (const page of pages) {
    const proseOnly = page.content.replace(/\[PLACEHOLDER:[^\]]*\]/g, "");
    for (const term of FORBIDDEN_VOCABULARY) {
      if (proseOnly.includes(term)) {
        failures.push(
          `${pageSlugFromFile(page.file) || "_index"}: internal vocabulary "${term}" appears outside a [PLACEHOLDER: ...] marker.`,
        );
      }
    }
  }
}

async function checkImages({
  pages,
  failures,
}: {
  pages: GuidePageFile[];
  failures: string[];
}): Promise<void> {
  const manifestPath = join(guideDirectory, "images.json");
  const manifestFile = Bun.file(manifestPath);
  if (!(await manifestFile.exists())) {
    return;
  }

  const manifest = JSON.parse(await manifestFile.text()) as {
    images: Array<{ id: string }>;
  };
  const manifestIds = manifest.images.map(image => image.id);
  const seenIds = new Set<string>();
  for (const id of manifestIds) {
    if (seenIds.has(id)) {
      failures.push(`images.json: duplicate id "${id}".`);
    }
    seenIds.add(id);
  }

  const srcCounts = new Map<string, number>();
  for (const page of pages) {
    const orphanPlaceholders = (page.content.match(/<!-- IMAGE:/g) ?? []).length;
    if (orphanPlaceholders > 0) {
      failures.push(
        `${pageSlugFromFile(page.file) || "_index"}: ${orphanPlaceholders} unconverted <!-- IMAGE: --> placeholder(s) remain — images.json exists, so these should already be drg/image shortcodes.`,
      );
    }
    for (const match of page.content.matchAll(/{{<\s*drg\/image\s+src="([^"]+)"/g)) {
      const src = match[1]!;
      srcCounts.set(src, (srcCounts.get(src) ?? 0) + 1);
    }
  }

  for (const [src, count] of srcCounts) {
    if (count > 1) {
      failures.push(`drg/image src "${src}" is used ${count} times — every src must be unique across the guide.`);
    }
    const id = src.replace(/^images\//, "").replace(/\.(avif|png)$/, "");
    if (!seenIds.has(id)) {
      failures.push(`drg/image src "${src}" (id: ${id}) has no entry in images.json.`);
    }
  }

  for (const id of manifestIds) {
    const referenced = [...srcCounts.keys()].some(
      src => src.replace(/^images\//, "").replace(/\.(avif|png)$/, "") === id,
    );
    if (!referenced) {
      failures.push(`images.json id "${id}" has no drg/image shortcode referencing it.`);
    }
  }
}

function report({
  structuralFailures,
  placeholderFailures,
  vocabularyFailures,
}: {
  structuralFailures: string[];
  placeholderFailures: string[];
  vocabularyFailures: string[];
}): void {
  const hardFailures = [...structuralFailures, ...vocabularyFailures];

  if (placeholderFailures.length > 0) {
    console.log(`Placeholders remaining (expected pre-publish):\n${placeholderFailures.join("\n")}`);
  }

  if (hardFailures.length > 0) {
    console.error(`\nverify:drg failed:\n${hardFailures.join("\n")}`);
    process.exit(1);
  }

  console.log(
    `\nverify:drg structural checks passed for ${RANK_SLUG}.${placeholderFailures.length > 0 ? " Placeholders still need to be filled in before this guide is publish-ready." : ""}`,
  );
}
