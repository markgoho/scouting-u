---
name: drg-images
description: Generate, audit, and manage images for Digital Requirements Guide (DRG) rank guides. Use after a rank guide's content is written — creating an images.json manifest, generating images via Gemini, uploading to ImageKit, auditing existing images, or converting image placeholders to shortcodes.
argument-hint: <rank-slug>
disable-model-invocation: true
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion]
---

# DRG Images — Production & Audit Skill

Manage images for Scouts BSA Digital Requirements Guide (DRG) rank guides.
This is a separate pass from the `drg` skill: run it only after a rank's
guide text is finished (or when auditing an already-published guide), never
while writing content.

## Input

The rank slug is passed as `$ARGUMENTS`. Use it to locate:

- **Guide directory:** `hugo/content/scouts-bsa/ranks/$ARGUMENTS/guide/`
- **Image manifest:** `hugo/content/scouts-bsa/ranks/$ARGUMENTS/guide/images.json`
- **Image files:** `hugo/content/scouts-bsa/ranks/$ARGUMENTS/guide/images/`
- **Content files:** all `.md` files in the guide directory

## Image Value Test

Not every page needs an image. Before adding one, apply this test:

> **"Does this image teach something that text alone cannot?"**

If the answer is no — a mood shot, a generic photo of someone doing the
activity, scene-setting decoration, or decorated text (visual formatting of
content already on the page) — skip it. A guide with 6 high-value images is
better than one with 15 generic ones; this repo has only 7 ranks, and most
requirement pages (Scout spirit, board of review, position of
responsibility) have nothing visual to teach at all.

**High-value:** a labeled diagram (First Class badge parts), correct-vs-incorrect
comparison (proper knot dressing vs. a slipped one), an annotated single
moment (hand position and blade angle mid-cut), or a spatial diagram
(campsite layout). **Low-value:** a generic activity photo, a mood/scene-setting
shot, or anything redundant with text already on the page. See
`IMAGE-STYLES.md` for the full comparison table and which visual style each
case calls for.

**Not an image at all — a video candidate.** If what needs teaching is a
multi-step motion or procedure where sequence, timing, or hand movement
matters (tying a knot start to finish, a rescue technique, CPR
compressions), a static image can't carry it and a strip of panels is the
wrong fix — stringing stills together drops the transitions, which are
usually the actual hard part. Drop a `<!-- VIDEO: -->` placeholder instead
and leave it for the `drg-videos` skill; see `SHORTCODES.md`'s "Choosing
image vs. video" for the full decision rule. Only fall back to a single
annotated image of the failure-prone moment if `drg-videos` can't find an
authoritative video for it.

**Placement rule:** every image appears **immediately after the paragraph
or section it illustrates**, never clustered at the bottom of a page before
`drg/next-page`.

## Granularity: per concept, not per page

Apply the Value Test to every distinct visual concept a requirement bundles
together, not once per page. A requirement that asks for several different
physical actions needs an image for each one that independently passes the
test — one combined image covering only the first action is a coverage gap,
not a deliberate trim.

For example, "Demonstrate the Scout sign, salute, and handshake" is one
requirement but three unrelated hand/arm positions — the sign, the salute,
and the handshake each has its own configuration a Scout can get backward,
so each earns its own image if it independently passes the Value Test.
Don't stop at the first one and call the requirement covered.

The "6 high-value images beats 15 generic ones" guidance above is about
total quality across a rank, not a per-page or per-requirement cap — it
argues against padding with low-value images, not against a requirement
that genuinely bundles several high-value concepts.

**When in doubt, don't generate — flag it.** Every requirement and
sub-requirement, and every distinct concept inside one, should be
*considered* against the Value Test. Considering something is not the same
as adding it: for a clear pass or a clear fail, decide and move on. For a
genuine borderline call, don't generate the image — surface the candidate
to the user with your reasoning and let them decide. There are only 7
ranks total, so there's room to look closely at every page rather than
defaulting to whichever reading is faster.

## The `value` Field

