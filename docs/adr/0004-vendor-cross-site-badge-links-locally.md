# Vendor mbu's eagle-required badge list locally rather than sharing a data source

**Status**: accepted

Eagle/Star/Life rank pages need to link to the 17 Eagle-required merit badges mbu defines, but no shared data source exists between the two repos — `uni-theme` ships no `data/` directory today. Rather than block cross-site linking on building that shared convention, we vendored a static local copy of the filtered `MERIT_BADGES` list (mechanism (a): counts plus a fixed canonical list; no OR-group prose parsing, which stays a separate, later mechanism).

This accepts drift risk — the vendored copy can go stale against mbu's source of truth — until a shared `uni-theme` `data/merit-badges.json` convergence lands (flagged to [mbu#128](https://github.com/markgoho/mbu/issues/128#issuecomment-5345367337)). Link-checking to catch that drift is deferred to fog.
