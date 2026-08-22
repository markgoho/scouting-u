# Short Labels are curated, not synced

**Status**: accepted

Rank Requirement text is immutable — it is Scouting America's wording and the
sync script copies it verbatim. Short Labels are not. The API's `short` field
is blank on most group stems (ADR 0001: only Scout `2`, Scout `6`, and Star `6`
have a parent row at all) and, where it is populated, it is inconsistent across
ranks in casing, voice, and grammatical form: Star `4` was `Service Project(s)`
while the near-identical Life `4` was `Complete service project(s)`, and Eagle
`2` said `Demonstrate Scouting spirit` where Star and Life said `Scout spirit`.

We therefore treat the Short Label as **curated content, seeded by the API**:
whatever is already written in `hugo/data/ranks/scouts-bsa/*.json` wins, and
`row.short` only fills in requirements that are new since the last sync.
`loadCuratedShorts` in `scripts/sync-ranks-api.ts` reads the existing rank file
before rebuilding the tree to enforce this.

## The convention

- **Group stems** get a Title Case noun phrase naming the topic
  (`Camping and Outdoor Ethics`, `Personal Protection`).
- **Leaves and standalone requirements** get a sentence-case, verb-first
  imperative with no leading article (`Complete 6 hours of service`,
  `Demonstrate taut-line hitch`).
- Counts use digits (`Earn 21 merit badges`, `Hike 5 miles`).
- Requirements that mean the same thing across ranks get the same label —
  Star `4` and Life `4` are both `Complete 6 hours of service`; every rank ends
  with `Complete Scoutmaster conference` and `Complete board of review`.

The two tiers are deliberate: the noun phrase reads as a section heading, the
verb phrase tells a Scout what they must actually do. Labels appear as
requirements-page headings, landing-page summaries, and search result-card
titles, so they carry the scanning load that the official text is too long for.

## Blank means the requirement text carries the heading

A Short Label only earns its place when it says less than the official text.
Where the text is already one short sentence, every label we could write just
restates it — "Demonstrate square knot" above "Demonstrate a practical use of
the square knot" is two lines saying one thing.

For those we set `short` to `""`. What a blank title then renders as is
**uni-theme's decision, not ours** — ADR 0010 moved the empty-title-slot policy
into the theme along with the rest of the requirement markup. The theme
promotes a single-sentence text visibly into the heading (as we used to do
locally) and falls back to a hidden derived lead sentence above the full
visible text when the requirement runs longer. Either way the heading element
and its `id` stay, so Pagefind's Route A sub-results keep working (ADR 0002),
and the requirement's full official wording stays on screen.

The rule for blanking, applied once across all seven ranks:

- The requirement text is **16 words or fewer** and carries no markup, **and**
- every meaningful word of the label already appears in that text.

Above 16 words the text is too long to read as a heading, and a label that
compresses it is doing real work. Our rule decides only whether to *write* a
label; where we blank one, the theme decides how the bare text presents. The
two rules do not have to agree, and they do not: five multi-sentence
requirements we blanked render hidden-derived rather than promoted. A label that introduces a word the text does
not use (`Hike 5 miles`, `Earn 21 merit badges`) is also doing real work, at
any length.

**One carve-out**: `Complete board of review` and `Complete Scoutmaster
conference` stay on every rank even where the rule would blank them. The
same-meaning-same-label convention above matters more here than the saved line,
because these are the labels a Scout compares across ranks on search cards and
landing pages.

Landing-page previews (`rank-preview.html`) show the truncated text as the row
title for a blanked requirement, so no surface renders an empty label.

## Consequences

The Short Labels are ours, not Scouting America's, and must never be presented
as official requirement wording. A re-sync no longer reports label drift from
upstream, because it no longer looks: correcting a bad label means editing the
JSON by hand.

`""` is now a curation decision, not an absence, so `loadCuratedShorts` keeps
it across a re-sync — otherwise every blanked label would silently come back
next August. Re-seeding one from the API means deleting the `short` **key**
from the requirement object; only an absent key falls through to `row.short`.