Every `images.json` entry needs a `value` field: one sentence, starting
with what the reader sees, ending with why text can't replace it. If you
can't write a compelling one, the image fails the Value Test — don't add
it. This is also the audit trail: during an audit, `value` is what you
check each image against.

## Image Placeholders

While writing guide content (in the `drg` skill), use HTML comment
placeholders instead of shortcodes, so the Hugo build stays green before
images exist:

```markdown
<!-- IMAGE: filename-id.png | Alt text description -->
<!-- IMAGE: compass-parts-labeled.png | Baseplate compass with all parts labeled | style:diagram -->
<!-- IMAGE: knot-dressing-comparison.png | Correct vs. loose square knot dressing | style:comparison | verb:show -->
```

Optional hint tokens: `style:{style}` (see `IMAGE-STYLES.md` for the six
supported styles; defaults to `photo` if omitted) and `verb:{family}` (the
operative requirement verb family carried over from `drg` — `show`,
`describe`, `identify`, or `create` — used as image-value/framing guidance,
never a command to force an image).

If a finished guide has no placeholders, don't treat that as zero images —
audit the content yourself: read the guide markdown, find every distinct
concept per requirement that passes the Value Test (see "Granularity"
above — a requirement can need more than one), and insert placeholders
inline before continuing.

## Image Generation Workflow

**Step 1 — Build or update `images.json`.** Every entry needs `id`, `file`,
`description`, and `value`; `style` and `verb_family` are optional. See
`IMAGE-STYLES.md` for the manifest schema, style-selection table, and the
description-writing rules (uniform, trademark, branding, people-labels,
recurring cast) — those rules live at full strength in
`scripts/generate-drg-images.ts`'s prompt preamble; treat the script as the
source of truth if this doc and the script ever disagree.

**Step 2 — Generate images.** Run immediately, don't wait for approval —
this can take several minutes per rank:

```bash
bun run generate:drg-images -- --rank $ARGUMENTS
```

**Step 3 — Upload to ImageKit.** Images are served from ImageKit, not
committed to git:

```bash
bun run migrate:imagekit
```

This uploads every rank's staged PNGs, writes back `width`/`height`/`v`
into that rank's `images.json`, and deletes the local `.png` after a
successful upload — don't add a manual `rm` step. Scope to one rank with
`RANK_SLUGS=$ARGUMENTS bun run migrate:imagekit`, or preview without
uploading via `bun run migrate:imagekit:dry`.

**Step 4 — Replace placeholders with shortcodes.**

```markdown
{{</* drg/image src="images/{id}.png" alt="..." */>}}
```

Match each placeholder's filename-id to its `images.json` entry. Every
placeholder must be converted — zero `<!-- IMAGE:` should remain once
`images.json` exists for the rank.

## Verification

```bash
RANK_SLUG=$ARGUMENTS bun run verify:drg
bun run verify:imagekit
bun run build
```

`verify:drg` (once `images.json` exists for the rank) checks: no
unconverted `<!-- IMAGE:` placeholders, no duplicate `id`s in the manifest,
every `drg/image` `src` is unique and resolves to a manifest entry, and
every manifest entry has exactly one shortcode referencing it. It fails
loudly on any mismatch — reconcile before moving on. `verify:imagekit`
HEAD-checks every resulting CDN URL. `bun run build` is the final gate.

## Image Audit Workflow

1. Read `images.json` and every `.md` file with a `drg/image` shortcode.
2. Apply the Image Value Test to each image, and to each distinct concept
   in the page's own requirement text — a page with one image can still be
   missing coverage for a second bundled concept (see "Granularity" above).
3. Images that fail: remove the manifest entry, remove the shortcode, and
   delete the file on ImageKit (dashboard, or the ImageKit API — there's no
   local file to `rm` once uploaded).
4. Images that pass but lack a `value` field: add one.
5. `RANK_SLUG=$ARGUMENTS bun run verify:drg && bun run build`.

## Completion Criteria

- Every `images.json` entry has `id`, `file`, `description`, and `value`.
- Zero `<!-- IMAGE:` placeholders remain.
- `RANK_SLUG=$ARGUMENTS bun run verify:drg` passes.
- `bun run verify:imagekit` passes.
- `bun run build` passes.
