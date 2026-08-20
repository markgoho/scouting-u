# Requirement-level search via Pagefind heading sub-results

**Status**: accepted

Requirement-level search needed to return individual Rank Requirements, not whole rank pages. Of the three mechanisms #12 found, `addCustomRecord` per requirement gives independently-ranked top-level hits but requires a Node build step and double-indexes (154 results for 147 requirements). We chose route A instead: give every Rank Requirement its own heading with a unique id and rely on Pagefind's native sub-result mechanism (`uni-theme`'s `search.ts` already passes `showSubResults: true`) — no new build infrastructure, no double-indexing.

This trades away interleaved cross-rank ranking: sub-results carry no `score`, so the ranked unit is the page, and results are necessarily grouped by rank.

## Consequences

Every Rank Requirement needs an `h1`–`h6` with a unique, non-blank-text id **on the heading itself**, not a containing element — a missing or duplicate id pollutes the excerpt of the *previous* requirement, since Pagefind's sub-result regions are bounded by heading positions.
