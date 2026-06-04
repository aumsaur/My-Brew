import { create } from "zustand";
import {
  blendColor,
  brewName,
  pickCategory,
  pickVessel,
  productColor,
  computeIntensity,
  DEFAULT_LIQUID,
} from "@/features/brew/data/ingredients";

const MAX_INGREDIENTS = 4; // matches the four dial slots

// Shared brewing state between the DOM shelf (drag source) and the 3D cauldron
// (color + splash + falling-ingredient + rising-vessel reactions).
export const useBrew = create((set, get) => ({
  added: [], // ingredient ids, in the order dropped
  lastAdded: null, // id of the most recent drop (for the falling model)
  color: DEFAULT_LIQUID, // live blend of the added ingredients
  pulse: 0, // bumped on every add → drives a 3D splash + drop
  brewPulse: 0, // bumped when stirring starts → drives the cauldron swirl
  stirring: false, // stir animation in progress (product hidden until done)
  potion: null, // { name, color, category, vessel } once brewed
  dialOpen: false, // is the radial dial expanded over the cauldron
  inspecting: false, // is the brewed product open in the inspect overlay

  toggleDial: () => set((s) => ({ dialOpen: !s.dialOpen })),
  setDialOpen: (v) => set({ dialOpen: v }),
  setInspecting: (v) => set({ inspecting: v }),

  addIngredient: (id) => {
    const { added, potion } = get();
    if (added.length >= MAX_INGREDIENTS || potion) return;
    const next = [...added, id];
    set({
      added: next,
      lastAdded: id,
      color: blendColor(next),
      pulse: get().pulse + 1,
      dialOpen: true,
    });
  },

  // Pull one ingredient back out of the brew (from a dial slot)
  removeIngredient: (index) => {
    const { added, potion } = get();
    if (potion) return;
    const next = added.filter((_, i) => i !== index);
    set({
      added: next,
      color: blendColor(next),
      lastAdded: next[next.length - 1] ?? null,
    });
  },

  // Start the stir: kicks off the cauldron swirl + the stick's stir animation.
  // The product is NOT revealed yet — the StirStick calls brew() when its stir
  // finishes (see StirStick.jsx).
  startStir: () => {
    const { added, potion, stirring } = get();
    if (added.length < 1 || potion || stirring) return;
    set({ brewPulse: get().brewPulse + 1, stirring: true, dialOpen: false });
  },

  // Finalize the brew once the stir completes → reveals the rising product.
  brew: () => {
    const { added, potion } = get();
    if (added.length < 1 || potion) return; // even a lone ingredient brews
    const category = pickCategory(added);
    const intensity = computeIntensity(added);
    const color = productColor(category, added, intensity); // intensity-driven hue
    set({
      potion: {
        name: brewName(category, added, intensity),
        color,
        category,
        vessel: pickVessel(category),
        intensity,
      },
      color, // the cauldron settles to the finished product's color
      stirring: false,
    });
  },

  reset: () =>
    set({
      added: [],
      lastAdded: null,
      color: DEFAULT_LIQUID,
      potion: null,
      dialOpen: false,
      inspecting: false,
      stirring: false,
    }),
}));
