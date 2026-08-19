#!/usr/bin/env python3
"""Analysis for docs/research/ranks-api-surface.md.

Reads the 8 payloads in ./api/ (see the "Reproducing" section of the write-up)
and prints every tally quoted in the document.

Usage:
    python3 analyze-ranks-api.py          # expects ./api/ alongside it
    python3 analyze-ranks-api.py /path/to/api
"""

import json
import os
import re
import statistics
import sys
from collections import Counter, defaultdict

API = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "api")

RANK_IDS = [1, 2, 3, 4, 5, 6, 7]
RANK_LABEL = {1: "1 Scout", 2: "2 Tenderfoot", 3: "3 Second Class",
              4: "4 First Class", 5: "5 Star Scout", 6: "6 Life Scout",
              7: "7 Eagle Scout"}


def load(name):
    with open(os.path.join(API, name), encoding="utf-8") as fh:
        return json.load(fh)


CATALOG = load("ranks.json")
REQ = {i: load("req-%d.json" % i) for i in RANK_IDS}
ROWS = {i: REQ[i]["requirements"] for i in RANK_IDS}
INFO = {i: REQ[i]["rankInformation"] for i in RANK_IDS}
BSA = {r["id"]: r for r in CATALOG if r.get("programId") == 2}
ALL_ROWS = [(i, row) for i in RANK_IDS for row in ROWS[i]]


def head(text):
    print("\n" + "=" * 72)
    print(text)
    print("=" * 72)


def listnum_key(value):
    """(int stem, letter suffix) — the only key that orders every rank."""
    m = re.match(r"^(\d+)([a-z]*)\.?$", value.strip())
    if not m:
        return (9999, value)
    return (int(m.group(1)), m.group(2))


# --------------------------------------------------------------------------
# Sections 1-2: endpoint shapes, field inventory
# --------------------------------------------------------------------------

def section_1_2():
    head("1. Endpoint shapes")
    print("catalog: %d rank objects" % len(CATALOG))
    by_program = defaultdict(list)
    for r in CATALOG:
        by_program[(r.get("programId"), r.get("program"))].append(r["id"])
    for (pid, pname), ids in sorted(by_program.items()):
        print("  programId=%s %-14s n=%d ids=%s" % (pid, pname, len(ids), ids))
    print("catalog rank object keys (%d): %s"
          % (len(CATALOG[0]), list(CATALOG[0].keys())))
    print("requirements response keys: %s" % list(REQ[1].keys()))
    print("rankInformation-only keys: %s"
          % sorted(set(INFO[1]) - set(CATALOG[0])))
    print("catalog-only keys: %s" % sorted(set(CATALOG[0]) - set(INFO[1])))
    print()
    print("%-16s %-10s %-24s %s" % ("rank", "version", "versionId on rows",
                                    "rows"))
    for i in RANK_IDS:
        vids = {row["versionId"] for row in ROWS[i]}
        print("%-16s %-10s %-24s %d"
              % (RANK_LABEL[i], INFO[i]["version"], sorted(vids), len(ROWS[i])))
    print("total rows: %d" % len(ALL_ROWS))

    head("2. Requirement row field inventory")
    keys = list(ROWS[1][0].keys())
    print("%d keys: %s" % (len(keys), keys))
    print("\npopulated (non-empty) per rank, populated/rows:")
    print("%-32s %s" % ("field", " ".join("%7s" % RANK_LABEL[i].split()[0]
                                          for i in RANK_IDS)))
    for k in keys:
        cells = []
        for i in RANK_IDS:
            n = sum(1 for row in ROWS[i]
                    if row[k] not in ("", {}, [], False, None))
            cells.append("%7s" % ("%d/%d" % (n, len(ROWS[i]))))
        print("%-32s %s" % (k, " ".join(cells)))
    print("\ndistinct values, whole corpus:")
    for k in ("childrenRequired", "required", "previousRankRequired",
              "parentRequirementId", "monthsSinceLastRankRequired",
              "eagleMBRequired", "totalMBRequired", "serviceHoursRequired",
              "disabledOnQuickEntry", "videoExternalURLId"):
        print("  %-30s %s" % (k, dict(Counter(row[k] for _, row in ALL_ROWS))))


