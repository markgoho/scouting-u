---
name: drg-videos
description: Find, verify, and place YouTube videos for multi-step, motion-based demonstrations in Digital Requirements Guide (DRG) rank guides — the sibling pass to drg-images for content a static image can't teach. Use after a rank guide's content is written, converting <!-- VIDEO: --> placeholders.
argument-hint: <rank-slug>
disable-model-invocation: true
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, WebFetch, WebSearch, AskUserQuestion]
---

# DRG Videos — Discovery, Verification & Placement Skill

Find, verify, and place YouTube videos for Scouts BSA Digital Requirements
Guide (DRG) rank guides. This is a separate pass from the `drg` skill, and a
sibling to `drg-images` — run it only after a rank's guide text is finished
(or when auditing an already-published guide), never while writing content.

## Input

The rank slug is passed as `$ARGUMENTS`. Use it to locate:

- **Rank data:** `hugo/data/ranks/scouts-bsa/$ARGUMENTS.json`
- **Guide directory:** `hugo/content/scouts-bsa/ranks/$ARGUMENTS/guide/`
- **Video manifest:** `hugo/content/scouts-bsa/ranks/$ARGUMENTS/guide/videos.json`
- **Content files:** all `req*.md` files in the guide directory

## Video Value Test

Not every page needs a video — most don't. Before searching for one, apply
this test:

> **Is this a multi-step motion or procedure where sequence, timing, or
> hand movement matters, that a still image can't carry?**

This is the mirror image of `drg-images`'s Image Value Test, and the two
skills split the same underlying question ("does this requirement have
something worth showing?") by what kind of thing needs showing — see
`SHORTCODES.md`'s "Choosing image vs. video" for the full decision rule. A
`<!-- VIDEO: -->` placeholder left by the `drg` skill (or found during your
own audit of a finished guide) is a candidate, not a mandate — if the
concept turns out to actually be a single static moment, convert it to an
`<!-- IMAGE: -->` placeholder instead and hand it to `drg-images`.

**High-value:** tying a knot start to finish, a rescue or carry technique,
CPR compressions, a casting stroke, a multi-step assembly (pitching a
tent). **Low-value:** a generic "kids at camp" video, a lecture with no
demonstration, anything the page's prose already covers step by step in
words that don't depend on watching motion.

## Placeholder Syntax

While writing guide content (in the `drg` skill), or while auditing a
finished guide yourself, use an HTML comment placeholder:

```markdown
<!-- VIDEO: square-knot-tying | Full tying motion for the square knot start to finish -->
<!-- VIDEO: cpr-compressions | Hand position, depth, and rate of chest compressions | verb:show -->
```

- First token after `VIDEO:` is a kebab-case `id`, becomes the manifest key.
- Second segment (after `|`) is the concept description — what the video
  must actually demonstrate. Write this specifically; it's your search
  brief in Phase 2.
- Optional `verb:{family}` hint, same vocabulary as `drg-images` (`show`,
  `describe`, `identify`, `create`).

If a finished guide has no placeholders, audit it yourself: read the guide
markdown, find every distinct concept that passes the Video Value Test, and
insert placeholders inline before continuing — same discipline
`drg-images` uses for image audits.

## Workflow — 5 Phases

### Phase 1: Audit

Read every `req*.md` file. Report:
- Pages with a `<!-- VIDEO: -->` placeholder (list them, with the concept
  text)
- Pages with an existing `drg/video` or `drg/external-link` shortcode
  pointing at YouTube (already covered, skip)
- Any additional concept you find during your own read that passes the
  Video Value Test but has no placeholder yet

### Phase 2: Discover

For each placeholder, use **WebSearch** — there is no automated search
script or API key in this repo; the placeholder's concept text is already
a good query. Search patterns:

- `{rank title or requirement topic} {concept} site:youtube.com`
- `{concept} tutorial youtube`

Prefer, in order:
1. **Official Scouting sources** — Scouting America / BSA channels,
   council or troop channels demonstrating the actual skill.
2. **Authoritative domain sources** — American Red Cross, American Heart
   Association, NOLS, Leave No Trace, National Park Service, U.S. Forest
   Service, Mayo Clinic, CDC. **For any safety-critical topic — first aid,
   CPR, water rescue, fire, knife/tool handling — only an authoritative
   source is acceptable.** Do not place a random creator's safety
   demonstration, however well-produced.
3. **Established outdoor/instructional channels** with a track record of
   accurate technique demonstrations, for non-safety topics only (e.g.,
   knot-tying channels, cooking technique channels).

Reject and keep searching rather than settle for whatever ranks first:
vlogs, reaction content, anything with ads/sponsorship overwhelming the
demonstration, or a video whose title doesn't match what the placeholder
actually asks for.

### Phase 3: Verify Requirement Fit

Before verifying the link works, verify the video is *right*, using the
same discipline `drg/SKILL.md`'s "Strict Requirement-Verb Interpretation"
applies to prose:

- Read the target `req*.md` page and the requirement's own verb and
  object.
- Does the video actually demonstrate what the requirement asks, not an
  adjacent easier version of it? A video on "basic knots" may not show the
  *specific* knot the requirement names.
- Is it appropriately short and focused — prefer under ~10 minutes for a
  single technique; a 45-minute course video buries the moment a Scout
  needs.
- Safety topics: confirm the source is one of the authoritative
  organizations listed above. If you can't confirm the channel's
  authority, don't place it — surface it to the user instead.

Write a one-sentence `value` (see manifest schema below) for each accepted
video before moving on.

### Phase 4: Verify Link

For each accepted video, confirm it via oEmbed:

```bash
curl -s "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=VIDEO_ID&format=json"
```

- **200 OK** → embeddable, use `drg/video`.
- **401** → exists but embedding disabled, use `drg/external-link`.
- **404 or error** → discard, go back to Phase 2 for this placeholder.

Never type or guess a video ID by hand — every ID must come from a real
YouTube URL you found via WebSearch or WebFetch. Models hallucinate
plausible-looking video IDs; oEmbed is the check that catches it.

### Phase 5: Place & Record

1. Read the target `req*.md` file.
2. Replace the `<!-- VIDEO: -->` placeholder with the shortcode, in place —
   don't move content to the top or bottom of the page.

```markdown
{{< drg/video
    title="Video Title — Channel Name"
    url="https://www.youtube.com/watch?v=VIDEO_ID" >}}
```

or, for embed-disabled videos:

```markdown
{{< drg/external-link
    title="Video Title — Channel Name"
    url="https://www.youtube.com/watch?v=VIDEO_ID" >}}
```

- Title format is `"Video Title — Channel Name"` (em dash).
- Keep `drg/next-page` as the last element on every page — place videos
  before it, never after.
- Don't place a video inside another shortcode block (e.g., inside
  `drg/safety-first` or `drg/be-prepared`).
