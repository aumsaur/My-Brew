// Bean origins — the "pick bean" step, replacing CabinetShelf's ingredient list.
//
// PLACEHOLDER CONTENT: real origin names, but the notes and pairings are mine,
// not researched. Swap them for whatever you actually want to say.
//
// The point of this file is the shape, not the contents: adding an origin is a
// ROW HERE, not a new mesh. One bag model is recoloured and relabelled per
// entry. That is the whole reason this theme expands where a made-up
// ingredient list did not — "Ethiopia, light roast" needs no invention and no
// explaining.

// Roast level is carried as COLOUR, which doubles as the roasting step's
// feedback: a bean moves down this ladder as it roasts, and overshooting the
// bottom is the burnt/fail state.
export const ROASTS = {
  light: "#c9a173",
  medium: "#a0704a",
  mediumDark: "#74492a",
  dark: "#46291a",
  burnt: "#221512",
};

export const BEANS = [
  {
    id: "ethiopia",
    name: "ETHIOPIA",
    region: "Yirgacheffe",
    roast: "light",
    accent: "#d2536b", // origin colour — the thing that tells bags apart
    notes: "floral, citrus",
  },
  {
    id: "colombia",
    name: "COLOMBIA",
    region: "Huila",
    roast: "medium",
    accent: "#e0a33c",
    notes: "caramel, red apple",
  },
  {
    id: "brazil",
    name: "BRAZIL",
    region: "Cerrado",
    roast: "mediumDark",
    accent: "#4f9d6b",
    notes: "chocolate, nut",
  },
  {
    id: "sumatra",
    name: "SUMATRA",
    region: "Mandheling",
    roast: "dark",
    accent: "#4a7fb5",
    notes: "earthy, cedar",
  },
];

export const BEANS_BY_ID = Object.fromEntries(BEANS.map((b) => [b.id, b]));

/** Bold per-origin colour. This is what distinguishes bags on the shelf;
 * roast is a brown ladder and cannot do that job. */
export function accentColor(bean) {
  return bean?.accent ?? "#f0ead8";
}

export function roastColor(bean) {
  return ROASTS[bean?.roast] ?? ROASTS.medium;
}

// Ordered ladder, so roasting can walk it continuously.
export const ROAST_ORDER = ["light", "medium", "mediumDark", "dark", "burnt"];

/**
 * Colour at roast progress t (0..1), interpolated along ROAST_ORDER.
 *
 * This is what the roaster's bean mass is tinted with, so the drum shows the
 * roast happening rather than reporting a number. t > ~0.85 is into `burnt`,
 * which is the fail state — overshoot is visible before it is punitive.
 *
 * Returns {from, to, mix} so the caller can lerp with its own THREE.Color and
 * avoid importing three into the data layer.
 */
export function roastRampAt(t) {
  const clamped = Math.min(1, Math.max(0, t));
  const span = clamped * (ROAST_ORDER.length - 1);
  const i = Math.min(ROAST_ORDER.length - 2, Math.floor(span));
  return {
    from: ROASTS[ROAST_ORDER[i]],
    to: ROASTS[ROAST_ORDER[i + 1]],
    mix: span - i,
  };
}

/** Human label for a roast progress value, for the inventory card. */
export function roastLabel(t) {
  if (t <= 0.01) return "green";
  if (t > BURNT_AT_LABEL) return "burnt";
  const span = Math.min(1, t) * (ROAST_ORDER.length - 1);
  return ROAST_ORDER[Math.min(ROAST_ORDER.length - 2, Math.floor(span))];
}

// kept separate from useBrewFlow's BURNT_AT so the data layer has no import
// cycle back into the hook
const BURNT_AT_LABEL = 0.85;

/**
 * CSS colour for roast progress t — the DOM-side twin of roastRampAt, for the
 * HUD. Lives here so the swatch in the inventory card and the fill in the brew
 * meter cannot drift apart from the bean mass in the drum.
 */
