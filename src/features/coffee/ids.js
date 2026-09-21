import { useEffect, useRef } from "react";

// NAMES FOR THINGS, so a change can be asked for instead of pointed at.
//
// "make the ice lid bigger" needs a shared word for the ice lid. Without one
// the loop is: describe it, guess wrong, screenshot, describe it again. Every
// addressable thing in the room carries an id, F2 paints them on screen, and
// clicking one copies it — so a request can name `scene.serve.lid` and land
// on the first try.
//
// TWO NAMESPACES, because the room has two kinds of thing and they are found
// in completely different ways:
//
//   ui.*     DOM. Tagged with a `data-ui-id` attribute and located with
//            getBoundingClientRect().
//   scene.*  3D. Registered here with the object itself, and projected
//            through the live camera every frame the overlay is up.
//
// IDS ARE STRUCTURAL, NEVER POSITIONAL. `ui.inventory.ring.roast` survives a
// re-layout; `ui.panel.3` is wrong the moment anything moves, and the counter
// is about to be re-spaced.
//
// The list of ids lives in `.claude/CONTROL.md`.

/** id -> Object3D. Module-level: the overlay is outside the Canvas. */
const registry = new Map();

export function sceneIdEntries() {
  return Array.from(registry.entries());
}

/**
 * Tag a 3D object. Returns a ref to spread onto a group or mesh.
 *
 * The OBJECT is registered rather than a position, so anything that moves —
 * the scoop on its pour, the lid on its hinge — reports where it actually is
 * rather than where it was authored.
 */
export function useSceneId(id) {
  const ref = useRef();
  useEffect(() => {
    const obj = ref.current;
    if (!obj) return undefined;
    registry.set(id, obj);
    return () => {
      // only drop it if nothing else has claimed the id since
      if (registry.get(id) === obj) registry.delete(id);
    };
  }, [id]);
  return ref;
}

/** Attribute spread for a DOM element: {...uiId("inventory")}. */
export function uiId(id) {
  return { "data-ui-id": id.startsWith("ui.") ? id : `ui.${id}` };
}
