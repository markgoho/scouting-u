---
name: drg
description: Write the Digital Requirements Guide for one Scouts BSA rank.
argument-hint: <rank-slug>
disable-model-invocation: true
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, WebFetch, WebSearch, AskUserQuestion]
---

# Digital Requirements Guide — Production Skill

Write the Digital Requirements Guide (DRG) for one Scouts BSA rank. `$ARGUMENTS`
is the rank slug (e.g. `star`). The scaffold script has already generated
deterministic structure with `[PLACEHOLDER: ...]` markers — your job is to
replace every placeholder with real teaching content, not to invent structure.

## Input & Scaffold Check

- **Rank data:** `hugo/data/ranks/scouts-bsa/$ARGUMENTS.json`
- **Output directory:** `hugo/content/scouts-bsa/ranks/$ARGUMENTS/guide/`

```bash
if [ ! -f "hugo/content/scouts-bsa/ranks/$ARGUMENTS/guide/_index.md" ]; then
  RANK_SLUG=$ARGUMENTS bun run scaffold:drg
fi
```

The scaffold is idempotent and never overwrites an existing file. If
`guide/_index.md` already exists, do not re-scaffold — read the existing
files and resume from their current state (see Resume Behavior below).

## What the scaffold already decided — do not re-litigate

- **Page granularity.** Every top-level requirement with children — however
  few — gets an overview page plus one dedicated page per child; there is no
  combined-page threshold. A requirement with no children is a plain leaf
  page. This is already built into the generated file tree — keep it unless
  there's a deliberate editorial reason to merge pages, and if you do,
  update `guide_nav` and every `prev`/`next` link consistently.
- **Titles.** Every `title` and `guide_nav` entry is the requirement's
  curated `short` field (ADR 0011) — never invent or rewrite one. If a
  `short` reads badly as a page title, that's a signal to fix the rank
  JSON label per ADR 0011's own convention (Title Case noun phrases for
  group stems, sentence-case verb-first imperatives for leaves), not to
  write around it here.
- **Every child page uses `drg/requirement`, never `drg/inherited-requirement`.**
  Every requirement with children now gets one dedicated page per child
  (see Page granularity above), and a dedicated child page's lead quote
  must always be `drg/requirement` — it's the only shortcode that writes
  `Page.Store.leadRequirement` (the `.req-rail` sticky quote), and only
  when its `number` equals the page's own `req_number`. This holds even
  when a child's text reads as a bare topic inherited from its parent's
  verb (see Inherited-action parent below) — the parent-verb merge happens
  in that page's own prose, not via a different shortcode.
  `drg/inherited-requirement` exists in uni-theme for combined-page child
  sections, but this scaffold no longer produces combined pages, so it has
  no live caller here.
- **Footnote markers** (`<sup><a href="#fn-N">`) are already stripped from
  quoted requirement text. Don't reintroduce them in your own prose, and
  don't guess at what a footnote said — if you need one, read it from the
  rank's `footnotes` array or the live requirements page.

## Parent-Requirement Classification

Before writing a multi-child requirement, classify its parent text. Do this
explicitly, not by defaulting every parent to the same shape:

- **Umbrella parent** — vague text like "Do the following:" (Star `6`) that
  only introduces children. Add a brief orienting intro after the
  `drg/requirement` block, then the child sections.
- **Hybrid parent** — parent text has real standalone teaching content
  *and* continues into children. Teach the parent's own content first,
  then the child sections, then a short synthesis tying it together.
- **Inherited-action parent** — parent text carries the operative verbs;
  children are bare topic labels. Example: Tenderfoot `4.a`, "Show first
  aid for the following:", with a `list` field of injury types as
  children. Since each child now has its own dedicated page, open that
  page's body by restating the parent's verb onto the child's own topic
  ("Show first aid for simple cuts and scrapes") instead of teaching the
  bare topic in isolation — the overview page's intro is the place to
  name the shared parent verb once for the whole group.

A requirement's `list` field (present on some leaves, e.g. Tenderfoot
`4.a`) is rendered by the scaffold as a plain markdown list after the
shortcode block — no shortcode wraps it. Write teaching content addressing
each list item; don't just repeat the list back.

## Named Artifact Investigation

Some requirements name a formal artifact — a code, oath, law, acronym, or
named procedure — without spelling it out. Investigate it in the **Scouts
BSA Handbook or scouting.org** (not a merit badge pamphlet — ranks have no
pamphlet) before writing: Scout Oath, Scout Law, motto, slogan, Outdoor
Code, buddy system, Safe Swim Defense, Safety Afloat, Leave No Trace,
Totin' Chip, Firem'n Chit, Personal Safety Awareness. When the requirement
expects the Scout to discuss the artifact itself, include its actual text
or enumerated items so the reader can see what they're being asked to
discuss. Don't broadly copy the Handbook beyond this narrow exception.

