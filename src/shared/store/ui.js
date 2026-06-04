import { create } from "zustand";
import { overlayMenuSlice, playerSlice } from "./uiSlices";

// UI store: overlay menu + first-person player state (consumed by Overlay.jsx).
export const useStore = create((set, get) => ({
  overlayMenuStore: overlayMenuSlice(set, get),
  playerStore: playerSlice(set, get),
}));
