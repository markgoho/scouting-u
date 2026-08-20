# Default to local-first templates and CSS against uni-theme, converge later

**Status**: accepted

With mbu#150/151/152 closed and `uni-theme` pinned at `996acf33`, most rank-specific presentation is too content-bound to reuse from the theme's generic shell today. `_default/list.html`/`single.html` are theme-sourced (confirmed generic), but rank landing CSS, rank JSON-LD, and the search result-card CSS are built locally from scratch rather than adapted from the theme's home hero and Course schema, which are shaped around mbu's content.

Each local-now choice carries a named convergence trigger rather than an open-ended "revisit someday": rank-ladder home CSS converges if mbu's home hero adopts the same shell; search result-card CSS converges if mbu adopts sub-results. Absent those triggers, these stay local indefinitely.
