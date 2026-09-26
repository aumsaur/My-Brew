import { useMemo } from "react";
import * as THREE from "three";

// The shared cup dimensions and its material.
//
// Split out of Vessel.jsx so that file only exports components: mixing
// constants and components in one module breaks fast refresh, and these are
// imported by the serve station, the machine and the vessel itself.

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
 * The SMALL CUP: a paper takeaway espresso cup.
 *
 * It was a handled glass tumbler, and the reason given was the mechanic —
 * the pour order is told by BANDS, and bands cannot be read through an
 * opaque wall, so the hot cup was made of glass to keep them legible.
 *
 * That reasoning holds and the cup changed anyway, because it was solving
 * the problem in the wrong place. A handled glass tumbler is a thing a cafe
 * owns; a paper cup is what an espresso is actually handed over in, and the
 * room is a self-serve corner. The bands are not lost either — they are on
 * the receipt, spelled out in order, and the tall glass is right there for
 * anyone who wants to watch them stack. Taking the paper cup is choosing
 * takeaway over the view, which is a choice a person makes at a counter.
 *
 * THE TAPER IS THE WHOLE SILHOUETTE. A paper cup is read by the cone: 31mm
 * across at the lip down to 22.5 at the base, which is far steeper than any
 * glass. Everything else — the rolled rim, the printed band, no handle —
 * hangs off that.
 */
export const MUG = shape({
  r: 0.031, // the lip
  rInner: 0.0225, // and the base it tapers down to
  h: 0.064,
  baseR: 0.0235,
  baseH: 0.004,
  floorH: 0.006,
  handle: false, // paper cups do not have one, which is why sleeves exist
  rim: true, // the rolled lip, and it is the tell at a distance
  paper: true,
  // MODELLED, not lofted from this record. The record still owns the
  // NUMBERS -- the taper, the height, where the floor sits -- and the mesh
  // was built to them in Blender, so the pour maths and the geometry
  // cannot drift apart. What the mesh adds is what a primitive cone has no
  // way to carry: a wall with thickness, so the lip is an edge you can see
  // rather than a zero-width line, and a rolled bead over it.
  model: "paper-cup.glb",
  // how far one sits down into the one below it when they are stacked
  nest: 0.013,
  // and how many the dispenser is loaded with. Paper is thin, so a sleeve of
  // eight is barely taller than three cups.
  stack: 8,
  cube: 0.01,
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
  // STACKABLE, because the tall vessel lives in a dispenser too — see
  // Dispenser in scene/ServeStation.
  //
  // 30mm of rise per glass, which is a fifth of its height and about what a
  // stacking tumbler gives you. The paper cup's 13mm is not available here
  // and the reason is the taper: a paper cup goes 31mm at the lip down to
  // 22.5 at the base, so it drops most of its length into the one below. A
  // tumbler runs 32 down to 28.5 over 140mm — 3.5mm of taper, and almost
  // nothing to nest into.
  nest: 0.03,
  // four, which is what fits under the cap at that pitch. Not a shorter
  // stack of the same fixture: the tube was sized to the stack.
  stack: 4,
  // cafe ice is chunky. Small cubes in a tall glass read as grit.
  cube: 0.0155,
});

/**
 * WHAT ESPRESSO LOOKS LIKE, as a surface. The COLOUR is espressoCss in
 * data/beans -- it moves with the roast and the shot length, so it cannot
 * live in a material -- and these are everything else about it.
 *
 * They are here, exported, because the same shot is drawn in two places by
 * two files: EspressoMachine pulls it into the demitasse, and ServeStation
 * stands that same demitasse on the bar. They each built their own material
 * and the two drifted -- 0.35 roughness and a full environment at the
 * machine against 0.62 and a quarter of one at the bar. Same colour in,
 * visibly different coffee out, which is the "why is it a different colour
 * over there" that kept getting reported and kept getting answered by
 * unifying the COLOUR, which was never the half that was broken.
 *
 * The bar's numbers won. Dark liquids go plasticky under this HDRI unless
 * they are rough and mostly ignore it.
 */
export const ESPRESSO_SURFACE = { roughness: 0.62, envMapIntensity: 0.25 };

/**
 * And the crema on top of it, which is the other half of the same bug.
 *
 * The machine drew one and the bar did not, so looking into the cup at the
 * machine showed a pale caramel lid and looking into the SAME CUP at the bar
 * showed dark coffee. No amount of agreeing about the body colour fixes
 * that: they were not drawing the same thing.
 */
export const CREMA_SURFACE = { color: "#c98d4d", roughness: 0.6 };
export const CREMA_T = 0.003; // how thick the disc is drawn

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
 * THE SAME GLASS, STACKED IN THE DISPENSER — and it cannot be the same
 * material, for a reason that is physical rather than cosmetic.
 *
 * useGlassMaterial is 0.11 and FrontSide, and both numbers were measured
 * against ONE wall with a drink behind it: at anything higher the espresso
 * band goes grey and the whole order-is-the-drink mechanic stops reading.
 * None of that applies to an empty glass in a tube. What applies instead is
 * that four nested glasses are EIGHT walls deep, seen through a tube that is
 * itself only 0.13 alpha — and at 0.11 a side the result was nothing at all.
 * The first build of this stack was invisible: the screenshot of four
 * glasses and the screenshot of three were the same image.
 *
 * So the stack gets the opacity its wall count has earned, and DoubleSide
 * because a glass you are looking INTO should show its far wall. No drink is
 * ever drawn through this, so it cannot tint a single band.
 */
export function useStackGlassMaterial() {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#d6e6ec",
        roughness: 0.06,
        metalness: 0.02,
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
        side: THREE.DoubleSide,
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
