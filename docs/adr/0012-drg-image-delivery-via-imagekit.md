# ADR 0012 — DRG guide images are generated via Gemini and delivered via ImageKit

- **Status:** Accepted
- **Date:** 2026-08-23
- **Applies to:** `hugo/layouts/shortcodes/drg/image.html`, `scripts/generate-drg-images.ts`,
  `scripts/migrate-images-to-imagekit.ts`, `scripts/verify-imagekit.ts`, every
  `guide/images.json`
- **Related:** `.claude/skills/drg-images/SKILL.md`, mbu's own
  `docs/adr/0001-imagekit-image-delivery.md` (this decision mirrors it)

## Context

Issue #80 identified that several rank requirements (Scout 1c's hand
gestures, 1d's badge-parts diagram) need visual aids that prose alone can't
cover well, and that this gap recurs at every rank. mbu (the sibling merit
badge site sharing this repo's `uni-theme`) already solved the same problem:
a Gemini-generated image pipeline feeding a shared ImageKit CDN account, with
a `drg-images` skill governing when an image earns its place.

Unlike mbu, scouting-u has no existing image infrastructure at all — no
`drg/image` shortcode, no local image resources, no CDN account of its own.
scouting-u is also much smaller in scope: 7 ranks rather than ~150 merit
badges, so the volume that justified mbu's CDN move is not present here on
its own. The deciding factor was reuse: mbu's ImageKit account, generation
prompts, and Hugo partials (`imagekit/img.html`, `imagekit/url.html`) already
exist and are vendored into this repo via `uni-theme` — building a
local-file-only pipeline would mean maintaining a second, divergent approach
for no real benefit.

## Decision

**Mirror mbu's pipeline, scoped down to DRG-only.** scouting-u has no
emblems, card images, or site hero/OG images to migrate — every image is a
rank guide illustration.

**Account:** the same shared ImageKit account mbu and doula.coop use
(`https://ik.imagekit.io/doulacoop`), plain default endpoint. Every
scouting-u object path is prefixed **`/su-assets/`** (mirroring mbu's
`/mbu-assets/` and doula.coop's own namespacing) so paths can never collide
across the three consumers of this account:

```
/su-assets/scouts-bsa/ranks/{slug}/guide/{id}
```

Uploads use `useUniqueFileName: false, overwriteFile: true` so re-runs
overwrite in place and paths never drift.

**Generation pipeline:** `scripts/generate-drg-images.ts` calls Gemini
(`gemini-3.1-flash-image-preview`) to produce PNGs staged locally at
`guide/images/{id}.png`, driven by an `images.json` manifest (`id`, `file`,
optional `style`/`verb_family`, `description`, `value`). The style-guide
prompts, uniform/trademark/branding/safety rules, and recurring-cast
description are a straight port of mbu's — the underlying rules (no BSA
trademark text rendered, clean uniforms, safety-correct technique) apply
identically to a rank guide as to a merit badge guide. Only the branding
denylist changed, to this site's own names (`Scouting University`,
`Scouting U`, `Digital Requirements Guide`) in place of mbu's.

**Upload:** `scripts/migrate-images-to-imagekit.ts` uploads whichever PNG
master it finds for every rank's `images.json` entries, writes back
`width`/`height`/`v` (an 8-hex-char content hash, versioning the URL instead
of triggering a CDN purge — same rationale as mbu's ADR), and deletes the
local PNG after a successful upload. `scripts/verify-imagekit.ts` HEAD-checks
every resulting URL before anything gets deleted from git.

**Width ladder:** `[400, 600, 800, 1200, 1600]`, same breakpoints as mbu's
— proven values, and consistent within scouting-u itself (any two images
requested at the same CSS width share a cache entry). The `/su-assets/`
prefix means scouting-u's URLs never overlap mbu's, so this is convention
reuse, not cross-site cache sharing. Quality (80) and format optimization
are account-level dashboard settings already configured for mbu; nothing
scouting-u-specific to set there.

**The seam:** `hugo/layouts/shortcodes/drg/image.html` is a local override
of `uni-theme`'s `shortcodes/drg/` directory (which has no `image.html` —
mbu's own copy is local for the same reason). It resolves `src` against the
guide's `images.json` manifest and calls the vendored `imagekit/img.html` /
`imagekit/url.html` partials, already available here through the `uni-theme`
module import — no theme change was needed.

**`.claude/skills/drg/SHORTCODES.md`** previously stated flatly that no
image pipeline exists in this repo. That line is now false and has been
removed; `SHORTCODES.md` documents `drg/image` and points to the
`drg-images` skill for the placeholder syntax and generation workflow.

## Consequences

- New dependencies: `@google/genai` (Gemini), `@imagekit/nodejs`, `sharp` —
  all already proven in mbu's pipeline.
- `IMAGEKIT_PRIVATE_KEY` must be set (wherever secrets are kept for this
  account — it is not committed to `.env` in mbu either) before
  `migrate:imagekit` can run; `GEMINI_API_KEY` is already present in this
  repo's `.env`.
- Local dev (`bun run hugo:dev`) hits the production ImageKit CDN
  unconditionally for every image — no offline image fallback, same
  trade-off mbu accepted.
- Deleting a DRG image is a two-step action (remove the manifest entry and
  shortcode, and delete the file on ImageKit via the API or dashboard), not
  a single `git rm`.
- No CSP change: `firebase.json` in this repo sets no `headers` block today,
  so there is nothing to narrow the way mbu narrowed its `img-src`. Revisit
  if a CSP is added later.
- No `/su-assets/` folder-scoping is relied on for isolation — namespacing
  comes entirely from the path prefix, same as mbu's and doula.coop's own
  folders on the same account.
