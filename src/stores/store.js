import { create } from "zustand";
import { overlayMenuSlice, playerSlice } from "@/sections/store";

export const useStore = create((set, get) => ({
  overlayMenuStore: overlayMenuSlice(set, get),
  playerStore: playerSlice(set, get),
}));

// export default useStore;
