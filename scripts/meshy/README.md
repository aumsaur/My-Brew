# Meshy model pipeline

Generates the low-poly ingredient AND vessel props with
[Meshy](https://www.meshy.ai) text-to-3D and drops them into `public/models/`
as GLBs — one flat folder, one review/send flow for both.

## One-time setup

1. Create an API key at meshy.ai → Settings → API Keys.
2. `cp .env.example .env` and paste the key into `MESHY_API_KEY`.
   (`.env` is git-ignored; the key is server-side only — never `VITE_`-prefixed.)

## Review before you send

**`npm run meshy` REVIEWS the prompts — it never calls the API.** It prints
every kind's exact prompt and resolved parameters (model type, topology,
polycount, AI model) so they can be read over — and edited in `prompts.mjs` —
before anything costs credits.

```bash
npm run meshy                      # review every kind's prompt + params
npm run meshy -- --only crystal    # review just one (comma-separate for several)
```

Only once the prompts look right, generate for real:

```bash
npm run meshy -- --send                    # generate everything just reviewed
npm run meshy -- --send --only crystal     # generate just one
npm run meshy -- --send --force            # regenerate even if the file exists
npm run meshy -- --send --refine           # also run Meshy's texture stage (see below)
```

Each kind runs Meshy's **preview** stage only (untextured low-poly mesh). That's
deliberate: the app recolours every mesh in the ingredient's own hue
(`GlbModel.jsx`), so textures would be thrown away — preview-only is cleaner and
much cheaper on credits. Pass `--refine` (or set `refine: true` on a model in
`prompts.mjs`) only if you want Meshy's baked textures for a hero prop.

## Use a generated model

Generation writes `public/models/<key>.glb`. Ingredients and vessels are two
separate registries (different override point, different key namespace —
ingredient KINDS vs recipe IDS — but same output folder and generator).

**Ingredients** — add a line to `MODEL_URLS` in
`src/features/brew/scene/IngredientModel.jsx`:

```js
const MODEL_URLS = {
  crystal: { url: "/models/crystal.glb" },       // fit defaults to 0.9
  flower:  { url: "/models/flower.glb", fit: 1.1 }, // tune size per model
};
```

**Vessels** — add a line to `VESSEL_MODEL_URLS` in
`src/features/brew/scene/RecipeVessel.jsx`, keyed by recipe id (see
`recipes.js`):

```js
const VESSEL_MODEL_URLS = {
  "dream-draught": { url: "/models/dream-draught.glb" },
  "thai-tea": { url: "/models/thai-tea.glb", fit: 1.2 },
};
```

Until a key is listed in the relevant registry it falls back to its hand-built
version (procedural prop / bespoke primitive-combo vessel), so a fresh
checkout with no GLBs renders exactly as before. While a GLB loads, the
hand-built version shows as the Suspense fallback, then swaps.

`fit` = the mesh's longest dimension in world units (default `0.9`). Bump it up
or down if a model lands too big or small next to the others.

## Tuning the look

Edit `prompts.mjs`. Ingredients (`MODELS`) and vessels (`VESSEL_MODELS`) are
two separate exports with their own shared boilerplate (`LP` vs `VESSEL_LP`) —
the difference: ingredients want to look like a bare specimen with NO support
of any kind, vessels are allowed their own integral foot/base/handle (a
chalice has a foot, that's not a display-mount artifact) but still shouldn't
get a separate presentation stand.

- `DEFAULTS.targetPolycount` — deliberately coarse (1200 by default). Lower =
  chunkier facets. Meshy's own read on "low-poly" still skews smoother/more
  organic than this game's hand-built primitives (an icosahedron at detail 1 is
  80 triangles), so the shared boilerplate leans hard on "extremely low-poly /
  blocky / no smooth shading" — tune that text too if results still come back
  too rounded. Override per-model (see `mandrake`'s lower `targetPolycount`).
- `DEFAULTS.negativePrompt` — the reliable lever against a generator's habit of
  mounting free-standing objects on a little display pedestal/stick. Wording it
  into the positive prompt alone wasn't enough on the first pass.
- `DEFAULTS.aiModel` — `"meshy-5"` / `"meshy-6"` / `"latest"`.
- Per-model `prompt` — colour-neutral on purpose; describe the **silhouette**,
  since colour is applied in-app (and the whole mesh becomes ONE flat colour —
  no per-part colour variation survives, so shape/facets have to carry all the
  visual interest).

## Adding more props

Both `MODELS` and `VESSEL_MODELS` are just plain objects — add an entry to
whichever fits, review, `--send`, then wire it into the matching `*_URLS`
registry above.
