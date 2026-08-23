const RANKS_ENDPOINT = "https://api.scouting.org/advancements/v2/ranks";
const REQUIREMENTS_ENDPOINT_PREFIX =
  "https://api.scouting.org/advancements/v2/ranks";
const SCHEMA_URL = "../../../static/schemas/rank.schema.json";
const SCOUTS_BSA_PROGRAM_ID = 2;
const RANK_IDS = [1, 2, 3, 4, 5, 6, 7];

type ApiRankCatalogEntry = {
  id: number;
  name: string;
  short: string;
  level: number;
  programId: number;
  program: string;
};

type ApiRequirementRow = {
  listNumber: string;
  name: string;
  short: string;
  versionId: string;
  monthsSinceLastRankRequired: string;
  eagleMBRequired: string;
  totalMBRequired: string;
  serviceHoursRequired: string;
};

type ApiRankInformation = {
  versionEffectiveDt: string;
  header: string;
  footer: string;
};

type ApiRequirementsResponse = {
  rankInformation: ApiRankInformation;
  requirements: ApiRequirementRow[];
};

type RequirementList = {
  type: "ul" | "ol";
  items: string[];
};

type Requirement = {
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
  children?: Requirement[];
};

type Footnote = {
  marker: string;
  text: string;
};

type RankData = {
  $schema: string;
  title: string;
  slug: string;
  short: string;
  level: number;
  program: string;
  version_id: string;
  version_effective_date: string;
  header: string;
  footer: string;
  footnotes: Footnote[];
  requirements: Requirement[];
};

// One hand-written paragraph per rank -- see #17's resolution comment.
const RANK_DESCRIPTIONS: Record<number, string> = {
  1: "Scout is the first rank in Scouts BSA, earned by learning the Scout Oath and Law, the Scout motto and slogan, and the basics of patrol life — from a proper salute and handshake to the buddy system and personal safety awareness. It sets the foundation everything else in the program builds on.",
  2: "Tenderfoot is the first rank earned through real time in the outdoors, requiring a Scout to demonstrate physical fitness, basic camping and cooking skills, and knot-tying, while continuing to grow as an active member of a patrol and troop.",
  3: "Second Class builds directly on Tenderfoot, asking a Scout to navigate with a map and compass, plan and cook a patrol meal, and demonstrate a deeper set of outdoor and first-aid skills — the point at which a Scout starts operating with real independence on a campout.",
  4: "First Class has long been considered the rank that makes a ‘complete’ Scout: it rounds out core outdoor skills like cooking, camping, and swimming, and asks a Scout to put them to use leading and teaching younger Scouts in the troop.",
  5: "Star Scout is the first of the leadership ranks, opening the path toward Eagle. It requires sustained active membership, a position of responsibility in the troop, a growing count of merit badges, and a service project, marking the shift from learning skills to leading with them.",
  6: "Life Scout deepens the leadership and merit badge requirements first introduced at Star, asking a Scout to serve longer in a position of responsibility, earn more merit badges, and complete another service project — the last rank before Eagle.",
  7: "Eagle Scout is Scouts BSA’s highest rank, earned through a required set of merit badges, sustained leadership in a position of responsibility, and a self-planned and led service project that benefits a community organization — a capstone most Scouts pursue over several years.",
};

const ALLOWED_TAGS = new Set([
  "strong",
  "em",
  "i",
  "sup",
  "p",
  "ul",
  "ol",
  "li",
  "q",
  "a",
]);
const VOID_TAGS = new Set(["br"]);

const LIST_NUMBER_PATTERN = /^(\d+)([a-z]?)\.?$/i;

// The one known malformed row in the corpus: Tenderfoot 6c has an <li>
// where a </li> was meant. Patched here rather than trusted as balanced.
const TENDERFOOT_6C_BROKEN =
  "curl-ups________ (Record the number done correctly in 60 seconds)<li>";
const TENDERFOOT_6C_FIXED =
  "curl-ups________ (Record the number done correctly in 60 seconds)</li>";
let tenderfoot6cPatchCount = 0;

// Known one-off citation-marker defects: hand-patched here rather than
// trusted, same rationale as Tenderfoot 6c above. Scoped to an exact
// (rank, requirement path) pair so the same source string on a different
// requirement is never touched by accident.
type KnownMarkerPatch = {
  rankSlug: string;
  path: string;
  broken: string;
  fixed: string;
};

