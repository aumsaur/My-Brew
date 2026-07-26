// Prompt manifest for Meshy text-to-3D generation.
//
// Each entry maps an ingredient `kind` (see src/features/brew/data/ingredients.js)
// to the prompt + options the generator submits to Meshy. We generate ONE mesh
// per kind — colour is applied per-ingredient in-app (GlbModel re-materials the
// mesh in the ingredient's own hue), so prompts stay COLOUR-NEUTRAL and focus on
// silhouette, which is what actually reads under the moody lighting.
//
// Output lands in /public/models/<kind>.glb. Register a kind in IngredientModel's
// MODEL_URLS once its file exists to swap the procedural prop for the mesh.

// Shared submission defaults — tuned for CHUNKY low-poly, faceted, texture-free
// meshes that sit next to the hand-built flat-shaded props (those use maybe a
// few dozen triangles each — an icosahedron at detail 1 is 80 tris — so "low
// poly" here means genuinely coarse, not just "not photoreal"). Override
// per-model below if one kind needs a different budget.
export const DEFAULTS = {
  aiModel: "meshy-5", // "meshy-5" | "meshy-6" | "latest"
  modelType: "lowpoly", // native low-poly generation
  topology: "triangle", // triangles flat-shade cleanly
  // 6000 read too smooth/organic; 1200 (+ "sharp angular" in LP) overcorrected
  // into spiky/jagged, worst on mandrake. 1800 + softer wording below is the
  // middle ground: still genuinely low-poly, not aggressive about it.
  targetPolycount: 1800,
  shouldRemesh: true,
  // First pass came back with several kinds (flower, eyeball, berries, crystal,
  // mandrake) sitting on a little circular pedestal with a connecting stick —
  // classic "3D-print display mount" habit some generators default to for
  // free-standing organic shapes. negative_prompt is the reliable lever for
  // that (wording it into the positive prompt alone wasn't enough).
  negativePrompt:
    "pedestal, base, plinth, stand, mount, platform, stick, rod, post, " +
    "display stand, 3d print support structure, museum display base",
  // We SKIP the refine/texture stage (refine:false) because GlbModel recolours the
  // mesh itself — so the preview mesh (untextured) is all we need, at a fraction of
  // the credits. Flip to true (or pass --refine) if you want Meshy's baked textures
  // for a hero prop.
  refine: false,
};

// Boilerplate every prompt shares — nudges Meshy toward a clean single prop that
// matches the flat-shaded, low-poly art direction.
//  - "low-poly, faceted, blocky": Meshy's default read on "low-poly" skews
//    smoother/more organic than this game's hand-built primitives, but
//    "extremely" + "sharp angular" + "no rounded surfaces" (an earlier pass)
//    overcorrected into spiky/jagged results — worst on mandrake. Dialed back
//    to a middle ground: still low-poly, not aggressively so.
//  - "floating specimen, no support of any kind": belt-and-suspenders against
//    the pedestal-and-stick habit alongside negative_prompt above.
//  - "single flat colour ... rely on carved facets": the app strips ALL of
//    Meshy's own colour/texture and recolours the whole mesh one flat hue
//    (GlbModel.jsx) — so any visual interest has to come from geometry alone,
//    not colour contrast, or the result reads as a featureless blob.
const LP =
  "low-poly, faceted, blocky simplified geometry, gently faceted silhouette, " +
  "PS1-era stylized game asset, flat-shaded, no smooth gradients, no fine " +
  "surface detail, single centered object, floating specimen with no support " +
  "of any kind beneath it, will be rendered in a single flat matte colour so " +
  "must read clearly from its facets and silhouette alone, not colour or " +
  "texture, plain background, no text";