# --------------------------------------------------------------------------
# Section 3: tree fields
# --------------------------------------------------------------------------

def section_3():
    head("3. Tree fields")
    for i in RANK_IDS:
        rows = ROWS[i]
        ids = {row["id"] for row in rows}
        top = [r for r in rows if r["parentRequirementId"] == ""]
        kids = [r for r in rows if r["parentRequirementId"] != ""]
        parents = {r["parentRequirementId"] for r in kids}
        dangling = parents - ids
        cr = [r["childrenRequired"] for r in rows if r["childrenRequired"]]
        print("%-16s rows=%-3d top=%-3d child=%-2d parents=%s cr=%s dangling=%s"
              % (RANK_LABEL[i], len(rows), len(top), len(kids),
                 sorted(parents), cr, sorted(dangling) or "none"))
    print("\nlistNumber literals, served order:")
    for i in RANK_IDS:
        lns = [r["listNumber"] for r in ROWS[i]]
        print("  %-16s unique=%s  %s"
              % (RANK_LABEL[i], len(set(lns)) == len(lns), lns))
    print("\nrequirementNumber != listNumber-minus-dot:")
    for i, row in ALL_ROWS:
        if row["requirementNumber"] != row["listNumber"].rstrip("."):
            print("  rank %d listNumber=%r requirementNumber=%r"
                  % (i, row["listNumber"], row["requirementNumber"]))
    print("\nsortOrder:")
    for i in RANK_IDS:
        so = [r["sortOrder"] for r in ROWS[i]]
        filled = [s for s in so if s]
        print("  %-16s populated=%d/%d unique=%s values=%s"
              % (RANK_LABEL[i], len(filled), len(so),
                 len(set(filled)) == len(filled), sorted(set(filled))))
    print("\nserved array order == listNumber order?")
    for i in RANK_IDS:
        lns = [r["listNumber"] for r in ROWS[i]]
        print("  %-16s %s" % (RANK_LABEL[i],
                              lns == sorted(lns, key=listnum_key)))
    print("\nstems with/without a bare parent row:")
    for i in RANK_IDS:
        stems = defaultdict(list)
        for r in ROWS[i]:
            stems[listnum_key(r["listNumber"])[0]].append(r["listNumber"])
        flat, nested = [], []
        for stem, lns in sorted(stems.items()):
            lettered = [x for x in lns if listnum_key(x)[1]]
            bare = [x for x in lns if not listnum_key(x)[1]]
            if lettered:
                (nested if bare else flat).append(stem)
        print("  %-16s stems=%-3d flat=%s nested=%s"
              % (RANK_LABEL[i], len(stems), flat, nested))
    print("\nparent rows and their children:")
    for i, row in ALL_ROWS:
        if row["childrenRequired"]:
            kids = [r["listNumber"] for r in ROWS[i]
                    if r["parentRequirementId"] == row["id"]]
            print("  rank %d id=%s listNumber=%r required=%r "
                  "childrenRequired=%r len(children)=%d %s\n    name=%r"
                  % (i, row["id"], row["listNumber"], row["required"],
                     row["childrenRequired"], len(kids), kids, row["name"]))


# --------------------------------------------------------------------------
# Section 4: embedded HTML, entities, escapes
# --------------------------------------------------------------------------

def strings():
    """(label, text) for every string scanned in section 4."""
    out = []
    for i in RANK_IDS:
        for k in ("header", "footer", "name", "short", "reallyShort",
                  "searchKeywords"):
            out.append(("r%d info.%s" % (i, k), INFO[i].get(k, "")))
        for row in ROWS[i]:
            for k in ("name", "short", "footer"):
                out.append(("r%d %s %s" % (i, row["listNumber"], k), row[k]))
        for v in BSA[i].get("versions", []):
            for k in ("header", "footer", "adminNotes"):
                out.append(("r%d v%s %s" % (i, v.get("id"), k), v.get(k) or ""))
    return out