// Life 3 ends in a bare "*" with no corresponding footer note anywhere --
// leftover from an older, uncorrected printing of the requirement (the
// sentence's own "17 merit badges" is itself stale; Eagle's current
// requirement 3 lists 13, and Star's identical cross-reference sentence
// carries no asterisk at all). Nothing to link to, so it's stripped.
const LIFE_3_ORPHAN_MARKER: KnownMarkerPatch = {
  rankSlug: "life",
  path: "3",
  broken: "for this list.*",
  fixed: "for this list.",
};

// Scout and Star both cite the internet-access waiver as a bare digit
// ("...videos</i>.1 (See...") instead of <sup>1</sup>. Scout's footer
// defines note 1 with the matching text, so that one links cleanly below.
// Star's footer has no note "1" -- only 6, 7, 8 -- so there's nothing to
// link to; stripped instead.
const STAR_6B_ORPHAN_MARKER: KnownMarkerPatch = {
  rankSlug: "star",
  path: "6.b",
  broken: "videos</a></i>.1 (See",
  fixed: "videos</a></i>. (See",
};
const SCOUT_6B_BARE_MARKER: KnownMarkerPatch = {
  rankSlug: "scout",
  path: "6.b",
  broken: "videos</a></i>.1 (See",
  fixed: 'videos</a></i>.<sup><a href="#fn-1">1</a></sup> (See',
};
const KNOWN_MARKER_PATCHES: KnownMarkerPatch[] = [
  LIFE_3_ORPHAN_MARKER,
  STAR_6B_ORPHAN_MARKER,
  SCOUT_6B_BARE_MARKER,
];
const appliedMarkerPatchCounts = new Map<string, number>();

// Footer notes with no citation anywhere in the requirement body -- kept in
// `footnotes` (the content is real) but excluded from the "every footnote
// must be cited" check below.
const KNOWN_UNCITED_FOOTNOTES: { rankSlug: string; marker: string }[] = [
  // "Cyber Chip" note; Star has no Cyber Chip requirement, and the related
  // requirement (6b, Personal Safety Awareness videos) cites nothing here.
  { rankSlug: "star", marker: "7" },
  // Duplicated verbatim as requirement 8's own self-contained "*" footnote.
  { rankSlug: "life", marker: "10" },
];

function computePath({
  parentPath,
  requirementId,
}: {
  parentPath: string;
  requirementId: string;
}): string {
  return parentPath === "" ? requirementId : `${parentPath}.${requirementId}`;
}

function slugify({ text }: { text: string }): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function decodeEntities({ text }: { text: string }): string {
  return text.replaceAll("&rsquo;", "’");
}

function normalizeLineBreaks({ html }: { html: string }): string {
  return html.replaceAll(/<br\s*\/?>|<\/br>/gi, "<br>");
}

function stripDecorativeClasses({ html }: { html: string }): string {
  return html.replaceAll(/\s+class="li-(?:disc|none|a)"/g, "");
}

function patchKnownMalformedMarkup({ html }: { html: string }): string {
  if (!html.includes(TENDERFOOT_6C_BROKEN)) {
    return html;
  }
  tenderfoot6cPatchCount += 1;
  return html.replace(TENDERFOOT_6C_BROKEN, TENDERFOOT_6C_FIXED);
}

function collapseWhitespace({ text }: { text: string }): string {
  return text.replaceAll(/\s+/g, " ").trim();
}

function assertBalancedAllowedTags({
  html,
  context,
}: {
  html: string;
  context: string;
}): void {
  const tagPattern = /<\/?([a-z]+)\b[^>]*>/gi;
  const stack: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(html)) !== null) {
    const tagName = match[1]!.toLowerCase();
    if (VOID_TAGS.has(tagName)) {
      continue;
    }

    const isClosing = match[0].startsWith("</");
    if (!ALLOWED_TAGS.has(tagName)) {
      throw new Error(`Disallowed tag <${tagName}> in ${context}`);
    }

    if (isClosing) {
      const expected = stack.pop();
      if (expected !== tagName) {
        throw new Error(
          `Unbalanced </${tagName}> in ${context} (expected </${expected ?? "nothing open"}>)`,
        );
      }
    } else {
      stack.push(tagName);
    }
  }

  if (stack.length > 0) {
    throw new Error(`Unclosed tag(s) ${stack.join(", ")} in ${context}`);
  }
}

