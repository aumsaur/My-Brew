// ── The recipe book ───────────────────────────────────────────────────────────
// The heart of the brewing loop. Each recipe names a target BLEND expressed as
// integer `pour` parts per ingredient — the cauldron fills to POT_CAPACITY units,
// so the parts scale into a target ratio you can pour toward by feel (see
// targetFractions). There's no order to fill and nothing is graded: pour + stir
// whatever you like, and if the balance is close enough to a recipe in the book
// you get its curated name; otherwise you get a whimsical one-off named after
// your own blend. Either way it's yours to save and share.
//
// `secret` recipes are never hinted at anywhere in the UI and need a noticeably
// closer match (SECRET_MATCH_THRESHOLD) to land — found only by free
// experimentation. The whole café shelf is secret: Aumster doesn't advertise the
// mortal-world drinks she keeps around; Thai Tea especially is her own, smuggled
// home from the night markets.

export const POT_CAPACITY = 6; // total the cauldron holds before it's full
export const POUR_RATE = 1.5; // units added per second while holding a pour
export const MIN_FILL_RATIO = 0.6; // pot must be at least this full before you can stir
export const MATCH_THRESHOLD = 0.62; // proportion-match score to count as "this recipe"
export const SECRET_MATCH_THRESHOLD = 0.85; // secrets need a noticeably closer pour

export const RECIPES = [
  // ── café (kept lean, and kept OFF the menu — see file header) ────────────────
  {
    id: "espresso-hex",
    name: "Espresso Hex",
    icon: "☕",
    category: "cafe",
    secret: true,
    pour: { coffeebean: 3 },
    blurb: "A black, bracing shot to wake the recently dead.",
  },
  {
    id: "graveyard-latte",
    name: "Graveyard Latte",
    icon: "🥛",
    category: "cafe",
    secret: true,
    pour: { coffeebean: 2, cream: 1 },
    blurb: "Roast softened with a ghost of cream. Served lukewarm, always.",
  },

  // ── fizzy ────────────────────────────────────────────────────────────────────
  {
    id: "sparkling-hex",
    name: "Sparkling Hex",
    icon: "🥤",
    category: "fizzy",
    pour: { colanut: 2, fizzcrystal: 1 },
    blurb: "Effervescence bound in frost — it bites back on the way down.",
  },
  {
    id: "cinder-fizz",
    name: "Cinder Fizz",
    icon: "🔥",
    category: "fizzy",
    pour: { colanut: 1, brimstone: 1 },
    blurb: "Cola nut struck against brimstone. Drink it before it stops sparking.",
  },

  // ── remedy ─────────────────────────────────────────────────────────────────
  {
    id: "bitter-green-tonic",
    name: "Bitter Green Tonic",
    icon: "🧪",
    category: "remedy",
    pour: { eyeball: 2, wormwood: 1 },
    blurb: "Clears the sight and curdles the mood. Two drops, no more.",
  },
  {
    id: "toadstool-tincture",
    name: "Toadstool Tincture",
    icon: "💊",
    category: "remedy",
    pour: { toadstool: 2, honey: 1 },
    blurb: "Folly, sweetened with wild honey so it goes down almost kindly.",
  },
  {
    id: "dragons-draught",
    name: "Dragon's Draught",
    icon: "🩸",
    category: "remedy",
    pour: { dragonresin: 3 },
    blurb: "Pure ember, undiluted. Warms you from the marrow out.",
  },

  // ── potion ─────────────────────────────────────────────────────────────────
  {
    id: "dream-draught",
    name: "Dream Draught",
    icon: "🌙",
    category: "potion",
    pour: { moonpetal: 2, nightshade: 1 },
    blurb: "Moonpetal steeped in a whisper of nightshade. Sleep, and remember.",
  },
  {
    id: "midnight-philter",
    name: "Midnight Philter",
    icon: "🔮",
    category: "potion",
    pour: { nightshade: 2, mandrake: 1 },
    blurb: "Rooted and dark. The philter you brew when the answer is no.",
  },
  {
    id: "ravens-elixir",
    name: "Raven's Elixir",
    icon: "🪶",
    category: "potion",
    pour: { ravenfeather: 1, batwing: 1, moonpetal: 1 },
    blurb: "Feather, wing, and bloom — three parts flight. Balance them exactly.",
  },

  // ── the deepest secret ── Aumster's own, off any menu ─────────────────────────
  {
    id: "thai-tea",
    name: "Thai Tea",
    icon: "🧡",
    category: "cafe",
    secret: true,
    pour: { spicedtea: 2, condensedmilk: 1 },
    blurb:
      "Aumster's own — smuggled home from the mortal night markets, orange as dusk and sweet as a secret. Her signature. Nowhere on the menu.",
  },
];

export const RECIPES_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
export const SECRETS = RECIPES.filter((r) => r.secret);

const sum = (obj) => Object.values(obj).reduce((s, v) => s + v, 0);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// A recipe as PROPORTIONS — each ingredient's share of the blend (sums to 1).
// This is what correctness is judged on, so any total volume with the right
// ratio matches ("many ways to make it").
export function targetFractions(recipe) {
  const totalParts = sum(recipe.pour) || 1;
  const out = {};
  for (const id in recipe.pour) out[id] = recipe.pour[id] / totalParts;
  return out;
}

// How closely `pours` (id → amount) matches a recipe, by PROPORTION. 1 = perfect
// ratio, 0 = hopeless. Volume doesn't matter — only the balance between
// ingredients. (Total-variation distance between the two mixes.)
export function scoreAgainst(recipe, pours) {
  const total = Object.values(pours).reduce((s, v) => s + v, 0);
  if (total <= 0) return 0;
  const tf = targetFractions(recipe);
  const ids = new Set([...Object.keys(tf), ...Object.keys(pours)]);
  let diff = 0;
  for (const id of ids) diff += Math.abs((tf[id] || 0) - (pours[id] || 0) / total);
  return clamp(1 - diff / 2, 0, 1);
}

// Find the recipe the current pour is closest to — secrets included, since
// that's the only way to ever stumble onto one.
export function bestMatch(pours) {
  let best = null;
  let bestScore = -1;
  for (const r of RECIPES) {
    const s = scoreAgainst(r, pours);
    if (s > bestScore) {
      bestScore = s;
      best = r;
    }
  }
  return { recipe: best, score: bestScore };
}

// The score a match against `recipe` needs to clear to count — secrets ask for a
// noticeably closer pour than everyday recipes.
export function matchThreshold(recipe) {
  return recipe?.secret ? SECRET_MATCH_THRESHOLD : MATCH_THRESHOLD;
}
