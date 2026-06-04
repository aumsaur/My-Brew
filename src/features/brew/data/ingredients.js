// Ingredients the user drags into the cauldron. Each has a 3D model `kind`, a
// color (for the liquid blend + glow), `vibe` weights that lean the result toward
// a product category, adjective/noun used to name the brew, a `strength` (how
// concentrated/potent it is — drives the result's intensity), and an optional
// `creamer` flag for milk-like dilutants.
export const INGREDIENT_LIST = [
  {
    id: "coffeebean",
    name: "Coffee Bean",
    kind: "bean",
    color: "#43291a",
    adjective: "Roasted",
    noun: "Vigor",
    vibe: { cafe: 3 },
    strength: 1.0,
  },
  {
    id: "cream",
    name: "Cream",
    kind: "jug",
    color: "#f3e7c9",
    adjective: "Silken",
    noun: "Calm",
    vibe: { cafe: 2, remedy: 1 },
    strength: 0.15,
    creamer: true,
  },
  {
    id: "colanut",
    name: "Cola Nut",
    kind: "nut",
    color: "#8a3324",
    adjective: "Effervescent",
    noun: "Buzz",
    vibe: { fizzy: 3 },
    strength: 0.9,
  },
  {
    id: "fizzcrystal",
    name: "Fizz Crystal",
    kind: "crystal",
    color: "#6bd6ff",
    adjective: "Frozen",
    noun: "Clarity",
    vibe: { fizzy: 2, potion: 1 },
    strength: 0.45,
  },
  {
    id: "toadstool",
    name: "Toadstool",
    kind: "mushroom",
    color: "#d94f4f",
    adjective: "Spotted",
    noun: "Folly",
    vibe: { remedy: 2, potion: 1 },
    strength: 0.6,
  },
  {
    id: "eyeball",
    name: "Eyeball",
    kind: "eyeball",
    color: "#5f9e8a",
    adjective: "Bloodshot",
    noun: "Sight",
    vibe: { remedy: 3 },
    strength: 0.7,
    display: "jar",
  },
  {
    id: "nightshade",
    name: "Nightshade",
    kind: "berries",
    color: "#7b2ff7",
    adjective: "Midnight",
    noun: "Whispers",
    vibe: { potion: 2, remedy: 1 },
    strength: 0.85,
    display: "jar",
  },
  {
    id: "moonpetal",
    name: "Moonpetal",
    kind: "flower",
    color: "#b07cff",
    adjective: "Lunar",
    noun: "Dreams",
    vibe: { potion: 3 },
    strength: 0.5,
  },
  {
    id: "ravenfeather",
    name: "Raven Feather",
    kind: "feather",
    color: "#3a3a48",
    adjective: "Shadowed",
    noun: "Secrets",
    vibe: { potion: 2, fizzy: 1 },
    strength: 0.55,
  },
  {
    id: "mandrake",
    name: "Mandrake",
    kind: "mandrake",
    color: "#6e4a2e",
    adjective: "Gnarled",
    noun: "Roots",
    vibe: { potion: 2, remedy: 1 },
    strength: 0.8,
  },
];

export const INGREDIENTS = Object.fromEntries(
  INGREDIENT_LIST.map((i) => [i.id, i])
);

export const DEFAULT_LIQUID = "#8a2be2"; // resting violet

// ── Product categories ────────────────────────────────────────────────────────
// `names` are ordered MOST intense (index 0) → mildest (last); brewName picks by
// the computed intensity, so a pure coffee shot reads "Espresso" and a creamy
// mix reads "Latte".
export const CATEGORIES = {
  cafe: {
    label: "Café",
    icon: "☕",
    vessels: ["cup"],
    names: ["Espresso", "Cortado", "Flat White", "Cappuccino", "Latte"],
  },
  fizzy: {
    label: "Fizzy",
    icon: "🥤",
    vessels: ["can", "colabottle"],
    names: ["Cola Syrup", "Energy Brew", "Soda Pop", "Spritz", "Sparkling Hex"],
  },
  remedy: {
    label: "Remedy",
    icon: "💊",
    vessels: ["bottle"],
    names: ["Concentrate", "Tincture", "Tonic", "Syrup", "Cordial"],
  },
  potion: {
    label: "Potion",
    icon: "🔮",
    vessels: ["flask"],
    names: ["Philter", "Draught", "Elixir", "Potion", "Infusion"],
  },
  // ── fallback outcomes for combinations we don't curate ──
  mystery: {
    label: "Mystery",
    icon: "✨",
    vessels: ["flask"],
    names: [
      "Murky Mystery",
      "Bubbling Enigma",
      "Strange Brew",
      "Curious Draught",
      "Unknown Philter",
    ],
  },
  fail: {
    label: "Botched",
    icon: "☠️",
    vessels: ["bottle", "flask"],
    names: [
      "Botched Sludge",
      "Failed Experiment",
      "Bitter Mistake",
      "Curdled Mess",
      "Inert Slurry",
    ],
  },
};
// Only the four "real" categories take part in vibe scoring; mystery/fail are
// outcomes pickCategory falls back to.
const CATEGORY_KEYS = ["cafe", "fizzy", "remedy", "potion"];