def section_4():
    head("4. Embedded HTML, entities, escapes")
    corpus = strings()
    tags = Counter()
    where = defaultdict(set)
    for label, text in corpus:
        for t in re.findall(r"<[^<>]{0,80}>", text):
            tags[t] += 1
            where[t].add(label.split()[0])
    for tag, n in tags.most_common():
        print("  %-70s %4d  %s" % (tag, n, sorted(where[tag])))
    print("\ntag balance per string (open != close):")
    for label, text in corpus:
        for el in ("strong", "li", "p", "i", "q", "em", "ul", "ol", "sup",
                   "a", "b"):
            o = len(re.findall(r"<%s\b[^>]*>" % el, text))
            c = len(re.findall(r"</%s>" % el, text))
            if o != c:
                print("  %-24s <%s> open=%d close=%d" % (label, el, o, c))
    print("\n<sup> inner values: %s"
          % sorted({m for _, t in corpus
                    for m in re.findall(r"<sup>(.*?)</sup>", t)}))
    print("entities: %s"
          % dict(Counter(m for _, t in corpus
                         for m in re.findall(r"&[a-zA-Z#0-9]+;", t))))
    joined = "".join(t for _, t in corpus)
    print("escapes: CRLF=%d bareLF=%d bareCR=%d TAB=%d doublespace=%d"
          % (joined.count("\r\n"),
             len(re.findall(r"(?<!\r)\n", joined)),
             len(re.findall(r"\r(?!\n)", joined)),
             joined.count("\t"), joined.count("  ")))
    print("non-ASCII: %s"
          % dict(Counter(ch for ch in joined if ord(ch) > 127)))
    print("\nrows whose name contains '<' / short contains '<' or '&':")
    for i in RANK_IDS:
        a = sum(1 for r in ROWS[i] if "<" in r["name"])
        b = sum(1 for r in ROWS[i] if "<" in r["short"] or "&" in r["short"])
        print("  %-16s name=%d/%d short=%d"
              % (RANK_LABEL[i], a, len(ROWS[i]), b))
    print("info.header populated: %s"
          % [i for i in RANK_IDS if INFO[i].get("header")])
    print("info.footer populated: %s"
          % [i for i in RANK_IDS if INFO[i].get("footer")])


# --------------------------------------------------------------------------
# Section 5: the `short` field
# --------------------------------------------------------------------------

