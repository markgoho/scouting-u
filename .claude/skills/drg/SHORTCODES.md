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
  `youtube.com`/`youtu.be`; any other URL falls back to a plain link.
  There is no video-verification pipeline in this repo (rank JSON has no
  `resources` field to source official videos from) — only link videos
  you have independently confirmed exist and are embeddable.

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

- Official per-requirement resources, `drg/video`/`drg/external-link` as
  a *mandatory* per-requirement baseline, YouTube oEmbed verification —
  rank JSON has no `resources` field (`rank.schema.json` forbids it).
- `option` param on `drg/requirement`, "Choose One" overview pages,
  `subrequirement_mode` handling — every rank group is complete-all.
- `<!-- IMAGE: ... -->` placeholders or any image-generation handoff —
  no image pipeline exists for this repo.