## The Ladder

Ranks build on each other. Where a requirement's skill was first taught at
an earlier rank, link to that rank's guide page (`/scouts-bsa/ranks/{slug}/guide/reqN/`)
— e.g. "you tied the square knot for Tenderfoot 3a; here you'll use it
under load." If the earlier rank's guide doesn't exist yet, skip the link
rather than inventing one; don't block on it.

**Repeated requirements** — Scout spirit, Scoutmaster conference, board of
review, position of responsibility, service hours — recur almost every
rank. Never write a near-identical page seven times. Write what's
*different at this rank*: the raised bar, the longer tenure, the new
expectations. If you're repeating a paragraph you could have copied from
the previous rank's guide, that's the signal to cut it and write the delta
instead.

## Structured Rank Data

`months_since_last_rank_required`, `total_mb_required`, `eagle_mb_required`,
and `service_hours_required` are populated on Star/Life/Eagle requirements
and otherwise empty. Where non-empty, surface them plainly in a "What This
Takes" section — a Scout planning their timeline needs these numbers, not
just prose describing them abstractly.

## Worksheets

`.req-worksheet` is styled and ready in uni-theme's `drg-print.css`. Use
the test: would a Scout actually print this, fill it in, and bring it to a
conversation? "Keep a log," "plan a menu," "prepare a budget" -type
requirements are textbook triggers. Never inline a fillable template as a
markdown table with blank cells or underscore blanks — that's a sign a
worksheet page is needed instead. See SHORTCODES.md for the worksheet file
convention.

## Reader-Facing Copy Safety Check

Before considering any page done, scan for internal-only language that
must never reach readers: `data.json`, "JSON", "scaffold", "stub",
"placeholder", or any script name (`scaffold-drg`, `verify-drg`). If a
sentence would sound strange to a Scout or leader reading it on the public
site, rewrite it.

## Shortcodes and Voice

See `SHORTCODES.md` for the full shortcode catalog and usage rules, and
`VOICE.md` for audience, tone, and writing craft (opening hooks, the
surprise test, shortcode variety, extended-learning depth). Consult both
before writing your first page.

Where a requirement's meaning is clearer shown than described, use an
`<!-- IMAGE: -->` placeholder (see `SHORTCODES.md`'s Images section) rather
than stretching prose to cover it. Turning placeholders into real images is
a separate, manually-invoked pass (`/drg-images <rank>`) run after this
guide's content is finished — don't attempt it as part of this skill.

## Workflow

**Run to completion.** Work through every remaining page without pausing
to summarize progress or ask whether to continue. The guide is not done
until every page is written, placeholders are gone, and verification
passes. Silence from the user means keep going.

1. **Analyze.** Read the rank JSON and the scaffolded files. Classify
   every multi-child parent (umbrella / hybrid / inherited-action).
   Identify ladder links to earlier ranks and any repeated-requirement
   pages that need a "what's different here" treatment instead of a
   rewrite.
2. **Write.** Work page by page, replacing `[PLACEHOLDER: ...]` markers
   with real content. Keep the scaffolded file structure, front matter,
   `guide_nav`, and `prev`/`next` links intact unless you have a
   deliberate reason to restructure, in which case update all three
   together.
3. **Verify.**
   ```bash
   RANK_SLUG=$ARGUMENTS bun run verify:drg
   bun run build
   ```
   `verify:drg` checks requirement-path coverage, `guide_nav` resolution,
   and a closed `prev`/`next` chain, and flags leftover
   `[PLACEHOLDER:` markers and internal vocabulary. `bun run build` runs
   `verify:output`, which fails on `<!-- raw HTML omitted -->` or a
   blank-text heading id — both are live risks if a `text_format="html"`
   param gets dropped while editing a shortcode block.

## Completion Criteria

The guide is done only when all of the following hold — not when it
"feels" finished:

- Zero `[PLACEHOLDER:` markers remain in any file.
- `RANK_SLUG=$ARGUMENTS bun run verify:drg` passes with no structural or
  vocabulary failures.
- `bun run build` passes.
- Every `guide_nav` entry and every `prev`/`next` link resolves to a real
  page.

## Resume Behavior

If a guide already exists, don't overwrite it wholesale. Read what's
there, preserve completed pages, and continue from where it left off —
finish, don't restart, and don't stop mid-guide to ask whether to
continue.
