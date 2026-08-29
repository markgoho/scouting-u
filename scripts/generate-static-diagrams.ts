import { GoogleGenAI } from "@google/genai";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { loadEnvFromRepoRoot } from "./lib/load-env-from-repo-root.ts";

await loadEnvFromRepoRoot();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY not found in environment.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const IMAGE_MODEL = "gemini-3.1-flash-image-preview";
const OUTPUT_DIR = path.resolve(import.meta.dir, "../hugo/static/img/diagrams");

await fs.mkdir(OUTPUT_DIR, { recursive: true });

interface DiagramPrompt {
  filename: string;
  title: string;
  description: string;
}

const DIAGRAMS: DiagramPrompt[] = [
  {
    filename: "bear-triangle.png",
    title: "The Backcountry Bear Triangle (200-Foot Separation)",
    description: `A clean, modern educational campsite diagram illustrating the "Backcountry Bear Triangle" for Leave No Trace outdoor safety.
Style: Clean vector-style educational diagram on a clean light background with crisp lines and clear legible labels.
Layout: An equilateral triangle showing three distinct zones separated by 200 feet:
1. Top Apex: "SLEEPING ZONE" (Illustration of 2-3 tents pitched neatly in trees, with a label: "Tents & Sleeping Gear - ZERO food or smellables").
2. Bottom-Left Apex: "CAMP KITCHEN & COOKING" (Illustration of camp stove, prep table, and 3-pot wash station, with a label: "Kitchen Area - All cooking and eating").
3. Bottom-Right Apex: "FOOD STORAGE & SUMP" (Illustration of a bear canister and counterbalance PCT bear bag hanging 12ft high in a tree, plus a gray water sump, with a label: "Food Storage & Sump - Bear cans & wash water").
Include clear dashed measurement lines connecting each apex with the label "200 Feet (70 Paces) Separation".
Colors: Professional slate gray, forest green, navy blue, and warm tan accents. Highly legible typography. NO project logos or branding.`
  },
  {
    filename: "three-pot-sanitation.png",
    title: "The BSA 3-Pot Dishwashing Sanitation System",
    description: `A clean, modern educational flow diagram showing the 3-pot dishwashing method used on Scout campouts.
Style: Clear, vector-like instructional graphic on a light background.
Flow sequence from left to right:
1. Step 0: "PRE-SCRAPE" (Scout using a rubber spatula to scrape food scraps into a trash bag).
2. Step 1: "POT 1: HOT WASH" (Pot of steaming water with soap bubbles, sponge, temperature labeled "110°F - 120°F (Biodegradable Soap)").
3. Step 2: "POT 2: HOT RINSE" (Pot of clean clear hot water, temperature labeled "120°F - 140°F (Clear Water)").
3. Step 3: "POT 3: SANITIZING RINSE" (Pot of warm water with sanitizer or water >180°F, dipping tongs, labeled "Sanitizing Tab or 180°F (30-60 sec soak)").
4. Step 4: "AIR DRY" (Ventilated mesh dunk bag hanging on a line in the breeze and sun, labeled "Air Dry in Mesh Bag - Never towel dry").
Clean directional arrows connecting each step with bold, crisp, highly legible text.`
  },
  {
    filename: "dutch-oven-heat-distribution.png",
    title: "Cast Iron Dutch Oven Anatomy and Charcoal Heat Distribution",
    description: `A clean cutaway educational technical diagram of a traditional 12-inch cast iron Dutch oven with lid and legs.
Style: Modern technical illustration on a clean light background.
Key features labeled with leader lines:
- "Flanged Rim Lid" (raised lip holding charcoal briquettes on top).
- "Top Charcoal Coils / Briquettes" (glowing black/gray briquettes on top lid).
- "Cast Iron Baking Cavity" (showing a golden baked cobbler/bread inside).
- "Wire Bail Handle" (heavy duty metal loop handle).
- "Three Integral Feet / Legs" (supporting the oven above coals).
- "Bottom Charcoal Briquettes" (arranged underneath in a circle).
Side callout panel illustrating the heat ratios:
- "Baking: 2/3 Top, 1/3 Bottom (e.g. 15 top / 9 bottom)"
- "Roasting: 1/2 Top, 1/2 Bottom (12 top / 12 bottom)"
- "Stewing: 1/3 Top, 2/3 Bottom (9 top / 15 bottom)"
Clean, elegant typography and professional colors.`
  },
  {
    filename: "rope-anatomy.png",
    title: "Parts of a Rope for Knot Tying",
    description: `A clean educational diagram illustrating the anatomical parts of a rope used in knot tying and pioneering.
Style: Clear textbook graphic with a thick, realistic braided rope against a clean off-white background.
Clearly labeled sections with pointer arrows:
1. "Working End (Bitter End)": The active end of the rope used to tie the knot, with a whipped end.
2. "Standing Part": The long main section of the rope between the working end and the anchor.
3. "Standing End": The fixed or anchored end of the rope.
4. "Bight": A U-shaped curve in the rope where the rope bends back on itself without crossing.
5. "Loop": A circle made where the working end crosses over or under the standing part.
6. "Elbow": Two loops in close proximity.
Professional, crisp lines, easy-to-read labels.`
  },
  {
    filename: "core-scout-knots.png",
    title: "Core Foundational Scouting Knots",
    description: `A clean, 6-panel educational knot identification chart showing the foundational knots of Scouts BSA.
Style: Vector-like textbook diagram on a light gray/white background.
6 distinct rectangular panels arranged in a 2x3 grid, each showing a cleanly tied knot with labels:
1. "Square Knot (Reef Knot)" - Joining two ropes of equal thickness, showing two interlocked bights.
2. "Two Half-Hitches" - Securing a rope to a post or tree ring with a round turn and two hitches.
3. "Taut-Line Hitch" - Adjustable friction hitch on a tent guyline with two inside wraps and one outside half-hitch.
4. "Bowline" - Fixed non-slip loop, showing the classic loop around the standing line.
5. "Clove Hitch" - Starting/ending lashings on a spar with two crossing loops.
6. "Sheet Bend" - Joining two ropes of unequal diameter or thickness.
Each knot is rendered with distinct colored rope strands (e.g., golden hemp and blue synthetic) for maximum clarity and contrast.`
  },
  {
    filename: "pioneering-lashings.png",
    title: "Structural Pioneering Lashings",
    description: `A 4-panel educational engineering diagram showing the primary structural pioneering lashings used to build camp towers and bridges.
Style: Clean technical diagram on a light background.
4 panels:
1. "Square Lashing": Two spars crossing at 90° right angles, showing the Clove Hitch start, 3 tight wraps around spars, 2 frapping turns between spars, and Clove Hitch finish.
2. "Diagonal Lashing": Two spars crossing diagonally (X-brace), showing Timber Hitch start pulling spars together, wraps across each diagonal, frapping turns, and Clove Hitch finish.
3. "Shear Lashing (A-Frame)": Two parallel or slightly angled spars joined at top to form an A-frame leg, with loose wraps and tight frapping turns.
4. "Tripod Lashing": Three spars laid parallel, wrapped over and under in a figure-eight weave, frapped between spars, and spread open into a standing tripod.
Clean leader lines, arrows indicating wrap and frap directions, and bold technical labels.`
  },
  {
    filename: "orienteering-compass-anatomy.png",
    title: "Anatomy of an Orienteering Baseplate Compass",
    description: `A detailed, high-resolution labeled technical diagram of an orienteering baseplate compass (Silva or Brunton style).
Style: Clean vector-style product diagram on a light background.
Clearly labeled parts with clean pointer lines:
- "Clear Acrylic Baseplate" with straight edges.
- "Direction-of-Travel Arrow" (bold arrow at top of baseplate pointing forward).
- "Magnifying Lens" for map reading.
- "Inch & Millimeter Scales / Map Rulers (1:24,000)".
- "Rotating Bezel / Dial" showing 360° compass degree markings and cardinal points (N, E, S, W).
- "Liquid-Filled Capsule" dampening needle vibration.
- "Magnetic Needle" (Red end pointing to Magnetic North, Black/White end pointing South).
- "Orienting Arrow ('The Shed')" engraved inside the capsule.
- "Orienting Lines" parallel lines inside capsule aligned with map grid lines.
- "Index Line" tick mark below bezel where bearing is read.
Clear, high-contrast, professional typography.`
  },
  {
    filename: "magnetic-declination.png",
    title: "Magnetic Declination: True North vs Magnetic North",
    description: `A clean educational cartography diagram explaining Magnetic Declination for land navigation.
Style: Modern navigation textbook graphic.
Diagram components:
- Top center showing a compass rose and map meridian: "True North (TN / ★)" pointing straight up along map grid lines.
- Left side showing "Magnetic North (MN)" tilted to the west: "West Declination (Add to map bearing: 'West is Best')".
- Right side showing "Magnetic North (MN)" tilted to the east: "East Declination (Subtract from map bearing: 'East is Least')".
- Center showing the angular difference labeled "Declination Angle (Degrees)".
- A memory aid callout box: "Map to Field Bearing: West Declination ADD (+) | East Declination SUBTRACT (-)".
Crisp, educational, high contrast, clean vector style.`
  },
  {
    filename: "topo-contour-profiles.png",
    title: "Topographic Map Contour Lines and 3D Terrain Profiles",
    description: `A side-by-side educational comparison diagram showing Topographic Map Contour Lines paired with their corresponding 3D Terrain Profiles.
Style: Clean textbook illustration with topographic map lines in sepia/brown and terrain in green/tan.
5 distinct rows:
1. "Peak / Hilltop": Concentric closed circular contour lines paired with a rounded 3D mountain summit.
2. "Ridge": Closely spaced U-shaped contour lines pointing downhill paired with a long 3D mountain spine.
3. "Valley / Stream": V-shaped contour lines pointing uphill toward high elevation paired with a 3D creek ravine.
4. "Saddle / Pass": Hourglass-shaped contour lines between two peaks paired with a 3D low col/dip.
5. "Cliff / Escarpment": Extremely tight, touching contour lines paired with a steep 3D vertical rock wall.
Bold, clear labels and crisp lines.`
  },
  {
    filename: "cloud-types-weather.png",
    title: "Cloud Classification and Weather Forecasting Chart",
    description: `A comprehensive educational altitude chart illustrating cloud types and their weather forecasting indicators.
Style: Beautiful atmospheric diagram showing altitude gradient from ground (0 ft) to 40,000 ft against a blue-to-deep-sky background.
Three altitude tiers:
1. "HIGH CLOUDS (20,000+ ft - Ice Crystals)":
   - "Cirrus" (wispy horse tails - fair weather changing in 24-48 hrs).
   - "Cirrostratus" (thin veil creating sun/moon halo - approaching warm front and rain).
2. "MIDDLE CLOUDS (6,500 - 20,000 ft - Water & Ice)":
   - "Altocumulus" (fluffy sheep back / mackerel sky - afternoon thunderstorm indicator).
   - "Altostratus" (gray blanket dimming sun - continuous rain approaching).
3. "LOW CLOUDS (0 - 6,500 ft - Liquid Water)":
   - "Cumulus" (puffy cotton balls with flat bases - fair weather).
   - "Stratus" (low gray fog ceiling - light drizzle).
4. "VERTICAL CLOUDS (Surface to 40,000+ ft)":
   - "Cumulonimbus" (massive towering anvil thunderhead - severe storms, lightning, squalls).
Clean altitude scale on the left axis, clear descriptive labels on each cloud type.`
  },
  {
    filename: "march-paws-flowchart.png",
    title: "Backcountry Wilderness First Aid Primary Assessment (MARCH PAWS)",
    description: `A clean medical assessment flowchart for Wilderness First Aid primary and secondary surveys.
Style: Modern emergency medical infographic on a crisp light background.
Left Column (Immediate Life Threats - Primary Survey):
- "M: Massive Bleeding" -> Apply direct pressure & Combat Tourniquet.
- "A: Airway" -> Open airway, check for obstruction, recovery position.
- "R: Respiration" -> Check breathing rate, seal chest wounds.
- "C: Circulation" -> Check radial/carotid pulses, skin color & temp, manage shock.
- "H: Hypothermia & Head/Spine" -> Protect spine, insulate ground, hypothermia wrap.
Right Column (Extended Backcountry Survey - Secondary PAWS):
- "P: Pain Management" -> Cold pack, splinting, comfort.
- "A: Antibiotics & Wound Care" -> Copious irrigation (1 liter), sterile dressing.
- "W: Wounds & Burns" -> Clean, dress, prevent infection.
- "S: Splints & Evacuation" -> Rigid SAM splinting, CSM checks, triage transport decision.
Clean arrows, professional medical blues and reds, crisp typography.`
  },
  {
    filename: "hypothermia-burrito-wrap.png",
    title: "Hypothermia Hypo-Wrap ('Burrito Wrap') System",
    description: `A step-by-step cross-sectional medical diagram of the 6-layer backcountry Hypothermia Warming Wrap ("Burrito Wrap").
Style: Clean technical medical illustration on a light background.
Layers shown wrapping an injured Scout:
1. Outer Shell: "Heavy Duty Waterproof Ground Tarp / Plastic Sheeting".
2. Insulation Base: "Closed-Cell Foam Sleeping Pads (2 pads between patient and cold ground)".
3. Outer Warmth: "Thick Winter Mummy Sleeping Bag (Down or Synthetic)".
4. Radiant Heat Barrier: "Reflective Mylar Space Blanket (reflects 90% body heat)".
5. Active Heat Sources: "Warm Water Bottles wrapped in socks placed at Armpits (Axillae), Groin, and Torso".
6. Inner Layer: "Dry Base Layer Clothing & Wool Beanie Hat covering head".
Numbered callouts and clean leader lines indicating each protective layer.`
  },
  {
    filename: "campsite-zoning-masterplan.png",
    title: "Patrol Campsite Layout and Safety Zoning Masterplan",
    description: `An aerial blueprint-style educational campsite layout map showing proper zoning for a Scouts BSA troop campout.
Style: Clean overhead architectural / tactical campsite map on a light graph-paper background.
Key zones clearly mapped with boundaries and distance markers:
- "Tent City / Patrol Camps": Patrol sleeping areas with 4-5 tents each, separated by 30 feet.
- "Central Campfire / Gathering Ring": In the middle with a cleared 10-foot mineral soil fire ring.
- "Ax Yard": Roped off enclosure with 10-foot safety radius around chopping block and tool rack.
- "Patrol Kitchen & Dining Fly": 200 feet downwind from tents, with prep tables and 3-pot wash station.
- "Bear Bag Hang / Food Storage": 200 feet away from both kitchen and sleeping areas.
- "Latrine / Sump Station": 200 feet from all natural water sources.
- "Wind Direction Arrow": Showing prevailing breeze blowing kitchen smells away from tents.
Clean compass rose, distance scale bar, and professional green/slate palette.`
  },
  {
    filename: "eagle-project-phases.png",
    title: "The 8-Phase Eagle Scout Service Project Lifecycle",
    description: `A comprehensive 8-step linear milestone roadmap showing the complete lifecycle of an Eagle Scout Service Project from inception to board of review.
Style: Modern infographic timeline with 8 circular milestone badges connected by a clean progress track on a light background.
The 8 Phases:
1. "1. Ideation & Beneficiary Contact": Identify community need with eligible non-profit/school.
2. "2. Project Proposal": Complete Section 1 of official Workbook (scope, materials, safety).
3. "3. Four Crucial Signatures": Beneficiary -> Scoutmaster -> Committee Chair -> District/Council approval.
4. "4. Project Final Plan": Detailed logistics, tool safety, permits, Eagle Coach assignment.
5. "5. Fundraising & Logistics": Obtain fundraising application approval and gather materials.
6. "6. Workday Execution": Direct and lead volunteers; enforce Age-Appropriate Tool rules.
7. "7. Project Report & Financials": Document completed work, hours, lessons learned, and budget reconciliation.
8. "8. Eagle Board of Review": Final review and national certification.
Clean icons inside each milestone, crisp typography, and professional blue-and-gold color scheme.`
  }
];

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateDiagram(d: DiagramPrompt): Promise<boolean> {
  const outputPath = path.join(OUTPUT_DIR, d.filename);
  
  if (await Bun.file(outputPath).exists()) {
    console.log(`✓ Skipping existing diagram: ${d.filename}`);
    return true;
  }

  console.log(`Generating diagram: ${d.filename} (${d.title})...`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: [
          {
            role: "user",
            parts: [{ text: d.description }],
          },
        ],
        config: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: "1K",
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data) {
          const buffer = Uint8Array.fromBase64(part.inlineData.data);
          await Bun.write(outputPath, buffer);
          console.log(`  ✓ Saved ${d.filename}`);
          return true;
        }
      }

      console.warn(`  ⚠ No image data returned for ${d.filename}`);
      return false;
    } catch (err: any) {
      console.error(`  ✗ Error on attempt ${attempt} for ${d.filename}:`, err.message || err);
      if (attempt < 3) {
        const backoff = attempt * 4000;
        console.log(`  Waiting ${backoff / 1000}s before retry...`);
        await sleep(backoff);
      }
    }
  }
  return false;
}

async function main() {
  console.log(`Generating ${DIAGRAMS.length} static educational diagrams into ${OUTPUT_DIR}...\n`);
  let successCount = 0;
  for (const d of DIAGRAMS) {
    const success = await generateDiagram(d);
    if (success) successCount++;
    await sleep(1500);
  }
  console.log(`\nCompleted: ${successCount}/${DIAGRAMS.length} diagrams generated successfully.`);
}

await main();
