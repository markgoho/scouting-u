# Rank emblem imagery: intellectual property findings

**Issue**: [markgoho/scouting-u#13](https://github.com/markgoho/scouting-u/issues/13) (parent map: #10)
**Researched**: 2026-08-18
**Status**: Findings only. **This document does not decide anything and is not legal advice.** The decision is Mark's.

---

## 1. Scope and framing

The ticket asks one question: can this site display Scouting America's rank emblem artwork, and
under what conditions?

That single question hides **four separable legal questions** with different answers and different
governing law. Keeping them apart matters more than any single citation below.

| # | Act | Body of law |
|---|-----|-------------|
| 1 | **Copying** an emblem PNG into this repo and serving it from our own host | Copyright (reproduction + distribution) |
| 2 | **Hotlinking** the CloudFront URL so the browser fetches it from Scouting America | No copy is made by us; display right, plus whatever terms attach to the host |
| 3 | **Naming** a rank in text ("Eagle Scout", "Star") | Trademark / the federal charter |
| 4 | **The federal charter** — a separate statutory grant that sits on top of ordinary trademark law | 36 U.S.C. § 30905 |

Question 4 is the most discriminating fact in this whole file, and it is the one most often missed
because it has no analogue for an ordinary corporate logo.

---

## 2. What the sources say

### 2.1 The federal charter gives an exclusive right to emblems and badges

Primary source, verbatim:

> **36 U.S. Code § 30905 — Exclusive right to emblems, badges, marks, and words**
>
> The corporation has the exclusive right to use emblems, badges, descriptive or designating marks,
> and words or phrases the corporation adopts. This section does not affect any vested rights.

Source: [36 U.S.C. § 30905, via Cornell LII](https://www.law.cornell.edu/uscode/text/36/30905).
Source credit: Pub. L. 105–225, Aug. 12, 1998, 112 Stat. 1326. Revised from the original
36 U.S.C. § 27, enacted June 15, 1916, ch. 148, § 7, 39 Stat. 228.

Two things to note about the text:

- It names **"emblems"** and **"badges"** explicitly. Rank emblems are the exact subject matter.
- It contains **no likelihood-of-confusion element** and no fair-use carve-out on its face. Ordinary
  Lanham Act trademark infringement requires a showing of likely confusion. This provision, as
  written, does not.

Scouting America's own brand guide reads the statute the same way:

> The trademarks and logos of the Boy Scouts of America are protected by a 1916 act of Congress
> (36 U.S.C. 27) as well as by a variety of registrations with the U.S. Patent and Trademark Office.
> The 1916 act specifically gives the Boy Scouts of America the sole and exclusive right to use
> emblems, badges, descriptive or designating marks, and words or phrases the corporation adopts.

Source: *BSA Brand Guidelines*, p. 14, "Trademark and Logo Protection",
[filestore.scouting.org/filestore/pdf/310-0231.pdf](https://filestore.scouting.org/filestore/pdf/310-0231.pdf)
(downloaded 2026-08-18; document is BSA-branded and predates the Scouting America rebrand; it cites
the pre-1998 section number).

Same page, on the artwork itself:

> These and all art or logotypes obtained from the Boy Scouts of America National Council are the
> exclusive property of the Boy Scouts of America and must be used and displayed as shown in this
> manual or official artwork unless otherwise stated in writing from an authorized officer of the
> Boy Scouts of America National Council. […] The Boy Scouts of America maintains its right to
> regulate use of trademarks and constrain that use whenever the BSA, in its sole discretion, deems
> it necessary to do so.

### 2.2 The published trademark statement names rank insignia as protected

> In addition to the protections granted by the U.S. Congress in federal charter, Scouting America
> has registered a number of marks, words and phrases for its purposes.

The published list includes `Eagle Scout™`, `Tenderfoot™`, `Boy Scout™`, `Cub Scout™`, `Merit Badge®`,
`Scouting®`, `Sea Scouts®`, `Venturing®`. Under "More Trademark Examples" it lists:

> Boy Scout uniform, **insignia and emblems** · Cub Scout uniform, **insignia and emblems** ·
> Merit Badge® designs · Venturing uniform, **insignia and emblems**

and closes:

> In effect, just about any mark that reasonably relates to Scouting America or its program is
> protected. Accordingly, anyone seeking to use any marks, words, or phrases, which may reasonably
> be related to Scouting America and its programs should contact the Scouting America Legal
> Department at 972-580-2000 to obtain permission in advance for such use.

Source: [Scouting America Trademarks, licensingbsa.org](https://licensingbsa.org/trademarks/)
(retrieved 2026-08-18; page footer reads "© 2026 Scouting America").

### 2.3 The website Terms of Use address rank insignia and content reuse directly

This is the closest thing to a terms document that governs material served from Scouting America's
web properties. Verbatim, from the **Intellectual Property** section:

> This Site's overall "look and feel" and the various BSA emblems, **rank insignia**, logos, service
> marks, trademarks, and other brand indicia found on the Site are the exclusive property of the Boy
> Scouts of America and **may not be used without the express written permission of the Boy Scouts of
> America**.

And, on content generally:

> Boy Scouts of America and/or its licensors own all right, title and interest in and to all content
> (and all compilations thereof) that appears on or is available through this Site and any other
> website owned, operated, or controlled by BSA, including without limitation all text, music,
> sounds, photographs, videos, **images**, illustrations, icons, graphics, headers, typefaces,
> **data**, inventory information, **databases** and software (collectively, the "Content"). […]
> **You may access and view the Content solely for personal, noncommercial purposes.** […] Except as
> set forth in this paragraph, you may not copy, distribute, display, publicly perform, transmit, or
> broadcast the Content or use the Content to create derivative works or compilations without prior
> written consent from BSA. Furthermore, you may not collect, re-purpose or reuse any data or product
> listings contained in the Content […]

> You may download, print and use pages from the Site for your own personal informational,
> non-commercial purposes as long as (1.) **you do not distribute or republish such information in
> any form, including digitally**, and (2.) the copied pages reflect the original Site content in its
> unaltered form and retain the BSA copyright notice […]

The same document also restricts two things worth flagging for an automated sync script:

> you specifically may not: **Link to this Site**, including linking to the home page or any other
> page on the Site, **without our express permission**. **Monitor, gather or copy any Content** on
> this Site by using any robot, "bot," spider, crawler, spyware, engine, device, software, extraction
> tool or any other automatic device, utility or manual process of any kind.

Source: *Website Terms and Conditions of Use*, scouting.org, **Effective January 15, 2015**.
Retrieved 2026-08-18 from the Internet Archive capture of 2024-12-24:
[web.archive.org/web/20241224181740/https://www.scouting.org/legal/terms-and-conditions/](https://web.archive.org/web/20241224181740/https://www.scouting.org/legal/terms-and-conditions/).
The live URL is <https://www.scouting.org/legal/terms-and-conditions/>.

**Caveat on this source** — see §4.1. The live page returned HTTP 403 to every automated fetch
attempted, so the text above is quoted from an archived capture, not from the live page.

### 2.4 What the API and the CDN actually serve

Confirmed directly against the endpoints on 2026-08-18:

- `GET https://api.scouting.org/advancements/v2/ranks` returns 200, no auth, ~68 KB JSON, 22 ranks.
- Each entry in `versions[]` carries three emblem URLs. Eagle Scout, verbatim:

  ```
  imageUrl100 = https://d1kn0x9vzr5n76.cloudfront.net/images/ranks/neweagle100.png
  imageUrl200 = https://d1kn0x9vzr5n76.cloudfront.net/images/ranks/neweagle200.png
  imageUrl400 = https://d1kn0x9vzr5n76.cloudfront.net/images/ranks/neweagle400.png
  ```

- `curl -I https://d1kn0x9vzr5n76.cloudfront.net/images/ranks/neweagle400.png` returns
  `HTTP/1.1 200 OK`, `Content-Type: image/png`, `Content-Length: 242776`,
  `Last-Modified: Tue, 04 Mar 2025 17:13:27 GMT`, `Server: AmazonS3`, served via CloudFront.

  The response carries **no** `Access-Control-Allow-Origin`, **no** `X-Robots-Tag`, **no** licence
  header, **no** copyright header, and **no** rights metadata of any kind. Open access is a server
  configuration, not a grant.

---

## 3. What comparable third-party sites do

**Read this section carefully: none of it is evidence of permission.** Other sites showing emblems
tells us what they chose to risk, not what Scouting America allows. Only an explicit written
permission or licence statement would be evidence, and none was found on any site checked.

| Site | Shows rank emblem artwork? | Statement carried |
|---|---|---|
| [boyscouttrail.com](https://www.boyscouttrail.com/boy-scouts/star-scouts.asp) | Yes — serves its own copy at `/i/boyscout/starbadge.gif` | Footer only: *"This site is not officially associated with Scouting America"* |
| [usscouts.org (U.S. Scouting Service Project)](http://www.usscouts.org/ussspdisclaimer.asp) | Runs a large Scouting reference site and a clipart archive | Long disclaimer, quoted below |
| [en.wikipedia.org, *Ranks in Scouts BSA*](https://en.wikipedia.org/wiki/Ranks_in_Scouts_BSA) | Yes | Image is tagged **non-free / fair use**, not free-licensed |

USSSP — the oldest and largest independent Scouting reference site — is the most useful data point,
because it is explicit about what it is *not*:

> **REPRESENTATIONS**: The U.S. Scouting Service Project is a non-profit organization operated by
> volunteers and **is not affiliated with the Boy Scouts of America (BSA)** or with the World
> Organization of the Scout Movement (WOSM). […]
>
> **COPYRIGHTS**: We're making every effort to protect copyrights. We've noted copyrighted material
> that we know about […] we'd like to point out that copyrighted material appearing here IS
> copyrighted, and cannot be used commercially without permission, whether or not the copyright is
> noted. […] If the claim appears on its face to have merit, we will pull any disputed content
> pending resolution of the claim.

Source: [USSSP Disclaimers](http://www.usscouts.org/ussspdisclaimer.asp) (footer: © 1994–2024).

**Note what USSSP does not say.** It claims non-affiliation and it promises takedown on a valid
claim. It does **not** claim any permission, licence, or fair-use position from BSA for the Scouting
marks or artwork it hosts. Its posture is "we will remove it if asked", not "we are allowed".

Wikipedia's handling is the sharpest signal, because Wikipedia's licensing process is documented and
deliberate. Queried via the MediaWiki API on 2026-08-18:

```
File:Boy Scouting ranks (Boy Scouts of America).png
LicenseShortName : Fair use
UsageTerms       : Fair use of copyrighted material in the context of Ranks in Scouts BSA
NonFree          : true
Credit           : The logo may be obtained from Boy Scouts of America.
```

That is, the Wikimedia community treats the Scouts BSA rank badge composite as **copyrighted,
non-free content used under a fair-use rationale** — it is hosted on en.wikipedia, not on Wikimedia
Commons, precisely because Commons refuses non-free files. Wikipedia is not asserting the image is
free to reuse; it is asserting a fair-use rationale scoped to one encyclopaedia article.

---

## 4. What the sources do *not* say

These are negative findings, recorded so that silence is not later mistaken for permission.

### 4.1 There are no API terms

Checked on 2026-08-18:

- `https://api.scouting.org/` → HTTP 301, no terms document served.
- `https://api.scouting.org/terms` → HTTP 404.
- The `advancements/v2` responses carry no licence field, no terms link, no attribution requirement.
- No developer portal, no API documentation site, and no developer agreement for `api.scouting.org`
  was found by search.

**Whether the scouting.org Website Terms of Use (§2.3) governs `api.scouting.org` is ambiguous and
unresolved.** The TOU defines its own scope as "this website (the 'Site')" and was written in 2015
for a marketing website, but the content clause reaches "any other website owned, operated, or
controlled by BSA". `api.scouting.org` is on the `scouting.org` domain. No source says either way.

### 4.2 The live Terms of Use could not be verified

`https://www.scouting.org/legal/terms-and-conditions/` returned **HTTP 403** to every automated fetch
attempted on 2026-08-18 (plain curl, browser user-agent headers, and WebFetch). The quoted text is
from the 2024-12-24 Internet Archive capture, which is stamped **Effective January 15, 2015**.

A search-engine snippet of the *live* page (indexed under the title "Website Terms and Conditions of
Use | Scouting America") reproduced the "BSA emblems, rank insignia, logos…" sentence identically,
which suggests the clause is unchanged — but that is a secondary indication, not verification.
**Someone should open that page in a browser and confirm the current text and effective date before
relying on it.**

### 4.3 There is no published position on non-commercial third-party informational sites

No document was found that addresses whether a free, non-commercial, informational site may display
rank emblems. Nothing found grants it; nothing found singles it out for prohibition. The published
material is uniformly framed as "obtain permission in advance", with no stated exception for
non-commercial or educational use.

### 4.4 The licensing programme does not appear to be the right door

`licensingbsa.org` is a **product** licensing programme. Its application form requires a Company, a
Street Address, and a "primary function" chosen from *Manufacturer / Distributor / Retailer /
Service Provider*, and it states:

> Submitting this form does not in any way mean that Scouting America has granted or will grant you a
> license. Also, submitting this form does not constitute an application for a license. […] the
> product license application review process can take between 2-4 weeks

Source: [licensingbsa.org/apply/](https://licensingbsa.org/apply/) (retrieved 2026-08-18).

Nothing on that site describes a route for a non-commercial website to request permission to display
an emblem. See §6 for the route that does exist.

### 4.5 The rebrand does not appear to have changed the legal position

The organisation now does business as Scouting America (the licensing site's own phrasing is "Boy
Scouts of America d/b/a Scouting America"). The 1916/1998 charter runs to "the corporation" and is
unaffected by a trade name. Document dates matter and are recorded above: the brand guide is
BSA-branded and cites the pre-1998 section number; the TOU is dated 2015 and uses "Boy Scouts of
America" throughout; the trademarks page is current (© 2026) and uses "Scouting America". No source
found says any earlier document is superseded.

---

## 5. Doctrine — what the tests require

**This section states the elements of the doctrines only. It deliberately does not apply any of them
to this site.** Applying them is legal analysis, and that is not what this document is for.

### 5.1 Copyright fair use — 17 U.S.C. § 107

Relevant to question 1 (copying the PNG into the repo). The statute makes fair use a four-factor
inquiry, applied case by case:

> (1) the purpose and character of the use, including whether such use is of a commercial nature or
> is for nonprofit educational purposes;
> (2) the nature of the copyrighted work;
> (3) the amount and substantiality of the portion used in relation to the copyrighted work as a
> whole; and
> (4) the effect of the use upon the potential market for or value of the copyrighted work.

Source: [17 U.S.C. § 107, Cornell LII](https://www.law.cornell.edu/uscode/text/17/107).

### 5.2 Nominative fair use — trademark

Relevant to question 3 (naming a rank), and to the difference between *identifying* a rank and
*decorating* a page with its artwork. The Ninth Circuit's three-part test, from
*New Kids on the Block v. News America Publishing, Inc.*, 971 F.2d 302, 306–08 (9th Cir. 1992),
asks whether:

1. the product or service is **not readily identifiable** without use of the mark;
2. **only so much of the mark** is used **as is reasonably necessary** to identify it; and
3. the user does **nothing that would suggest sponsorship or endorsement** by the mark holder.

Sources: [Ninth Circuit Model Civil Jury Instruction 15.26, "Defenses — Nominative Fair
Use"](https://www.ce9.uscourts.gov/jury-instructions/civil/chapter-15/15-26-defenses-nominative-fair-use/);
[Nominative use overview](https://en.wikipedia.org/wiki/Nominative_use).
The circuits are split on how this doctrine operates; the Ninth Circuit formulation above is the
canonical one but is not uniform national law.

The related statutory descriptive fair-use defence is at
[15 U.S.C. § 1115(b)(4)](https://www.law.cornell.edu/uscode/text/15/1115).

### 5.3 The charter question that sits over both

Both doctrines above are shaped around **confusion** and **market harm**. § 30905 as written contains
neither element. The open doctrinal question — and it is genuinely open in this research, not
resolved — is **how far a fair-use or nominative-use posture reaches against a confusion-independent
statutory grant**.

Two leads, both **secondary and unverified against a primary court record**:

- *Wrenn v. Boy Scouts of America*, No. 3:03-cv-04057 (N.D. Cal., decided Oct. 28, 2008). Secondary
  summaries state the court held BSA "need not demonstrate the likelihood of confusion because it has
  been granted special protection by Congressional charter." **A CourtListener API search for this
  case returned zero results (`count: 0`) on 2026-08-18; the opinion text was not obtained.** Treat
  this as a lead to verify, not as an established holding.
  ([Wikipedia summary](https://en.wikipedia.org/wiki/Wrenn_v._Boy_Scouts_of_America))
- *San Francisco Arts & Athletics, Inc. v. USOC*, 483 U.S. 522 (1987), read a textually analogous
  charter grant to the U.S. Olympic Committee as broader than ordinary trademark and not requiring a
  confusion showing. **Not verified against the opinion in this research.** It is offered only as the
  closest structural analogue for someone qualified to evaluate.

Anyone weighing this seriously should read § 30905 alongside those two cases with counsel. That is
outside what this document can settle.

---

## 6. Who to ask for written permission

Two distinct doors, for two distinct things:

**For permission to use site content and imagery** — this is the route that matches this site's
situation. The Terms of Use names it explicitly:

> **Request for Consent to Use Content** — If you wish to use any of this Site's Content for any
> purpose other than your individual review and individual educational purposes, please send a request
> with your proposed use to **BSA.Legal@scouting.org** so that we may evaluate your proposed use.
> Unless required by law, the BSA will not be obligated to grant such requests and may approve or deny
> them at its sole discretion. Any approval of your request by BSA will be limited to a specific,
> enumerated use and conditioned upon your acceptance of additional reasonable terms and conditions
> […] No approval or permission to use this Site's Content will be effective unless made in writing by
> a duly authorized representative of BSA. Furthermore, BSA reserves the right to revoke its consent
> at any time.

- **Email**: `BSA.Legal@scouting.org`
- **Phone**: Scouting America Legal Department, **972-580-2000** (the number the trademarks page
  directs mark-use requests to)

Practical notes drawn from the clause itself: any grant is **use-specific and enumerated**, must be
**in writing from an authorised representative**, may carry **additional conditions**, and is
**revocable at any time**. A permission for "rank emblems on scouting.university rank pages" would
need to describe the use precisely enough to be enumerated.

**For commercial product licensing** — not this site's situation, recorded for completeness:

- Email `licensing@scouting.org`, phone (800) 323-0732
- Scouting America Licensing Programs, 2109 Westinghouse Blvd., Charlotte, NC 28273
- Application request form: <https://licensingbsa.org/apply/>

---

## 7. Decision inputs for Mark

Open questions this research surfaced but does **not** answer. Listed, not resolved.

1. **Which of the four acts in §1 is even on the table?** Serving our own copy, hotlinking the CDN,
   and text-only rank naming are three different exposures. The answer may differ per act.
2. **Does the 2015 TOU bind `api.scouting.org`?** Unresolved (§4.1). If it does, note that the same
   document also restricts automated collection and unpermitted linking — which would reach the sync
   script and the requirement *text*, not only the emblems.
3. **Is the live TOU still the 2015 text?** Needs a human with a browser (§4.2).
4. **Does the requirement-text-is-factual assumption survive the TOU?** The ticket's working
   assumption is that requirement text is fine and only artwork is at risk. The TOU's Content clause
   sweeps in "text", "data", and "databases" without distinguishing factual content, and separately
   bars automated collection. Copyright does not protect facts, but the TOU is a contract-style
   instrument, not a copyright statement. **This is a bigger question than the emblem question and
   this ticket did not scope it.** Worth its own ticket.
5. **Is a permission request worth sending regardless?** It costs one email to
   `BSA.Legal@scouting.org`. A written, enumerated grant would close questions 1–4 at once. A refusal
   or a silence leaves the position exactly where it is now.
6. **What does the site say about itself?** Every comparable site checked carries a non-affiliation
   disclaimer (§3). A disclaimer is cheap and is one of the three nominative-use factors (§5.2), but
   nothing found suggests a disclaimer alone substitutes for permission.

**Not a blocker for the MVP.** Per issue #10, rank pages ship with a typographic or icon-based rank
identity (uni-theme vendors ~300 Phosphor icons). Emblems drop in later only if this clears.

---

## 8. Method

Everything above was retrieved on **2026-08-18**. Primary sources were fetched directly wherever
possible; where a primary source could not be reached, that is stated at the point of use.

**Reached**: 36 U.S.C. § 30905 and 17 U.S.C. § 107 (Cornell LII) · BSA Brand Guidelines PDF 310-0231
(filestore.scouting.org, extracted with `pdftotext`) · licensingbsa.org trademarks and apply pages ·
scouting.org Terms of Use (Internet Archive, 2024-12-24 capture) · `api.scouting.org/advancements/v2/ranks`
and the CloudFront emblem host (direct `curl`) · usscouts.org disclaimer page · en.wikipedia
MediaWiki API for file licensing · Ninth Circuit model jury instructions.

**Not reached**: the live scouting.org Terms of Use page (HTTP 403 to all automated attempts) · the
*Wrenn v. Boy Scouts of America* opinion text (CourtListener search returned no results) · the
*San Francisco Arts & Athletics v. USOC* opinion text (not attempted; noted as an unverified lead) ·
any API terms document for `api.scouting.org` (none appears to exist).

`docs/research/` did not exist in this repo before this file; `docs/` previously held only `agents/`.
