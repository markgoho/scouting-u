# Ranks API surface and field semantics

Research for [#11](https://github.com/markgoho/scouting-u/issues/11) (map [#10](https://github.com/markgoho/scouting-u/issues/10)).
Consumed by grilling ticket #16 — this file reports facts, not decisions.

- **Source**: Scouting America advancements API v2. Primary source only; no secondary write-ups were read.
- **Fetched**: 2026-08-18. All 8 payloads pulled in one pass.
- **Auth**: none. Plain `GET`, no headers, HTTP 200 on every call.
- **Analysis script**: [`analyze-ranks-api.py`](./analyze-ranks-api.py) in this directory. It reads the 8 JSON files and prints every tally quoted below.

## Reproducing

```sh
mkdir -p api
curl -sS "https://api.scouting.org/advancements/v2/ranks" -o api/ranks.json
for i in 1 2 3 4 5 6 7; do
  curl -sS "https://api.scouting.org/advancements/v2/ranks/$i/requirements" -o "api/req-$i.json"
done
python3 analyze-ranks-api.py   # expects ./api/ alongside it
```

Response sizes on 2026-08-18: `ranks.json` 67,283 B; requirements 15,378 / 21,005 / 30,368 / 30,831 / 9,687 / 8,900 / 11,305 B for ranks 1–7.

## Reading conventions used throughout

- **"Empty" means the literal `""`.** Across all 8 payloads, no field is ever `null`. Unset objects are `{}`, unset arrays are `[]`, unset scalars are `""`. There is no `null` anywhere.
- **Two boolean encodings coexist.** `/ranks` (catalog) uses real JSON types: `lds: true`, `level: 1`, `price: 3.29`. `rankInformation` and every requirement row stringify everything: `lds: "True"`, `level: "1"`, `price: "3.29"`, `required: "True"`. The exceptions are four requirement-row fields that *are* real JSON booleans/arrays: `electiveAdventure`, `requiresSSElective`, `linkedElectiveAdventures`, `ssElectives`. So one requirement row carries `required: "True"` (capital-T string) next to `electiveAdventure: false` (JSON boolean).
- Rank ids 1–7 were confirmed as Scouts BSA by filtering `programId == 2`, not assumed.

---

## 1. Endpoint shapes

### `GET /advancements/v2/ranks`

Returns a bare **JSON array of 22 rank objects**. Grouping by program:

| programId | program | n | ids |
|---|---|---|---|
| 2 | Scouts BSA | 7 | 1–7 |
| 1 | Cub Scouting | 7 | 8–14 |
| 5 | Sea Scouting | 4 | 15–18 |
| 4 | Venturing | 4 | 19–22 |

Rank object keys (15): `id`, `name`, `short`, `reallyShort`, `level`, `image`, `programId`, `program`, `searchKeywords`, `lds`, `sku`, `price`, `priceLastUpdated`, `scoutNet`, `versions`.

### `GET /advancements/v2/ranks/{id}/requirements`

Returns an **object** with exactly two keys: `rankInformation` (object) and `requirements` (array).

`rankInformation` is, precisely, *the catalog rank object unioned with the active version object, flattened and stringified*:

- present in `rankInformation`, absent from the catalog rank object: `rankId`, `version`, `versionEffectiveDt`, `versionExpiryDt`, `expiredDate`, `header`, `footer`, `adminNotes`, `proofReadDate`, `active`, `disabledOnQuickEntry`, `imageUrl100`, `imageUrl200`, `imageUrl400`
- present on the catalog rank object, absent from `rankInformation`: `id` (renamed `rankId`), `program` (only `programId` survives), `versions`

**The endpoint serves exactly one version.** Every row in `.requirements[]` carries the same `versionId`, and it is the id of the version named by `rankInformation.version`:

| rank | rankInformation.version | versionId on every row | rows |
|---|---|---|---|
| 1 Scout | 2022 | 84 | 20 |
| 2 Tenderfoot | 2022 | 83 | 27 |
| 3 Second Class | 2022 | 98 | 37 |
| 4 First Class | 2022 | 99 | 38 |
| 5 Star Scout | 2016 | 40 | 10 |
| 6 Life Scout | 2016 | 41 | 8 |
| 7 Eagle Scout | **2026** | 108 | 7 |

There is no documented parameter for requesting a non-current version. Historical requirement text is therefore **not** reachable through this endpoint — only the historical `header`/`footer` prose is, via `versions[]` in the catalog.

147 requirement rows total across the 7 ranks.

---

## 2. Requirement row: full field inventory

Every row has all 25 keys, in this order:

`id`, `versionId`, `name`, `short`, `listNumber`, `requirementNumber`, `sortOrder`, `footer`, `childrenRequired`, `required`, `parentRequirementId`, `videoExternalURLId`, `previousRankRequired`, `monthsSinceLastRankRequired`, `eagleMBRequired`, `totalMBRequired`, `serviceHoursRequired`, `disabledOnQuickEntry`, `linkedAdventureId`, `linkedAwardId`, `linkedAdventure`, `electiveAdventure`, `linkedElectiveAdventures`, `requiresSSElective`, `ssElectives`.

Populated (non-empty) count per field, per rank, as `populated/rows`:

| field | 1 Scout | 2 Tndrft | 3 2nd Cl | 4 1st Cl | 5 Star | 6 Life | 7 Eagle |
|---|---|---|---|---|---|---|---|
| `id` | 20/20 | 27/27 | 37/37 | 38/38 | 10/10 | 8/8 | 7/7 |
| `versionId` | 20/20 | 27/27 | 37/37 | 38/38 | 10/10 | 8/8 | 7/7 |
| `name` | 20/20 | 27/27 | 37/37 | 38/38 | 10/10 | 8/8 | 7/7 |
| `short` | 20/20 | 27/27 | 37/37 | 38/38 | 10/10 | 8/8 | 7/7 |
| `listNumber` | 20/20 | 27/27 | 37/37 | 38/38 | 10/10 | 8/8 | 7/7 |
| `requirementNumber` | **18/20** | 27/27 | 37/37 | 38/38 | **9/10** | 8/8 | 7/7 |
| `sortOrder` | 20/20 | 27/27 | **3/37** | **4/38** | **2/10** | **0/8** | 7/7 |
| `footer` | 0/20 | 0/27 | 0/37 | 0/38 | 0/10 | 0/8 | 0/7 |
| `childrenRequired` | 2/20 | 0/27 | 0/37 | 0/38 | 1/10 | 0/8 | 0/7 |
| `required` | 20/20 | 27/27 | 37/37 | 38/38 | 10/10 | 8/8 | 7/7 |
| `parentRequirementId` | 6/20 | 0/27 | 0/37 | 0/38 | 2/10 | 0/8 | 0/7 |
| `videoExternalURLId` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `previousRankRequired` | 20/20 | 27/27 | 37/37 | 38/38 | 10/10 | 8/8 | 7/7 (all `"False"` bar one) |
| `monthsSinceLastRankRequired` | 0/20 | 0/27 | 0/37 | 0/38 | 2/10 | 2/8 | 2/7 |
| `eagleMBRequired` | 0 | 0 | 0 | 0 | 1/10 | 1/8 | 1/7 |
| `totalMBRequired` | 0 | 0 | 0 | 0 | 1/10 | 1/8 | 1/7 |
| `serviceHoursRequired` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `disabledOnQuickEntry` | all `"False"` | | | | | | |
| `linkedAdventureId` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `linkedAwardId` | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `linkedAdventure` | `{}` ×147 | | | | | | |
| `electiveAdventure` | `false` ×147 | | | | | | |
| `linkedElectiveAdventures` | `[]` ×147 | | | | | | |
| `requiresSSElective` | `false` ×147 | | | | | | |
| `ssElectives` | `[]` ×147 | | | | | | |

**Dead fields for Scouts BSA** (empty or a single constant on all 147 rows): `footer`, `videoExternalURLId`, `serviceHoursRequired`, `disabledOnQuickEntry` (always `"False"`), `linkedAdventureId`, `linkedAwardId`, `linkedAdventure`, `electiveAdventure`, `linkedElectiveAdventures`, `requiresSSElective`, `ssElectives`. The `linkedAdventure*` / `ssElective*` family is plainly Cub-Scouting and Sea-Scouting machinery riding on a shared row shape.

Note that **row-level `footer` is empty on all 147 Scouts BSA rows** — the only live footer is `rankInformation.footer`.

Distinct values, whole-corpus:

| field | values |
|---|---|
| `childrenRequired` | `""` ×144, `"2"` ×2, `"4"` ×1 |
| `required` | `"True"` ×144, `"False"` ×3 |
| `previousRankRequired` | `"False"` ×146, `"True"` ×1 |
| `parentRequirementId` | `""` ×139, `"2014"` ×4, `"2008"` ×2, `"602"` ×2 |
| `monthsSinceLastRankRequired` | `""` ×141, `"4"` ×2, `"6"` ×4 |
| `eagleMBRequired` | `""` ×144, `"4"`, `"3"`, `"13"` |
| `totalMBRequired` | `""` ×144, `"6"`, `"5"`, `"21"` |

---

## 3. Priority 1 — the tree fields

### 3.1 Summary per rank

| rank | rows | top-level (`parentRequirementId == ""`) | child rows | parent rows | `childrenRequired` values |
|---|---|---|---|---|---|
| 1 Scout | 20 | 14 | 6 | 2 (ids 2008, 2014) | `2`, `4` |
| 2 Tenderfoot | 27 | 27 | 0 | 0 | — |
| 3 Second Class | 37 | 37 | 0 | 0 | — |
| 4 First Class | 38 | 38 | 0 | 0 | — |
| 5 Star Scout | 10 | 8 | 2 (id 602) | 1 | `2` |
| 6 Life Scout | 8 | 8 | 0 | 0 | — |
| 7 Eagle Scout | 7 | 7 | 0 | 0 | — |

**No dangling `parentRequirementId` on any rank** — every non-empty parent id resolves to a row in the same payload. Max depth is 1 (no grandchildren: none of the three parent rows is itself a child).

**Only ranks 1 and 5 have any nesting at all, and only for one or two requirements each.** Ranks 2, 3, 4, 6, 7 are 100 % flat.

### 3.2 The exact literals

`listNumber` carries **trailing punctuation** — it is `"7."`, not `"7"`. But not always: some rows drop the dot. Full literals, in served array order:

- **1 Scout** — `'7.' '1a.' '6.' '1b.' '1c.' '1d.' '1e.' '1f.' '2.' '2a.' '2b.' '2c.' '2d.' '3a.' '3b.' '4a.' '4b.' '5.' '6a' '6b'` — note `6a` / `6b` have **no trailing dot**, unlike `2a.`–`2d.`
- **2 Tenderfoot** — `'1a.' '6a.' '4b.' '4a.' '9.' '10.' '11.' '1b.' '2a.' '2b.' '3b.' '3a.' '5c.' '7a' '1c.' '2c.' '3c.' '3d.' '4c.' '5a.' '4d.' '5b.' '6b.' '6c.' '7b.' '8.' '5d.'` — `7a` has no dot; every other row does
- **3 Second Class** — `1a.`…`9b.`, `10.`, `11.`, `12.` — all dotted, 37 rows
- **4 First Class** — `1a.`…`9d.`, `10.`…`13.` — all dotted, 38 rows
- **5 Star Scout** — `'6a' '6b' '1.' '2.' '3.' '4.' '5.' '7.' '8.' '6.'` — `6a`/`6b` undotted
- **6 Life Scout** — `'1.' '2.' … '8.'` — all dotted
- **7 Eagle Scout** — `'1' '2' '3' '4' '5' '6' '7'` — **no dots at all on any row**

`listNumber` is **unique within every rank**. No duplicates anywhere.

### 3.3 `requirementNumber` vs `listNumber`

`requirementNumber` is `listNumber` with the trailing dot stripped — *always*, with exactly three exceptions across all 147 rows:

| rank | `listNumber` | `requirementNumber` |
|---|---|---|
| 1 Scout | `"6."` | `""` |
| 1 Scout | `"2."` | `""` |
| 5 Star | `"6."` | `""` |

Those three rows are precisely the three parent rows. So `requirementNumber` carries **no information** `listNumber` does not, and it is *empty on the rows a tree walker most needs to label*. It does **not** group siblings — a `1a.` row has `requirementNumber == "1a"`, not `"1"`.

### 3.4 `sortOrder` — unreliable

`sortOrder` is a **string** and is not a plain integer. Values seen:

- **1 Scout** — populated 20/20, unique, dotted decimals: `1.1 1.2 1.3 1.4 1.5 1.6 2 2.1 2.2 2.3 2.4 3.1 3.2 4.1 4.2 5 6 6.1 6.2 7`
- **2 Tenderfoot** — populated 27/27, **not unique**: `"2.1"` appears on two different rows (`2a.` and `2b.`); `2.2` is absent
- **3 Second Class** — populated **3/38**… of 37 rows only `11`, `12`, `13` are set; the other 34 rows are `""`
- **4 First Class** — populated **4/38**: only `10`, `11`, `12`, `13`
- **5 Star Scout** — populated **2/10**: only `6.1`, `6.2`
- **6 Life Scout** — populated **0/8**. Entirely empty.
- **7 Eagle Scout** — populated 7/7, clean `1`–`7`

So `sortOrder` is: sometimes absent entirely, sometimes non-integer, and at least once duplicated. `Number(sortOrder)` yields `NaN` on `""` and truncates `"1.1"` → `1.1` (fine in JS, but `parseInt` would give `1`). **mbu's `sync-requirements-api.ts` types `sortOrder` as `number`** (`/Users/mgoho/Github/mbu/scripts/sync-requirements-api.ts` line 68) — that assumption does not hold for ranks.

### 3.5 Array order is not display order

| rank | served array order == listNumber order? |
|---|---|
| 1 Scout | **No** — served `7. 1a. 6. 1b. …` |
| 2 Tenderfoot | **No** — served `1a. 6a. 4b. 4a. 9. 10. 11. 1b. …` |
| 3 Second Class | Yes |
| 4 First Class | Yes |
| 5 Star Scout | **No** — served `6a 6b 1. 2. 3. 4. 5. 7. 8. 6.` |
| 6 Life Scout | Yes |
| 7 Eagle Scout | Yes |

Neither array order nor `sortOrder` orders all seven ranks. **Parsing `listNumber` into `(int stem, letter suffix)` is the only key that orders every rank correctly** — verified: sorting each rank's rows by that key reproduces the canonical published order for all 7.

### 3.6 Flat-vs-nested: the exact map

Grouping rows by the numeric stem of `listNumber` and asking whether a bare stem row (`"6."`) exists alongside the lettered rows (`"6a"`, `"6b"`):

| rank | stems | lettered stems with **no** bare row (flat) | lettered stems **with** a bare parent row (nested) |
|---|---|---|---|
| 1 Scout | 7 | `1`, `3`, `4` | `2`, `6` |
| 2 Tenderfoot | 11 | `1`,`2`,`3`,`4`,`5`,`6`,`7` | — |
| 3 Second Class | 12 | `1`,`2`,`3`,`5`,`6`,`7`,`8`,`9` | — |
| 4 First Class | 13 | `1`,`2`,`3`,`4`,`5`,`6`,`7`,`8`,`9` | — |
| 5 Star Scout | 8 | — | `6` |
| 6 Life Scout | 8 | — | — |
| 7 Eagle Scout | 7 | — | — |

**Scout rank is mixed within itself.** Requirements 1, 3, and 4 have lettered sub-rows (`1a.`–`1f.`, `3a.`/`3b.`, `4a.`/`4b.`) that are *top-level rows with empty `parentRequirementId` and no parent row at all* — the shared prose stem ("Repeat from memory the Scout Oath…", etc.) exists nowhere in the payload. Requirements 2 and 6 have a genuine parent row carrying the shared prose plus `childrenRequired`.

Full Scout rank dump (served order):

```
id=2006  listNo='7.'   reqNo='7'   sort='7'    required=True
id=2007  listNo='1a.'  reqNo='1a'  sort='1.1'  required=True
id=2008  listNo='6.'   reqNo=''    sort='6'    required=False  PARENT childrenRequired=2
id=2009  listNo='1b.'  reqNo='1b'  sort='1.2'  required=True
id=2010  listNo='1c.'  reqNo='1c'  sort='1.3'  required=True
id=2011  listNo='1d.'  reqNo='1d'  sort='1.4'  required=True
id=2012  listNo='1e.'  reqNo='1e'  sort='1.5'  required=True
id=2013  listNo='1f.'  reqNo='1f'  sort='1.6'  required=True
id=2014  listNo='2.'   reqNo=''    sort='2'    required=False  PARENT childrenRequired=4
id=2015  listNo='2a.'  reqNo='2a'  sort='2.1'  required=True   child of 2014
id=2016  listNo='2b.'  reqNo='2b'  sort='2.2'  required=True   child of 2014
id=2017  listNo='2c.'  reqNo='2c'  sort='2.3'  required=True   child of 2014
id=2018  listNo='2d.'  reqNo='2d'  sort='2.4'  required=True   child of 2014
id=2019  listNo='3a.'  reqNo='3a'  sort='3.1'  required=True
id=2020  listNo='3b.'  reqNo='3b'  sort='3.2'  required=True
id=2021  listNo='4a.'  reqNo='4a'  sort='4.1'  required=True
id=2022  listNo='4b.'  reqNo='4b'  sort='4.2'  required=True
id=2023  listNo='5.'   reqNo='5'   sort='5'    required=True
id=2419  listNo='6a'   reqNo='6a'  sort='6.1'  required=True   child of 2008
id=2420  listNo='6b'   reqNo='6b'  sort='6.2'  required=True   child of 2008
```

Star Scout, served order:

```
id=2421  listNo='6a'   reqNo='6a'  sort='6.1'  required=True   child of 602
id=2422  listNo='6b'   reqNo='6b'  sort='6.2'  required=True   child of 602
id=595   listNo='1.'   reqNo='1'   sort=''     required=True
id=596   listNo='2.'   reqNo='2'   sort=''     required=True
id=597   listNo='3.'   reqNo='3'   sort=''     required=True
id=598   listNo='4.'   reqNo='4'   sort=''     required=True
id=599   listNo='5.'   reqNo='5'   sort=''     required=True
id=600   listNo='7.'   reqNo='7'   sort=''     required=True
id=601   listNo='8.'   reqNo='8'   sort=''     required=True
id=602   listNo='6.'   reqNo=''    sort=''     required=False  PARENT childrenRequired=2
```

### 3.7 Does the child's `listNumber` repeat the parent's prefix?

**Yes, on every one of the 8 child rows.** Parent `"2."` → children `2a. 2b. 2c. 2d.`; parent `"6."` → children `6a 6b` (Scout and Star alike). There is no case where a child's `listNumber` fails to carry its parent's numeric stem.

Consequence, stated as fact: **`listNumber` alone is sufficient to reconstruct the requirement path on all 7 ranks.** The `parentRequirementId` / `childrenRequired` chain adds exactly two pieces of information `listNumber` does not carry:

1. Which lettered groups have a real prose stem row (Scout 2 and 6; Star 6) vs. a synthetic one that has to be invented or omitted (Scout 1, 3, 4; Tenderfoot 1–7; Second Class 1–3, 5–9; First Class 1–9).
2. The `childrenRequired` count — "do 2 of the following" — which appears on only 3 of 147 rows.

### 3.8 `required` and `childrenRequired` correlate exactly

`required == "False"` appears on exactly 3 rows — the same 3 parent rows, all bearing `childrenRequired`:

```
rank 1 listNumber='6.'  childrenRequired='2'  name='Do the following:'
rank 1 listNumber='2.'  childrenRequired='4'  name='After attending at least one Scout troop meeting, do the following:'
rank 5 listNumber='6.'  childrenRequired='2'  name='Do the following:'
```

Note the semantics: Scout `2.` has `childrenRequired: "4"` and exactly 4 children — i.e. "all of them", not "choose 4 of N". Scout `6.` and Star `6.` have `childrenRequired: "2"` and exactly 2 children. **In every case `childrenRequired == len(children)`**, so on this corpus the field never actually encodes a choose-k-of-n. `required: "False"` on a parent row appears to mean "this row is a header, not a checkable item", not "this requirement is optional".

---

## 4. Priority 2 — embedded HTML, entities, escapes

Scanned strings: `rankInformation.{header,footer,name,short,reallyShort,searchKeywords}`, every requirement row's `{name,short,footer}`, and every `versions[].{header,footer,adminNotes}` in the catalog for ranks 1–7. Tags extracted by exact literal via `<[^<>]{0,80}>`.

### 4.1 Complete tag inventory (exact literals, whole corpus)

| literal | count | where seen |
|---|---|---|
| `<br>` | 144 | ranks 1–7, headers/footers and `name` |
| `<sup>` / `</sup>` | 49 / 49 | ranks 1, 3, 4, 5, 6, 7 — footers and `name` |
| `<li>` / `</li>` | 46 / **44** | ranks 2, 3, 4, 6, 7 — `name` and footers |
| `<strong>` / `</strong>` | 34 / 34 | ranks 1–7 |
| `<br/>` | 27 | ranks 1–7, headers/footers |
| `<p>` / `</p>` | 17 / 17 | ranks 3, 4 (catalog), 5, 6, 7 `name` |
| `</ul>` | 9 | ranks 2, 3, 4, 7 |
| `<q>` / `</q>` | 6 / 6 | rank 3 only |
| `<i>` / `</i>` | 4 / 4 | rank 1 `6a`/`6b`, rank 5 `6a`/`6b` |
| `<em>` / `</em>` | 4 / 4 | rank 4 footer, rank 6 `8.` |
| `<ul>` | 4 | rank 7 footer |
| `<ul class="li-disc">` | 3 | rank 2 `4a.`, rank 3 `6a.`, rank 4 `7b.` |
| `<a href="https://www.scouting.org/training/youth-protection/scouts-bsa/">` | 2 | rank 1 `6b`, rank 5 `6b` |
| `</a>` | 2 | same two rows |
| `<ul class="li-none">` | 2 | rank 2 `6a.`, rank 2 `6c.` |
| `<br />` | 2 | rank 6 `8.` |
| `<ol class="li-a">` / `</ol>` | 1 / 1 | rank 6 `6.` |
| `</br>` | 1 | rank 7 `7.` — a **stray closing tag** for a void element |
| `<b>` / `</b>` | 1 / 1 | rank 7 catalog footer only (a non-active version) |

**Every one of those literals except `<b>`/`</b>` is reachable through the requirements endpoint** (i.e. appears in `rankInformation` or a requirement row of the current version). `<b>`/`</b>` appear only in a historical `versions[].footer`.

Only **four distinct elements have attributes**, and all four attribute values are fixed strings:

- `class="li-disc"` on `<ul>`
- `class="li-none"` on `<ul>`
- `class="li-a"` on `<ol>`
- `href="https://www.scouting.org/training/youth-protection/scouts-bsa/"` on `<a>` (the only URL in the corpus)

### 4.2 Line-break tag variants

Four distinct spellings of a line break appear, and they are **not consistent within a single string**:

`<br>` (144) · `<br/>` (27) · `<br />` (2) · `</br>` (1)

Real examples:

```
rank 1, rankInformation.footer:  "...must be earned in sequence.<br><br/>\r\nAlternative requirements..."
rank 3, rankInformation.footer:  "<br><br/><strong>NOTES:</strong>\r\nThe requirements for..."
rank 6, req 8. name:             "...for the Life rank.*<br /> <br /> *If the board of review..."
rank 7, req 7. name:             "...for the Eagle Scout rank.<sup>12</sup> \r\n<br></br>\r\nIn preparation..."
```

The `<br><br/>` pair and `<br></br>` pair are both intended as "blank line". The 2016 and 2022 footers of the *same* rank use different spellings (`<br><br>` in Scout 2016, `<br><br/>` in Scout 2022), so the spelling is version-dependent, not rank-dependent.

### 4.3 Tag balance

- `<strong>` is **balanced in every string that contains it** (25 strings; several have 4 open + 4 close — e.g. rank 5/6 requirement `5.` and rank 7 requirement `4.`).
- `<p>`, `<i>`, `<q>`, `<em>`, `<ul>`/`<ol>` are balanced everywhere.
- **`<li>` is unbalanced in exactly one place** — rank 2 (Tenderfoot) requirement `6c.` has 5 `<li>` and 3 `</li>`. Raw:

```
'Show improvement (of any degree) in each activity listed in Tenderfoot requirement 6a
after practicing for 30 days.\r\n<br>\r\n<br><strong>30 days later</strong><br>\r\n
<ul class="li-none">\r\n  <li>Push-ups ________ (Record the number done correctly in 60 seconds)</li>\r\n
  <li>Sit-ups or curl-ups________ (Record the number done correctly in 60 seconds)<li>\r\n
 <li>Back-saver sit-and-reach _________ (Record the distance stretched)</li>\r\n
  <li>1 mile walk/run _____________ (record the time)</li>\r\n</ul>'
```

The second `<li>` is closed with `<li>` instead of `</li>`. Any renderer that trusts the markup will nest the third item inside the second.

### 4.4 `<sup>` contents

`<sup>` is used only for footnote markers. The complete set of inner values:

`1` `2` `3` `4` `5` `6` `7` `8` `9` `10` `11` `12` `13` and one compound: **`<sup>4, 5</sup>`**.

Markers on requirement `name` are resolved by matching prose in `rankInformation.footer`, which repeats the same `<sup>N</sup>` before each note. Example from rank 3:

```
"<sup>2</sup> If you use a wheelchair or crutches, or if it is difficult for you to get
around, you may substitute <q>trip</q> for <q>hike</q> in requirement 3b and 3c."
```

There is no structured link between marker and note — only the matching digit inside a `<sup>`. Note also that footnote text sometimes lives in the *prose of the requirement itself* using a bare `*` instead of `<sup>` (rank 6 requirement `8.`: `"...for the Life rank.*<br /> <br /> *If the board of review does not approve..."`), so `*` is a third footnote convention alongside `<sup>N</sup>` and the footer.

### 4.5 HTML entities

**Exactly one entity appears in the entire corpus**: `&rsquo;` — 4 occurrences, all in rank 7 (Eagle) footers (`rankInformation.footer` and the 2016/2022/2026 catalog versions). Nothing else: no `&amp;`, `&nbsp;`, `&quot;`, `&#39;`, or numeric entities anywhere.

Consequence: literal `&` characters in the data are **unescaped**. All 6 bare ampersands in `short` are: `'Scout Oath & Law'` (r1), `'Salute & Sign'` (r1), `'Plan & Cook Meal'` (r3), `'Reflection & Goal Setting'` (r3 and r4), `'Track garbage & recycle'` (r4).

### 4.6 Escape sequences and whitespace

| sequence | total occurrences |
|---|---|
| `\r\n` | 168 |
| bare `\n` (not preceded by `\r`) | 86 |
| bare `\r` (not followed by `\n`) | 0 |
| `\t` | 11 |
| double space (`"  "`) | 52 |

Both CRLF and bare LF occur; bare CR does not. Newlines are **not** semantic — they are source-file wrapping, and the intended paragraph breaks are the `<br>` tags. Splitting on `\n` produces mid-sentence fragments.

**All 11 tabs in the corpus are trailing tabs on `short`** — none appear in `name`, `header`, or `footer`. The full list: r2 `'Injury prevention\t'`, `'Buddy system\t'`; r3 `'Orient a map\t'`, `'Hike 5 miles\t'`, `'Demonstrate navigation\t'`, `'Injury prevention\t'`, `'Car accident response\t'`, `'Compare 3 prices\t'`, `'Understand bullying\t'`; r4 `'Plan a campout menu\t'`; r5 `'Six Merit Badges\t'`.

Double spaces appear inside prose, e.g. `"must be completed as a member  of a troop"` in the Scout header.

### 4.7 Non-ASCII

**Exactly one non-ASCII codepoint in the entire corpus**: `U+2019 RIGHT SINGLE QUOTATION MARK` (`’`), 5 occurrences, all in rank 7 (Eagle) footers. Everything else is plain ASCII — no `&nbsp;` (U+00A0), no em dashes, no fraction glyphs, no `®`. Apostrophes elsewhere are the ASCII `'` (e.g. `"the Scout's advancement"` in rank 6).

### 4.8 Where HTML appears at all

| rank | rows whose `name` contains `<` | rows whose `short` contains `<` or `&` |
|---|---|---|
| 1 Scout | 2 / 20 | 2 |
| 2 Tenderfoot | 3 / 27 | 0 |
| 3 Second Class | 5 / 37 | 2 |
| 4 First Class | 3 / 38 | 2 |
| 5 Star Scout | 4 / 10 | 0 |
| 6 Life Scout | 3 / 8 | 0 |
| 7 Eagle Scout | 3 / 7 | 0 |

`short` **never contains a `<`** on any rank — the `<`-or-`&` hits above are all bare ampersands. `rankInformation.footer` is populated and contains HTML on all 7 ranks; `rankInformation.header` is populated on **rank 1 only** (empty on ranks 2–7).