export function roastCss(t) {
  const { from, to, mix } = roastRampAt(t);
  const h = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const a = h(from);
  const b = h(to);
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * mix)).join(",")})`;
}

// HOW DARK THE SHOT IS, and it is the same shot everywhere it appears.
//
// There were three espressos in the room: #3a1f12 in the machine's cup,
// #5a3018 for the stream falling into it, and POUR_COLOUR.espresso #24120b
// for the band once it reached the bar. The first and the last are the same
// liquid in the same ceramic demitasse, two metres apart, and they did not
// match — carry a shot to the serve station and it changed colour on the way.
//
// The dark one was not a mistake, it was a COMPENSATION: the band is seen
// through a tinted glass wall that lifts and neutralises whatever is behind
// it, so it is mixed darker to come out right. That is correct for the band
// and wrong for anything not behind glass, which is how it ended up on the
// shot cup — a compensation applied where there was nothing to compensate
// for. So there are two functions here and the pairing is the point:
// `espressoCss` is the liquid, `espressoBandCss` is that liquid seen through
// the serving glass.
//
// AND IT MOVES WITH THE BREW, which it never did before: the same flat brown
// came out of a green bean and a burnt one. Roast is the main axis, because
// that is what actually darkens coffee — a dark roast is a dark cup. Shot
// LENGTH is the second and it runs the other way: a ristretto is the same
// coffee with less water pushed through it, so it is denser and darker,
// while a lungo is diluted and visibly paler. Pull long and the cup says so.
const SHOT_INK = [
  [0.0, "#6b4126"],
  [0.35, "#3a1f12"], // the value the machine always used — medium, unchanged
  [0.7, "#2a1209"],
  [1.0, "#190a04"],
];
// how much the glass takes out. Measured, not chosen: #3a1f12 rendered as a
// neutral grey through the glass wall, and #24120b is what was mixed to fix
// it -- 0.6 of the original, channel for channel.
const GLASS_K = 0.6;

const bytes = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const css = (c) =>
  `rgb(${c.map((v) => Math.round(Math.min(255, Math.max(0, v)))).join(",")})`;

/** The espresso itself, as it looks in an opaque cup. */
export function espressoCss(roast = 0, shot = 0.5) {
  const t = Math.min(1, Math.max(0, roast));
  let i = 0;
  while (i < SHOT_INK.length - 2 && t > SHOT_INK[i + 1][0]) i += 1;
  const [t0, c0] = SHOT_INK[i];
  const [t1, c1] = SHOT_INK[i + 1];
  const k = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
  const a = bytes(c0);
  const b = bytes(c1);
  // CONCENTRATION, not brightness: 0.9 at a ristretto, 1.18 at a full lungo.
  const dilute = 0.9 + 0.28 * Math.min(1, Math.max(0, (shot - 0.15) / 0.85));
  return css(a.map((v, n) => (v + (b[n] - v) * k) * dilute));
}

/** The same shot, seen through the serving glass — see GLASS_K. */
export function espressoBandCss(roast = 0, shot = 0.5) {
  const m = espressoCss(roast, shot).match(/\d+/g).map(Number);
  return css(m.map((v) => v * GLASS_K));
}

// Grind fineness ladder — the same idea as ROASTS one step later in the loop.
// Grinding currently only gates on "finished", but the ladder is what the HUD
// names, and it is the hook for "espresso needs a fine grind" when that lands.
export const GRIND_ORDER = ["coarse", "medium", "fine", "espresso"];

export function grindLabel(t) {
  if (t <= 0.01) return "whole bean";
  const span = Math.min(1, t) * GRIND_ORDER.length;
  return GRIND_ORDER[Math.min(GRIND_ORDER.length - 1, Math.floor(span))];
}

// Short forms for the meter's sub-section, where the track is only ~90px per
// segment and "mediumDark" will not fit.
export const LADDER_LABELS = {
  light: "light",
  medium: "med",
  mediumDark: "med-dk",
  dark: "dark",
  coarse: "coarse",
  fine: "fine",
  espresso: "espr",
  flat: "flat",
  silky: "silky",
  foamy: "foamy",
  dry: "dry",
  ristretto: "rist",
  normale: "normale",
  lungo: "lungo",
  bitter: "bitter",
};

// Shot ladder — the last rung of the loop, named the way a barista would.
export const SHOT_ORDER = ["ristretto", "normale", "lungo", "bitter"];

export function shotLabel(t) {
  if (t <= 0.01) return "empty";
  const span = Math.min(1, t) * SHOT_ORDER.length;
  return SHOT_ORDER[Math.min(SHOT_ORDER.length - 1, Math.floor(span))];
}