function sanitizeHtml({
  html,
  context,
}: {
  html: string;
  context: string;
}): string {
  if (html.trim() === "") {
    return "";
  }

  let sanitized = decodeEntities({ text: html });
  sanitized = normalizeLineBreaks({ html: sanitized });
  sanitized = stripDecorativeClasses({ html: sanitized });
  sanitized = patchKnownMalformedMarkup({ html: sanitized });
  assertBalancedAllowedTags({ html: sanitized, context });
  return collapseWhitespace({ text: sanitized });
}

function applyKnownMarkerPatch({
  rankSlug,
  path,
  text,
  patch,
}: {
  rankSlug: string;
  path: string;
  text: string;
  patch: KnownMarkerPatch;
}): string {
  if (rankSlug !== patch.rankSlug || path !== patch.path) {
    return text;
  }
  if (!text.includes(patch.broken)) {
    throw new Error(
      `Expected known-marker text "${patch.broken}" not found in ${rankSlug} ${path}`,
    );
  }
  const key = `${patch.rankSlug}:${patch.path}`;
  appliedMarkerPatchCounts.set(key, (appliedMarkerPatchCounts.get(key) ?? 0) + 1);
  return text.replace(patch.broken, patch.fixed);
}

// Rewrites a citation marker like <sup>4</sup> or the compound <sup>4,
// 5</sup> into linked <a href="#fn-N"> citations, one per digit, so it
// resolves to req-footnotes.html's id="fn-N" targets. Throws on any digit
// with no matching footer definition -- a real, previously-unseen orphan
// should fail the sync, not render as a dead link.
function linkFootnoteCitations({
  text,
  footnoteMarkers,
  context,
}: {
  text: string;
  footnoteMarkers: Set<string>;
  context: string;
}): string {
  return text.replaceAll(/<sup>([\d,\s]+)<\/sup>/g, (_whole, rawList: string) => {
    const digits = rawList.split(",").map(digit => digit.trim());
    const links = digits.map(digit => {
      if (!footnoteMarkers.has(digit)) {
        throw new Error(
          `${context}: citation marker "${digit}" has no matching footnote definition`,
        );
      }
      return `<a href="#fn-${digit}">${digit}</a>`;
    });
    return `<sup>${links.join(", ")}</sup>`;
  });
}

// Splits a rank's sanitized footer blob into its non-footnote intro prose
// and the numbered footnote definitions that follow. Footers always
// introduce a definition with a bare <sup>N</sup> (never compound); text
// before the first one is the intro, and each subsequent chunk up to the
// next marker (or end of string) is that note's definition.
function parseFooter({
  html,
  context,
}: {
  html: string;
  context: string;
}): { intro: string; footnotes: Footnote[] } {
  const markerPattern = /<sup>(\d+)<\/sup>/g;
  const matches = [...html.matchAll(markerPattern)];
  if (matches.length === 0) {
    return { intro: html, footnotes: [] };
  }

  const intro = collapseWhitespace({ text: html.slice(0, matches[0]!.index) });
  assertBalancedAllowedTags({ html: intro, context: `${context} intro` });

  const footnotes = matches.map((match, i) => {
    const start = match.index! + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1]!.index! : html.length;
    const marker = match[1]!;
    const text = collapseWhitespace({
      text: html
        .slice(start, end)
        .replace(/^(\s*<br\s*\/?>\s*)+/i, "")
        .replace(/(\s*<br\s*\/?>\s*)+$/i, ""),
    });
    assertBalancedAllowedTags({ html: text, context: `${context} note ${marker}` });
    return { marker, text };
  });

  return { intro, footnotes };
}

// Pulls a trailing <ul>/<ol> checklist off the end of a requirement's text
// into a structured list, so the theme can render it as a real list instead
// of trusting raw markup passed through safeHTML. List items must be plain
// text -- a nested tag inside an <li> means the shape has changed and needs
// a human look, not a silent pass-through.
function extractTrailingList({
  text,
}: {
  text: string;
}): { text: string; list?: RequirementList } {
  const match = /^(.*?)\s*<(ul|ol)>(.*)<\/\2>$/s.exec(text);
  if (match === null) {
    return { text };
  }

  const [, before, tag, inner] = match;
  const items = [...inner!.matchAll(/<li>(.*?)<\/li>/gs)].map(itemMatch => {
    const item = collapseWhitespace({ text: itemMatch[1]! });
    if (item.includes("<")) {
      throw new Error(`extractTrailingList: list item contains markup: "${item}"`);
    }
    return item;
  });

  if (items.length === 0) {
    return { text };
  }

  return {
    text: collapseWhitespace({ text: before! }),
    list: { type: tag as "ul" | "ol", items },
  };
}

