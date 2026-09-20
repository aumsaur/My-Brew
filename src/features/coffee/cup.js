import { useMemo } from "react";
import * as THREE from "three";

// The shared cup dimensions and its material.
//
// Split out of Vessel.jsx so that file only exports components: mixing
// constants and components in one module breaks fast refresh, and these are
// imported by the milk bar, the machine and the vessel itself.

/** Derive the three numbers every vessel is actually used through. */
function shape(v) {
  return {
    ...v,
    floor: v.baseH + v.floorH, // inside bottom
    fill: v.h - v.floorH - 0.006, // usable depth, brim held back
    top: v.baseH + v.h, // the rim, which is what a pour is aimed at
  };
}

/**
 * The DEMITASSE. What the shot is pulled into at the machine and carried to
 * the bar in — never the serving vessel. Drawn at CUP_SCALE where it stands.
 */
export const CUP = shape({
  r: 0.052,
  rInner: 0.047,
  h: 0.088,
  baseR: 0.038,
  baseH: 0.009,
  floorH: 0.008,
  handle: true,
  cube: 0.011,
});
export const CUP_FLOOR = CUP.floor;
export const CUP_FILL = CUP.fill;

/**
 * The HOT CUP. Glass, not ceramic, and that is the mechanic again: the pour
 * order is told by the bands and an opaque cup has no bands. A handled glass
 * tumbler is a real cafe object and the one that can be both.
 *
 * Which of the two you get is decided by the fridge — see takeGlass. Ice
 * means a tall glass, no ice means this. That is how a bar works: the cup is
 * picked when the order is known, not chosen from a menu of glassware.
 */
export const MUG = shape({
  r: 0.038,
  rInner: 0.034,
  h: 0.076,
  baseR: 0.029,
  baseH: 0.007,
  floorH: 0.008,
  handle: true,
  rim: true,
  cube: 0.012,
});

/**
 * The SERVING GLASS: a tall cafe glass, drawn at its true size.
 *
 * It used to be the demitasse again, in glass instead of ceramic, and that
 * was the whole of what an iced drink looked like - a mug you could see
 * through. A cafe serves anything over ice in a 130mm glass, and the reason
 * is the reason this project needs one too: the drink is TOLD in bands, and
 * bands need height. Espresso over milk in a 70mm mug is two smudges; in this
 * it is a drink with a bottom and a top.
 *
 * No handle. A handle is what a hot cup has, and it is also what was poking
 * out of the one silhouette that has to read as glass.
 *
 * Fill is normalised (see POUR_VOLUME), so nothing about the drink logic
 * moves when this does: a lone shot is 30% of whatever it is poured into.
 */
export const SERVE = shape({
  r: 0.032, // 64mm across and 147 tall: a highball's 2.3:1, measured off one
  rInner: 0.0285,
  h: 0.14,
  baseR: 0.028,
  baseH: 0.007,
  floorH: 0.008,
  handle: false,
  rim: true,
  // cafe ice is chunky. Small cubes in a tall glass read as grit.
  cube: 0.0155,
});

/**
 * The RIM, and only the rim.
 *
 * The wall has to stay at 0.11 or the bands stop being the colours they were
 * measured to be — but at 0.11 an empty glass is not there at all, and a
 * half-poured one reads as liquid standing on the counter with nothing
 * around it. Real glassware is read off its edges, so the edge is where the
 * opacity goes. Above the liquid line, so it cannot tint a single band.
 */
export function useGlassRimMaterial() {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#dfeaee",
        roughness: 0.05,
        metalness: 0.02,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    []
  );
}

export function useCupMaterial() {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#efe7db",
        roughness: 0.55,
        // the wall is an OPEN cylinder, so the inside of the far wall is a
        // back face — single-sided you look straight through the cup
        side: THREE.DoubleSide,
      }),
    []
  );
}

/**
 * The SERVING vessel is glass, and that is a mechanic decision as much as a
 * styling one: the pour order is told by the bands, and bands inside an
 * opaque ceramic cup cannot be seen at all. A latte macchiato is served in a
 * glass in real life for exactly this reason.
 *
 * depthWrite off so the opaque contents inside still draw — three renders
 * opaque first, then blends transparent over the top.
 *
 * FrontSide and a low opacity, both measured rather than chosen. An espresso
 * band renders (67,48,40) with the glass hidden and (118,109,105) through it
 * at DoubleSide/0.34 — a neutral grey, and the dark-under-pale reading that
 * the whole order mechanic depends on was gone. The jump fits a TWO-layer
 * blend exactly: depthWrite off means the far wall is not rejected behind
 * the drink, so every band was being tinted towards white twice. FrontSide
 * draws the near wall only, and 0.11 of a wall that is not quite white puts
 * espresso back at ~(86,62,52) while milk and water barely move.
 */
export function useGlassMaterial() {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#cdd9dd",
        roughness: 0.08,
        metalness: 0.02,
        transparent: true,
        opacity: 0.11,
        depthWrite: false,
        side: THREE.FrontSide,
      }),
    []
  );
}

/**
 * Latte art, drawn once into a canvas and laid on the surface as a decal.
 *
 * A heart rather than a rosetta: it is the pour a beginner actually lands,
 * and it is the one shape that still reads when the drink is 40 pixels wide.
 * Earning it needs textured milk poured LAST — see hasArt in data/drinks —
 * because art sits on the surface, and milk that went in first is buried
 * under the shot.
 */
export function useArtTexture() {
  return useMemo(() => {
    const S = 128;
    const c = document.createElement("canvas");
    c.width = S;
    c.height = S;
    const g = c.getContext("2d");
    const cx = S / 2;
    const cy = S * 0.58;
    const r = S * 0.26;
    g.fillStyle = "#fffaf0";
    g.beginPath();
    g.moveTo(cx, cy + r);
    g.bezierCurveTo(
      cx - r * 2,
      cy - r * 0.45,
      cx - r * 0.55,
      cy - r * 1.7,
      cx,
      cy - r * 0.45
    );
    g.bezierCurveTo(
      cx + r * 0.55,
      cy - r * 1.7,
      cx + r * 2,
      cy - r * 0.45,
      cx,
      cy + r
    );
    g.fill();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

/** The ice: a few frosted cubes, not a pale slab that would read as milk. */
export function useIceMaterial() {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#e8f6fb",
        roughness: 0.18,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
      }),
    []
  );
}
