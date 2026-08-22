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

## Consequences

The Short Labels are ours, not Scouting America's, and must never be presented
as official requirement wording. A re-sync no longer reports label drift from
upstream, because it no longer looks: correcting a bad label means editing the
JSON by hand. Deleting a `short` (setting it to `""`) is the way to re-seed one
from the API.
