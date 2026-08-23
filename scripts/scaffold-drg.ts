/**
 * Scaffolds the Digital Requirements Guide content tree for one Scouts BSA
 * rank: hugo/content/scouts-bsa/ranks/{slug}/guide/. Trimmed port of
 * mbu/scripts/scaffold-drg.ts -- rank data has no subrequirement_mode,
 * is_option, or resources field (rank.schema.json forbids the latter), and
 * never nests past depth 2 (ADR 0001), so the option/select/pamphlet
 * branches of the badge scaffold don't apply here.
 *
 * Idempotent: never overwrites an existing file.
 */
import { join } from "node:path";

type RequirementList = {
  type: "ul" | "ol";
  items: string[];
};

type RankRequirement = {
  req_id: string;
  path: string;
  text: string;
  list_number: string;
  short: string;
  months_since_last_rank_required: string;
  eagle_mb_required: string;
  total_mb_required: string;
  service_hours_required: string;
  list?: RequirementList;
  children?: RankRequirement[];
};

type RankData = {
  title: string;
  slug: string;
  short: string;
  level: number;
  program: string;
  header: string;
  footer: string;
  footnotes: { marker: string; text: string }[];
  requirements: RankRequirement[];
};

type GuidePageKind = "index" | "requirement" | "extended-learning" | "print";