- Blank line before and after the shortcode.

3. Add or update the entry in `videos.json` (create the file if this rank
   has none yet):

```json
{
  "rank": "star",
  "videos": [
    {
      "id": "square-knot-tying",
      "file": "req5b.md",
      "url": "https://www.youtube.com/watch?v=VIDEO_ID",
      "title": "How to Tie a Square Knot — American Red Cross",
      "channel": "American Red Cross",
      "status": "working",
      "value": "Shows the full tying motion in real time, including the transitions a static image would skip"
    }
  ]
}
```

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Unique kebab-case identifier, matches the placeholder's id |
| `file` | Yes | Which `.md` file this video appears in |
| `url` | Yes | The exact URL used in the shortcode |
| `title` | Yes | Video title, matches the shortcode's `title` param |
| `channel` | Yes | Source channel — the audit trail for source authority |
| `status` | Yes | `working` or `embed_disabled` |
| `value` | Yes | One sentence: what the video teaches that a still image can't |

Only accepted, placed videos belong in `videos.json` — same invariant as
`images.json`: every entry has exactly one shortcode referencing it, and
every YouTube `drg/video`/`drg/external-link` url resolves to an entry.

## No Video Found

If Phase 2 turns up nothing acceptable — no authoritative source, or
nothing that actually matches the requirement's verb — don't leave the
concept uncovered:

1. Remove the `<!-- VIDEO: -->` placeholder.
2. Add an `<!-- IMAGE: -->` placeholder in its place, framed around the
   single most failure-prone moment in the motion (grip, angle, hand
   position at the critical instant) rather than attempting a multi-panel
   sequence — see `SHORTCODES.md`'s decision rule for why panels are the
   wrong fallback.
3. Tell the user which concept fell back to a static image and why, so
   `drg-images` picks it up on its next pass.

Don't silently drop a placeholder with no replacement — a page that ends
up with neither an image nor a video for a concept that clearly needed one
is a regression, not a trim.

## Verification

```bash
RANK_SLUG=$ARGUMENTS bun run verify:drg
RANK_SLUGS=$ARGUMENTS bun run verify:youtube-links
bun run build
```

`verify:drg` (once `videos.json` exists for the rank) checks: no
unconverted `<!-- VIDEO:` placeholders, no duplicate `id`s in the
manifest, every video url used in the guide resolves to a manifest entry,
and every manifest entry has exactly one shortcode referencing it.
`verify:youtube-links` re-checks every placed video via oEmbed — link rot
is real; a video that verified in Phase 4 can go private or get deleted
later. `bun run build` is the final gate.

## Video Audit Workflow

1. Read `videos.json` and every `.md` file with a `drg/video` or YouTube
   `drg/external-link` shortcode.
2. Apply the Video Value Test to each: is this still the right medium, and
   does the source still meet the authority bar for safety topics?
3. Re-run Phase 4's oEmbed check — a video that worked at placement time
   can break later.
4. Videos that fail: remove the manifest entry and the shortcode, then
   apply the "No Video Found" fallback.
5. `RANK_SLUG=$ARGUMENTS bun run verify:drg && RANK_SLUGS=$ARGUMENTS bun run verify:youtube-links && bun run build`.

## Completion Criteria

- Every `videos.json` entry has `id`, `file`, `url`, `title`, `channel`,
  `status`, and `value`.
- Zero `<!-- VIDEO:` placeholders remain (converted to a shortcode or, per
  "No Video Found," to an `<!-- IMAGE: -->` placeholder).
- `RANK_SLUG=$ARGUMENTS bun run verify:drg` passes.
- `RANK_SLUGS=$ARGUMENTS bun run verify:youtube-links` reports zero broken
  links.
- `bun run build` passes.
