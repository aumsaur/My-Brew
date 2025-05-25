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