// Runs a requirement's sanitized text through the known-marker patches,
// footnote-citation linking, and trailing-list extraction, in that order --
// the bare-digit patches insert or remove content outside any <sup> tag, so
// they have to run before the generic <sup> rewriter sees the text.
function structureRequirementText({
  text,
  rankSlug,
  path,
  footnoteMarkers,
  citedMarkers,
  context,
}: {
  text: string;
  rankSlug: string;
  path: string;
  footnoteMarkers: Set<string>;
  citedMarkers: Set<string>;
  context: string;
}): { text: string; list?: RequirementList } {
  let patched = text;
  for (const patch of KNOWN_MARKER_PATCHES) {
    patched = applyKnownMarkerPatch({ rankSlug, path, text: patched, patch });
  }

  const linked = linkFootnoteCitations({ text: patched, footnoteMarkers, context });
  for (const match of linked.matchAll(/<a href="#fn-(\d+)">/g)) {
    citedMarkers.add(match[1]!);
  }

  return extractTrailingList({ text: linked });
}

function parseListNumber({
  listNumber,
}: {
  listNumber: string;
}): { stem: string; letter: string } {
  const match = LIST_NUMBER_PATTERN.exec(listNumber.trim());
  if (match === null) {
    throw new Error(`Unparseable listNumber: "${listNumber}"`);
  }
  return { stem: match[1]!, letter: match[2]!.toLowerCase() };
}

function buildLeaf({
  row,
  reqId,
  parentPath,
  curatedShorts,
  rankSlug,
  footnoteMarkers,
  citedMarkers,
}: {
  row: ApiRequirementRow;
  reqId: string;
  parentPath: string;
  curatedShorts: Map<string, string>;
  rankSlug: string;
  footnoteMarkers: Set<string>;
  citedMarkers: Set<string>;
}): Requirement {
  const path = computePath({ parentPath, requirementId: reqId });
  const sanitized = sanitizeHtml({
    html: row.name,
    context: `requirement ${row.listNumber}`,
  });
  const { text, list } = structureRequirementText({
    text: sanitized,
    rankSlug,
    path,
    footnoteMarkers,
    citedMarkers,
    context: `requirement ${row.listNumber}`,
  });
  return {
    req_id: reqId,
    path,
    text,
    list_number: row.listNumber,
    short: curatedShorts.get(path) ?? row.short.trim(),
    months_since_last_rank_required: row.monthsSinceLastRankRequired,
    eagle_mb_required: row.eagleMBRequired,
    total_mb_required: row.totalMBRequired,
    service_hours_required: row.serviceHoursRequired,
    ...(list !== undefined ? { list } : {}),
  };
}

