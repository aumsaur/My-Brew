import { create } from "zustand";
import { overlayMenuSlice } from "@/sections/store";

export const useStore = create((set, get) => ({
  overlayMenuStore: overlayMenuSlice(set, get),
}));

// export default useStore;
