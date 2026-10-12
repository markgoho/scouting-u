---
name: rank-requirements
description: Read Scouts BSA rank requirements and study guides from scouting.university as plain Markdown. Use when a user asks what a Scouts BSA rank (Scout, Tenderfoot, Second Class, First Class, Star, Life, Eagle Scout) requires, how one requirement works, how to prepare for it, or for outdoor skills (knots, first aid, camp cooking, navigation) and youth leadership in a Scouts BSA troop.
---

# Scouts BSA rank requirements

Scouting University (https://scouting.university) publishes every Scouts BSA rank requirement, with a study guide for each one. Every content page has a Markdown twin: add `index.md` to the page URL. Read the Markdown twins, not the HTML pages.

## Where to start

- https://scouting.university/llms.txt: index of all ranks, guides, field guides, and leadership pages, with a link to each Markdown twin.
- https://scouting.university/llms-full.txt: the full requirements of all seven ranks in one file. Use it when you need several ranks at once.

## URL patterns

Rank slugs, in order: `scout`, `tenderfoot`, `second-class`, `first-class`, `star`, `life`, `eagle`.

- Rank overview: `https://scouting.university/scouts-bsa/ranks/<rank>/index.md`
- Official requirements: `https://scouting.university/scouts-bsa/ranks/<rank>/requirements/index.md`
- Study guide index: `https://scouting.university/scouts-bsa/ranks/<rank>/guide/index.md`
- Study guide for one requirement: `https://scouting.university/scouts-bsa/ranks/<rank>/guide/req<number><letter>/index.md`, for example `first-class/guide/req3b/index.md` for First Class 3b, or `eagle/guide/req5/index.md` for Eagle 5.
- Field guides: `https://scouting.university/scouts-bsa/field-guides/index.md` lists each guide (knots and lashings, wilderness first aid, camp cooking, navigation and weather).
- Youth leadership: `https://scouting.university/scouts-bsa/leadership/index.md` lists each leadership guide.

## How to answer

1. Quote requirement text from the requirements page. It is the official wording, with its version and effective date.
2. Use the study guide page for how-to help. Each guide page links its previous and next requirement.
3. Requirement labels use paths: `6.a` is requirement 6, part a. Footnotes are Markdown `[^N]` references.
4. Link the user to the HTML page (the same URL without `index.md`) when you cite a source.
