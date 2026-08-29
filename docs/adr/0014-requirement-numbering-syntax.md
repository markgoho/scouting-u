# Requirement Numbering Syntax and Representation Across Layers

**Status**: accepted

## Context

Rank requirement numbers originate from the national advancements API in `listNumber` fields formatted as `1a.`, `2b.`, `10.`, etc. Across the application layers (data storage, URLs, page routing, CSS view-transitions, and reader-facing typography), requirement identifiers serve different purposes requiring consistent syntax conventions.

Prior to this decision, guide navigation grouped child requirements under generic uppercase subheadings (`REQUIREMENT 1`) with an introductory landing page and non-numbered child links (`Participate in 10 activities`). This created unnecessary page hops and left child links ambiguous when viewed out of context.

## Decision

### 1. The Four Syntactical Representations

Requirement numbers exist in four distinct forms across the codebase:

| Layer / Purpose | Syntax | Example | Usage |
| :--- | :--- | :--- | :--- |
| **Data Model Path (`path`)** | Dot-separated string | `1`, `1.a`, `1.b`, `10` | Canonical address in `rank.json` (ADR 0001) and internal data pipelines. |
| **Page `<h1>` & Content Titles** | Clean action title | `Participate in 10 activities`, `Invite someone to Scouting` | Page `<h1>`, breadcrumbs, and `prev`/`next` footer titles (no repetitive number). |
| **Parent Kicker / Eyebrow** | Numbered topic stem | `1. Camping and Outdoor Ethics`, `3. Tools` | Sidebar group subheading and page header kicker above `<h1>`. |
| **Side Navigation Items** | Sub-letter / Number marker | `a Participate in 10 activities`, `10. Invite someone to Scouting` | Sidebar link with tabular monospace marker column (`a`, `b` without period; `10.` with period). |
| **URL Slugs & Anchor IDs** | Compact (no dots) | `req1a`, `req10`, `{#1a}` | File paths (`guide/req1a.md`), web URLs (`/guide/req1a/`), and Pagefind sub-result anchor IDs. |
| **View Transition Keys** | Hyphenated lower | `1-a`, `2-b`, `10` | CSS `view-transition-name` tokens (`req-title-1-a`, `req-text-1-a`). |

### 2. Guide Hierarchy & Navigation Structure (Model A)

1. **Elimination of Group Overview Pages**: Multi-child requirement groups (e.g. First Class 1, 2, 3) no longer generate an intermediate parent overview page (`req1.md`). The linear reading chain flows directly from the guide index (`_index.md`) into the first child page (`req1a.md`).
2. **Parent Stems as Subsection Headings**: The parent group stem's curated `short` label with parent requirement number (e.g. `1. Camping and Outdoor Ethics`, `3. Tools`) serves as the subsection header in the navigation and as the kicker above the page's `<h1>`.
3. **Clean Action `<h1>`**: The `<h1>` displays the unencumbered verb-first imperative title (`Discuss lashing uses`, `Participate in 10 activities`), avoiding redundant numbering above the lead quote block.
4. **Sub-Letter Markers in Navigation**: Child navigation items display `a`, `b`, `c` (omitting the trailing period) in a dedicated tabular monospace column (`.req-nav__marker`), keeping titles perfectly aligned down the left margin. Standalone requirements display their full number (`10.`, `11.`).

### 3. Conformance Rules

- **Subrequirements** display as `a`, `b` under a numbered group heading (`3. Tools`) in the nav, with a clean `<h1>` and lead quote box.
- **Standalone requirements** with no children use trailing-dot notation in the nav (`10. Invite someone to Scouting`) and have an unnumbered clean `<h1>`.
- **Parent requirement lookups** on requirements pages resolve directly to the first child page (`/guide/req1a/`) when a parent stem card is selected.
