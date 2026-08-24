# Shortcode Catalog

Exhaustive for DRG writing in this repo. Do not invent additional shortcode
names or params beyond what's documented here — check uni-theme's vendored
copy at `hugo/_vendor/github.com/markgoho/uni-theme/layouts/shortcodes/drg/`
if you need to confirm exact behavior.

## Requirement text

```markdown
{{</* drg/requirement number="6" text_format="html" */>}}
Do the following:
{{</* /drg/requirement */>}}
```

- `number` — the requirement's compact number (dots removed, e.g. `"6"`,
  `"6a"`). Must equal the page's own `req_number` front-matter value for
  this to render as the page's lead quote (drives the `.req-rail` sticky
  panel and title-echo stripping).
- `text_format="html"` — **always pass this.** Rank JSON `text` is
  pre-rendered HTML (embedded `<a href>`, `<sup>` markers), not markdown.
  Without it, `markdownify` runs a second, unrelated pass and — since this
  repo does not set goldmark's `unsafe` render option — silently strips
  any HTML to `<!-- raw HTML omitted -->`. The scaffold already does this
  for every requirement block it generates; preserve it if you touch a
  shortcode call by hand.
- `.Inner` — the exact requirement text, verbatim. Never edit, summarize,
  or paraphrase it.

```markdown
{{</* drg/inherited-requirement number="6a" parent_text="Do the following:" text_format="html" */>}}
With your parent or guardian, complete the exercises...
{{</* /drg/inherited-requirement */>}}
```