export const MODELS = {
  bean: { prompt: `A single plump coffee bean with a deep central groove, ${LP}` },
  // jug shared by Ghostmilk/Starmilk/Wild Honey — an enchanted spirit-vessel
  // rather than a literal kitchen pitcher, to match the whimsical rename.
  jug: {
    prompt: `A small ornate spirit-vessel pitcher with a curling spout and a looping rune-etched handle, ${LP}`,
  },
  // Buzzroot Nut — a crackling seed pod, not a literal real-world kola nut.
  nut: {
    prompt: `A jagged crystalline seed pod split by a cracked jagged seam, faceted like a tiny geode, ${LP}`,
  },
  // NOTE: no "crystal" entry — it's pregrind now (a jarred procedural granule
  // pile, see IngredientModel.jsx's Crystal()), not worth an AI generation.
  mushroom: { prompt: `A single toadstool mushroom with a domed spotted cap and a fat stem, ${LP}` },
  // NOTE: no "eyeball" entry — reverted to the hand-built version (see
  // IngredientModel.jsx's MODEL_URLS note). A sphere's hand-placed iris/pupil/
  // vein detail isn't something a generic low-poly AI mesh can approximate.
  berries: { prompt: `A small cluster of round berries on a short stem with one leaf, ${LP}` },
  // Moonpetal — should actually read as a moon, not a generic flower: petals
  // shaped like thin crescent slivers, not rounded/oval like a normal bloom.
  flower: {
    prompt: `A bloom of thin crescent-moon-shaped petals curving upward around a small glowing round core, each petal a slender crescent sliver, ${LP}`,
  },
  // Raven Feather ONLY now — bat wing got its own "batwing" kind below (they
  // used to share this "feather" model, which is why Bat Wing didn't read as
  // a bat wing at all: a bird feather and a bat wing are completely different
  // shapes).
  feather: { prompt: `A single elongated bird feather with a central rachis and a quill base, ${LP}` },
  // Bat Wing — a webbed membrane wing stretched between finger-like bone
  // spokes, NOT a feather.
  batwing: {
    prompt: `A single bat wing — a thin webbed membrane stretched between four splayed finger-like bone spokes radiating from a small wrist joint, ${LP}`,
  },
  // "too fine grain" on the first pass, from over-aggressive negative framing
  // ("NO small bumps...") — dropped that. Still too jagged on the second pass;
  // user's own read was "too many root" — "forked legs" + "arm stubs" + a
  // "leafy crown" is 6+ separate small pointy protrusions for a low-poly mesh
  // to resolve cleanly, and each one is a chance to read as a spike. Cut the
  // element count instead of just re-wording: one body, two SIMPLE (not
  // forked) legs, no arms, one small rounded tuft — roughly half the parts.
  mandrake: {
    prompt: `A gnarled mandrake root — a single stout tapered body splitting into two simple rounded legs at the base, with one small rounded leaf tuft on top, no arms, no extra branches, ${LP}`,
    targetPolycount: 900,
  },
  // leaf shared by Duskleaf Tea/Wormwood. A "small pile" read as one blurred
  // blob on the first pass — pinning an exact low leaf count keeps each leaf
  // individually legible instead of merging into a mass.
  leaf: {
    prompt: `Exactly four curled ember-edged leaves, clearly separated and individually visible, fanned at odd angles, tips faintly scorched, ${LP}`,
  },
  // NOTE: no "anise" entry — Star Anise was dropped from the ingredient list.
};

// ── Recipe vessels ────────────────────────────────────────────────────────────
// The served-drink vessels — one per curated recipe (recipes.js), previously
// hand-built as Three.js primitive combinations in scene/RecipeVessel.jsx.
// Hand-coding 11 bespoke shapes turned out bug-prone (transparency sorting on
// closed glass shells, a crescent moon that needed real geometry debugging to
// get right) — better to run these through the same pipeline as the
// ingredients instead of hand-fixing primitives one at a time. Output keys are
// RECIPE IDS (not ingredient kinds) — distinct namespace, land in the same
// public/models/ folder, same review/--send flow as everything above.
//
// DIFFERENT from ingredient boilerplate in one deliberate way: a vessel's OWN
// integral foot/base/handle is correct and wanted (a chalice has a foot, a cup
// has a handle) — only a SEPARATE display mount is the unwanted artifact. The
// ingredient LP's blanket "floating specimen, no support" would fight a cup's
// own design, so vessels get their own boilerplate.
// Same dial-back as the ingredient LP above — "extremely" + "sharp angular" +
// "no rounded surfaces" read too spiky/jagged in practice.
const VESSEL_LP =
  "low-poly, faceted, blocky simplified geometry, gently faceted silhouette, " +
  "PS1-era stylized game asset, flat-shaded, no smooth gradients, no fine " +
  "surface detail, single centered object, resting naturally on its own " +
  "integral base or foot with no separate display stand or mount beneath it, " +
  "will be rendered in a single flat matte colour so must read clearly from " +
  "its facets and silhouette alone, not colour or texture, plain background, " +
  "no text";

