import { useEffect, useState } from "react";

// WHAT IS UNDER THE CURSOR, said once, in one place.
//
// The cold store used to letter every item with a shelf tag: a plate and a
// line of type standing on the shelf in front of each grocery. Three of them
// at station distance is three labels competing with the things they label,
// and the type was too small to read from where the camera actually stands —
// so the room paid for signage nobody could use.
//
// A hover readout costs nothing until you point at something, appears at a
// size chosen for the SCREEN rather than for the shelf, and works the same
// way for every object in the room. The fridge lost its tags to this; the
// bar's sources, the bean bags and the cakes report through it too, so there
// is one answer to "what is that" no matter what you are pointing at.
//
// A MODULE-LEVEL CHANNEL rather than React state threaded through the scene.
// The things that hover are spread across six components inside the Canvas
// and the readout is DOM outside it; lifting a hover string through
// CoffeeRoom would re-render the whole room on every mouse move over a prop.
// This is the same shape as ids.js, and for the same reason.

let current = null;
const listeners = new Set();

/** Point at something. Pass null on the way out. */
export function setHovered(label) {
  // guard the common case: pointerout/pointerover fire in pairs as the
  // cursor crosses between two meshes of the SAME prop, and without this
  // every seam in a model is a flicker
  if (current === label) return;
  current = label;
  for (const fn of listeners) fn(current);
}

/**
 * Stop reporting `label`, but only if it is still the one showing.
 *
 * Leaving one prop for another fires the new prop's `over` BEFORE the old
 * prop's `out`, so an unconditional clear on the way out erases the label
 * that just arrived.
 */
export function clearHovered(label) {
  if (current === label) setHovered(null);
}

export function useHovered() {
  const [label, setLabel] = useState(current);
  useEffect(() => {
    listeners.add(setLabel);
    setLabel(current);
    return () => listeners.delete(setLabel);
  }, []);
  return label;
}
