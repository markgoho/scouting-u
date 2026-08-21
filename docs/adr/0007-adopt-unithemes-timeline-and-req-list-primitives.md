# Adopt uni-theme's timeline and req-list primitives for rank requirements

**Status**: accepted

ADR 0005 and ADR 0006 held that the requirements page's card/rail styling stays local because "there's still no equivalent shape in uni-theme's mbu-oriented components to converge with." That's now out of date for the node-plus-rail shell specifically.

`css/components/timeline.css` already generalized `.req-timeline`/`.req-card`'s numbered-node-plus-panel geometry into `.timeline`/`.timeline__node`/`.timeline__panel`, and the home page's rank ladder (`layouts/partials/home/ladder.html`) already consumes it — it isn't mbu-oriented, it's a genuinely shared primitive that simply hadn't been pointed at the requirements page yet. What was still missing was an equivalent for the *nested child* rail (mbu's `.req-children--rail`/`.req-child--rail`/`.req-child__marker`), so uni-theme gained `.req-list`/`.req-list__item` (rail variant only — mbu's `chips`/`options` variants are driven by `subrequirement_mode`, a field rank JSON has no equivalent of).

The requirements page now composes `.timeline` (depth-1 numbered groups/leaves) with `.req-list` (depth-2 marker/title/text children), with only content-bound chrome (`.rank-req__panel`'s card background/border/shadow, heading/text sizing) staying local per ADR 0005/0006's still-valid rule. mbu's sidebar nav, mobile dropdown, action dock, and options/pills stay mbu-only — rank data has no equivalent of a study guide, per-item copy actions, or a `select`/`all` distinction, and this is a single page rather than one of many needing lateral nav.

mbu's own live templates were not migrated to the new primitive as part of this — that's a separate follow-up with its own regression risk, tracked apart from scouting-u's consumption of it.
