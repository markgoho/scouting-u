# Extract shared UI to uni-theme immediately; consumers map, the theme renders

**Status**: accepted

Supersedes [ADR 0005](0005-local-first-templates-and-css-against-uni-theme.md) outright
and narrows [ADR 0008](0008-uni-theme-first-for-shared-ui-shells.md)'s remaining
carve-out.

ADR 0005 said build local, converge on a named trigger. ADR 0008 flipped that default
for page-level shells but kept a carve-out: content genuinely shaped by one domain's
own data — "rank's leaf/group requirement-tree structure, mbu's guide/
`subrequirement_mode` fields" — stays local. The requirement card was the test case,
and the carve-out failed it.

Mark's ruling: no more "build local, converge later." Anything shared extracts to
uni-theme immediately.

## Why the carve-out failed

`requirement-node.html` looked content-bound by ADR 0008's test, so it stayed local
while uni-theme owned everything around it: the `.req-card`/`.req-child` CSS, the dock
and sidebar partials, and `deep-link.ts` — 319 lines of selection, dock targeting,
copy-link, copy-text, and guide-link behavior. The theme owned the reader; each site
hand-wrote the writer; the interface between them existed only in whatever both
happened to emit.

That cost real bugs, none of which any test would have caught:

- scouting-u never emitted `data-guide`, so the dock's Study Guide button rendered a
  dead `href=""` on every rank page.
- Both sites independently re-derived, empirically, that Pagefind's Route A sub-results
  need the `id` on a non-blank `h1`-`h6` (scouting-u#35). Neither wrote it down.
- Both answered "what fills a title slot with no curated label?" differently — mbu with
  a hidden derived lead sentence, scouting-u by promoting the text (ADR 0009) — so two
  sibling sites behaved differently for the same case, by accident.

The mistake was reading the divergence between the two card partials as a *presentation*
difference. It was a *data-shape* difference. Presentation and behavior were supposed to
be identical all along.

## The split

A consumer maps its own data into uni-theme's node dict. The theme renders it.

- **Local**: mapping only. Rank JSON to node dict; whatever content-bound resolution
  that needs (Short Label lookup, marker shape, DRG guide href once it exists) happens
  before the dict is built.
- **Theme**: all markup, the `deep-link.ts` selector contract, the Pagefind non-blank-
  heading invariant, and policy decisions that were previously per-site — including the
  empty-title-slot policy that ADR 0009 used to implement locally.

This keeps ADR 0005/0006's real insight — content-bound logic does not belong in a
shared theme — while denying its conclusion, that content-bound logic justifies a local
copy of shared markup. The mapper is the carve-out. Nothing downstream of it is.

## Consequences

Local partials that render shared UI become partials that `return` a dict and emit
nothing. `requirement-node.html` is the first; it no longer recurses into markup, only
into data.

A theme change can now break a consumer silently, because the contract is a dict shape
rather than a template. Two mitigations, both proven on the first migration: the
contract is documented in uni-theme's `CONTRACT.md`, and the consumer with the awkward
data verifies against real content before the theme pushes. scouting-u's rank text is
pre-rendered HTML rather than markdown, which is the only thing exercising the theme's
`text_format` and block-content paths today — mbu's markdown never reaches them.

Deciding *what* counts as shared still takes judgment. The test is not "does this branch
on my domain's fields" — that test produced the duplication above. It is "should this
look and behave the same on both sites?"
