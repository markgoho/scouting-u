# Default to local-first templates and CSS against uni-theme, converge later

**Status**: superseded by [ADR 0010](0010-uni-theme-first-with-a-mapper-renderer-split.md)

[ADR 0008](0008-uni-theme-first-for-shared-ui-shells.md) already flipped this ADR's
default for page-level UI shells. ADR 0010 supersedes what was left: there is no
longer a "build local, converge on a trigger" path at all, and the content-bound
carve-out both this ADR and 0008 preserved now applies only to mapping data into the
theme's contract, never to keeping a local copy of shared markup.

With mbu#150/151/152 closed and `uni-theme` pinned at `996acf33`, most rank-specific presentation is too content-bound to reuse from the theme's generic shell today. `_default/list.html`/`single.html` are theme-sourced (confirmed generic), but rank landing CSS, rank JSON-LD, and the search result-card CSS are built locally from scratch rather than adapted from the theme's home hero and Course schema, which are shaped around mbu's content.

Each local-now choice carries a named convergence trigger rather than an open-ended "revisit someday": rank-ladder home CSS converges if mbu's home hero adopts the same shell; search result-card CSS converges if mbu adopts sub-results. Absent those triggers, these stay local indefinitely.
