export const overlayMenuSlice = (set, get) => ({
  isOverlayMenuOpen: false,
  toggleOverlayMenu: () =>
    set(({ overlayMenuStore }) => ({
      overlayMenuStore: {
        ...overlayMenuStore,
        isOverlayMenuOpen: !overlayMenuStore.isOverlayMenuOpen,
      },
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
