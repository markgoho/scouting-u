# Ranks API surface and field semantics

Research for [#11](https://github.com/markgoho/scouting-u/issues/11) (map [#10](https://github.com/markgoho/scouting-u/issues/10)).
Consumed by grilling ticket #16 — this file reports facts, not decisions.

- **Source**: Scouting America advancements API v2. Primary source only; no secondary write-ups were read.
- **Fetched**: 2026-08-18. All 8 payloads pulled in one pass.
- **Auth**: none. Plain `GET`, no headers, HTTP 200 on every call.
- **Analysis script**: [`analyze-ranks-api.py`](./analyze-ranks-api.py) in this directory. It reads the 8 JSON files and prints every tally quoted in sections 1–8. Section 9 additionally reads mbu's `scripts/sync-requirements-api.ts`.

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

---

*Sections 5–9 were added in a second pass. All 8 payloads were re-fetched on 2026-08-18 before that pass; every response was HTTP 200 and **byte-identical in size to the first pass** (67,283 / 15,378 / 21,005 / 30,368 / 30,831 / 9,687 / 8,900 / 11,305 B), and `analyze-ranks-api.py` reproduces every tally in sections 1–4 unchanged. Sections 5–9 therefore describe the same corpus.*

---

## 5. Priority 3 — the `short` field

### 5.1 Completeness

**`short` is populated on all 147 rows of all 7 ranks. It is never `""`, never whitespace-only.**

| rank | rows | empty | trimmed length min–max | median | rows with trailing whitespace |
|---|---|---|---|---|---|
| 1 Scout | 20 | 0 | 9–30 | 17.5 | none |
| 2 Tenderfoot | 27 | 0 | 9–37 | 15.0 | `4c.`, `5a.` |
| 3 Second Class | 37 | 0 | 7–31 | 17.0 | `3a.`, `3b.`, `3d.`, `6c.`, `6e.`, `8d.`, `9b.` |
| 4 First Class | 38 | 0 | 7–28 | 17.0 | `2a.` |
| 5 Star Scout | 10 | 0 | 15–27 | 20.5 | `3.` |
| 6 Life Scout | 8 | 0 | 15–28 | 23.0 | none |
| 7 Eagle Scout | 7 | 0 | 13–27 | 20.0 | none |

Lengths above are **after `.strip()`**. The 11 rows flagged in the last column are exactly the 11 trailing tabs catalogued in §4.6 — the tab is the *only* trailing whitespace in the corpus, and it is only ever on `short`. Raw (untrimmed) length equals trimmed length + 1 on those 11 rows and is identical elsewhere; no rank's raw min/max differs from its trimmed min/max, because no tab row is a per-rank extreme.

Whole corpus, trimmed: **min 7, max 37, mean 17.7, median 17.0.**

```
length histogram (trimmed, buckets of 5)
   5- 9   6  ######
  10-14  37  #####################################
  15-19  53  #####################################################
  20-24  31  ###############################
  25-29  17  #################
  30-34   2  ##
  35-39   1  #
```

### 5.2 Truncation

**No evidence of truncation.** Two independent checks:

1. **No length cap.** The longest value is 37 characters and **exactly one row** reaches it. The eight longest values are 37, 31, 30, 28, 28, 27, 27, 27 — a smooth tail with no cluster at a round number, which is what a `varchar(N)` cap would produce.
2. **No mid-token or dangling-connective endings.** Scanning all 147 for a value ending in a stopword (`a an the of and or to in for with from`), a hyphen, `...` or `…` returns **zero hits**.

The eight longest, verbatim:

```
 37  r2 5d.   'Why it is important to hike on trails'
 31  r3 1b.   'Leave No Trace Seven Principles'
 30  r1 2.    'Attend meeting; Complete 2a-2d'
 28  r6 3.    'Five Additional Merit Badges'
 28  r4 9b.   'Study an environmental issue'
 27  r7 2     'Demonstrate Scouting spirit'
 27  r6 4.    'Complete service project(s)'
 27  r5 6a    'Protection from Child Abuse'
```

### 5.3 Duplication

**Within a rank: zero duplicates on all 7 ranks** (compared on trimmed values). `short` is a unique label inside its own rank.

**Across ranks: 12 values are shared by two or more ranks.** Every one of them is a genuinely recurring requirement, not a data error:

| value | rows |
|---|---|
| `Scoutmaster conference` | r1 `7.`, r2 `10.`, r3 `11.`, r4 `12.`, r5 `7.`, r6 `7.`, r7 `6` — **all 7 ranks** |
| `Board of review` | r2 `11.`, r3 `12.`, r4 `13.`, r5 `8.`, r6 `8.`, r7 `7` — 6 ranks |
| `Demonstrate Scout spirit` | r4 `11.`, r5 `2.`, r6 `2.` |
| `Position of responsibility` | r5 `5.`, r6 `5.`, r7 `4` |
| `Protection from Child Abuse` | r1 `6a`, r5 `6a` |
| `Personal Safety Awareness` | r1 `6b`, r5 `6b` |
| `Be physically active` | r3 `7a.`, r4 `8a.` |
| `Reflection & Goal Setting` | r3 `7b.`, r4 `8b.` |
| `Injury prevention` | r2 `4c.`, r3 `6c.` |
| `Outdoor Code` | r1 `1e.`, r2 `1c.` |
| `Scout spirit` | r2 `9.`, r3 `10.` |
| `Complete service project(s)` | r4 `9d.`, r6 `4.` |

Consequence, stated as fact: **`short` is not globally unique and cannot key a requirement on its own.** In search results, a bare `short` of `Scoutmaster conference` is ambiguous across all seven ranks.

Note also that near-duplicates differ only in case or wording: `Scout Spirit` (r1 `1b.`) vs `Scout spirit` (r2 `9.`) vs `Demonstrate Scout spirit` (r4/r5/r6) vs `Demonstrate Scouting spirit` (r7 `2`); and `Personal protection` (r1 `6.`) vs `Personal Protection` (r5 `6.`) — the same requirement, capitalised differently on two ranks. Capitalisation across the corpus mixes Title Case (`First Class Badge`, `Five Additional Merit Badges`) and sentence case (`Knife safety`, `Board of review`) with no discernible rule.

### 5.4 `short` on the three parent (header) rows

The three parent rows carry a `short` like any other row, and two of the three are usable labels:

```
r1 6.   PARENT  short='Personal protection'
          child 6a   short='Protection from Child Abuse'
          child 6b   short='Personal Safety Awareness'
r1 2.   PARENT  short='Attend meeting; Complete 2a-2d'
          child 2a.  short='Describe Youth Leadership'
          child 2b.  short='Describe Advancement'
          child 2c.  short='Describe Ranks'
          child 2d.  short='Describe Merit Badges'
r5 6.   PARENT  short='Personal Protection'
          child 6a   short='Protection from Child Abuse'
          child 6b   short='Personal Safety Awareness'
```

A parent's `short` is always distinguishable from its children's — no parent repeats a child's label. But **Scout `2.` is self-referential**: `'Attend meeting; Complete 2a-2d'` embeds sibling list numbers, so it only reads correctly next to rows numbered `2a`–`2d`. Lifted into a flat search result or a home-page ladder it names nothing.

### 5.5 Full literals

Rank 1 Scout, in `listNumber` order:

```
1a.  'Scout Oath & Law'
1b.  'Scout Spirit'
1c.  'Salute & Sign'
1d.  'First Class Badge'
1e.  'Outdoor Code'
1f.  'Pledge of Allegiance'
2.   'Attend meeting; Complete 2a-2d'
2a.  'Describe Youth Leadership'
2b.  'Describe Advancement'
2c.  'Describe Ranks'
2d.  'Describe Merit Badges'
3a.  'Patrol Method'
3b.  'Patrol Spirit'
4a.  'Knots (3)'
4b.  'Whip and fuse rope'
5.   'Knife safety'
6.   'Personal protection'
6a   'Protection from Child Abuse'
6b   'Personal Safety Awareness'
7.   'Scoutmaster conference'
```

Rank 5 Star Scout:

```
1.   'Active 4 months'
2.   'Demonstrate Scout spirit'
3.   'Six Merit Badges\t'
4.   'Service Project(s)'
5.   'Position of responsibility'
6.   'Personal Protection'
6a   'Protection from Child Abuse'
6b   'Personal Safety Awareness'
7.   'Scoutmaster conference'
8.   'Board of review'
```

Rank 6 Life Scout:

```
1.  'Active 6 months'
2.  'Demonstrate Scout spirit'
3.  'Five Additional Merit Badges'
4.  'Complete service project(s)'
5.  'Position of responsibility'
6.  'Teach EDGE method'
7.  'Scoutmaster conference'
8.  'Board of review'
```

Rank 7 Eagle Scout:

```
1  'Active 6+ months'
2  'Demonstrate Scouting spirit'
3  'Earn 21 merit badges'
4  'Position of responsibility'
5  'Eagle project'
6  'Scoutmaster conference'
7  'Board of review'
```

### 5.6 Summary of `short` quality

| property | verdict |
|---|---|
| populated on every row of every rank | **yes** — 147/147 |
| ever empty | **no** |
| ever truncated | **no** — no length cap, no mid-token endings |
| duplicated within a rank | **no** — 0 on all 7 ranks |
| duplicated across ranks | **yes** — 12 values, one of them on all 7 ranks |
| free of HTML | **yes** — never contains `<` (§4.8) |
| free of entities | **yes** — 6 bare `&` (§4.5), no entities |
| clean whitespace | **no** — 11 rows carry a trailing tab |
| consistent capitalisation | **no** — Title Case and sentence case both used, same requirement cased two ways across ranks |
| self-contained out of context | **mostly** — one exception, Scout `2.` `'Attend meeting; Complete 2a-2d'` |

---

## 6. Priority 4 — the numeric fields vs the prose

### 6.1 Where they are populated at all

Whole-corpus value counts (147 rows):

| field | values |
|---|---|
| `monthsSinceLastRankRequired` | `""` ×141, `"4"` ×2, `"6"` ×4 |
| `serviceHoursRequired` | `""` ×147 — **never populated on any Scouts BSA row** |
| `eagleMBRequired` | `""` ×144, `"4"`, `"3"`, `"13"` |
| `totalMBRequired` | `""` ×144, `"6"`, `"5"`, `"21"` |
| `previousRankRequired` | `"False"` ×146, `"True"` ×1 |

**All five fields are empty on ranks 1–4** — with the single caveat that `previousRankRequired` is never literally empty anywhere: it carries its populated default `"False"` on all 147 rows (as §2 records). Every *non-default* value sits on rank 5, 6 or 7. **Nine rows in total carry a non-default value on any of the five.**

### 6.2 Every row carrying a non-default value, verbatim, adjudicated

```
rank 5 Star   id=595  listNumber='1.'  short='Active 4 months'
  monthsSinceLastRankRequired='4'  previousRankRequired='True'
  name='Be active in your troop for at least four months as a First Class Scout.'
```
→ **agrees.** `4` ↔ "four months". `previousRankRequired: "True"` and the prose names First Class.

```
rank 5 Star   id=597  listNumber='3.'  short='Six Merit Badges\t'
  eagleMBRequired='4'  totalMBRequired='6'
  name='Earn six merit badges, including any four from the required list for
        Eagle. You may choose any of the merit badges on the  required list for
        Eagle to fulfill this requirement. See Eagle rank requirement 3 for this list.'
```
→ **agrees.** `6` ↔ "six", `4` ↔ "any four". Both numbers are **incremental** (badges earned *for this rank*).

```
rank 5 Star   id=601  listNumber='8.'  short='Board of review'
  monthsSinceLastRankRequired='4'
  name='Successfully complete your board of review for the Star rank.<sup>8</sup>'
```
→ **DISAGREES.** The prose contains no month count and nothing about tenure. The `4` is rank-level metadata (Star's tenure period) attached to the board-of-review row.

```
rank 6 Life   id=603  listNumber='1.'  short='Active 6 months'
  monthsSinceLastRankRequired='6'
  name='Be active in your troop for at least six months as a Star Scout.'
```
→ **agrees** on the number. But `previousRankRequired` is `"False"` here, while the prose names Star Scout exactly as Star's requirement 1 names First Class — see §6.5.

```
rank 6 Life   id=605  listNumber='3.'  short='Five Additional Merit Badges'
  eagleMBRequired='3'  totalMBRequired='5'
  name='Earn five more merit badges (so that you have 11 in all) including any
        number more from the list for Eagle so that you have a total of seven from
        the required list of Eagle in that total number of 11 merit badges. You may
        choose any of the 17 merit badges on the required list for Eagle to fulfill
        this requirement. See Eagle rank requirement 3 for this list.*'
```
→ **PARTLY DISAGREES.** `totalMBRequired: "5"` ↔ "five more" ✓ (incremental). But **`eagleMBRequired: "3"` appears nowhere in the prose** — the prose states the *cumulative* figure, "a total of seven from the required list of Eagle". The `3` is only recoverable as `7 − 4` (Star's `eagleMBRequired`). Rendering `3` beside this text puts an unexplained number next to a sentence that says seven.
Two further prose facts on this row: the numbers extracted from it are `five, 11, seven, 11, 17, 3` — the `17` is a **stale count of the Eagle-required list**, which the current (2026) Eagle requirement 3 gives as 13; and the `3` in the prose is a cross-reference ("Eagle rank requirement 3"), not a quantity.

```
rank 6 Life   id=610  listNumber='8.'  short='Board of review'
  monthsSinceLastRankRequired='6'
  name='Successfully complete your board of review for the Life rank.*<br />…'
```
→ **DISAGREES.** Same pattern as Star `8.` — no month count in the prose.

```
rank 7 Eagle  id=2425  listNumber='1'  short='Active 6+ months'
  monthsSinceLastRankRequired='6'
  name='Be active in your troop for at least six months as a Life Scout.'
```
→ **agrees.** `6` ↔ "six months".

```
rank 7 Eagle  id=2427  listNumber='3'  short='Earn 21 merit badges'
  eagleMBRequired='13'  totalMBRequired='21'
  name='Earn a total of 21 merit badges (10 more than required for the Life rank),
        including these 13 merit badges: (a) First Aid, … (m) Family Life. …'
```
→ **agrees** with the prose as written — `21` ↔ "a total of 21", `13` ↔ "these 13". But both numbers here are **cumulative**, the opposite convention to ranks 5 and 6 (see §6.4).

```
rank 7 Eagle  id=2431  listNumber='7'  short='Board of review'
  monthsSinceLastRankRequired='6'
  name='Successfully complete your board of review for the Eagle Scout rank.<sup>12</sup>…'
```
→ **DISAGREES.** No month count in the prose.

### 6.3 `monthsSinceLastRankRequired` sits on the wrong rows half the time

Ranks 5, 6, 7 each carry it on **exactly two rows: requirement `1.` (tenure) and the board-of-review requirement.** It is *not* on the position-of-responsibility requirement, whose prose is the other place a month figure appears:

| rank | rows carrying the field | value | rows whose prose states months but carry **no** field |
|---|---|---|---|
| 5 Star | `1.`, `8.` | `4`, `4` | `5.` "serve actively … for four months" |
| 6 Life | `1.`, `8.` | `6`, `6` | `5.` "serve actively … for six months" |
| 7 Eagle | `1`, `7` | `6`, `6` | `4` "serve actively … for six months" |

So of the six populated cells, **three agree with their own row's prose (the `1.` rows) and three sit on a row whose prose never mentions months (the board-of-review rows)** — and in all three ranks the one requirement that *does* state a second month figure is left empty.

### 6.4 `eagleMBRequired` / `totalMBRequired` change meaning between ranks

| rank | `eagleMBRequired` | `totalMBRequired` | prose says | convention |
|---|---|---|---|---|
| 5 Star | `4` | `6` | "six merit badges, including any four from the required list for Eagle" | **incremental** |
| 6 Life | `3` | `5` | "five more merit badges (so that you have 11 in all) … a total of seven from the required list" | **incremental** (`totalMB` matches "five more"; `eagleMB` matches nothing in the prose) |
| 7 Eagle | `13` | `21` | "a total of 21 merit badges (10 more than required for the Life rank), including these 13" | **cumulative** |

The arithmetic confirms it rather than the naming: `totalMBRequired` running total is 6 → 6+5 = 11 → Eagle's value is **21, not 10**; `eagleMBRequired` running total is 4 → 4+3 = 7 → Eagle's value is **13, not 6**. Identically named fields therefore mean "additional badges for this rank" on ranks 5 and 6 and "badges held in total" on rank 7.

### 6.5 `previousRankRequired` is not a usable predicate

`"True"` appears on exactly one row in the corpus — Star `1.`. Life `1.` and Eagle `1` are `"False"` despite prose of exactly the same form ("as a Star Scout", "as a Life Scout"). Every other row on every rank, including all of ranks 1–4, is `"False"`. The field does not encode which rank precedes which; the catalog `level` field does (§8.1).

### 6.6 `serviceHoursRequired` is dead while the prose is not

The field is `""` on all 147 rows. Five requirements state a service-hours figure in prose and get nothing:

```
r2 7b.  'Participate in a total of one hour of service in one or more service projects…'
r3 8e.  'Participate in two hours of service through one or more service projects…'
r4 9d.  'Participate in three hours of service through one or more service projects…'
r5 4.   'While a First Class Scout, participate in six hours of service…'
r6 4.   'While a Star Scout, participate in six hours of service…'
```

### 6.7 Agreement scoreboard

| field | rows populated | agrees with own row's prose | disagrees / unsupported by own row's prose |
|---|---|---|---|
| `monthsSinceLastRankRequired` | 6 | 3 (r5 `1.`, r6 `1.`, r7 `1`) | 3 (r5 `8.`, r6 `8.`, r7 `7` — board of review, no months in prose) |
| `eagleMBRequired` | 3 | 2 (r5 `3.`, r7 `3`) | 1 (r6 `3.` — value `3`, prose says seven) |
| `totalMBRequired` | 3 | 3 | 0 — but r5/r6 are incremental and r7 is cumulative |
| `previousRankRequired` | 1 `"True"` | 1 | 2 rows with identical prose are `"False"` |
| `serviceHoursRequired` | 0 | — | 5 rows state hours in prose and carry nothing |

---

## 7. Priority 5 — the `versions` array

`versions[]` exists only on the **catalog** endpoint (`/v2/ranks`); `rankInformation` drops it (§1). Each version object has 14 keys:

`versionId`, `version`, `header`, `footer`, `adminNotes`, `proofReadDate`, `active`, `disabledOnQuickEntry`, `expiredDate`, `versionEffectiveDt`, `versionExpiryDt`, `imageUrl100`, `imageUrl200`, `imageUrl400`.

### 7.1 Every version of every Scouts BSA rank

27 version objects across the 7 ranks. `active` is printed as-returned.

| rank | versionId | version | active | versionEffectiveDt | versionExpiryDt | expiredDate | header | footer | adminNotes |
|---|---|---|---|---|---|---|---|---|---|
| 1 Scout | **84** | 2022 | `true` | 2022-08-01 | `""` | `""` | yes | yes | — |
| 1 Scout | 38 | 2016 | `true` | 2016-01-01 | 2022-07-31 | 2022-12-31 | yes | yes | yes |
| 1 Scout | 1 | 2012 | `true` | 2012-01-01 | 2015-12-31 | 2021-12-31 | — | — | — |
| 2 Tenderfoot | **83** | 2022 | `true` | 2022-08-01 | `""` | `""` | — | yes | — |
| 2 Tenderfoot | 37 | 2016 | `true` | 2016-01-01 | 2022-07-31 | 2022-12-31 | — | yes | yes |
| 2 Tenderfoot | 8 | 2012 | `true` | 2012-01-01 | 2015-12-31 | 2021-12-31 | — | yes | — |
| 3 Second Class | **98** | 2022 | `true` | 2022-08-01 | `""` | `""` | — | yes | — |
| 3 Second Class | 36 | 2016 | `true` | 2016-01-01 | 2022-07-31 | `""` | — | yes | yes |
| 3 Second Class | 35 | 2015 | `true` | 2015-01-01 | 2015-12-31 | 2021-12-31 | — | yes | — |
| 3 Second Class | 21 | 2013 | `true` | 2013-01-01 | 2014-12-31 | 2021-12-31 | — | yes | — |
| 3 Second Class | 3 | 2012 | `true` | 2012-01-01 | 2012-12-31 | 2021-12-31 | — | yes | — |
| 4 First Class | **99** | 2022 | `true` | 2022-08-01 | `""` | `""` | — | yes | — |
| 4 First Class | 39 | 2016 | `true` | 2016-01-01 | 2022-07-31 | `""` | — | yes | yes |
| 4 First Class | 22 | 2013 | `true` | 2013-01-01 | 2015-12-31 | 2021-12-31 | — | yes | — |
| 4 First Class | 4 | 2012 | `true` | 2012-01-01 | 2012-12-31 | 2021-12-31 | — | yes | — |
| 5 Star Scout | **40** | 2016 | `true` | 2016-01-01 | `""` | `""` | — | yes | yes |
| 5 Star Scout | 23 | 2013 | `true` | 2013-01-01 | 2015-12-31 | 2021-12-31 | — | yes | — |
| 5 Star Scout | 5 | 2012 | `true` | 2012-01-01 | 2012-12-31 | 2021-12-31 | — | yes | — |
| 6 Life Scout | **41** | 2016 | `true` | 2016-01-01 | `""` | `""` | — | yes | yes |
| 6 Life Scout | 24 | 2013 | `true` | 2013-01-01 | 2015-12-31 | 2021-12-31 | — | yes | — |
| 6 Life Scout | 6 | 2012 | `true` | 2012-01-01 | 2012-12-31 | 2021-12-31 | — | yes | — |
| 7 Eagle Scout | **108** | 2026 | `true` | 2026-02-27 | `""` | `""` | — | yes | — |
| 7 Eagle Scout | 73 | 2022 | `true` | 2022-07-01 | 2026-02-26 | 2026-02-26 | yes | yes | yes |
| 7 Eagle Scout | 42 | 2016 | `true` | 2016-01-01 | 2022-06-30 | 2024-07-01 | — | yes | yes |
| 7 Eagle Scout | 27 | 2013 | `true` | 2013-07-15 | 2015-12-31 | 2021-12-31 | — | yes | — |
| 7 Eagle Scout | 25 | 2014 | `true` | 2014-01-01 | 2015-12-31 | 2021-12-31 | — | yes | — |
| 7 Eagle Scout | 7 | 2012 | `true` | 2012-01-01 | 2013-12-31 | 2021-12-31 | — | yes | yes |

Bold `versionId` = the version the requirements endpoint actually serves (it matches the `versionId` on every row of that rank, §1).

| rank | versions | active version | version labels present |
|---|---|---|---|
| 1 Scout | 3 | 2022 (id 84) | 2022, 2016, 2012 |
| 2 Tenderfoot | 3 | 2022 (id 83) | 2022, 2016, 2012 |
| 3 Second Class | 5 | 2022 (id 98) | 2022, 2016, 2015, 2013, 2012 |
| 4 First Class | 4 | 2022 (id 99) | 2022, 2016, 2013, 2012 |
| 5 Star Scout | 3 | 2016 (id 40) | 2016, 2013, 2012 |
| 6 Life Scout | 3 | 2016 (id 41) | 2016, 2013, 2012 |
| 7 Eagle Scout | 6 | 2026 (id 108) | 2026, 2022, 2016, 2014, 2013, 2012 |

The label set is **not the same across ranks** — Scout has no 2013 or 2015 version, Second Class has both. A version label is a per-rank string, not a corpus-wide edition.

### 7.2 `active` does not identify the active version

**`active` is `true` on all 27 version objects, including the 2012 editions.** It is a constant, not a flag. `rankInformation.active` is likewise `"True"` on all 7 ranks.

Two things do identify the served version, and they agree on all 7 ranks:

1. `rankInformation.version` (and the `versionId` carried on every requirement row).
2. **`versionExpiryDt == ""`** — empty on exactly the 7 served versions and populated on all 20 others.

`expiredDate` is *not* a substitute: it is empty on 9 of 27 — the 7 served versions **plus** Second Class 2016 and First Class 2016, both of which have a `versionExpiryDt` of 2022-07-31.

### 7.3 Date reliability

- `versionEffectiveDt` — **populated on all 27**, always a bare `YYYY-MM-DD` string. No time component, no timezone, no `null`.
- `versionExpiryDt` — populated on 20 of 27; empty on exactly the served version of each rank. Reliable as an "is current" predicate.
- `expiredDate` — populated on 18 of 27, and its value sometimes differs from `versionExpiryDt` by years (Scout 2016: expiry 2022-07-31, expiredDate 2022-12-31; Eagle 2016: expiry 2022-06-30, expiredDate 2024-07-01). It appears to record when the edition stopped being *accepted*, not when it stopped being *current*. Not usable as a version selector.
- **Eagle's windows overlap.** 2012 runs to 2013-12-31 while 2013 begins 2013-07-15; 2013 and 2014 both end 2015-12-31. Array order is also not chronological there — the 2013 object is served before the 2014 object. Every other rank's windows are contiguous and non-overlapping, and every other rank's array is in descending date order.

### 7.4 Prose survives on old versions; requirement rows do not

Of the 27 version objects, `footer` is populated on **26** (only Scout 2012 has neither header nor footer), `header` on **3** (Scout 2022, Scout 2016, Eagle 2022), and `adminNotes` on **9**. This is the only historical content the public API exposes — §4.1 found `<b>`/`</b>` exclusively in a historical `versions[].footer`, prose reachable nowhere else.

The requirement rows of a non-served version are **not reachable**. Both spellings of the per-version requirements endpoint return HTTP 401:

```
$ curl -sS -o /dev/null -w '%{http_code}' \
    https://api.scouting.org/advancements/v2/ranks/versions/84/requirements
401

$ curl -sS https://api.scouting.org/advancements/ranks/versions/84/requirements
{
  "errorCode": "M401",
  "message": "Unauthorized",
  "errorDesc": "Missing JWT Token"
}
```

The `401` is returned even for `versionId: 84`, which *is* the currently served Scout version — so the refusal is on the endpoint, not on the version being historical. There is no anonymous route to any version's requirement rows other than `/v2/ranks/{id}/requirements`, which always serves the current one.

---

## 8. Priority 6 — rank-level fields

### 8.1 `level`

Within `programId == 2`, `level` is `{1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7}` — **bijective with ids 1–7, and equal to the id on every rank.** It orders the seven cleanly, ascending Scout → Eagle.

It does **not** track `id` globally, because it restarts per program and is not always 1-based:

| programId | program | `level` values |
|---|---|---|
| 1 | Cub Scouting | 0, 1, 2, 3, 4, 5, 6 (Lion is `0`, Bobcat `1` — while their ids are 14 and 13) |
| 2 | Scouts BSA | 1, 2, 3, 4, 5, 6, 7 |
| 4 | Venturing | 1, 2, 3, 4 |
| 5 | Sea Scouting | 1, 2, 3, 4 |

So `level` is only an ordering key **within a program**, and its base differs between programs. For Scouts BSA it is a correct and complete advancement order.

### 8.2 `name` / `short` / `reallyShort`

| id | `name` | `short` | `reallyShort` |
|---|---|---|---|
| 1 | `Scout` | `Scout` | `Scout` |
| 2 | `Tenderfoot` | `Tenderfoot` | `Tenderfoot` |
| 3 | `Second Class` | `Second Class` | `2nd Class` |
| 4 | `First Class` | `First Class` | `1st Class` |
| 5 | `Star Scout` | `Star` | `Star` |
| 6 | `Life Scout` | `Life` | `Life` |
| 7 | `Eagle Scout` | `Eagle` | `Eagle` |

The inconsistency is in **`name`**, not in `short`: `name` appends " Scout" for ranks 5–7 and omits it for ranks 1–4. `short` is the field that is internally consistent — it is the bare rank word throughout ("Scout" for rank 1 because that *is* the bare word). `reallyShort` differs from `short` on only two ranks, 3 and 4, where it numeralises ("2nd Class", "1st Class"); on the other five it is byte-identical to `short`.

### 8.3 What each field yields as a URL slug

Slugging with lowercase → non-alphanumeric runs to `-` → trim:

| id | `slug(name)` | `slug(short)` | `slug(reallyShort)` |
|---|---|---|---|
| 1 | `scout` | `scout` | `scout` |
| 2 | `tenderfoot` | `tenderfoot` | `tenderfoot` |
| 3 | `second-class` | `second-class` | `2nd-class` |
| 4 | `first-class` | `first-class` | `1st-class` |
| 5 | `star-scout` | `star` | `star` |
| 6 | `life-scout` | `life` | `life` |
| 7 | `eagle-scout` | `eagle` | `eagle` |

| field | 7 distinct slugs | any empty | collisions |
|---|---|---|---|
| `name` | yes | none | none |
| `short` | yes | none | none |
| `reallyShort` | yes | none | none |

**All three are collision-free and non-empty across the seven Scouts BSA ranks**, so any of them yields a working `/scouts-bsa/ranks/{slug}/`. What differs is only the resulting shape: `name` gives `…/ranks/eagle-scout/` and the asymmetric pair `…/ranks/scout/` + `…/ranks/star-scout/`; `short` gives the uniform one-word `…/ranks/eagle/`; `reallyShort` gives the same as `short` except `…/ranks/2nd-class/` and `…/ranks/1st-class/`, which lead with a digit. No recommendation is made here — #16 owns the call.

### 8.4 Other rank-level fields

| id | `image` | `sku` | `price` | `scoutNet` | `lds` | `searchKeywords` |
|---|---|---|---|---|---|---|
| 1 | `scout.png` | 657432 | 3.29 | `RN` | `true` | `Boy Scout Scouting Scout Rank Award Requirements` |
| 2 | `tenderfoot.png` | 657437 | 3.29 | `RT` | `true` | `Boy Scout Scouting Tenderfoot Rank Award Requirements` |
| 3 | `secondclass.png` | 657436 | 3.29 | `R2` | `true` | `Boy Scout Scouting Second Class Rank Award Requirements` |
| 4 | `firstclass.png` | 657435 | 3.29 | `R1` | `true` | `Boy Scout Scouting First Class Rank Award Requirements` |
| 5 | `star.png` | 657434 | 3.29 | `RS` | `true` | `Boy Scout Scouting Star Scout Rank Award Requirements` |
| 6 | `life.png` | 657433 | 3.29 | `RL` | `true` | `Boy Scout Scouting Life Scout Rank Award Requirements` |
| 7 | `neweagle.png` | 663044 | 3.29 | `RE` | `true` | `Boy Scout Scouting Eagle Rank Award Requirements` |

`searchKeywords` is a single space-separated string of the same template on every rank — `Boy Scout Scouting {name} Rank Award Requirements` — carrying no information the rank name does not, and using the retired "Boy Scout" wording.

`imageUrl100/200/400` come from `rankInformation` (and from each `versions[]` entry), all on one CloudFront host:

```
https://d1kn0x9vzr5n76.cloudfront.net/images/ranks/{stem}{100|200|400}.png
```

with `{stem}` = `scout`, `tenderfoot`, `secondclass`, `firstclass`, `star`, `life`, **`neweagle`** — i.e. the `image` filename minus `.png`, and Eagle's stem is `neweagle`, not `eagle`. All 21 URLs are populated. (Whether these may be used is [#13](https://github.com/markgoho/scouting-u/issues/13) / [#26](https://github.com/markgoho/scouting-u/issues/26), not this ticket.)

---

## 9. Ranks vs merit badges — the two-way gap

Reference for the merit-badge side: `/Users/mgoho/github/mbu/scripts/sync-requirements-api.ts` (mbu). Per map [#10](https://github.com/markgoho/scouting-u/issues/10) that script is a reference for approach only — mbu's ADR 0002 rules out sharing requirement-engine code. Facts only below.

### 9.1 On a rank row, with no merit-badge equivalent

mbu's `ApiRequirementRow` type declares **8 fields**: `id`, `name`, `listNumber`, `requirementNumber`, `sortOrder`, `childrenRequired`, `required`, `parentRequirementId`. A rank row has **25** (§2). The 17 unmatched fields:

| rank-row field | state on Scouts BSA (§2) |
|---|---|
| `versionId` | populated on all 147 — mbu's script does not model versions at all |
| `short` | populated on all 147; **no merit-badge counterpart exists** |
| `footer` | empty on all 147 (only `rankInformation.footer` is live) |
| `previousRankRequired` | `"True"` on 1 row |
| `monthsSinceLastRankRequired` | 6 rows |
| `eagleMBRequired` | 3 rows |
| `totalMBRequired` | 3 rows |
| `serviceHoursRequired` | 0 rows |
| `videoExternalURLId` | 0 rows |
| `disabledOnQuickEntry` | constant `"False"` |
| `linkedAdventureId`, `linkedAwardId`, `linkedAdventure` | empty / `{}` — Cub Scouting machinery |
| `electiveAdventure`, `linkedElectiveAdventures` | `false` / `[]` — Cub Scouting machinery |
| `requiresSSElective`, `ssElectives` | `false` / `[]` — Sea Scouting machinery |

Of those 17, only **six carry information on Scouts BSA today** — three groups: `short`, `versionId`, and the numeric quartet (`previousRankRequired` / `monthsSinceLastRankRequired` / `eagleMBRequired` / `totalMBRequired`), whose reliability is §6. The remaining eleven are dead for this program.

Rank-*level* additions with no badge equivalent: `level`, `reallyShort`, `versions[]`, `rankInformation.header`, `rankInformation.footer`, `imageUrl100/200/400`, `lds`, `scoutNet`, `sku`, `price`, `priceLastUpdated`.

### 9.2 What mbu relies on that ranks do not provide

| mbu field / mechanism | how mbu gets it | ranks equivalent |
|---|---|---|
| `resources[]` | `cheerio` over each requirement's HTML, selecting `$("details a[href]")` and keeping absolute `http(s)` links | **none.** §4.1's tag inventory has **no `<details>` element anywhere** in the ranks corpus, and exactly **one distinct `<a href>` literal**, on 2 of 147 rows (the youth-protection training link on Scout `6b` and Star `6b`). A resources-extraction pass over rank prose would yield at most one link, twice. |
| `pamphlet_url` | regex `href="([^"]+\.pdf[^"]*)"` on a requirement matching `/official merit badge pamphlets/i` | **none.** No `.pdf` href and no such requirement exists on any rank. |
| `category`, `eagle_required`, `eagle_group` | mbu's own hand-maintained `scripts/merit-badges.ts` catalog, not the API | **none needed** — the rank analogue, advancement order, *is* in the API as `level` (§8.1). |
| `discontinued`, `discontinued_date` | mbu's own catalog | **none.** The API models retirement per *version* (`versionExpiryDt` / `expiredDate`, §7.3), never per rank. All 7 ranks are live. |
| `last_updated` | carried forward from the previous badge JSON, or today's date | **partially available and better** — `rankInformation.versionEffectiveDt` is the real effective date of the served text (§7.3), populated on all 7. |
| `url` (canonical page) | constructed from the badge slug | n/a — no canonical URL is served for a rank either. |
| `sortOrder` typed as `number` (line 68) | the merit-badge API supplies it | **breaks on ranks.** §3.4: `sortOrder` is a string, empty on 34/37 Second Class rows, 34/38 First Class, 8/10 Star and **all 8** Life rows, non-integer where present (`"1.1"`), and duplicated once on Tenderfoot. |
| `requirementNumber` as a usable label | present on merit-badge rows | **empty on exactly the 3 parent rows** (§3.3) — the rows a tree walker most needs to label. |

Two further observations about the shared API family, recorded as fact:

- mbu's script needs three hand-maintained override maps against the *same* API — `SUBREQUIREMENT_MODE_OVERRIDES`, `REQUIREMENT_ID_OVERRIDES`, `REQUIREMENT_PATH_OVERRIDES` — all of them currently populated solely for the Shotgun Shooting badge. The ranks corpus's structural anomalies are catalogued in §3; whether they need the same treatment is #16's call.
- mbu reads requirements from the **non-`v2`** path `https://api.scouting.org/advancements/meritBadges/…`, while the ranks catalog and requirements both live under `/advancements/v2/`. The non-`v2` ranks version route is the one that 401s (§7.4).

### 9.3 Structural asymmetry worth recording

mbu's `Requirement` type is genuinely recursive (`subrequirements?: Requirement[]`) with a `path` string and a `subrequirement_mode`. The ranks corpus never exceeds **depth 1**, has only **3 parent rows in 147**, and `childrenRequired` equals the child count in all 3 cases, so no choose-*k*-of-*n* occurs anywhere (§3.8). Whatever ranks need is a strict subset of that shape — except for `short`, which mbu has nothing to hold.
