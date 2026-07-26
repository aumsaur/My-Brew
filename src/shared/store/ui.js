import { create } from "zustand";
import {
  overlayMenuSlice,
  grimoireSlice,
  mapSlice,
  playerSlice,
} from "./uiSlices";

// UI store: overlay menu + lectern grimoire + workshop map + player state.
export const useStore = create((set, get) => ({
  overlayMenuStore: overlayMenuSlice(set, get),
  grimoireStore: grimoireSlice(set, get),
  mapStore: mapSlice(set, get),
  playerStore: playerSlice(set, get),
}));

// Dev-only handle for debugging / e2e driving of the overlays from the console.
if (import.meta.env.DEV && typeof window !== "undefined") {
  window.__ui = useStore;
}