function buildRequirementTree({
  requirementRows,
  curatedShorts,
  rankSlug,
  footnoteMarkers,
  citedMarkers,
}: {
  requirementRows: ApiRequirementRow[];
  curatedShorts: Map<string, string>;
  rankSlug: string;
  footnoteMarkers: Set<string>;
  citedMarkers: Set<string>;
}): Requirement[] {
  const rowsByStem = new Map<
    string,
    { bareRow?: ApiRequirementRow; letterRows: { letter: string; row: ApiRequirementRow }[] }
  >();

  for (const row of requirementRows) {
    const { stem, letter } = parseListNumber({ listNumber: row.listNumber });
    const entry = rowsByStem.get(stem) ?? { letterRows: [] };
    if (letter === "") {
      if (entry.bareRow !== undefined) {
        throw new Error(`Duplicate bare row for stem "${stem}"`);
      }
      entry.bareRow = row;
    } else {
      entry.letterRows.push({ letter, row });
    }
    rowsByStem.set(stem, entry);
  }

  const stems = [...rowsByStem.keys()].sort(
    (a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10),
  );

  return stems.map(stem => {
    const { bareRow, letterRows } = rowsByStem.get(stem)!;

    if (letterRows.length === 0) {
      if (bareRow === undefined) {
        throw new Error(`Stem "${stem}" has no rows at all`);
      }
      return buildLeaf({
        row: bareRow,
        reqId: stem,
        parentPath: "",
        curatedShorts,
        rankSlug,
        footnoteMarkers,
        citedMarkers,
      });
    }

    const sortedLetterRows = [...letterRows].sort((a, b) =>
      a.letter.localeCompare(b.letter),
    );

    const groupText =
      bareRow !== undefined
        ? structureRequirementText({
            text: sanitizeHtml({ html: bareRow.name, context: `requirement ${stem}` }),
            rankSlug,
            path: stem,
            footnoteMarkers,
            citedMarkers,
            context: `requirement ${stem}`,
          })
        : { text: "" };

    return {
      req_id: stem,
      path: stem,
      text: groupText.text,
      list_number: bareRow?.listNumber ?? "",
      short: curatedShorts.get(stem) ?? bareRow?.short.trim() ?? "",
      months_since_last_rank_required: bareRow?.monthsSinceLastRankRequired ?? "",
      eagle_mb_required: bareRow?.eagleMBRequired ?? "",
      total_mb_required: bareRow?.totalMBRequired ?? "",
      service_hours_required: bareRow?.serviceHoursRequired ?? "",
      ...(groupText.list !== undefined ? { list: groupText.list } : {}),
      children: sortedLetterRows.map(({ letter, row }) =>
        buildLeaf({
          row,
          reqId: letter,
          parentPath: stem,
          curatedShorts,
          rankSlug,
          footnoteMarkers,
          citedMarkers,
        }),
      ),
    };
  });
}

function countSourcedNodes({
  requirements,
}: {
  requirements: Requirement[];
}): number {
  let count = 0;
  for (const requirement of requirements) {
    if (requirement.list_number !== "") {
      count += 1;
    }
    if (requirement.children !== undefined) {
      count += countSourcedNodes({ requirements: requirement.children });
    }
  }
  return count;
}

function collectProseGroupPaths({
  requirements,
  output,
}: {
  requirements: Requirement[];
  output: string[];
}): void {
  for (const requirement of requirements) {
    if (requirement.children !== undefined) {
      if (requirement.text !== "") {
        output.push(requirement.path);
      }
      collectProseGroupPaths({ requirements: requirement.children, output });
    }
  }
}