// All vessel model kinds (must match the VESSELS registry in Vessel.jsx)
export const VESSEL_KINDS = ["cup", "can", "colabottle", "bottle", "flask"];

// ── Color blend ───────────────────────────────────────────────────────────────
const hexToRgb = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbToHex = (rgb) =>
  "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

const mixHex = (a, b, t) => {
  const A = hexToRgb(a),
    B = hexToRgb(b);
  return rgbToHex([0, 1, 2].map((i) => A[i] + (B[i] - A[i]) * t));
};

export function blendColor(ids) {
  if (!ids.length) return DEFAULT_LIQUID;
  const sum = [0, 0, 0];
  for (const id of ids) {
    const [r, g, b] = hexToRgb(INGREDIENTS[id].color);
    sum[0] += r;
    sum[1] += g;
    sum[2] += b;
  }
  return rgbToHex(sum.map((v) => v / ids.length));
}

// Per-category color poles. The product hue lerps from `mild` (creamy / low
// intensity) to `strong` (concentrated) by intensity, then keeps a hint of the
// actual ingredient blend. Potion has no poles — it uses the raw blend, only
// darkened (intense) or lifted (mild).
const CATEGORY_COLORS = {
  cafe: { strong: "#2e1a0f", mild: "#caa477" },
  fizzy: { strong: "#7a1f12", mild: "#e0623f" },
  remedy: { strong: "#176b3c", mild: "#8fd9ad" },
  potion: null,
};

export function productColor(category, ids, intensity = 0.6) {
  const blend = blendColor(ids);
  if (category === "fail") return mixHex(blend, "#4a4036", 0.62); // muddy, drained
  if (category === "mystery") return mixHex(blend, "#3a2a5a", 0.45); // murky violet
  const poles = CATEGORY_COLORS[category];
  if (!poles) {
    return mixHex(
      blend,
      intensity > 0.5 ? "#000000" : "#ffffff",
      Math.abs(intensity - 0.5) * 0.4
    );
  }
  const base = mixHex(poles.mild, poles.strong, intensity);
  return mixHex(base, blend, 0.22);
}

// How concentrated the brew is (0 = milky/diluted → 1 = a pure shot). Creamers
// dilute; a single strong ingredient concentrates; piling stuff in dilutes.
export function computeIntensity(ids) {
  if (!ids.length) return 0.6;
  const arr = ids.map((id) => INGREDIENTS[id]);
  const avg = arr.reduce((s, i) => s + (i.strength ?? 0.5), 0) / arr.length;
  const creamRatio = arr.filter((i) => i.creamer).length / arr.length;
  let intensity = avg * (1 - creamRatio * 0.7);
  if (arr.length === 1)
    intensity = intensity * 1.2 + 0.12; // a concentrated shot
  else intensity *= 1 - (arr.length - 1) * 0.06; // more = diluted
  return Math.max(0, Math.min(1, intensity));
}

// ── Result selection ──────────────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Dominant vibe decides the category. We don't curate every mix: if the
// ingredients sprawl across 3+ categories it's a chaotic "fail", and if the top
// two categories tie (no clear winner) it's an ambiguous "mystery". Otherwise
// the clear winner stands.
export function pickCategory(ids) {
  const totals = { cafe: 0, fizzy: 0, remedy: 0, potion: 0 };
  for (const id of ids) {
    const vibe = INGREDIENTS[id].vibe;
    for (const k in vibe) totals[k] += vibe[k];
  }
  const ranked = CATEGORY_KEYS.map((k) => [k, totals[k]]).sort(
    (a, b) => b[1] - a[1]
  );
  const distinct = CATEGORY_KEYS.filter((k) => totals[k] > 0).length;

  if (distinct >= 3) return "fail"; // too many clashing vibes
  if (distinct === 0) return "mystery"; // nothing scored (shouldn't happen)
  if (ranked[0][1] === ranked[1][1]) return "mystery"; // a dead tie at the top
  return ranked[0][0];
}

export function brewName(category, ids, intensity = 0.6) {
  const names = CATEGORIES[category].names; // ordered strong → mild
  const idx = Math.round((1 - intensity) * (names.length - 1));
  const title = names[Math.max(0, Math.min(names.length - 1, idx))];
  const adjective = pick(ids.map((id) => INGREDIENTS[id].adjective));
  const noun = pick(ids.map((id) => INGREDIENTS[id].noun));
  return `${title} of ${adjective} ${noun}`;
}

// Which physical vessel a category pours into (some categories have variety)
export function pickVessel(category) {
  return pick(CATEGORIES[category].vessels);
}
