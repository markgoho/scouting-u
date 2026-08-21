# Scouting University

A site that renders Scouts BSA rank requirements, pulled from Scouting America's advancements API, in a human-friendly format. Sibling site to [mbu](https://github.com/markgoho/mbu) (merit-badge.university); both consume the shared `uni-theme` Hugo module.

## Language

**Program**:
One of Scouting America's four program tracks (Scouts BSA, Cub Scouting, Sea Scouting, Venturing). This MVP covers Scouts BSA only; the URL hierarchy is program-first (`/scouts-bsa/...`) to leave room for the others.
_Avoid_: Track, division

**Rank**:
An achievement level within one Program (Scout, Tenderfoot, ... Eagle, for Scouts BSA). The site's central concept — analogous to mbu's Merit Badge. Every rank, including Scout (`level` 1), is earned by completing its requirements — a new troop member has not yet earned any rank, and Scout is not a default or starting state.
_Avoid_: Badge, achievement (unqualified); describing Scout as a default/starting rank

**Level**:
A Rank's numeric position within its Program's sequence. Restarts per Program (Cub Lion is `0`); not a synonym for Rank, just its ordinal.
_Avoid_: Rank number, order

**Rank Requirement**:
A discrete unit of work a Scout must complete to earn a Rank, expressed as text with an optional Rank Requirement Path, a Short Label, and — for the top 6 lettered groups — child Rank Requirements. Named "Rank Requirement," not "Requirement," to stay unambiguous alongside mbu's `CONTEXT.md`, which already owns "Requirement" for merit-badge requirements.
_Avoid_: Requirement (unqualified — collides with mbu), step, task

**Rank Requirement Path**:
A dot-separated, fully qualified address that uniquely identifies a Rank Requirement within a Rank (e.g. `2`, `2.a`). Built from the API's `listNumber` field (digit + optional letter), not by concatenating parent/child IDs the way mbu's Requirement Path is — see ADR 0001.
_Avoid_: Requirement Path (mbu's term), anchor, ID (unqualified)

**Rank Requirement Group**:
A Rank Requirement that has lettered children (e.g. Scout `2`, Star `6`), whether or not the API supplies prose for the stem itself — see ADR 0001. Children of a group are plain Rank Requirements, structurally identical to any other.
_Avoid_: Parent requirement, section

**Short Label**:
The official one-line label for a Rank Requirement, sourced from the API's `short` field. Used as requirements-page heading text, the landing-page summary label, and the search result-card title. No mbu equivalent.
_Avoid_: short (field name only), title, label (unqualified)

**Rank Version**:
A dated snapshot of a Rank's requirements, identified by `version_id` and `version_effective_date`. Only the active version is stored — no historical `versions[]`, no version-switcher UI. Identifier-vs-display-label vocabulary is deliberately not defined yet; nothing in the product surfaces a human-readable version label today, so that naming question waits for the version-switcher fog item to graduate.
_Avoid_: Version (unqualified)
