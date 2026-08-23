# Voice, Audience, and Writing Craft

## Who is the reader?

- **Primary**: Scouts BSA members, ages 11-17, working toward this rank.
- **Secondary**: Scoutmasters and other unit leaders using the guide as a
  teaching companion — ranks are signed off by a Scoutmaster conference
  and board of review, not a merit-badge-style counselor.
- **Tertiary**: Parents/guardians helping a Scout prepare.

## Voice rules

| Attribute | Guideline |
|---|---|
| Reading level | 6th-8th grade. Short sentences. Define technical terms on first use. |
| Tone | Encouraging, conversational, informative — an experienced Scoutmaster explaining something worth knowing. |
| Person | Address the reader as "you." |
| Voice | Active over passive. "Pack your first-aid kit," not "A first-aid kit should be packed." |
| Enthusiasm | Genuine, not cloying. One exclamation point per section, max. |
| Inclusivity | Gender-neutral language. Assume diverse backgrounds. |
| Safety | Shift to direct, serious-but-not-scary tone for safety content. Authoritative, not casual. |

## What the guide is NOT

- **Not a workbook.** It teaches what's needed to fulfill the requirement —
  no fill-in-the-blank answers, no doing the Scout's thinking for them.
- **Not a replacement for the Scoutmaster conference.** It prepares the
  Scout for that conversation, it doesn't substitute for it.
- **Not a rulebook recitation.** Don't just restate the requirement text in
  slightly different words — teach the substance behind it.

## Opening hooks

The first paragraph after the `drg/requirement` shortcode must be specific
to the actual requirement, not a generic warm-up. Self-test: could this
paragraph work for three unrelated requirements by swapping one noun? If
yes, rewrite it.

**Weak:** "This is an important skill every Scout should learn. Let's dive
in and see what you need to know!"

**Strong:** "A blister the size of a quarter can end a hike at mile three.
Knowing how to prevent — and treat — foot injuries is the difference
between finishing the trail and calling for a ride home."

The strong version couldn't be confused with any other requirement. It
drops the reader into the subject immediately.

## Did You Know — the surprise test

A fact only earns a `drg/did-you-know` callout if it's genuinely
surprising, counterintuitive, or memorable — not merely topical.

- **First aid:** "Good Samaritan laws in most states protect you from
  liability when you help someone in an emergency — but only if you don't
  exceed your training."
- **Camping/outdoor ethics:** "A single dropped orange peel can take up to
  two years to decompose in the backcountry — 'natural' doesn't mean
  fast."

If your fact wouldn't survive a "so what?" from a skeptical 13-year-old,
it belongs in body text, not a callout.

## Shortcode variety

Aim for 4-6 different shortcode types across a page. If `safety-first`
appears mechanically at the bottom of every section regardless of whether
there's a genuine safety concern, something's wrong. If every page follows
the identical pattern (requirement → two paragraphs → tip → checklist →
safety-first → next-page), the guide reads like a template rather than a
teaching tool — vary order and density based on what the content actually
needs.

## Cross-references

When a requirement builds on an earlier one — within the same rank or from
an earlier rank on the ladder (see SKILL.md) — link back with natural
language: "You tied this knot for Tenderfoot 3a; here you'll use it under
load." Don't force a cross-reference where the connection is tenuous.

## Extended Learning depth

Each deep-dive section in `extended-learning.md` should teach something
genuinely new — a skill, concept, or perspective the requirement pages
didn't cover. "Here are more things you can do" is not a deep dive. "Here
is how search-and-rescue teams navigate without GPS when batteries die" is.

## Content rules

**Do:**
- Teach the knowledge, not the answer.
- Include safety content wherever warranted.
- Link to authoritative external sources where useful.
- When referencing another rank, link to this site's own
  `/scouts-bsa/ranks/{slug}/` pages — never to scouting.org for
  requirement text.
- Provide practical tools: checklists, worksheets, frameworks.
- Mix 2-3 content element types per page, at minimum.

**Don't:**
- Give away the answer (if a requirement says "identify five knots," don't
  list exactly five).
- Alter requirement text.
- Use jargon without defining it.
- Link to commercial products or unreliable sources.
- Be preachy or lecture.
- Overload a page beyond roughly 1500 words of educational content.
