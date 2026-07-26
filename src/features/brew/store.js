import { create } from "zustand";
import {
  blendPours,
  brewName,
  pickCategory,
  pickVessel,
  productColor,
  computeIntensity,
  CATEGORIES,
  INGREDIENTS,
  DEFAULT_LIQUID,
  PAGE_COUNT,
} from "@/features/brew/data/ingredients";
import {
  bestMatch,
  matchThreshold,
  POT_CAPACITY,
  POUR_RATE,
  MIN_FILL_RATIO,
} from "@/features/brew/data/recipes";

// ── discovered-recipe persistence ─────────────────────────────────────────────
// The grimoire fills across sessions, so which recipes you've brewed is kept in
// localStorage (best-effort — private-mode / SSR just falls back to empty).
const DISCOVERED_KEY = "mybrew.discovered";
function loadDiscovered() {
  try {
    const raw = localStorage.getItem(DISCOVERED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function persistDiscovered(list) {
  try {
    localStorage.setItem(DISCOVERED_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

const sumPours = (pours) => Object.values(pours).reduce((s, v) => s + v, 0);

// A short, personal line for an off-recipe blend — nothing in the book matches
// it, so the brew is introduced by what actually went into it.
function oddityBlurb(ids) {
  const names = ids.map((id) => INGREDIENTS[id].name);
  if (names.length === 0) return "Conjured from nothing but whimsy.";
  if (names.length === 1) return `Pure, unmixed ${names[0]} — a brew all its own.`;
  const last = names[names.length - 1];
  const rest = names.slice(0, -1).join(", ");
  return `Nothing in the book quite matches it — born from ${rest} and ${last}.`;
}

const initialDiscovered = loadDiscovered();

// ── The brew ─────────────────────────────────────────────────────────────────
// Pour whatever you like — HOLD ingredients to pour them toward the cauldron's
// capacity — then DRAG the stir stick to mix. There's no order and nothing is
// graded: the balance you poured decides what you get. Close enough to a recipe
// in the book and you get its curated name; otherwise a one-off named after your
// own blend. Either way it's yours to save and share.
//
// phase:  idle → pouring → stirring → served
export const useBrew = create((set, get) => ({
  pours: {}, // ingredient id → poured amount (units, up to POT_CAPACITY)
  pouringId: null, // ingredient currently being held/poured, or null
  phase: "idle",
  stirProgress: 0, // 0..1 accumulated stir travel
  discovered: initialDiscovered, // recipe ids brewed at least once
  cabinetPage: 0, // which shelf page the cabinet is showing

  flipPage: (dir) =>
    set((s) => ({ cabinetPage: (s.cabinetPage + dir + PAGE_COUNT) % PAGE_COUNT })),

  color: DEFAULT_LIQUID, // live cauldron color (amount-weighted blend)
  pulse: 0, // bumped on each pour-start → a splash + falling model
  lastAdded: null, // id for the falling model
  brewPulse: 0, // bumped when the stir begins → cauldron swirl
  potion: null, // { name, color, category, vessel, recipeId, intensity } → rising vessel
  result: null, // { name, icon, blurb, color, secret, isNew, ids } → the share card
  inspecting: false, // is the served product open in the inspect overlay

  setInspecting: (v) => set({ inspecting: v }),

  // legacy no-ops kept so the cauldron-liquid onClick doesn't throw (the radial
  // dial it used to open is gone; pours are shown in the HUD now)
  dialOpen: false,
  toggleDial: () => {},
  setDialOpen: () => {},

  // ── pouring ────────────────────────────────────────────────────────────────
  // Press-and-hold an ingredient (cabinet cubby or HUD rack) to start pouring it.
  startPour: (id) => {
    const { phase } = get();
    if (phase === "stirring" || phase === "served") return;
    set((s) => ({
      pouringId: id,
      phase: "pouring",
      pulse: s.pulse + 1,
      lastAdded: id,
    }));
  },

  // Called every frame while a pour is held (see PourController in BrewScene).
  // Capacity is a shared budget: the pour tops up until the cauldron is FULL
  // (total across all ingredients hits POT_CAPACITY), then stops.
  pourTick: (dt) => {
    const { pouringId, pours, phase } = get();
    if (!pouringId || phase !== "pouring") return;
    const total = sumPours(pours);
    const room = POT_CAPACITY - total;
    if (room <= 0) return; // pot is full
    const amt = (pours[pouringId] || 0) + Math.min(POUR_RATE * dt, room);
    const next = { ...pours, [pouringId]: amt };
    set({ pours: next, color: blendPours(next) });
  },

  endPour: () => set({ pouringId: null }),

  // ── stirring ─────────────────────────────────────────────────────────────
  // The stir stick calls beginStir on grab, addStir as you drag it around, and
  // the store serves the brew once the stir completes.
  beginStir: () => {
    const { phase, pours } = get();
    if (phase === "served" || phase === "stirring") return false;
    if (sumPours(pours) < POT_CAPACITY * MIN_FILL_RATIO) return false; // not full enough
    set((s) => ({ phase: "stirring", pouringId: null, brewPulse: s.brewPulse + 1 }));
    return true;
  },

  addStir: (delta) => {
    const { phase, stirProgress } = get();
    if (phase !== "stirring") return;
    const p = Math.min(1, stirProgress + delta);
    set({ stirProgress: p });
    if (p >= 1) get().serve();
  },

  // ── judging ─────────────────────────────────────────────────────────────
  // No grading, no fail state — every pour becomes a named brew. If it's close
  // enough to a recipe in the book (secrets need a much closer match — see
  // matchThreshold) you get that curated name; otherwise a whimsical one-off
  // named from the blend itself.
  serve: () => {
    const { pours, discovered } = get();
    const ids = Object.keys(pours).filter((id) => pours[id] > 0.05);
    const { recipe, score } = bestMatch(pours);
    const goodEnough = !!recipe && score >= matchThreshold(recipe);

    // stamp the grimoire the first time a recipe is actually brewed
    let isNew = false;
    let nextDiscovered = discovered;
    if (goodEnough && !discovered.includes(recipe.id)) {
      nextDiscovered = [...discovered, recipe.id];
      isNew = true;
      persistDiscovered(nextDiscovered);
    }

    const intensity = computeIntensity(ids.length ? ids : ["moonpetal"]);
    let potion;
    let blurb;
    if (goodEnough) {
      const color = productColor(recipe.category, ids, intensity);
      potion = {
        name: recipe.name,
        color,
        category: recipe.category,
        vessel: pickVessel(recipe.category),
        recipeId: recipe.id, // → its own bespoke vessel (RecipeVessel.jsx)
        intensity,
      };
      blurb = recipe.blurb;
    } else {
      const cat = pickCategory(ids);
      const color = productColor(cat, ids, intensity);
      potion = {
        name: brewName(cat, ids, intensity),
        color,
        category: cat,
        vessel: pickVessel(cat),
        recipeId: null, // no recipe matched — generic category vessel
        intensity,
      };
      blurb = oddityBlurb(ids);
    }
    const icon = goodEnough ? recipe.icon : (CATEGORIES[potion.category]?.icon ?? "✨");

    set({
      phase: "served",
      discovered: nextDiscovered,
      potion,
      color: potion.color,
      result: {
        recipeId: goodEnough ? recipe.id : null,
        name: potion.name,
        icon,
        blurb,
        category: potion.category,
        color: potion.color,
        vessel: potion.vessel,
        secret: goodEnough && !!recipe.secret,
        isNew,
        ids,
      },
    });
  },

  // ── flow ─────────────────────────────────────────────────────────────────
  // Empty the pot and start fresh.
  reset: () =>
    set({
      pours: {},
      pouringId: null,
      phase: "idle",
      stirProgress: 0,
      result: null,
      potion: null,
      color: DEFAULT_LIQUID,
      inspecting: false,
    }),
}));

// Dev-only handle for debugging / e2e driving of the brew loop from the console.
if (import.meta.env.DEV && typeof window !== "undefined") {
  window.__brew = useBrew;
}
