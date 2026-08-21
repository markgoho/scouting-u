# Pull layout mechanics from uni-theme; keep content-bound styling local

**Status**: accepted

Supersedes the default set by [ADR 0005](0005-local-first-templates-and-css-against-uni-theme.md) for one category of rule. `.rank-landing` and `.rank-requirements` each duplicated a `max-width: 42rem; margin: 0 auto;` wrapper, despite already rendering inside uni-theme's `<main class="main container">`, which sets `--container-max-width: 75rem` and centers via `.container`. The duplicate rule fought the theme's own width instead of composing with it.

Going forward, generic structural CSS — container width, vertical rhythm/padding scale, flex/grid list patterns — should come from uni-theme (`.container`, spacing tokens, existing layout primitives) rather than be redeclared per page. Component-specific styling that is genuinely shaped by rank content (`.rank-req__heading`, `.rank-req--depth-2`'s indent rule, requirement-group borders) stays local per ADR 0005 — there's still no equivalent shape in uni-theme's mbu-oriented components to converge with.

When adding a new page-local stylesheet, check first whether the layout concern (width, spacing, structural containers) is already solved by uni-theme before writing a local rule.
