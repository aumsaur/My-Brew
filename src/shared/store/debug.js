import { create } from "zustand";

// Dev-only UI state. Kept in a store so the DOM debug panel (outside the Canvas)
// and the in-scene markers (inside the Canvas) share one toggle.
export const useDebug = create((set) => ({
  showHotspots: false,
  toggleHotspots: () => set((s) => ({ showHotspots: !s.showHotspots })),
}));
