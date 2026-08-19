# scouting.org Terms of Use: automated collection of requirement data

**Issue**: [markgoho/scouting-u#26](https://github.com/markgoho/scouting-u/issues/26) (parent map: #10; surfaced by #13)
**Researched**: 2026-08-18
**Status**: Findings only. **This document does not decide anything and is not legal advice.** The decision is Mark's.

---

## 1. Scope and framing

Issue #13 researched whether this site could display Scouting America's rank emblem artwork. Its
working assumption — shared by the whole wayfinder map — was that requirement **text** is factual,
published information and therefore safe, while only the artwork carried risk. Reading the 2015
Terms of Use (TOU) text, #13 found that assumption does not hold cleanly: the Content clause sweeps
in "text," "data," and "databases" without carving out factual content, and separately bars automated
collection. If that clause reaches this site, it reaches the sync script and every rank page, not
just emblem images.

This document asks five narrower questions, in the order the issue poses them, and reports findings
only — no verdict.

---

## 2. The live Terms of Use text

**The live page could not be reached.** Fetched directly on 2026-08-18 with both plain `curl` and a
browser-user-agent `curl`: `https://www.scouting.org/legal/terms-and-conditions/` returns **HTTP
403**. `https://www.scouting.org/robots.txt` also returns 403 to automated `curl`, serving a
Cloudflare "Just a moment…" managed-challenge page (bot-detection JavaScript challenge), not the
plain-text robots file. This matches #13's experience exactly — the block is upstream of the specific
page, not specific to `/legal/`.

**A near-current cached copy is available and was checked.** The Internet Archive's Wayback Machine
holds a capture of the live page dated **2026-07-31** — about eighteen days before this research, and
roughly eight months newer than the 2024-12-24 capture #13 relied on:

> [web.archive.org/web/20260731235706/https://www.scouting.org/legal/terms-and-conditions/](https://web.archive.org/web/20260731235706/https://www.scouting.org/legal/terms-and-conditions/)
> (fetched 2026-08-18, HTTP 200 from the archive, content-length 271,298 bytes)

Its text is **word-for-word identical**, in every clause checked, to the 2015 text #13 quoted. The
page still opens:

> **Effective January 15, 2015**
> This website is provided by Boy Scouts of America and its affiliates (collectively, "BSA"). By
> accessing this website (the "Site"), you are indicating your acknowledgment and acceptance of these
> Terms of Use ("TOU"). […] These Terms of Use are subject to change by BSA at any time in its
> discretion.

The Content clause, the automated-collection clause (§4 below), the "Request for Consent to Use
Content" clause naming `BSA.Legal@scouting.org`, and the rank-insignia sentence from #13's §2.3 all
appear unchanged, including the closing copyright notice still reading "© 2015 Boy Scouts of
America."

**What this does and does not establish.** A Wayback capture is a secondary, cached source, not a
live fetch, and the automated block means neither #13 nor this document has verified the *current
live* page by direct observation. But an archived capture dated eighteen days before this research —
under the same "Effective January 15, 2015" heading, with identical clause text — is stronger evidence
of currency than #13 had, and gives no indication the document has been revised. Someone with a
browser could still confirm this directly in under a minute; that has not been done here.

---

## 3. Does the Terms of Use bind `api.scouting.org`?

**This is unresolved, exactly as #13 left it.** No new evidence found here resolves it either way.
What was checked:

**The TOU's own scope language is inconsistent across clauses — this matters and was not obvious at
first read.** Two different clauses use two different scopes, and the ticket's question turns on
which one (if either) governs an API host:

- The **Content-ownership** clause reaches wide: content that "appears on or is available through
  this Site **and any other website owned, operated, or controlled by BSA**" (verbatim, confirmed
  unchanged in the 2026-07-31 capture).
- The **automated-collection** clause — the one that actually matters for this ticket — is narrower:
  it bars gathering "any Content (as defined below) **on this Site**" (verbatim, §4 below; confirmed
  at line 170 of the extracted 2026-07-31 capture text). It does not repeat the "and any other website
  owned, operated, or controlled by BSA" phrase. Read strictly, the automated-collection bar is scoped
  to "this Site" only, and "this Site" is defined at the top of the document as the website the user is
  accessing ("By accessing this website (the 'Site')…").

`api.scouting.org` is on the `scouting.org` domain, and its root redirects to the marketing site:

```
$ curl -sI https://api.scouting.org/
HTTP/1.1 301 Moved Permanently
Location: https://www.scouting.org:443/
```

(fetched 2026-08-18). That supports `api.scouting.org` being "owned, operated, or controlled by BSA"
for purposes of the *broad* Content-ownership clause — but the *narrow* automated-collection clause
does not use that broader phrase, and no source found resolves whether "this Site" in that specific
sentence was meant to include a separate API host that a browser never renders.

**A related, unresolved textual point: the TOU frames its own formation around "accessing this
website."** The opening paragraph (§2 above) reads: "By **accessing this website** (the 'Site'), you
are indicating your acknowledgment and acceptance of these Terms of Use." A sync script that calls
`api.scouting.org` directly, and never loads a page from `www.scouting.org`, arguably never performs
the act the TOU names as the moment of acceptance. This is a **browsewrap-style assent question about
the TOU's own text**, not a permission — it cuts in the opposite direction from the broad
Content-ownership language above, and nothing found resolves the tension between the two.

Net: the TOU's own scope language is not internally consistent on whether it reaches an API host, and
the clause that actually restricts automated collection is the narrower of the two.

**No API-specific terms document exists.** Checked directly on 2026-08-18:

| URL | Result |
|---|---|
| `https://api.scouting.org/terms` | HTTP 404 |
| `https://api.scouting.org/docs` | HTTP 404 |
| `https://api.scouting.org/swagger` | HTTP 404 |
| `https://api.scouting.org/api-docs` | HTTP 404 |
| `https://api.scouting.org/robots.txt` | HTTP 404, body `No listener for endpoint: /robots.txt` |

The `robots.txt` response is telling: it is not a missing static file, it is an API-gateway 404 for
an undefined route, the same shape as every other undefined path on that host. `api.scouting.org` is
a REST backend with no served robots policy of its own, and the Wayback Machine has **never**
archived a `robots.txt` at that host (`web.archive.org/cdx/search/cdx?url=api.scouting.org/robots.txt`
returned zero rows on 2026-08-18) — consistent with one never having existed publicly.

**`www.scouting.org`'s robots.txt, separately, is wide open.** A February 2026 Wayback capture of
`https://www.scouting.org/robots.txt` reads, in full:

```
User-agent: *
Disallow:

Sitemap: http://www.scouting.org/sitemap.xml
```

(Wayback Machine capture dated 2026-02-04, fetched 2026-08-18 via `web.archive.org/web/20260204070154id_/`.)
An empty `Disallow:` permits crawling of everything on that host under the robots-exclusion protocol.
Two caveats: this is a **crawl-politeness signal, not a contract term** — it says nothing about the
TOU's separate, contractual bar on automated collection (§4) — and it covers `www.scouting.org`, not
`api.scouting.org`, which serves no robots.txt at all.

**No developer agreement, rate-limit statement, or API terms of any kind were found**, including in
the response headers of the endpoint this site actually calls. `GET https://api.scouting.org/advancements/v2/ranks`
(fetched 2026-08-18, HTTP 200) returns only infrastructure headers — `Content-Type`, `Content-Length`,
`Strict-Transport-Security`, `X-Frame-Options`, and internal `x-esb-*` gateway trace headers — no
`X-RateLimit-*`, no `Retry-After`, no `Link rel="terms-of-service"`, no `X-Robots-Tag`, and no licence
or copyright header of any kind. Nothing found says the site TOU explicitly extends to, or explicitly
excludes, `api.scouting.org`.

---

## 4. What "automated collection" actually prohibits

Verbatim, from the "User Responsibilities and Restrictions on Use" section (confirmed unchanged in
the 2026-07-31 capture, §2 above; this is the narrow-scoped "on this Site" clause discussed in §3):

> Furthermore, you agree to use the Site and all related services only for lawful purposes […]
> Without limiting the foregoing, you specifically may not: […]
>
> **Monitor, gather or copy any Content** (as defined below) **on this Site by using any robot,
> "bot," spider, crawler, spyware, engine, device, software, extraction tool or any other automatic
> device, utility or manual process of any kind.**

The same list also bars, unchanged in the 2026-07-31 capture: *"Link to this Site, including linking
to the home page or any other page on the Site, without our express permission."* #13 flagged this
bullet too; it survives verbatim and is noted here for completeness, though it is not this ticket's
main question.

Three things stand out when this clause is read against a once-a-year, human-run sync script:

**The prohibited-method list already includes plain software.** It does not read as "bots only." A
script that calls `GET /advancements/v2/ranks` and writes the JSON to disk is, on its face, "software"
or an "extraction tool" within the list, regardless of how a human happens to trigger it.

**The clause's own catch-all reaches manual methods too.** The list ends "…or any other automatic
device, utility or **manual process of any kind**." That phrase is not limited to bots or automated
devices — it names manual process explicitly. Nothing in the sentence turns on whether a human
initiated the run.

**No frequency or volume threshold appears anywhere in the clause, or elsewhere in the document.**
The text does not say "repeated," "bulk," "commercial-scale," or set any cadence. As written, it does
not on its face distinguish a once-a-year fetch of one JSON endpoint from continuous scraping of the
whole site. Whether a court or BSA itself would draw such a line in practice is a separate question
this document cannot answer — nothing found states or implies where BSA would draw it. The only
textual hook for a lower-risk framing is the general contract-interpretation principle that terms
exist to prevent some harm (here, plausibly: server load, content re-hosting, competitive re-use) — a
purposive reading like that is an argument someone could make, not something the text itself states.

---

## 5. What comparable third-party tools rely on

**Read this section the way #13 read its comparable-sites section: none of it is evidence of
permission.** It shows what other builders chose to risk (or were told to stop risking), not what
BSA allows.

### 5.1 A forum moderator has twice relayed, secondhand, that National does not want third parties using `api.scouting.org`

`discussions.scouting.org` is BSA's official community/support forum (Discourse software). A thread
titled "Is there Documentation for api.scouting.org" was fetched directly via the forum's JSON API
(`discussions.scouting.org/t/.../328234.json`, 2026-08-18) so post authorship and role flags could be
checked in the raw data rather than trusted to a rendered page:

- **DanKlco** (2022-11-13) posted a Postman collection and a TypeScript client
  (`CubPack-org/scouting-api-client`) built by capturing the browser's own requests to
  `api.scouting.org`.
- **Matt.Johnson** (an ordinary member per the JSON — no moderator or admin flag) replied the same
  day: *"No. No plans to release it either. The BSA, through intermediaries, has been very very
  clear."*
- **Stephen_Hornak** (also an ordinary member) replied: *"best advice is to stop what you are doing
  and get rid of what you have thus far."* DanKlco replied: *"I took it down."*
- **DonovanMcNeil** — the JSON flags this account `moderator: true` (and a derived `staff: true`,
  which in Discourse simply means `admin OR moderator`; it is a **forum role**, not evidence of BSA
  employment) — posted the same day: *"BSA is correctly concerned about PII is the base answer and
  contacting youth."* On 2025-09-07, in the same thread, the same moderator account added: *"Simple
  answer is National has no plans to open API to Volunteers or Third Party Providers."*
- Later in the same 2025 exchange, when pressed for a citable official statement, **CharleyHamilton**
  (an ordinary member) said the people who actually make this decision "are not on these discussion
  groups and don't accept this kind of feedback via the **SUAC volunteers**" — SUAC being a volunteer
  advisory committee, not BSA staff. The pressing participant, **ChristopherSmith34**, told
  CharleyHamilton directly: *"I understand that you're 'far from officialdom.'"* **No BSA employee or
  published BSA document was identified anywhere in the thread**; every participant, including the
  moderator, reads as a volunteer.

Corroborating this with GitHub directly: `github.com/CubPack-org/scouting-api-client` returns
**HTTP 404** (checked 2026-08-18) — consistent with DanKlco's "I took it down."

**What this is and is not evidence of.** This is a **volunteer forum moderator relaying, secondhand,
a position they attribute to "National"** — repeated in their own words three years apart (2022,
2025) — not a statement from a BSA employee, and not a published BSA policy document. No source in
this thread or elsewhere names who at BSA holds this position or where it is written down. Treat it
as the best available secondhand signal of BSA's institutional attitude toward third-party use of
`api.scouting.org`, not as an authoritative statement of it.

**Scope caveat, stated plainly because it matters:** the tool discussed in that thread was built by
replaying an **authenticated** browser session (rosters, per-scout advancement, "contacting youth" —
the moderator's own framing is PII-centric). It is not the same surface as this site's target,
`GET /advancements/v2/ranks`, which is unauthenticated and returns a generic catalog of rank
definitions with no per-person data. **No source found states whether the relayed "no third parties"
position extends to a no-auth, no-PII reference/definitions endpoint specifically** — the thread's own
stated rationale (PII, contacting youth) does not obviously apply to that narrower endpoint, but
nothing found says it doesn't apply either. This is a real, dated, twice-repeated secondhand
statement against third-party use of the *api.scouting.org* host in general; it is not a statement
scoped to the ranks-catalog endpoint this site calls, and it is not sourced to BSA directly.

### 5.2 A second, unrelated project documents the same public endpoints without incident

[`github.com/mmarseglia/scouting-api`](https://github.com/mmarseglia/scouting-api) documents public
`api.scouting.org` endpoints, including `GET /advancements/ranks`, as an OpenAPI spec "in the hopes
that volunteers can find creative uses to better serve Scouting" (README, fetched 2026-08-18). It
states no legal basis, cites no permission, and carries no non-affiliation disclaimer. It remains
live and publicly viewable as of this research, in apparent contrast to §5.1 — though absence of a
takedown is not evidence of permission, only evidence that no takedown has (yet) happened.

### 5.3 A third tool relies on authenticated, per-user access — a different posture

[`github.com/natbros-git/scouts-cli`](https://github.com/natbros-git/scouts-cli) is a CLI that "wraps
`api.scouting.org` for programmatic access to scout advancement, rosters, messaging, and org
management." Its README (fetched 2026-08-18) describes browser-based login against
`advancements.scouting.org` (Scoutbook Plus) per user, with tokens tied to that member's session. This
is closer to the tool in §5.1 than to this site's use: it operates as an authenticated member acting
on their own account's data, not an anonymous fetch of a public reference endpoint.

### 5.4 A longstanding text-republishing site exists, but its data source is unstated

`usscouts.org` (checked 2026-08-18, `advance/ScoutsBSA/rank1.asp`) republishes full Scouts BSA rank
requirement **text** — the same category of content this site's sync script would collect, not just
imagery. #13 §3 already found and quoted its disclaimer:

> The U.S. Scouting Service Project […] **is not affiliated with the Boy Scouts of America (BSA)** […]
> we'd like to point out that copyrighted material appearing here IS copyrighted, and cannot be used
> commercially without permission […] If the claim appears on its face to have merit, we will pull any
> disputed content pending resolution of the claim.

Source: [usscouts.org/ussspdisclaimer.asp](http://www.usscouts.org/ussspdisclaimer.asp). **Nothing
found states how USSSP originally obtained this text** — manual transcription from BSA's published
requirement PDFs is at least as plausible as automated API polling, and the site predates
`api.scouting.org`'s public availability by many years. It is a real, longstanding data point for "a
non-affiliated site republishing rank requirement text without a stated BSA permission," but it is a
weak analogue specifically for *automated collection*, because its collection method was not
established.

---

## 6. Should `BSA.Legal@scouting.org` get one combined request?

Reasoning only — no request is drafted here, per the ticket's instructions.

#13 §6 quoted the TOU's own designated channel:

> **Request for Consent to Use Content** — If you wish to use any of this Site's Content for any
> purpose other than your individual review and individual educational purposes, please send a request
> with your proposed use to **BSA.Legal@scouting.org** […] Any approval of your request by BSA will be
> limited to a specific, enumerated use […]

Three things point toward one combined request rather than two:

- **The clause names "Content," not "artwork."** The same defined term ("text, music, sounds,
  photographs, videos, images, illustrations, icons, graphics, headers, typefaces, data, inventory
  information, databases and software") covers both the rank emblem PNGs (#13's subject) and the rank
  requirement JSON (this ticket's subject). It is one clause, one contact, one review channel for both.
- **Any approval is "limited to a specific, enumerated use."** That already means the request has to
  spell out exactly what's being asked for. Enumerating "automated, once-a-year fetch of
  `GET /advancements/v2/ranks`, and display of the associated rank emblem images, on
  scouting.university" in a single email is one enumeration; splitting it into two requests would
  describe overlapping uses (the same site, the same pages) to the same reviewer twice.
- **The automated-collection bar (§4) and the Content/consent clause are not separable in practice
  for this site.** The sync script's fetch and the emblem display are two steps of one pipeline
  feeding the same rank pages. A reviewer evaluating one without the other would be evaluating half
  the actual use.

Nothing found suggests BSA.Legal routes data-only and artwork-only requests differently, or that
combining them would slow or complicate review — that is inference from the clause's own wording, not
a stated BSA position on request-splitting.

---

## 7. What the sources do not say

Recorded so silence is not later mistaken for permission.

- **No source states, one way or the other, whether the site TOU's contract terms legally reach
  `api.scouting.org`.** The scope language is broad enough to plausibly cover it (§3); nothing
  confirms or excludes it.
- **No source states a volume, frequency, or "low-impact use" exception to the automated-collection
  clause.** A once-a-year manual run is not distinguished from continuous scraping anywhere in the
  text (§4).
- **No source — TOU, forum thread, or comparable-tool README — directly addresses the specific case
  of an unauthenticated, no-PII, reference/definitions endpoint** (as opposed to per-scout or roster
  data). The one concrete secondhand statement found (§5.1) is framed around PII and contacting youth,
  which is not obviously this endpoint's shape, but nothing says the "no third parties" position stops
  short of it either.
- **No source resolves whether the narrow "on this Site" automated-collection clause reaches an API
  host that is never rendered as a webpage**, or how that squares with the TOU's broader
  Content-ownership language and its own "by accessing this website" framing of acceptance (§3).
- **No published BSA position exists on non-commercial, third-party informational reuse of rank
  requirement text**, of the kind #13 already found missing for emblem artwork. Nothing found grants
  it; nothing found singles it out for prohibition beyond the general clauses already quoted.
- **The live TOU page itself was not directly viewed by a human with a browser** in the course of this
  research (§2). The eighteen-day-old cached copy is the closest available evidence of current text.

---

## 8. Decision inputs for Mark

Open questions this research surfaced but does **not** answer. Listed, not resolved.

1. **Does the automated-collection clause reach a once-a-year, human-triggered sync?** The text's own
   wording ("manual process of any kind," no frequency threshold — §4) does not obviously carve that
   out, even though the practical risk of a low-volume annual pull looks very different from
   continuous scraping.
2. **Does the site TOU bind `api.scouting.org` at all?** Still unresolved (§3), and now sharper: the
   clause that actually restricts automated collection is scoped to "this Site," not the broader
   "this Site and any other website owned, operated, or controlled by BSA" language used elsewhere in
   the same document. No API-specific terms exist to check instead.
3. **Does BSA's stated "no third parties on api.scouting.org" position (§5.1) reach a no-auth,
   no-PII, reference-only endpoint**, or is it specific to the PII/roster surface the forum thread was
   actually about? Nothing found answers this directly.
4. **Is a combined data-and-artwork permission request to `BSA.Legal@scouting.org` worth sending
   regardless?** §6 lays out why one combined, enumerated request looks more efficient than two. A
   written, enumerated grant would close questions 1–3 at once; a refusal or continued silence leaves
   the position exactly where it is now.
5. **Is the forum thread (§5.1) worth weighing at all**, given it is a volunteer forum moderator's
   secondhand account of an unwritten "National" position — not a BSA employee and not a published
   policy — even though it was repeated in the moderator's own words three years apart (2022, 2025)?

**Same "not a blocker for the MVP" note as #13**: rank pages ship without emblem artwork regardless
(uni-theme vendors ~300 Phosphor icons). This ticket's finding is broader than #13's, though — if the
automated-collection clause is read strictly, it would reach the sync script and the requirement text
itself, not only the emblem question. That is the larger open question #13 flagged and this ticket
was scoped to examine; it remains open.

---

## 9. Method

Everything above was retrieved on **2026-08-18** unless a different date is stated at the point of
use.

**Reached**: `api.scouting.org` root, `/terms`, `/docs`, `/swagger`, `/api-docs`, `/robots.txt`, and
`/advancements/v2/ranks` response headers (direct `curl`) · `www.scouting.org/robots.txt` and the live
`/legal/terms-and-conditions/` page
(direct `curl`, both blocked — see below) · the Wayback Machine CDX API for both hosts ·
the 2026-07-31 Wayback capture of the live Terms of Use page · a February 2026 Wayback capture of
`www.scouting.org/robots.txt` · `discussions.scouting.org`'s Discourse JSON API for the
"Is there Documentation for api.scouting.org" thread (raw post authorship/staff flags, not just the
rendered page) · GitHub for `mmarseglia/scouting-api`, `natbros-git/scouts-cli`, and
`CubPack-org/scouting-api-client` (README content and repo existence) · `usscouts.org`'s rank-1 page
and disclaimer page.

**Not reached**: the live `www.scouting.org/legal/terms-and-conditions/` page and the live
`www.scouting.org/robots.txt` — both returned **HTTP 403** to every automated fetch attempted (plain
`curl`, browser user-agent `curl`); both are Cloudflare-challenge-gated. `dlaporte/scoutbook-api`
(referenced in search results and in the forum thread) returned 404 on both a direct README fetch and
the GitHub repos API — either renamed, deleted, or made private since it was indexed. No official,
published, dated policy document from BSA addressing third-party use of `api.scouting.org`
specifically — the only concrete statement found is the forum thread quoted in §5.1, which is
informal and not a published policy artifact.

`docs/research/` did not exist in this repo's `trunk` before this file (it exists on the separate
`research/rank-emblem-ip` branch, not yet merged); this file follows that document's structure and
citation convention.
