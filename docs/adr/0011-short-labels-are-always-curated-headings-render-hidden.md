# Every requirement gets a curated Short Label; the theme renders child headings hidden

**Status**: accepted

Supersedes [ADR 0009](0009-short-labels-are-curated.md)'s blanking rule. The curation
convention it also established — Title Case noun phrases for group stems, sentence-case
verb-first imperatives with no leading article for leaves, digits for counts,
same-meaning-same-label across ranks — still holds and is unchanged by this ADR.

## What changed

ADR 0009 blanked `short` (`""`) when the official text was 16 words or fewer and every
meaningful word of a label would just restate it, because uni-theme's empty-title-slot
policy then promoted that text **visibly** into the heading — a label next to it would
say the same sentence twice. `tenderfoot 3.a` was ADR 0009's own worked example of a
rejected label: `"Demonstrate square knot"` above `"Demonstrate a practical use of the
square knot."`.

We removed the reason for that rule instead of the rule's logic: uni-theme now ships an
opt-in site param, `site.Params.theme.hideReqChildTitles` (`req-child-item.html` only;
`req-card.html`'s depth-1 heading is untouched), and scouting-u sets it `true` in
`hugo/hugo.toml`. Every lettered child's heading renders `visually-hidden` regardless of
what `text/heading-for.html` would have promoted or hidden — only the marker and the
requirement text show next to each letter. The redundancy ADR 0009's rule existed to
prevent no longer occurs on this page, because no child heading is visible at all
anymore. The driver: a bold summary heading next to every lettered requirement was
redundant noise once the group above it (`"1. Camping and Outdoor Ethics"`) already
carries a heading — the page read as too verbose.

With visibility off the table, we populated `short` on all 17 requirements across
`tenderfoot.json`, `scout.json`, `second-class.json`, and `first-class.json` that ADR
0009 had left blank — including `tenderfoot 3.a`, now `"Demonstrate square knot"`,
exactly the label ADR 0009 rejected. **The blanking rule no longer applies to
scouting-u: every requirement gets a curated Short Label, regardless of text length.**

`mbu`, the theme's other consumer of `req-child-item.html`, leaves the param unset. Its
default is `false`, so this is a no-op there — mbu keeps ADR 0009's original rendering
(hidden derived lead for multi-sentence text, visible promoted text for a single short
sentence) for any content shaped like it.

## Hidden here is not unused elsewhere

`short` was already documented (ADR 0009) as feeding Pagefind titles, search
result-card titles, and rank landing-page previews (`rank-preview.html`) in addition to
the requirements-page heading. Populating the 17 changes those other surfaces from
truncated official text to curated labels — that's a visible, intended effect of this
change, not a side effect confined to the hidden heading.

It also sets up the Digital Requirements Guide: `short` is the planned source for each
requirement's section heading once DRG pages exist, so curating it now is not wasted
work even though the requirements page itself no longer displays it per-child.

## Consequences

- A future editor reading `req-child-item.html`'s output on a rendered scouting-u page
  and seeing no per-child heading should not assume `node.title`/`short` is unused —
  check search cards, landing previews, and (once built) the DRG before "cleaning up" a
  short label as dead content.
- Re-seeding a rank from the API (`loadCuratedShorts` in `scripts/sync-ranks-api.ts`)
  must keep filling every requirement now, not just the ones the old rule would have
  populated — there is no longer a legitimate reason for `short` to be `""` on a leaf
  with non-empty `text` in this repo.
- `hideReqChildTitles` is scouting-u-local opt-in, not a new theme default; a third
  consumer of `req-child-item.html` starts with visible child headings unless it also
  opts in.
