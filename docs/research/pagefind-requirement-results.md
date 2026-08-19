# Requirement-level Pagefind results: mechanisms and the markup each demands

**Issue**: [markgoho/scouting-u#12](https://github.com/markgoho/scouting-u/issues/12) (parent map: #10)
**Researched**: 2026-08-18
**Pagefind version**: 1.5.2 (the version pinned in this repo's `package.json`)
**Status**: Findings only. **No route is chosen here.** The decision belongs to
[#18](https://github.com/markgoho/scouting-u/issues/18) and [#23](https://github.com/markgoho/scouting-u/issues/23).

Every behavioural claim below is either quoted from pagefind.app or proven by a fixture in
`docs/research/fixtures/pagefind-subresults/`. Claims proven by fixture are marked **[fixture]**.
Where docs and fixture disagree, both are reported.

---

## 0. The short version

There are **three** mechanisms that can produce more than one hit for a rank page, not two. They
differ in one property that decides everything downstream: **whether each requirement is a
top-level, independently-ranked result, or a child nested under its rank page.**

| | Mechanism | One hit per requirement? | Independently ranked? | Rank label per hit | Build pipeline |
|---|---|---|---|---|---|
| **A** | Sub-results from heading anchors | Yes, but **nested under the rank page** | **No** — no `score` field | Inherited from page meta | Unchanged (CLI) |
| **B** | One HTML page per requirement | Yes, top-level | Yes | Own page meta | Unchanged (CLI) |
| **C** | `addCustomRecord` per requirement | Yes, top-level | Yes | Own record meta | **Must replace the CLI with a Node script** |

A fourth thing people reach for — putting `data-pagefind-body` on each requirement — **does not
work at all**, and is disposed of first because it is the intuitive wrong answer.

The literal target list in the ticket interleaves ranks:

```
[First Class]  2a. Cook something
[Tenderfoot]   5b. Cook some food
[First Class]  2b. Cook something else
```

**Only B and C can produce that ordering.** Route A structurally cannot — see §2.3.

---

## 1. The mechanism that does not work: `data-pagefind-body` per requirement

The obvious idea is to mark each requirement `<li>` with `data-pagefind-body` so Pagefind treats
each as its own indexable unit. It does not. The docs say so, and the fixtures confirm it.

> "Multiple `data-pagefind-body` elements may exist on a page, and their content will be combined."
>
> — [Indexing](https://pagefind.app/docs/indexing/)

"Combined" means combined into **one record for the page**, not one record each.

**[fixture]** `site-b/` nests a `data-pagefind-body` on every requirement `<li>` *inside* an outer
page-level `data-pagefind-body`. `site-c/` puts `data-pagefind-body` on sibling requirement `<li>`
elements with **no** outer wrapper at all. Both produce `page_count=1`:

```
=== site-b: page_count=1
=== site-c: page_count=1
```

Searching either index for "cook" returns exactly **one** result, with the requirements appearing
as sub-results (because they also carry heading anchors), never as separate results.

**Consequence for the template**: the number of `data-pagefind-body` elements on the requirements
page is irrelevant to result granularity. Nesting them is legal but pointless. One record per HTML
file is a hard property of the CLI indexer; the only ways around it are a second HTML file (route B)
or a synthetic record (route C).

---

## 2. Route A — sub-results

### 2.1 What triggers a sub-result

> "Sub-results allow Pagefind to provide context on which sections of a page match a search term,
> based on the HTML `id` attributes found on the page."
>
> "Sub-results are based on headings (`h1` → `h6`) that have `id` attributes that can be linked to."
>
> — [Sub-results](https://pagefind.app/docs/sub-results/)

Three conditions, all necessary, all confirmed by fixture:

1. The element is a **heading**, `h1`–`h6`. Not a `<li>`, not a `<div>`, not a `<p>`.
2. It has an **`id`**.
3. It has **non-blank text content**.

**[fixture]** `site-a/` was built to break each condition in turn:

| Markup in `site-a` | Became a sub-result? |
|---|---|
| `<h2 id="1a">1a</h2>` | Yes |
| `<h2 id="2a">2a</h2>` with a nested `<h4 id="2a-i">` beneath it | Yes — **both**, as siblings |
| `<li id="3a"><p class="req-label">3a</p>` (id on a non-heading) | **No** |
| `<h2 id="4a"></h2>` (heading + id, empty text) | **No** |

The `3a` and `4a` text did not vanish — it was absorbed into the **preceding** region (`2b`), whose
excerpt ran on past the end of requirement 2b. This is the single most dangerous markup failure
mode for this site: a requirement without a compliant heading does not merely fail to surface, it
**pollutes the neighbouring requirement's excerpt**.

### 2.2 What a sub-result carries

**[fixture]** The exact object, dumped from a live search:

```json
{
  "title": "2a",
  "url": "/scouts-bsa/ranks/first-class/requirements/#2a",
  "anchor": { "element": "h2", "id": "2a", "text": "2a", "location": 24 },
  "weighted_locations": [ { "weight": 1, "balanced_score": 512.14, "location": 47 } ],
  "locations": [ 47 ],
  "excerpt": "2a. Help plan a patrol menu ... that requires <mark>cooking</mark> at least two of the meals.",
  "plain_excerpt": "2a. Help plan a patrol menu ... that requires cooking at least two of the meals."
}
```

Keys, verbatim: `title, url, anchor, weighted_locations, locations, excerpt, plain_excerpt`.

Note what is **absent**: `meta`, `filters`, and `score`. See §2.3 and §4.

`title` is the heading's own text. For requirement headings that means `title` is the requirement
**number** (`"2a"`), not its prose — which is exactly the label the target list wants in its second
column, and is free.

`url` is `page URL + #id`, so every sub-result is **independently linkable** without any extra work.

### 2.3 The decisive limitation: sub-results are not independently ranked

**[fixture]** A top-level result object has keys `[id, score, words, data]` and a real `score`
(e.g. `1.282297968864441`). A sub-result has **no `score` key**. Sub-results are an array *inside*
one page's `data()`.

So the ranked unit is the **page**. A search for "cook" over the real 7-rank site returns 7 results
(one per rank), each carrying up to 38 sub-results. The DOM order the UI can produce is therefore
necessarily grouped:

```
First Class            <- one page result
  2a. Cook something
  2b. Cook something else
Tenderfoot             <- next page result
  5b. Cook some food
```

It **cannot** interleave `First Class / Tenderfoot / First Class` as the ticket's target list does.

**Partial mitigation, worth knowing**: each sub-result does carry
`weighted_locations[].balanced_score`. Summing or maxing those gives a per-sub-result number that
could order a client-side flattened list. This is a real option, but note two costs: it is an
**undocumented internal field** (it appears in no docs page fetched for this ticket, only in the
runtime output), and the resulting ordering would be locally computed within the already
page-ranked set — a page that never made the result list contributes no sub-results to sort.

### 2.4 Markup route A demands of the Hugo template

Concretely, for `layouts/.../requirements.html`:

- Every requirement node that should be findable must render an `h1`–`h6` element.
- That heading must carry a **unique-per-page `id`**. The requirement's `listNumber` / path
  (`2a`, `2a-i`) is the natural id and is already in the rank JSON.
- The heading must contain **visible, non-empty text**. The requirement number alone is enough and
  yields the right `title`. If the design does not want a visible number, it must still be in the
  DOM — hiding it with `data-pagefind-ignore` would remove it from the index, and hiding it with
  CSS is fine but a heading whose text is emptied at build time is not.
- **Child requirements flatten.** `2a-i` nested inside `2a`'s `<li>` became a *sibling* sub-result,
  not a nested one. There is no hierarchy in the sub-result array. If the UI needs to show
  "2a(i) is under 2a", that relationship must be reconstructed from the id string or supplied
  separately — Pagefind will not carry it.
- **A heading must precede every requirement's prose.** Because region boundaries are heading
  positions, any prose before the first heading, or after the last, lands in a page-level
  sub-result or in the final requirement's region respectively. Trailing page furniture (footnotes,
  "see the troop cookbook") inside `data-pagefind-body` will be appended to the **last**
  requirement's excerpt unless it is wrapped in `data-pagefind-ignore`.
- Heading **level does not matter** — `h2` and `h4` both produced sub-results. Levels can follow
  the document outline freely.
- `data-pagefind-body` placement is unconstrained (§1). One on the requirements wrapper is enough.

---

## 3. Routes B and C — one indexed unit per requirement

Both routes make each requirement a **top-level, independently-scored result**, which is what the
ticket's target ordering requires. They differ in where the unit comes from.

### 3.1 Route B — a real HTML page per requirement

Hugo emits `/scouts-bsa/ranks/first-class/requirements/2a/index.html`, each with its own
`data-pagefind-body`, its own `<h1>`, its own meta and filter.

**[fixture]** `route2a` in `run.mjs`. Searching "cook" returns **147 results** at real scale, one
per requirement, each with its own `meta` and `filters`:

```
PAGE /scouts-bsa/ranks/first-class/requirements/3b/
  meta:    { title: 'First Class 3b' }
  filters: { rank: [ 'First Class' ] }
```

- **Result URL**: a real, navigable page — `.../requirements/2a/`. Not a fragment.
- **Markup demanded**: nothing unusual. A normal Hugo page per requirement, `data-pagefind-body` on
  its main, `data-pagefind-meta` for rank and requirement number, `data-pagefind-filter` for rank.
  No heading-id discipline needed at all — sub-results are irrelevant here.
- **Cost outside Pagefind**: 147 extra output pages, 147 extra URLs in the sitemap, and a real
  design question about what a single-requirement page *is* as a destination. That cost is a site
  architecture decision, not a search decision, and is much larger than the index cost.

### 3.2 Route C — `addCustomRecord` per requirement

The rank pages stay as they are; a Node build script additionally injects one synthetic record per
requirement whose `url` is the **fragment URL back into the rank page**.

> ```js
> const { errors, file } = await index.addCustomRecord({
>     url: "/contact/",
>     content: "My raw content to be indexed for search. Will be lightly processed by Pagefind.",
>     language: "en",
>     meta: { title: "Contact", category: "Landing Page" },
>     filters: { tags: ["landing", "company"] },
>     sort: { weight: "20" }
> });
> ```
>
> — [Node API](https://pagefind.app/docs/node-api/)

`url`, `content` and `language` are required; `meta`, `filters` and `sort` are optional. `content`
is raw text, "lightly processed" — not HTML, so no anchors and no sub-results within a record.

**[fixture]** `route2b` in `run.mjs`. Each record produces exactly the target shape:

```
PAGE /scouts-bsa/ranks/first-class/requirements/#2a
  meta:    { rank: 'First Class', req: '2a', title: '2a' }
  filters: { rank: [ 'First Class' ] }
  excerpt: Requirement 5 for First Class. <mark>Cook</mark> a meal over a fire, ...
```

- **Result URL**: `/scouts-bsa/ranks/first-class/requirements/#2a` — a fragment link into the
  existing rank page. **A fragment URL is accepted without complaint**, which is the finding that
  makes this route viable: no new pages, and the link still lands on the requirement.
- **Markup demanded on the requirements page**: only that the anchor targets exist —
  `id="2a"` on *some* element. Unlike route A it need **not** be a heading, so mbu's existing
  `<li id="{{ $req.path }}">` pattern would already satisfy it.
- **Pipeline consequence — the real cost.** `addCustomRecord` is **Node API only**. This repo's
  `package.json` currently indexes with the CLI:
  ```json
  "index": "bunx pagefind --site hugo/public"
  ```
  There is no custom-record path through the CLI. Route C requires replacing that script with a
  Node build script that calls `createIndex` / `addDirectory` / `addCustomRecord` / `writeFiles`.
  That is a concrete, non-trivial change to the build for #18/#23 to price in.
- **Double-indexing is real and confirmed.** **[fixture]** The `route2b` index returns
  **154 results** for "cook" at real scale: 7 rank pages *plus* 147 records. Every requirement
  matches twice — once inside its rank page's record, once as its own record. Suppressing the
  duplicate means removing `data-pagefind-body` from the rank page, which makes **the rank page
  itself unfindable**. The docs do not mention this interaction; the fixture shows it immediately.

---

## 4. Metadata and filters: page-scoped, never sub-result-scoped

### 4.1 What the docs say

> "Each metadata key can only have one value per page."
>
> — [Metadata](https://pagefind.app/docs/metadata/)

> "An element tagged with `data-pagefind-filter` will associate **that page** with the filter name,
> and capture the contents of the element as the filter value." … "Filters can have multiple values
> per page."
>
> — [Filtering](https://pagefind.app/docs/filtering/)

Both attributes are page-scoped. There is no documented sub-result scope, and §2.2 shows the
sub-result object carries neither `meta` nor `filters`.

### 4.2 What the fixture shows about attributes placed *inside* a requirement region

**[fixture]** `site-b/` sets `data-pagefind-meta="req:5b"` and `data-pagefind-filter="req_num:5b"`
inside requirement 5b's region, and the 5c equivalents inside 5c's. Both **escape their region**,
and they escape differently:

```
meta:     { rank: 'Tenderfoot', req: '5c', title: 'Tenderfoot Rank Requirements' }
filters:  { req_num: [ '5b', '5c' ] }
```

- **Meta collides — last one wins.** `req` ended as `'5c'`; requirement 5b's value was silently
  overwritten. This is "one value per page" in action.
- **Filters accumulate.** `req_num` became `['5b','5c']`, so the page matches a filter on either —
  but nothing records *which* requirement carried which value. Filtering by `req_num:5b` would
  return the whole Tenderfoot page.

**Neither attribute can label an individual sub-result.** Any per-requirement metadata written into
the requirements page is either lost (meta) or de-associated (filters).

### 4.3 Why this is nearly a non-issue for the rank label

The thing the ticket actually wants attached to each hit is the **rank name** — and rank is a
property of the *page*, not of the requirement. Every sub-result on the First Class page is First
Class. So page-level `data-pagefind-meta="rank:First Class"` plus
`data-pagefind-filter="rank:First Class"` is sufficient to label every hit correctly under **all
three routes**; the UI reads it from the parent result and applies it to each child.

What page-level scoping **does** block is per-requirement metadata that varies *within* a page —
for example a per-requirement `eagle_required` flag, or the `short` one-line label from the API.
Under route A those cannot be attached to a hit at all. Under B and C they are trivial, because
each requirement owns its record.

### 4.4 One live gotcha in the inline syntax

> "The exception is specifying metadata inline, which may only be the last item in a list."
>
> — [Metadata](https://pagefind.app/docs/metadata/)

**[fixture]** `site-a/` violates this deliberately. Written as
`data-pagefind-meta="rank:First Class, rank_slug:first-class"`, Pagefind indexed:

```
meta: { rank: 'First Class, rank_slug:first-class', ... }
```

The inline value swallowed the rest of the attribute, silently. **One inline `key:value` capture per
element, and it must be last.** Use separate hidden `<span>`s for multiple values — as `site-a` then
does successfully.

---

## 5. Can the excerpt be the full requirement text?

Yes, under all three routes, and route A gets it almost for free.

`excerptLength` is a search-time option, not an index-time one:

> "Set the maximum length for generated excerpts. Defaults to `30`."
>
> — [Search Config](https://pagefind.app/docs/search-config/)

The default of 30 words is why requirement excerpts look truncated out of the box. mbu already
raises it to 500 in `uni-theme`'s `assets/ts/search.ts`.

**[fixture]** The important finding is that **a sub-result's excerpt is clamped to its own anchor
region, but the page-level excerpt is not.** Re-running route A at `excerptLength=500`:

- the **page** excerpt runs on across a dozen requirements into one unreadable wall of text;
- each **sub-result** excerpt is exactly one complete requirement, ending cleanly at the next
  heading:

  > `1a. Requirement 1 for First Class. <mark>Cook</mark> a meal over a fire, demonstrate first aid,
  > tie a bowline, and explain the outdoor code to your patrol leader before the next campout.
  > Discuss what you learned with your Scoutmaster and record it in your handbook.`

So under route A, setting `excerptLength` at or above the longest requirement's word count yields
**the full requirement text, with matches marked, for free** — provided §2.4's heading discipline
holds, since the clamp is the heading boundary. Under routes B and C the record *is* one
requirement, so the same setting produces the same result trivially.

**Supplementing rather than replacing** also works. Metadata is searched and returned:

> "Metadata is returned alongside the data for each search result, and will also be searched
> alongside body text."
>
> — [Metadata](https://pagefind.app/docs/metadata/)

**[fixture]** `site-c/` puts a 250-character full requirement into
`data-pagefind-meta="reqtext:..."` and it came back **complete and untruncated**. No length cap is
documented and none was observed. But this is only useful at **one requirement per record** —
§4.2's collision rule means a rank page can hold exactly one `reqtext`. Practically: routes B and C
can ship the canonical requirement text as metadata alongside a marked-up excerpt; route A cannot.

---

## 6. Index size at the real scale

**[fixture]** `run.mjs` at the real Scouts BSA shape — 7 ranks, 20/27/37/38/10/8/7 = **147
requirements**, ~250 characters of prose each:

```
route1   pages= 7  custom=  0  fragments=  7  fragment=  4.3 KiB  index=2.2 KiB  total=637.7 KiB
route2a  pages=147 custom=  0  fragments=147  fragment= 42.3 KiB  index=1.7 KiB  total=676.0 KiB
route2b  pages= 7  custom=147  fragments=154  fragment= 47.1 KiB  index=3.2 KiB  total=682.4 KiB
```

`total` is dominated by the ~630 KiB Pagefind runtime bundle, which is identical in all three. The
**differential** is what matters:

- Route A (route1): **~6.5 KiB** of actual index and fragment data.
- Route B (route2a): **~44 KiB** — about **38 KiB more** than route A.
- Route C (route2b): **~50 KiB** — about **44 KiB more** than route A, because it carries both.

**Index size is not a discriminator at this scale.** A 40 KiB difference against a 630 KiB runtime
is noise. Also note fragments are fetched lazily and per-result, so the per-search network cost is
roughly *lower* for B and C — one small fragment per hit rather than one large page fragment.

For headroom: `SYNTHETIC_22=1 node run.mjs` reruns at 22 ranks × 40 requirements = 880, the shape
if Cub Scouting, Sea Scouting and Venturing are all added. **That figure is synthetic**, not the MVP.

---

## 7. One ranking consequence worth flagging to #18/#23

Routes B and C replace a few long pages with ~147 very short records, and Pagefind's default
ranking is length-sensitive:

> "Reducing the `termFrequency` parameter is a good way to boost longer documents in your search
> results, as they no longer get penalized for having a low term frequency."
>
> — [Ranking](https://pagefind.app/docs/ranking/)

`pageLength` (default 0.75) "will strongly favour pages that are shorter than the average page on
the site" at 1.0. On a site whose index is 147 one-paragraph records plus a handful of long prose
pages, the short records will out-rank the prose pages for the same term unless `pageLength` and
`termFrequency` are tuned. This was not measured here — it is a flagged risk, not a finding.

---

## 8. What mbu actually does, verified

The ticket states mbu returns one result per badge. That is right, but the reason is more specific
than "it marks the page with `data-pagefind-body`", and it matters.

`uni-theme`'s `assets/ts/search.ts` — which mbu vendors and this site would inherit — **already
passes `showSubResults: true`** and `excerptLength: 500`. mbu is therefore *configured* for
sub-results.

It gets none, because of its markup. In `hugo/layouts/partials/merit-badges/req-card.html` the
requirement id is on the list item:

```html
<li id="{{ $req.path }}" class="req-card" ...>
```

and its heading carries no id and is conditional on guide content:

```html
{{ with $lookup.title }}<h3 class="req-card__title" ...>{{ . }}</h3>{{ end }}
```

That is precisely the `site-a` `3a` case in §2.1 — an id on a non-heading — which produces **zero**
sub-results. So mbu's granularity is not a deliberate configuration choice that scouting-u must
override; it is a markup consequence that **route A would fix with an id moved onto a heading**,
with no change to the shared `search.ts` at all.

This also means the shared `search.ts` needs no modification for route A, and would need changes for
neither B nor C either — both produce ordinary top-level results.

---

## 9. What this does not settle

- **Whether `weighted_locations[].balanced_score` is safe to depend on** for client-side flattening
  under route A. It is undocumented and could change between Pagefind versions.
- **Sub-result count limits.** No cap was observed — a First Class page returned all 38 sub-results
  — but the docs say only that "sections with the most hits" are prioritised, implying an ordering
  exists. Whether `PagefindUI` truncates the rendered list was not tested (this research drove the
  JS API directly, not the UI component).
- **Ranking behaviour at real scale** (§7) — flagged, unmeasured.
- **Whether a fragment-URL custom record confuses `highlightParam`.** Highlighting requires
  importing `/pagefind/pagefind-highlight.js` on destination pages
  ([Highlighting](https://pagefind.app/docs/highlighting/)); its interaction with a `#anchor` +
  `?highlight=` URL was not exercised.
- **Route B's real cost is a content-architecture question**, not a search one: what a
  single-requirement page is for. That belongs to #18, not here.

---

## 10. Reproducing this

Fixtures live in `docs/research/fixtures/pagefind-subresults/`. `.build/` is generated and
gitignored.

```sh
cd docs/research/fixtures/pagefind-subresults
node run.mjs                              # builds every index, prints index sizes
node search.mjs .build/site-a-index cook  # live search, prints sub_results verbatim
node search.mjs .build/route1-index cook 500   # excerpt clamping at excerptLength=500
node dump-fragment.mjs .build/site-b-index     # decoded fragment: anchors, meta, filters
SYNTHETIC_22=1 node run.mjs               # headroom run at 880 requirements
```

| Fixture | Isolates |
|---|---|
| `site-a/` | Anchor eligibility, region boundaries, the inline-meta gotcha |
| `site-b/` | **Nested** `data-pagefind-body`; region-local meta/filter escape |
| `site-c/` | **Sibling** `data-pagefind-body` with no wrapper; long meta values |
| `run.mjs` route1 | Route A at real scale |
| `run.mjs` route2a | Route B at real scale |
| `run.mjs` route2b | Route C at real scale, incl. double-indexing |

`search.mjs` serves a built index over localhost and drives the real `pagefind.js`, so the
`sub_results` printed are the ones Pagefind itself computes — nothing is transcribed or simulated.
`dump-fragment.mjs` decodes `.pf_fragment` files directly; its sub-result derivation is a
transcription of `calculate_sub_results` from the generated bundle and is used only for inspecting
anchors, not for any claim above.

## Sources

- [Sub-results](https://pagefind.app/docs/sub-results/)
- [Indexing](https://pagefind.app/docs/indexing/)
- [Metadata](https://pagefind.app/docs/metadata/)
- [Filtering](https://pagefind.app/docs/filtering/)
- [Node API](https://pagefind.app/docs/node-api/)
- [Search API](https://pagefind.app/docs/api/)
- [Search Config](https://pagefind.app/docs/search-config/)
- [Ranking](https://pagefind.app/docs/ranking/)
- [Highlighting](https://pagefind.app/docs/highlighting/)