type GuidePage = {
  kind: GuidePageKind;
  fileName: string;
  pageSlug: string;
  title: string;
  groupTitle: string;
  reqNumber?: string;
  body: string;
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

void scaffoldDrg();

async function scaffoldDrg(): Promise<void> {
  const rank = await loadRankData({ rankDataPath });
  const requirementPages = buildRequirementPages({ rank });
  const guidePages: GuidePage[] = [
    buildIndexPage({ rank, requirementPages }),
    ...requirementPages,
    buildExtendedLearningPage(),
    buildPrintPage(),
  ];

  await Bun.$`mkdir -p ${guideDirectory}`;

  let createdFileCount = 0;
  let skippedFileCount = 0;

  for (const guidePage of guidePages) {
    const pagePath = join(guideDirectory, guidePage.fileName);
    const pageContent = renderPage({ guidePage, guidePages, rank });
    const fileExists = await Bun.file(pagePath).exists();

    if (fileExists) {
      skippedFileCount += 1;
      console.log(`Skipping existing file: ${pagePath}`);
      continue;
    }

    await Bun.write(pagePath, pageContent);
    createdFileCount += 1;
    console.log(`Created ${pagePath}`);
  }

  console.log(
    `Scaffold complete for ${rank.slug}: created ${createdFileCount} file(s), skipped ${skippedFileCount} existing file(s).`,
  );
}

async function loadRankData({
  rankDataPath,
}: {
  rankDataPath: string;
}): Promise<RankData> {
  const rankDataContent = await Bun.file(rankDataPath).text();
  return JSON.parse(rankDataContent) as RankData;
}

/**
 * Page-granularity rule: a top-level requirement with no children is a
 * plain leaf page. Any requirement with children -- however few -- gets an
 * overview page plus one dedicated page per child; there is no combined-page
 * threshold. Group widths vary a lot across ranks (second-class req 2 has 7
 * children, first-class req 6 has 6), but the split is now unconditional.
 */
function buildRequirementPages({ rank }: { rank: RankData }): GuidePage[] {
  const pages: GuidePage[] = [];

  for (const requirement of rank.requirements) {
    const children = requirement.children ?? [];

    if (children.length === 0) {
      pages.push(buildLeafPage({ requirement }));
      continue;
    }

    pages.push(buildOverviewPage({ requirement, children }));
    for (const child of children) {
      pages.push(buildDedicatedChildPage({ requirement, child }));
    }
  }

  return pages;
}

function buildLeafPage({
  requirement,
}: {
  requirement: RankRequirement;
}): GuidePage {
  const reqNumber = compactPath({ path: requirement.path });
  return {
    kind: "requirement",
    fileName: `req${reqNumber}.md`,
    pageSlug: `req${reqNumber}`,
    title: requirementTitle({ requirement }),
    groupTitle: `Requirement ${requirement.req_id}`,
    reqNumber,
    body: [
      buildRequirementShortcodeBlock({
        number: reqNumber,
        text: stripFootnoteMarkers({ text: requirement.text }),
      }),
      renderRequirementList({ requirement }),
      "",
      "[PLACEHOLDER: Write the instructional body for this requirement.]",
    ]
      .filter(line => line !== "")
      .join("\n\n"),
  };
}

function buildOverviewPage({
  requirement,
  children,
}: {
  requirement: RankRequirement;
  children: RankRequirement[];
}): GuidePage {
  const reqNumber = compactPath({ path: requirement.path });
  const targetSummaries = children
    .map(child => {
      const url = pageUrl({
        slug: rankSlug(),
        pageSlug: `req${compactPath({ path: child.path })}`,
      });
      const title = child.short || `Requirement ${compactPath({ path: child.path })}`;
      const rawLabel = child.list_number || compactPath({ path: child.path });
      const label = rawLabel.endsWith(".") ? rawLabel : `${rawLabel}.`;
      return `- ${label} **[${title}](${url})**: [PLACEHOLDER: Summarize what the Scout will do and gain on this page.]`;
    })
    .join("\n");
  const firstChildPageSlug = `req${compactPath({ path: children[0]!.path })}`;

  return {
    kind: "requirement",
    fileName: `req${reqNumber}.md`,
    pageSlug: `req${reqNumber}`,
    title: requirementTitle({ requirement }),
    groupTitle: `Requirement ${requirement.req_id}`,
    reqNumber,
    body: [
      buildRequirementShortcodeBlock({
        number: reqNumber,
        text: stripFootnoteMarkers({ text: requirement.text }),
      }),
      "Work through each child requirement below in order. Use this page as your roadmap before you open the first detailed child page.",
      "## What You'll Complete",
      targetSummaries,
      "[PLACEHOLDER: Add orienting context, sequencing advice, or quick preparation notes for this requirement.]",
      buildNextPageShortcode({
        targetPageSlug: firstChildPageSlug,
        text: "[PLACEHOLDER: Transition text]",
        teaser: "[PLACEHOLDER: Preview the first child requirement page]",
      }),
    ].join("\n\n"),
  };
}

/**
 * A dedicated child page (split, >=4-child group) is its own page, so its
 * lead `drg/requirement` call must be the one whose `number` equals the
 * page's own `req_number` -- that equality is what makes uni-theme's
 * shortcode treat it as the page's lead (title-dedup + the `.req-rail`
 * Page.Store write). `drg/inherited-requirement` never does that write, so
 * it can't be used for a page's own lead even when the child's text reads
 * as a bare topic; the parent-stem merge for such a child is left to the
 * page's own prose, not the scaffold.
 */
function buildDedicatedChildPage({
  requirement,
  child,
}: {
  requirement: RankRequirement;
  child: RankRequirement;
}): GuidePage {
  const reqNumber = compactPath({ path: child.path });
  return {
    kind: "requirement",
    fileName: `req${reqNumber}.md`,
    pageSlug: `req${reqNumber}`,
    title: requirementTitle({ requirement: child }),
    groupTitle: `Requirement ${requirement.req_id}`,
    reqNumber,
    body: [
      buildRequirementShortcodeBlock({
        number: reqNumber,
        text: stripFootnoteMarkers({ text: child.text }),
      }),
      renderRequirementList({ requirement: child }),
      "",
      "[PLACEHOLDER: Write the instructional body for this requirement.]",
    ]
      .filter(line => line !== "")
      .join("\n\n"),
  };
}

function requirementTitle({
  requirement,
}: {
  requirement: RankRequirement;
}): string {
  if (requirement.short === "") {
    throw new Error(
      `Requirement ${requirement.path} has no curated Short Label -- ADR 0011 requires one before a guide page can be scaffolded for it.`,
    );
  }
  return requirement.short;
}

function compactPath({ path }: { path: string }): string {
  return path.split(".").join("");
}

function renderRequirementList({
  requirement,
}: {
  requirement: RankRequirement;
}): string {
  const list = requirement.list;
  if (list === undefined || list.items.length === 0) {
    return "";
  }

  const marker = list.type === "ol" ? (index: number) => `${index + 1}.` : () => "-";
  return list.items.map((item, index) => `${marker(index)} ${item}`).join("\n");
}

function stripFootnoteMarkers({ text }: { text: string }): string {
  return text.replace(/<sup>\s*<a href="#fn-\d+">\d+<\/a>\s*<\/sup>/g, "");
}

function buildRequirementShortcodeBlock({
  number,
  text,
}: {
  number: string;
  text: string;
}): string {
  return [
    `{{< drg/requirement number="${number}" text_format="html" >}}`,
    text,
    "{{< /drg/requirement >}}",
  ].join("\n");
}

function buildNextPageShortcode({
  targetPageSlug,
  text,
  teaser,
}: {
  targetPageSlug: string;
  text: string;
  teaser: string;
}): string {
  return [
    "{{< drg/next-page",
    `    text="${escapeAttribute({ value: text })}"`,
    `    teaser="${escapeAttribute({ value: teaser })}"`,
    `    url="${pageUrl({ slug: rankSlug(), pageSlug: targetPageSlug })}" >}}`,
  ].join("\n");
}

function escapeAttribute({ value }: { value: string }): string {
  return value.split('"').join('\\"');
}

function rankSlug(): string {
  if (RANK_SLUG === undefined || RANK_SLUG === "") {
    throw new Error("RANK_SLUG is required");
  }
  return RANK_SLUG;
}

function pageUrl({ slug, pageSlug }: { slug: string; pageSlug: string }): string {
  if (pageSlug === "") {
    return `/scouts-bsa/ranks/${slug}/guide/`;
  }
  return `/scouts-bsa/ranks/${slug}/guide/${pageSlug}/`;
}

function buildIndexPage({
  rank,
  requirementPages,
}: {
  rank: RankData;
  requirementPages: GuidePage[];
}): GuidePage {
  const firstRequirementPage = requirementPages[0];
  const structuredFacts = collectStructuredFacts({ rank });

  return {
    kind: "index",
    fileName: "_index.md",
    pageSlug: "",
    title: "Introduction & Overview",
    groupTitle: "Getting Started",
    body: [
      "## Overview",
      "[PLACEHOLDER: Write a 2-4 sentence overview of this rank and why a Scout should care about earning it.]",
      "## Building on the Last Rank",
      "[PLACEHOLDER: Reference the Scout's previous rank -- Scout spirit, service, positions of responsibility, or other requirements that repeat here with a raised bar. Link to that rank's guide where useful.]",
      "## What It Takes",
      structuredFacts.length === 0
        ? "[PLACEHOLDER: This rank has no populated tenure/merit-badge/service-hour fields to surface.]"
        : `[PLACEHOLDER: Surface these structured requirement fields where the Scout will feel them: ${structuredFacts.join("; ")}.]`,
      "## Get Ready!",
      "[PLACEHOLDER: Add a short motivational callout that prepares the Scout to begin.]",
      firstRequirementPage === undefined
        ? "[PLACEHOLDER: Add a drg/next-page shortcode once requirement pages exist.]"
        : buildNextPageShortcode({
            targetPageSlug: firstRequirementPage.pageSlug,
            text: "[PLACEHOLDER: Intro transition text]",
            teaser: "[PLACEHOLDER: What the Scout will learn next]",
          }),
    ].join("\n\n"),
  };
}

function collectStructuredFacts({ rank }: { rank: RankData }): string[] {
  const facts: string[] = [];

  const visit = (requirement: RankRequirement): void => {
    if (requirement.months_since_last_rank_required !== "") {
      facts.push(
        `req ${requirement.req_id}: ${requirement.months_since_last_rank_required} months since last rank`,
      );
    }
    if (requirement.eagle_mb_required !== "" || requirement.total_mb_required !== "") {
      facts.push(
        `req ${requirement.req_id}: ${requirement.total_mb_required || "?"} merit badges total, ${requirement.eagle_mb_required || "0"} from the Eagle-required list`,
      );
    }
    if (requirement.service_hours_required !== "") {
      facts.push(`req ${requirement.req_id}: ${requirement.service_hours_required} service hours`);
    }
    for (const child of requirement.children ?? []) {
      visit(child);
    }
  };

  for (const requirement of rank.requirements) {
    visit(requirement);
  }

  return facts;
}

function buildExtendedLearningPage(): GuidePage {
  return {
    kind: "extended-learning",
    fileName: "extended-learning.md",
    pageSlug: "extended-learning",
    title: "Extended Learning",
    groupTitle: "Beyond the Rank",
    body: [
      "## Congratulations!",
      "[PLACEHOLDER: Congratulate the Scout and explain how this rank connects to lifelong learning.]",
      "## Dig Deeper",
      "[PLACEHOLDER: Add broader context, advanced concepts, or real-world applications beyond the rank requirements.]",
      "## Try This Next",
      "[PLACEHOLDER: Suggest concrete next experiences, projects, or practice opportunities.]",
      "## Organizations and Resources",
      "[PLACEHOLDER: Add high-quality organizations, programs, or references for continued exploration.]",
    ].join("\n\n"),
  };
}

function buildPrintPage(): GuidePage {
  return {
    kind: "print",
    fileName: join("print", "index.md"),
    pageSlug: "print",
    title: "Complete Digital Requirements Guide",
    groupTitle: "Printable Guide",
    body: "",
  };
}

function yamlQuote(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function buildGuideNav({
  guidePages,
  rank,
}: {
  guidePages: GuidePage[];
  rank: RankData;
}): { groupTitle: string; items: { title: string; url: string }[] }[] {
  const groups = new Map<string, { title: string; url: string }[]>();

  for (const guidePage of guidePages) {
    if (guidePage.kind === "print") {
      continue;
    }

    const items = groups.get(guidePage.groupTitle) ?? [];
    items.push({
      title: guidePage.title,
      url: pageUrl({ slug: rank.slug, pageSlug: guidePage.pageSlug }),
    });
    groups.set(guidePage.groupTitle, items);
  }

  return Array.from(groups.entries()).map(([groupTitle, items]) => ({
    groupTitle,
    items,
  }));
}

function renderPage({
  guidePage,
  guidePages,
  rank,
}: {
  guidePage: GuidePage;
  guidePages: GuidePage[];
  rank: RankData;
}): string {
  const pageIndex = guidePages.findIndex(
    candidate => candidate.fileName === guidePage.fileName,
  );
  const previousPage = pageIndex > 0 ? guidePages[pageIndex - 1] : undefined;
  const nextPage =
    pageIndex >= 0 && pageIndex < guidePages.length - 1
      ? guidePages[pageIndex + 1]
      : undefined;

  const lines = [
    "---",
    `title: ${yamlQuote(guidePage.title)}`,
    `layout: ${yamlQuote(guidePage.kind === "print" ? "guide-print" : "guide")}`,
    `rank_slug: ${yamlQuote(rank.slug)}`,
  ];

  if (guidePage.kind === "index" || guidePage.kind === "print") {
    lines.push(`rank_name: ${yamlQuote(rank.title)}`);
    lines.push(`drg_noun: ${yamlQuote("Rank")}`);
  }

  if (guidePage.kind !== "print") {
    lines.push(`group_title: ${yamlQuote(guidePage.groupTitle)}`);
  }

  if (guidePage.kind === "requirement" && guidePage.reqNumber !== undefined) {
    lines.push(`req_number: ${yamlQuote(guidePage.reqNumber)}`);
  }

  if (guidePage.kind === "index") {
    const identityEyebrow = `Rank ${rank.level} of 7`;
    lines.push("identity:");
    lines.push(`  eyebrow: ${yamlQuote(identityEyebrow)}`);
    lines.push(`  title: ${yamlQuote(rank.title)}`);
    lines.push("  demote_heading: true");
    lines.push(`  micro_tag: ${yamlQuote(`${rank.program.toUpperCase()} RANK`)}`);
  }

  if (guidePage.kind === "print") {
    lines.push("noindex: true");
    lines.push(
      `canonical_override: ${yamlQuote(`/scouts-bsa/ranks/${rank.slug}/guide/`)}`,
    );
    lines.push("build:");
    lines.push("  list: never");
  }

  if (guidePage.kind !== "print" && previousPage !== undefined) {
    lines.push(
      `prev: ${yamlQuote(pageUrl({ slug: rank.slug, pageSlug: previousPage.pageSlug }))}`,
    );
    lines.push(`prev_title: ${yamlQuote(previousPage.title)}`);
  }

  if (guidePage.kind !== "print" && nextPage !== undefined) {
    lines.push(
      `next: ${yamlQuote(pageUrl({ slug: rank.slug, pageSlug: nextPage.pageSlug }))}`,
    );
    lines.push(`next_title: ${yamlQuote(nextPage.title)}`);
  }

  if (guidePage.kind === "index") {
    const guideNav = buildGuideNav({ guidePages, rank });
    lines.push("guide_nav:");
    for (const group of guideNav) {
      lines.push(`  - group_title: ${yamlQuote(group.groupTitle)}`);
      lines.push("    items:");
      for (const item of group.items) {
        lines.push(`      - title: ${yamlQuote(item.title)}`);
        lines.push(`        url: ${yamlQuote(item.url)}`);
      }
    }
  }

  if (guidePage.kind === "print") {
    lines.push("---", "");
    return lines.join("\n");
  }

  lines.push("---", "", guidePage.body, "");
  return lines.join("\n");
}