const VESSEL_NEGATIVE =
  "display stand, museum mount, presentation plinth separate from the object, " +
  "3d print support structure";

export const VESSEL_MODELS = {
  "espresso-hex": {
    prompt: `A tiny squat espresso demitasse cup on its saucer, with a small side handle, ${VESSEL_LP}`,
    negativePrompt: VESSEL_NEGATIVE,
  },
  "graveyard-latte": {
    prompt: `A tall clear drinking glass mug with straight sides and a small handle, ${VESSEL_LP}`,
    negativePrompt: VESSEL_NEGATIVE,
  },
  "sparkling-hex": {
    prompt: `A tall hexagonal faceted drinking tumbler glass, ${VESSEL_LP}`,
    negativePrompt: VESSEL_NEGATIVE,
  },
  "cinder-fizz": {
    prompt: `A rugged charred stone tankard mug with a side handle and a cracked surface, ${VESSEL_LP}`,
    negativePrompt: VESSEL_NEGATIVE,
  },
  "bitter-green-tonic": {
    prompt: `A slim apothecary vial with a bulbous dropper cap, ${VESSEL_LP}`,
    negativePrompt: VESSEL_NEGATIVE,
  },
  "toadstool-tincture": {
    prompt: `A round specimen jar topped with a small domed spotted mushroom-cap stopper, ${VESSEL_LP}`,
    negativePrompt: VESSEL_NEGATIVE,
  },
  "dragons-draught": {
    prompt: `A rugged dark iron chalice goblet on a short stem with a spiked rim, ${VESSEL_LP}`,
    negativePrompt: VESSEL_NEGATIVE,
  },
  "dream-draught": {
    prompt: `A small round bulb flask with a narrow neck, topped with a crescent-moon-shaped stopper, ${VESSEL_LP}`,
    negativePrompt: VESSEL_NEGATIVE,
  },
  "midnight-philter": {
    prompt: `A small round bulb flask with a narrow neck, standing on two gnarled root-like legs instead of a flat base, ${VESSEL_LP}`,
    negativePrompt: VESSEL_NEGATIVE,
  },
  "ravens-elixir": {
    prompt: `A slender flask with two small wings flaring from its shoulders and a feather-shaped stopper, ${VESSEL_LP}`,
    negativePrompt: VESSEL_NEGATIVE,
  },
  "thai-tea": {
    prompt: `A tall straight drinking glass with a thin striped straw leaning against the rim, ${VESSEL_LP}`,
    negativePrompt: VESSEL_NEGATIVE,
  },
};

// ── InnerWorld skill crystals ─────────────────────────────────────────────────
// PROMPTS ONLY — not wired into the app yet. InnerWorld's skill hall currently
// renders skills as one of TWO procedural families (scene/GeoCrystal.jsx: 4
// rounded "geo" forms that drop in; scene/CrystalCluster.jsx: 6 shard
// "cluster" arrangements that grow up, 3 of which get a special runtime
// material — iridescent/smoky/frosted). User wants ONE unified Meshy-driven
// look replacing both families. That's a real integration project, not just
// new prompts — GlbModel.jsx hardcodes a single flat MeshStandardMaterial, so
// it needs extending to support the iris/elestial/tangerine treatments
// layered on top of a swapped-in mesh, and skills.js's rollSkills()/ARRANGEMENTS
// need restructuring around 3 shapes instead of 10. Doing that properly is its
// own follow-up pass — these 3 prompts are the first piece, sized for variety
// (a tall dramatic one, a busy multi-shard one, a compact gem) rather than
// trying to 1:1 replace all 10 old variants.
export const INNERWORLD_MODELS = {
  "crystal-spire": {
    prompt: `A dramatic crystal spire formation — one dominant tall pointed shard flanked by two smaller companion shards at its base, ${LP}`,
  },
  "crystal-cluster": {
    prompt: `A dense crystal cluster of several jagged pointed shards clustered tightly together at their roots, radiating outward at varied angles, ${LP}`,
  },
  "crystal-gem": {
    prompt: `A single chunky faceted crystal gem, a multi-sided polyhedron with sharp angular facets, ${LP}`,
  },
};
