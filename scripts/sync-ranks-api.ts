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
  children?: Requirement[];
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
  requirements: Requirement[];
};

// One hand-written paragraph per rank -- see #17's resolution comment.
const RANK_DESCRIPTIONS: Record<number, string> = {
  1: "Scout is the rank every Scouts BSA member starts at, earned by learning the Scout Oath and Law, the Scout motto and slogan, and the basics of patrol life — from a proper salute and handshake to the buddy system and personal safety awareness. It sets the foundation everything else in the program builds on.",
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
}: {
  row: ApiRequirementRow;
  reqId: string;
  parentPath: string;
}): Requirement {
  return {
    req_id: reqId,
    path: computePath({ parentPath, requirementId: reqId }),
    text: sanitizeHtml({
      html: row.name,
      context: `requirement ${row.listNumber}`,
    }),
    list_number: row.listNumber,
    short: row.short.trim(),
    months_since_last_rank_required: row.monthsSinceLastRankRequired,
    eagle_mb_required: row.eagleMBRequired,
    total_mb_required: row.totalMBRequired,
    service_hours_required: row.serviceHoursRequired,
  };
}

function buildRequirementTree({
  requirementRows,
}: {
  requirementRows: ApiRequirementRow[];
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
      return buildLeaf({ row: bareRow, reqId: stem, parentPath: "" });
    }

    const sortedLetterRows = [...letterRows].sort((a, b) =>
      a.letter.localeCompare(b.letter),
    );

    return {
      req_id: stem,
      path: stem,
      text:
        bareRow !== undefined
          ? sanitizeHtml({ html: bareRow.name, context: `requirement ${stem}` })
          : "",
      list_number: bareRow?.listNumber ?? "",
      short: bareRow?.short.trim() ?? "",
      months_since_last_rank_required: bareRow?.monthsSinceLastRankRequired ?? "",
      eagle_mb_required: bareRow?.eagleMBRequired ?? "",
      total_mb_required: bareRow?.totalMBRequired ?? "",
      service_hours_required: bareRow?.serviceHoursRequired ?? "",
      children: sortedLetterRows.map(({ letter, row }) =>
        buildLeaf({ row, reqId: letter, parentPath: stem }),
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

    const tree = buildRequirementTree({ requirementRows: requirements });

    const sourcedCount = countSourcedNodes({ requirements: tree });
    if (sourcedCount !== requirements.length) {
      throw new Error(
        `${rank.name}: tree accounts for ${sourcedCount} rows, API returned ${requirements.length}`,
      );
    }
    totalRows += requirements.length;
    collectProseGroupPaths({ requirements: tree, output: proseGroupPaths });

    const slug = slugify({ text: rank.short });
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
      footer: sanitizeHtml({
        html: rankInformation.footer,
        context: `${rank.name} footer`,
      }),
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
  console.log("\nSync complete.");
}

await main();
