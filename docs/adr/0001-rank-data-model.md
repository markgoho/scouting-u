# Rank data model: requirement paths, schema, sanitization

**Status**: accepted

## Requirement path model

The ranks API is inconsistent about nesting: only 3 of ~40+ lettered requirement
groups across all 7 ranks have a real parent row with prose (Scout `2`, Scout `6`,
Star `6`). Every other lettered group (all of Tenderfoot, Second Class, First
Class; Scout `1`, `3`, `4`) has no parent row at all — the lettered rows
(`1a.`, `1b.`, ...) are top-level with an empty `parentRequirementId`, and the
shared stem text a human would expect ("1. Do the following:") exists nowhere
in the payload.

The published Scout Rank Requirements sheet visually groups lettered items
with rule lines regardless of whether a stem sentence exists — `1a`-`1f`,
`3a`-`3b`, and `4a`-`4b` are grouped exactly like `2`/`2a`-`2d` and `6a`-`6b`,
just without an intro line. We match that: **every digit stem with lettered
children becomes a structural group node** (`path` = the digit stem;
children `path` = `1.a` etc.), whether or not the API supplies prose for it.
When the API has prose (Scout `2`, `6`; Star `6`), the group node carries it.
When it doesn't, the group node's `text` is an empty string and the template
renders no intro paragraph — just the heading and its lettered children.
Digit stems with no lettered children stay flat singles.

This gives every rank a uniform two-level path shape for anchors, deep links,
and the sidebar rail, without inventing prose the source doesn't have.

`listNumber` (trailing dot stripped) is the sole input to this parse — it is
the only field that orders every rank correctly (`sortOrder` and served array
order both fail on several ranks). If a future re-sync produces a
`listNumber` that doesn't fit `digit + optional letter`, the sync script
throws and halts rather than guessing; sync is manual and annual, so a human
is present to fix it.

## Schema

- Rank-only fields (`short`, `monthsSinceLastRankRequired`,
  `eagleMBRequired`, `totalMBRequired`, `serviceHoursRequired`) are stored
  raw as the API gives them, including fields known to be unreliable or
  always empty. Sync records source truth without editorializing; whether
  and how any of this renders is a separate decision, not yet made.
- Only the active version is stored — `versionId`, `versionEffectiveDt`, and
  current requirement text, described as "current requirements as of Aug
  2026." No historical `versions[]` array; no version-switching UI is
  scoped for the MVP. Revisit if a version-switcher is ever built.
- Rank slugs are derived from `short` (`scout`, `tenderfoot`,
  `second-class`, `first-class`, `star`, `life`, `eagle`) — the same field
  already used for the compact display label elsewhere, avoiding a second
  mapping.
- `hugo/static/schemas/rank.schema.json` is maintained, mirroring mbu's
  `merit-badge.schema.json` convention (draft-07, for ajv-cli).

## Sanitization

Requirement text and rank `header`/`footer` are sanitized to an allowlist
during sync, not at render time, so the data file is trustworthy for every
consumer. This diverges from mbu, which strips all HTML to plain text — rank
prose carries structurally meaningful markup (lists, footnote markers) that
mbu's badge prose didn't.

Allowlist: `<strong>`, `<em>`, `<i>`, `<sup>`, `<p>`, `<ul>`, `<ol>`, `<li>`,
`<q>`, `<a href>`. The four `<br>` spellings found in the corpus (`<br>`,
`<br/>`, `<br />`, `</br>`) normalize to one. Decorative
`class="li-disc"/"li-none"/"li-a"` attributes are stripped. The sole entity,
`&rsquo;`, is decoded.

One known malformed row (Tenderfoot `6c`, one `<li>` used where `</li>` was
meant) is auto-fixed by the sync script as a specific, commented patch. Any
other unbalanced-tag string encountered fails the sync loudly rather than
being silently rendered wrong.

`footer` syncs as a single sanitized-HTML blob, `<sup>N</sup>` footnote
markers included as-is. There is no structured link between a marker and its
note in the source (matching is by digit only, and one row uses a bare `*`
instead), so no parsing or cross-linking happens at this layer — that's a
rendering decision, not a data-model one.
