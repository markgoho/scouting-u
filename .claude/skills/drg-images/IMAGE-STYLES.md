# Image Styles & Manifest Reference

Reference for `SKILL.md` Step 1 (building `images.json`). Consult when
choosing a `style`, writing a `description`, or checking whether an image
idea passes the Value Test.

## High-value vs. low-value images

| Type | Example | Why it works |
|---|---|---|
| Labeled diagram | First Class badge with trefoil/eagle/scroll/knot/stars labeled | Reader learns part names by studying the image |
| Correct vs incorrect | Proper vs. loose square-knot dressing, side-by-side | Reader immediately sees what to do and what to avoid |
| Step-by-step sequence | 4 panels showing how to tie a bowline | Reader can follow the procedure |
| Spatial diagram | Campsite layout with tent/fire/latrine distances | Spatial relationships impossible to convey in text |
| Annotated technique | Compass bearing with arrow showing sighting line | Reader learns the physical motion |

| Type | Example | Why it fails |
|---|---|---|
| Generic activity photo | "Scout hiking on a trail" | Shows a result, teaches nothing about how to do it |
| Mood/scene-setting | "Beautiful campsite at sunset" | Decorative, adds no educational content |
| Redundant to text | Photo of a packed backpack after every item is already listed | Reader already has the information |
| Decorated text | Colored bars restating a list already in prose | Visual formatting of content already on the page |

## Style selection

Six styles, chosen by what the content needs to do — not every image is a
photo.

| Content type | Style | When to use |
|---|---|---|
| A Scout demonstrating a technique, real gear in use | `photo` | Photorealism adds value — action shots, real equipment detail |
| Badge parts, knot anatomy, equipment breakdown | `diagram` | Clean labels, precise detail, no distracting scenery |
| Safety technique with labeled checkpoints | `annotated-photo` | Realistic base + overlaid callouts at key positions |
| Correct vs incorrect, before/after | `comparison` | Split-frame makes the contrast unmistakable |
| Data, rules, steps | `infographic` | Icons + text hierarchy — but see the caution below |
| Field-guide subject (knot, plant, signal) | `illustrated` | Precise linework, labeled features |

**Quick rule:** labeling parts or showing data → `diagram`/`illustrated`.
Showing people doing things → `photo`/`annotated-photo`. Contrasting two
things → `comparison`.

Verb-family defaults (from a placeholder's `verb:` hint or a requirement's
own wording): `show` → step-wise photo/annotated-photo; `describe` →
labeled diagram/cross-section; `identify` → identification grid/comparison;
`create` → spatial diagram/before-after. Defaults, not rigid rules — cut an
image even with a `verb:` hint if it fails the Value Test.

## Generator quirks — write descriptions around these

- **Infographics render illegible text.** AI image generation cannot
  reliably render readable sentences at web resolution. Prefer
  `illustrated`/`diagram` instead; reserve `infographic` for a few large
  numbers with icons, and say so explicitly in the description.
- **Arrows can't reliably target specific features in a complex scene.** If
  a diagram needs multiple arrows each pointing at a distinct spatial
  element, they will frequently land wrong. Prefer `photo` of the real
  subject, or `diagram` only when structure is simple enough that labels
  are unambiguous (one object, parts radiating outward).
- **Text on angled or curved paths renders malformed.** Never ask for
  labels along a triangle's edges or text curved around a circle —
  redesign as horizontal labels in a row or grid instead.
- **Keep diagrams visual-first.** If more than ~30% of the image area
  would be text, that content belongs in page HTML (a table, a styled
  list), not in the image. Labels should be short words or brief phrases.

## Description-writing rules

The exact wording enforced on every generation request lives in
`scripts/generate-drg-images.ts` (`UNIFORM_SECTION`, `SAFETY_SECTION`,
`NO_BRANDING_SECTION`, `RECURRING_CAST`) — that script is the source of
truth if this summary and the script ever disagree. In short, when writing
a `description`:

- Default Scouts to a clean uniform unless the activity would genuinely
  damage one (wading, painting, heavy exertion) — then describe
  activity-appropriate clothing instead. Never describe a uniform as
  dirty, torn, or worn.
- Never write "Scouting America," "Boy Scouts of America," "BSA,"
  "Scouting University," "Scouting U," or "Digital Requirements Guide" —
  the generator can pick these up from a description and render them as
  visible text, which is a trademark and branding violation. Using "BSA
  uniform" for scene context in your own description prompt is fine; the
  restriction is about what ends up *rendered as text in the image*.
- Demographic terms (age, race, gender) may appear in a description to set
  a scene, but must never appear as rendered text/labels in the image
  itself.
- If the pipeline's recurring cast (named characters, used for visual
  consistency across a rank's images) appears in a scene, their names and
  descriptors are prompt-only — never rendered as visible text.

## `images.json` manifest

```json
{
  "rank": "star",
  "style_context": "Outdoor skills, leadership, and service for Star rank Scouts",
  "images": [
    {
      "id": "compass-bearing-sighting",
      "file": "req5.md",
      "style": "annotated-photo",
      "verb_family": "show",
      "description": "A Scout in a clean field uniform sighting a bearing through a baseplate compass, with a callout arrow labeling the sighting line and another labeling the direction-of-travel arrow",
      "value": "Shows the exact hand position and sighting alignment that text alone cannot convey"
    }
  ]
}
```

| Field | Required | Description |
|---|---|---|
| `id` | Yes | Unique kebab-case identifier, becomes the filename |
| `file` | Yes | Which `.md` file this image appears in |
| `style` | No | One of the six styles above (omit for default `photo`) |
| `verb_family` | No | `show`, `describe`, `identify`, or `create` |
| `description` | Yes | Detailed scene description for the image generator |
| `value` | Yes | What this image teaches that text alone cannot |

`style_context` is prepended to every generation prompt for the rank. Keep
it purely about the visual subject matter — never include organizational
names, age ranges, or "guide"/"study" framing; the generation script
already handles educational framing on top of it.

`width`, `height`, and `v` are written automatically by
`migrate-images-to-imagekit.ts` — never set them by hand.