- Only for a **child section on a combined page**, never a page's own lead
  block (see SKILL.md's "what the scaffold already decided"). The
  shortcode's own grammar/merge logic decides whether to compose the
  parent's verb onto the child's text or leave it as-is — you don't need
  to pre-merge it yourself.
- **Not currently emitted.** `scaffold-drg.ts` no longer produces combined
  pages (every child gets its own dedicated page — see SKILL.md's Page
  granularity rule), so this shortcode has no live caller in scouting-u
  right now. It still exists in uni-theme and is documented here in case
  the combined-page case returns; don't reach for it in new hand-written
  content.
- `parent_text` is required and must be the parent's verbatim text,
  already resolved by the scaffold. Don't invent one if it's missing —
  that means this child shouldn't be using this shortcode.

## Callouts

```markdown
{{</* drg/tip */>}}
Practical, actionable advice. 1-4 sentences.
{{</* /drg/tip */>}}

{{</* drg/did-you-know */>}}
Fact or statistic. Must pass the surprise test (see VOICE.md).
{{</* /drg/did-you-know */>}}

{{</* drg/safety-first */>}}
Direct, authoritative safety content. 2-5 sentences.
{{</* /drg/safety-first */>}}
```

## Checklist

```markdown
{{</* drg/checklist title="Title" subtitle="Subtitle" */>}}

- Item one: description.
- Item two: description.
{{</* /drg/checklist */>}}
```

Renders as a `<details>` disclosure. On the print page (`guide/print/`)
it auto-opens — no action needed on your part, it's automatic based on
the page's URL.

## Be Prepared (scenario-based)

```markdown
{{</* drg/be-prepared title="Scenario Title" */>}}
Steps to handle this scenario.

- **Step one**: do this.
- **Step two**: then this.
{{</* /drg/be-prepared */>}}
```

Use for concrete "what would you do" scenarios — safety situations, field
problem-solving. Aim for at least one or two per guide.

## Links, downloads, video

```markdown
{{</* drg/external-link
    title="Resource Title"
    url="https://example.org"
    description="What this resource offers." */>}}

{{</* drg/download
    title="Template Name"
    url="/downloads/template.pdf" */>}}

{{</* drg/download
    title="Pre-Hike Planning Worksheet"
    url="/scouts-bsa/ranks/{slug}/guide/{worksheet-slug}/"
    type="printable" */>}}

{{</* drg/video
    title="Video Title"
    url="https://www.youtube.com/watch?v=..." */>}}
```

- `drg/download` with `type="printable"` links to an internal worksheet
  page; omit `type` for an external downloadable file.
- `drg/video` embeds YouTube via oEmbed-style iframe when the URL matches
  `youtube.com`/`youtu.be`; any other URL falls back to a plain link. Don't
  place one by hand while writing — see "Images and Videos" below and the
  `drg-videos` skill for the discovery/verification pipeline.

## Extended Learning cards

```markdown
{{</* drg/experience-card
    title="Visit a Local Fire Station"
    details="Location: Your area | Highlights: See real emergency response in action." */>}}

{{</* drg/org-card
    name="American Red Cross"
    url="https://www.redcross.org/"
    description="Training and certification in first aid and CPR." */>}}
```

Use only these two card shortcodes on `extended-learning.md` — don't
invent wrapper shortcodes like `cards` or `drg/cards`.

## Page transition

```markdown
{{</* drg/next-page
    text="Now that you've covered the basics"
    teaser="Find out what it takes to earn Star."
    url="/scouts-bsa/ranks/{slug}/guide/{next-page}/" */>}}
```

Must always be the very last element on a page — nothing (no shortcode,
no text) after it.

## Worksheets

File convention: `guide/{worksheet-slug}/index.md`, `layout: printable`.
Required elements: a back-link to the parent requirement page, a print
button (`window.print()`), a title (`<h2 class="drg-worksheet__title">`),
a subtitle linking to the rank and requirement, and form fields using
`drg-worksheet__*` CSS classes (fields, lines, tables, check items,
writing areas, signature blocks).

**Do not add worksheets to `guide_nav`.** They aren't requirement pages
and don't belong in sidebar navigation — link to one from its parent
requirement page via `drg/download` with `type="printable"`, which is the
only entry point.

## Not supported in this repo

These mbu shortcodes/features do not apply to ranks and have no theme
equivalent here — do not reference or attempt to use them:

- Official per-requirement resources as a JSON-sourced baseline — rank
  JSON has no `resources` field (`rank.schema.json` forbids it). `drg/video`
  and `drg/external-link` are never a *mandatory* per-requirement baseline
  here either; most pages have nothing that needs one.
- `option` param on `drg/requirement`, "Choose One" overview pages,
  `subrequirement_mode` handling — every rank group is complete-all.

## Images and Videos

```markdown
{{</* drg/image src="images/compass-parts-labeled.png" alt="Baseplate compass with all parts labeled" */>}}
```

`drg/image` resolves `src` against the guide's `images.json` manifest, not a
local page resource — see the `drg-images` skill for placeholder syntax,
the Image Value Test, and the full generation/upload workflow.

`drg/video` (or `drg/external-link` when embedding is disabled) points at a
YouTube URL verified and placed by the `drg-videos` skill — see that skill
for placeholder syntax, the Video Value Test, and discovery/verification.

Do not add image or video placeholders or shortcodes while writing content
in this skill; that happens as separate passes after a guide's text is
finished.

**Choosing image vs. video.** Both start from the same question — does this
requirement have something worth showing, not just telling? — but split on
what kind of thing it is:

- **A single moment or spatial relationship** — labeled parts, a finished
  state, a correct-vs-incorrect snapshot, a spatial layout — is an *image*.
  A still frame conveys it completely.
- **A multi-step motion or procedure where sequence, timing, or hand
  movement matters** — tying a knot, a rescue technique, CPR compressions,
  a casting stroke — is a *video candidate*, not a multi-panel image
  sequence. Stringing several static panels together to fake motion is the
  antipattern this rule exists to stop: it either omits the transitions
  that are the actual hard part, or bloats into more panels than a reader
  will study. If no authoritative video exists for the concept, fall back
  to one image of the single most failure-prone moment in the motion (per
  the `drg-videos` skill's "no video found" guidance) rather than leaving
  the concept uncovered.

When in doubt while writing, drop whichever placeholder matches, and let
the dedicated skill make the final call.