def section_5():
    head("5. `short`")
    all_lengths = []
    for i in RANK_IDS:
        vals = [r["short"] for r in ROWS[i]]
        raw = [len(v) for v in vals]
        trimmed = [len(v.strip()) for v in vals]
        all_lengths += trimmed
        empty = [r["listNumber"] for r in ROWS[i] if r["short"].strip() == ""]
        dupes = {v: n for v, n in Counter(v.strip() for v in vals).items()
                 if n > 1}
        ws = [r["listNumber"] for r in ROWS[i] if r["short"] != r["short"].strip()]
        print("%-16s n=%-3d empty=%-4s rawlen %d-%d trimlen %d-%d med=%.1f "
              "within-rank dupes=%s trailing-ws rows=%s"
              % (RANK_LABEL[i], len(vals), empty or "0",
                 min(raw), max(raw), min(trimmed), max(trimmed),
                 statistics.median(trimmed), dupes or "none", ws or "none"))
    print("\ncorpus trimmed length: min=%d max=%d mean=%.1f median=%.1f"
          % (min(all_lengths), max(all_lengths),
             statistics.mean(all_lengths), statistics.median(all_lengths)))
    print("length histogram (trimmed, bucket of 5):")
    hist = Counter((n // 5) * 5 for n in all_lengths)
    for b in sorted(hist):
        print("  %2d-%2d  %-3d %s" % (b, b + 4, hist[b], "#" * hist[b]))
    longest = sorted(((len(r["short"].strip()), i, r["listNumber"],
                       r["short"].strip()) for i, r in ALL_ROWS), reverse=True)
    print("\nlongest 8 (checking for a varchar cap cluster):")
    for n, i, ln, v in longest[:8]:
        print("  %3d  r%d %-5s %r" % (n, i, ln, v))
    print("rows tied at the maximum length (%d): %d"
          % (longest[0][0], sum(1 for n, *_ in longest if n == longest[0][0])))
    print("\ncross-rank duplicate `short` values (trimmed):")
    seen = defaultdict(list)
    for i, r in ALL_ROWS:
        seen[r["short"].strip()].append("r%d %s" % (i, r["listNumber"]))
    for v, locs in sorted(seen.items()):
        if len(locs) > 1:
            print("  %-34r %s" % (v, locs))
    print("\nsuspected truncation (no terminal punctuation is normal; "
          "flagging values ending mid-token or with a dangling connective):")
    for i, r in ALL_ROWS:
        v = r["short"].strip()
        if re.search(r"\b(a|an|the|of|and|or|to|in|for|with|from)$", v, re.I) \
                or v.endswith("-") or v.endswith("…") or v.endswith("..."):
            print("  r%d %-5s %r" % (i, r["listNumber"], v))
    print("\nparent (header) rows — is `short` distinguishable from children?")
    for i, r in ALL_ROWS:
        if r["childrenRequired"]:
            print("  r%d %-5s PARENT short=%r" % (i, r["listNumber"], r["short"]))
            for c in ROWS[i]:
                if c["parentRequirementId"] == r["id"]:
                    print("      child %-5s short=%r" % (c["listNumber"],
                                                         c["short"]))
    for i in (1, 5, 6, 7):
        print("\nfull `short` literals, rank %s (listNumber order):"
              % RANK_LABEL[i])
        for r in sorted(ROWS[i], key=lambda x: listnum_key(x["listNumber"])):
            print("  %-5s %r" % (r["listNumber"], r["short"]))


# --------------------------------------------------------------------------
# Section 6: numeric fields vs prose
# --------------------------------------------------------------------------

NUMERIC = ("monthsSinceLastRankRequired", "serviceHoursRequired",
           "eagleMBRequired", "totalMBRequired", "previousRankRequired")


def section_6():
    head("6. Numeric fields vs prose")
    for k in NUMERIC:
        print("%-30s %s" % (k, dict(Counter(r[k] for _, r in ALL_ROWS))))
    print("\nEvery row carrying a non-default value on any numeric field:")
    for i, r in ALL_ROWS:
        hits = {k: r[k] for k in NUMERIC
                if r[k] not in ("", "False") and r[k] is not False}
        if hits:
            print("\n  rank %s  id=%s  listNumber=%r  short=%r"
                  % (RANK_LABEL[i], r["id"], r["listNumber"], r["short"]))
            print("    %s" % hits)
            print("    name=%r" % r["name"])
    print("\nProse number words / digits found in those rows' `name`:")
    words = (r"\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|"
             r"twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|"
             r"nineteen|twenty|twenty-one|\d+)\b")
    for i, r in ALL_ROWS:
        if any(r[k] not in ("", "False") for k in NUMERIC):
            plain = re.sub(r"<[^>]+>", " ", r["name"])
            print("  r%d %-4s -> %s" % (i, r["listNumber"],
                                        re.findall(words, plain, re.I)))
    print("\nAll rows whose `name` mentions months/hours/merit badges but "
          "carries NO numeric field (the false-negative check):")
    for i, r in ALL_ROWS:
        if any(r[k] not in ("", "False") for k in NUMERIC):
            continue
        plain = re.sub(r"<[^>]+>", " ", r["name"])
        if re.search(r"\bmonths?\b|\bhours?\b|merit badge", plain, re.I):
            print("  r%d %-5s %r" % (i, r["listNumber"], plain[:150]))


# --------------------------------------------------------------------------
# Section 7: the versions array
# --------------------------------------------------------------------------

def section_7():
    head("7. versions[]")
    print("version object keys: %s" % list(BSA[1]["versions"][0].keys()))
    for i in RANK_IDS:
        vs = BSA[i]["versions"]
        print("\n%s — %d versions; rankInformation.version=%r versionId on "
              "rows=%s" % (RANK_LABEL[i], len(vs), INFO[i]["version"],
                           sorted({r["versionId"] for r in ROWS[i]})))
        for v in vs:
            print("    versionId=%-5s version=%-8s active=%-6s eff=%-14r "
                  "exp=%-14r expired=%-14r header=%-5s footer=%-5s notes=%s"
                  % (v.get("versionId"), v.get("version"), v.get("active"),
                     v.get("versionEffectiveDt"), v.get("versionExpiryDt"),
                     v.get("expiredDate"),
                     bool(v.get("header")), bool(v.get("footer")),
                     bool(v.get("adminNotes"))))
    print("\nrankInformation version fields:")
    for i in RANK_IDS:
        print("  %-16s version=%-8s active=%-6s eff=%-24r exp=%-24r expired=%r"
              % (RANK_LABEL[i], INFO[i].get("version"), INFO[i].get("active"),
                 INFO[i].get("versionEffectiveDt"),
                 INFO[i].get("versionExpiryDt"), INFO[i].get("expiredDate")))


# --------------------------------------------------------------------------
# Section 8: rank-level fields
# --------------------------------------------------------------------------

def slug(value):
    s = value.strip().lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


def section_8():
    head("8. Rank-level fields")
    print("%-4s %-16s %-16s %-16s %-6s %-8s %s"
          % ("id", "name", "short", "reallyShort", "level", "programId", "lds"))
    for r in sorted(CATALOG, key=lambda x: x["id"]):
        print("%-4s %-16s %-16s %-16s %-6s %-8s %s"
              % (r["id"], r["name"], r["short"], r["reallyShort"],
                 r.get("level"), r.get("programId"), r.get("lds")))
    print("\nlevel within programId==2: %s"
          % {i: BSA[i]["level"] for i in RANK_IDS})
    print("level bijective with ids 1-7: %s"
          % (sorted(BSA[i]["level"] for i in RANK_IDS) == list(range(1, 8))))
    print("level == id for all 7: %s"
          % all(BSA[i]["level"] == i for i in RANK_IDS))
    print("level restarts per program: %s"
          % {p: sorted(r["level"] for r in CATALOG if r["programId"] == p)
             for p in sorted({r["programId"] for r in CATALOG})})
    print("\nslug candidates:")
    print("%-4s %-22s %-22s %s" % ("id", "slug(name)", "slug(short)",
                                   "slug(reallyShort)"))
    for i in RANK_IDS:
        r = BSA[i]
        print("%-4s %-22s %-22s %s" % (i, slug(r["name"]), slug(r["short"]),
                                       slug(r["reallyShort"])))
    for field in ("name", "short", "reallyShort"):
        slugs = [slug(BSA[i][field]) for i in RANK_IDS]
        print("  %-12s unique=%s empty=%d collisions=%s"
              % (field, len(set(slugs)) == 7, sum(1 for s in slugs if not s),
                 [s for s, n in Counter(slugs).items() if n > 1] or "none"))
    print("\nother catalog fields, Scouts BSA:")
    for i in RANK_IDS:
        r = BSA[i]
        print("  %-16s image=%r sku=%r price=%r scoutNet=%r keywords=%r"
              % (RANK_LABEL[i], r.get("image"), r.get("sku"), r.get("price"),
                 r.get("scoutNet"), r.get("searchKeywords")))
    print("\nimageUrl* from rankInformation:")
    for i in RANK_IDS:
        print("  %-16s 100=%s" % (RANK_LABEL[i], INFO[i].get("imageUrl100")))
        print("  %-16s 200=%s" % ("", INFO[i].get("imageUrl200")))
        print("  %-16s 400=%s" % ("", INFO[i].get("imageUrl400")))


def main():
    section_1_2()
    section_3()
    section_4()
    section_5()
    section_6()
    section_7()
    section_8()


if __name__ == "__main__":
    main()