function buildContentBundle({
  title,
  short,
  level,
  description,
}: {
  title: string;
  short: string;
  level: number;
  description: string;
}): string {
  const escape = (value: string): string =>
    `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;

  return [
    "---",
    `title: ${escape(title)}`,
    `short: ${escape(short)}`,
    `level: ${level}`,
    `description: ${escape(description)}`,
    "---",
    "",
  ].join("\n");
}

async function fetchJson<T>({ url }: { url: string }): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
    );
  }
  return (await response.json()) as T;
}

function getRankDataPath({ slug }: { slug: string }): string {
  return `hugo/data/ranks/scouts-bsa/${slug}.json`;
}

/**
 * Short Labels are curated, not authoritative API data: the API leaves many
 * group stems blank and its own `short` values are inconsistent across ranks.
 * Anything already written in the rank file wins -- including a deliberate
 * empty string, which means "this requirement's own text carries the heading"
 * and must survive a re-sync. The API value only seeds requirements whose
 * `short` key is absent from the file, which is how you ask for a re-seed.
 * See ADR 0009.
 */
async function loadCuratedShorts({
  slug,
}: {
  slug: string;
}): Promise<Map<string, string>> {
  const curated = new Map<string, string>();
  const file = Bun.file(getRankDataPath({ slug }));
  if (!(await file.exists())) {
    return curated;
  }

  const existing = (await file.json()) as RankData;
  const collect = (requirements: Requirement[]): void => {
    for (const requirement of requirements) {
      if (requirement.short !== undefined) {
        curated.set(requirement.path, requirement.short);
      }
      if (requirement.children !== undefined) {
        collect(requirement.children);
      }
    }
  };
  collect(existing.requirements);
  return curated;
}

function getContentBundlePath({ slug }: { slug: string }): string {
  return `hugo/content/scouts-bsa/ranks/${slug}/_index.md`;
}

async function main(): Promise<void> {
  console.log("Fetching rank catalog...");
  const catalog = await fetchJson<ApiRankCatalogEntry[]>({
    url: RANKS_ENDPOINT,
  });
  const scoutsBsaRanks = catalog
    .filter(
      rank =>
        rank.programId === SCOUTS_BSA_PROGRAM_ID && RANK_IDS.includes(rank.id),
    )
    .sort((a, b) => a.level - b.level);

  if (scoutsBsaRanks.length !== 7) {
    throw new Error(
      `Expected 7 Scouts BSA ranks, got ${scoutsBsaRanks.length}`,
    );
  }

  let totalRows = 0;
  const proseGroupPaths: string[] = [];

  for (const rank of scoutsBsaRanks) {
    console.log(`\n--- ${rank.name} (id ${rank.id}) ---`);
    const { rankInformation, requirements } =
      await fetchJson<ApiRequirementsResponse>({
        url: `${REQUIREMENTS_ENDPOINT_PREFIX}/${rank.id}/requirements`,
      });

    const versionIds = new Set(requirements.map(row => row.versionId));
    if (versionIds.size !== 1) {
      throw new Error(
        `${rank.name}: expected one versionId, got ${[...versionIds].join(", ")}`,
      );
    }

    const slug = slugify({ text: rank.short });
    const curatedShorts = await loadCuratedShorts({ slug });

    const sanitizedFooter = sanitizeHtml({
      html: rankInformation.footer,
      context: `${rank.name} footer`,
    });
    const { intro: footerIntro, footnotes } = parseFooter({
      html: sanitizedFooter,
      context: `${rank.name} footer`,
    });
    const footnoteMarkers = new Set(footnotes.map(footnote => footnote.marker));
    const citedMarkers = new Set<string>();

    const tree = buildRequirementTree({
      requirementRows: requirements,
      curatedShorts,
      rankSlug: slug,
      footnoteMarkers,
      citedMarkers,
    });

    const sourcedCount = countSourcedNodes({ requirements: tree });
    if (sourcedCount !== requirements.length) {
      throw new Error(
        `${rank.name}: tree accounts for ${sourcedCount} rows, API returned ${requirements.length}`,
      );
    }
    totalRows += requirements.length;
    collectProseGroupPaths({ requirements: tree, output: proseGroupPaths });

    for (const footnote of footnotes) {
      if (citedMarkers.has(footnote.marker)) {
        continue;
      }
      const isKnownUncited = KNOWN_UNCITED_FOOTNOTES.some(
        known => known.rankSlug === slug && known.marker === footnote.marker,
      );
      if (!isKnownUncited) {
        throw new Error(
          `${rank.name}: footnote "${footnote.marker}" is never cited in the requirement body -- new orphan, or a marker shape structureRequirementText doesn't catch yet`,
        );
      }
    }

    const description = RANK_DESCRIPTIONS[rank.id];
    if (description === undefined) {
      throw new Error(`No hand-written description for ${rank.name}`);
    }

    const rankData: RankData = {
      $schema: SCHEMA_URL,
      title: rank.name,
      slug,
      short: rank.short.trim(),
      level: rank.level,
      program: rank.program,
      version_id: [...versionIds][0]!,
      version_effective_date: rankInformation.versionEffectiveDt,
      header: sanitizeHtml({
        html: rankInformation.header,
        context: `${rank.name} header`,
      }),
      footer: footerIntro,
      footnotes,
      requirements: tree,
    };

    const dataPath = getRankDataPath({ slug });
    await Bun.write(dataPath, `${JSON.stringify(rankData, undefined, 2)}\n`);
    console.log(`  data: ${dataPath} (${requirements.length} rows)`);

    const bundlePath = getContentBundlePath({ slug });
    await Bun.write(
      bundlePath,
      buildContentBundle({
        title: rank.name,
        short: rankData.short,
        level: rank.level,
        description,
      }),
    );
    console.log(`  content: ${bundlePath}`);
  }

  console.log(`\nTotal requirement rows synced: ${totalRows} (expect 147)`);
  console.log(
    `Prose group nodes: ${proseGroupPaths.join(", ") || "none"} (expect scout:2, scout:6, star:6)`,
  );
  console.log(
    `Tenderfoot 6c patch applications: ${tenderfoot6cPatchCount} (expect 1)`,
  );
  for (const patch of KNOWN_MARKER_PATCHES) {
    const key = `${patch.rankSlug}:${patch.path}`;
    console.log(
      `${patch.rankSlug} ${patch.path} marker patch applications: ${appliedMarkerPatchCounts.get(key) ?? 0} (expect 1)`,
    );
  }
  console.log("\nSync complete.");
}

await main();
