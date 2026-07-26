export const overlayMenuSlice = (set, get) => ({
  isOverlayMenuOpen: false,
  toggleOverlayMenu: () =>
    set(({ overlayMenuStore }) => ({
      overlayMenuStore: {
        ...overlayMenuStore,
        isOverlayMenuOpen: !overlayMenuStore.isOverlayMenuOpen,
      },
    })),
  closeOverlayMenu: () =>
    set(({ overlayMenuStore }) => ({
      overlayMenuStore: { ...overlayMenuStore, isOverlayMenuOpen: false },
    })),
});

// The lectern grimoire: clicking it flies the camera to the book (a virtual,
// non-scroll route) and fades in the book-content overlay. See Experience.jsx
// (CameraRig book blend) + GrimoireOverlay.jsx.
export const grimoireSlice = (set) => ({
  isBookOpen: false,
  openBook: () =>
    set(({ grimoireStore }) => ({
      grimoireStore: { ...grimoireStore, isBookOpen: true },
    })),
  closeBook: () =>
    set(({ grimoireStore }) => ({
      grimoireStore: { ...grimoireStore, isBookOpen: false },
    })),
});

// The workshop map: a fixed parchment chart of the scene, toggled by the
// rolled-scroll button. See features/map/WorkshopMap.jsx.
export const mapSlice = (set) => ({
  isMapOpen: false,
  toggleMap: () =>
    set(({ mapStore }) => ({
      mapStore: { ...mapStore, isMapOpen: !mapStore.isMapOpen },
    })),
  closeMap: () =>
    set(({ mapStore }) => ({
      mapStore: { ...mapStore, isMapOpen: false },
    })),
});

export const playerSlice = (set, get) => ({
  isPlaying: false,
  startPlaying: () =>
    set(({ playerStore }) => ({
      playerStore: { ...(playerStore || {}), isPlaying: true },
    })),
  stopPlaying: () =>
    set(({ playerStore }) => ({
      playerStore: { ...(playerStore || {}), isPlaying: false },
    })),
  hoveredName: "",
  setHoveredName: (name) =>
    set(({ playerStore }) => ({
      playerStore: { ...(playerStore || {}), hoveredName: name },
    })),
});
