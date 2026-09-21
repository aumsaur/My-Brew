// Single source of truth for the coffee corner: where props stand, how big they
// are, and (via cameraRoutes.js) where the camera goes to look at them.
//
// Metres, floor at y = 0, camera looking down -Z at the wall.
//
// SCALE: each prop was modelled in its own units, so they are NOT mutually
// consistent. `scale` = real height / model height. Re-export a model at a
// different size and recompute it.
//
// The machine is deliberately past life size (0.58 where realistic is 0.39).
// It is the hero; strict realism made the counter read as four unrelated
// objects.
//
// `model` is the MEASURED glTF bounding box (centre + size, in model units).
// cameraRoutes derives look-at points and framing distances from it, so a prop
// that moves takes its camera route with it. These numbers come from reading
// the GLB accessor min/max — do not hand-edit; re-measure after a re-export.
export const FOV = 42;

export const LAYOUT = {
  counter: { w: 2.2, d: 0.62, h: 0.92 },
  board: { pos: [0.3, 0.932, 0.04], w: 0.64, d: 0.3, t: 0.024 },
  // `y` is the shelf board's CENTRE — boxGeometry is centred on its position —
  // so anything standing on it sits at y + t/2, never at y.
  shelf: { x: 0.42, y: 1.34, z: -0.28, w: 1.05, t: 0.05, d: 0.22 },

  machine: {
    pos: [-0.31, 0.92, 0.0], // +0.15 with the group - see serve
    scale: 0.58,
    model: { c: [0.0, 0.4, 0.0669], size: [0.52, 0.8, 0.6939] },
    foot: { c: [0.0, 0.01], r: 0.29 },
    view: [0.1, 0.34, 1],
    fit: 1.45,
    inspect: { view: [0.05, 0.22, 1], fit: 0.95 },
  },
  roaster: {
    pos: [0.2, 0.944, 0.05], // +0.15 with the group, then -0.09 - see serve
    scale: 1.39,
    model: { c: [0.016, 0.0721, 0.0045], size: [0.2061, 0.1442, 0.1351] },
    foot: { c: [0.0, 0.0045], r: 0.0871 },
    view: [0.06, 0.4, 1],
    fit: 1.5,
    inspect: { view: [0.1, 0.34, 1], fit: 0.95 },
  },
  grinder: {
    pos: [0.51, 0.944, 0.03], // +0.15 with the group, then -0.09 - see serve
    scale: 0.73,
    model: { c: [0.0203, 0.129, 0.0], size: [0.1053, 0.258, 0.0669] },
    foot: { c: [0.0, 0.0], r: 0.0315 },
    view: [0.08, 0.3, 1],
    fit: 1.5,
    // UNUSED by the rig: a hand grinder is HELD, so it uses HOLD_POSE below
    // and the camera does not move for it at all. Kept so the route map stays
    // uniform, and for anything that wants a static close-up of it in place.
    inspect: { view: [0.22, 0.2, 1], fit: 0.8 },
  },
  beans: {
    // y is DERIVED below — see the note under LAYOUT. Typed by hand it was
    // 1.37 against a shelf whose top is 1.365, and the bags floated 5mm.
    pos: [0.54, 0, -0.25],
    scale: 1.03,
    // the SHELF of bags, not one bag: four across at 0.115 spacing
    model: { c: [0.0, 0.0775, 0.002], size: [0.45, 0.155, 0.064] },
    view: [0.0, 0.18, 1],
    fit: 1.5,
    inspect: { view: [0.0, 0.14, 1], fit: 1.1 },
  },
  // The finishing station. Built from primitives (see scene/ServeStation), so
  // `model` is the tray-and-contents box rather than a measured GLB — the one
  // entry here that is authored rather than read off an export.
  serve: {
    // ROASTER AND GRINDER CAME BACK LEFT 90mm after the group move. The
    // uniform +0.15 kept every gap but left a 307mm hole between the
    // machine and the roaster — the middle of the counter reading as a gap
    // rather than as space. They now sit 217mm off the machine, and the
    // room to their right is the walk to the cold store.
    //
    // THE WHOLE COUNTER GROUP MOVED INBOARD BY 150mm (was -0.855).
    //
    // -0.855 left the 0.42-wide board ending at -1.065 against a counter edge
    // at -1.10: 35mm, which reads as falling off. Meanwhile everything was
    // bunched left and 600mm of counter sat empty on the right.
    //
    // The shift is UNIFORM across serve/machine/roaster/grinder, so every
    // gap between props is exactly what it was - only the margins change.
    // Now 185mm of counter to the left and ~450mm to the right, and the wider
    // right side is the approach to the fridge, so it wants the room.
    pos: [-0.705, 0.92, 0.04],
    scale: 1,
    // Authored, not measured - see above. `size[1]` covers a POUR, not the
    // resting station: a carafe carried over the glass stands 0.31 up, and
    // framing derived from the resting height cropped the top of every pour.
    model: { c: [0.0, 0.11, 0.0], size: [0.42, 0.3, 0.26] },
    foot: { c: [0.0, 0.0], r: 0.21 },
    view: [-0.12, 0.42, 1],
    fit: 1.5,
    inspect: { view: [-0.1, 0.34, 1], fit: 1.1 },
  },
  // THE CAKE FRIDGE: a glass-doored display cabinet standing on the floor,
  // NOT built into the counter. The first attempt cut it into the counter's
  // front and that is not what a cafe looks like -- the cake case is its own
  // piece of furniture you walk up to.
  //
  // It MIRRORS THE COLD STORE. That one stands at x 1.36 and the overview
  // frame runs about -1.26..1.02, so it is half out of shot at the right and
  // reached by clicking its sign. -1.42 gives the room the same bookend on
  // the left, and the counter's left end at -1.10 leaves 0.1m of daylight.
  //
  // `pos` is the FLOOR, like the cold store's, so `c` lifts to the centre.
  display: {
    pos: [-1.42, 0, -0.02],
    scale: 1,
    model: { c: [0.0, 0.775, 0.0], size: [0.6, 1.55, 0.56] },
    // a touch off-axis, so the door's glass reads as glass rather than as a
    // flat grey pane straight on
    view: [-0.24, 0.1, 1],
    fit: 1.2,
    inspect: { view: [-0.16, 0.06, 1], fit: 0.95 },
  },
  fridge: {
    pos: [1.36, 0, -0.04],
    scale: 0.88,
    model: { c: [0.0, 0.765, 0.0862], size: [0.76, 1.67, 0.8923] },
    // Slightly front-LEFT: the door hinges on +X and swings toward the viewer,
    // so some left offset is needed to see past it. Only SOME, though — at
    // -0.5 the near interior wall hid the carton on the left shelf almost
    // completely, and one of the three projects was undiscoverable.
    view: [-0.26, 0.15, 1],
    fit: 1.18,
    inspect: { view: [-0.26, 0.15, 1], fit: 1.05 },
  },
};

// Every prop's model origin is at its BASE, so "standing on" a surface means
// pos.y === that surface's top. Derive it rather than typing it: the machine,
// roaster and grinder all happened to be exact, the bean bags were 5mm out and
// visibly floating, and nothing in the file said which was which.
LAYOUT.beans.pos[1] = LAYOUT.shelf.y + LAYOUT.shelf.t / 2;

/** World-space centre of a prop, from its layout position and measured AABB. */
export function worldCentre(key) {
  const p = LAYOUT[key];
  return [
    p.pos[0] + p.model.c[0] * p.scale,
    p.pos[1] + p.model.c[1] * p.scale,
    p.pos[2] + p.model.c[2] * p.scale,
  ];
}

/**
 * Distance that frames a prop at FOV. `mode` picks the normal standing-back
 * framing or the tight handling one used while a station is actually in use -
 * a hand grinder wants to be in your hands, not watched across the counter.
 */
export function framingDistance(key, mode = "focus") {
  const p = LAYOUT[key];
  const fit = mode === "inspect" ? (p.inspect?.fit ?? p.fit) : p.fit;
  const radius = (Math.max(...p.model.size) * p.scale) / 2;
  return (radius / Math.tan(((FOV / 2) * Math.PI) / 180)) * fit;
}

export function viewDir(key, mode = "focus") {
  const p = LAYOUT[key];
  return mode === "inspect" ? (p.inspect?.view ?? p.view) : p.view;
}

/**
 * Where a prop actually TOUCHES the surface, and how wide that contact is.
 *
 * Not the same as the AABB, and the difference is visible: the grinder's crank
 * arm sits 200mm up and reaches sideways, the machine's steam wand hangs off
 * the front. Both drag the full bounding box off the axis the prop really
 * stands on — the beacon ring drawn from it landed 15mm and 33mm off centre
 * and two-thirds too wide.
 *
 * `foot` is measured the same way `model` is: from the GLB, taking the meshes
 * whose base falls in the bottom quarter of the model. `c` is [x, z] only —
 * a footprint has no height. Props without one fall back to the AABB, which
 * is correct for anything that is as wide at the bottom as it is anywhere.
 */
export function footprint(key) {
  const p = LAYOUT[key];
  const f = p.foot ?? {
    c: [p.model.c[0], p.model.c[2]],
    r: Math.max(p.model.size[0], p.model.size[2]) / 2,
  };
  return {
    x: p.pos[0] + f.c[0] * p.scale,
    y: p.pos[1],
    z: p.pos[2] + f.c[1] * p.scale,
    r: f.r * p.scale,
  };
}

/** World-space Y of a prop's highest point — where a marker floats above it. */
export function topOf(key) {
  const p = LAYOUT[key];
  return p.pos[1] + (p.model.c[1] + p.model.size[1] / 2) * p.scale;
}

/**
 * Where a milk jug stands to be steamed: under the steam wand's tip, on the
 * drip grate. Measured from espresso-machine.glb — the wand node sits at
 * (0.178, 0.428, 0.15) and its tip reaches 0.254 below that, and the grate
 * tops out at y = 0.14. Re-measure if the machine is re-exported.
 *
 * Lives here rather than in ServeStation because it is a fact about the MACHINE,
 * and ServeStation has no reason to load the machine's GLB to find it out.
 */
export function steamPose() {
  const m = LAYOUT.machine;
  return [
    m.pos[0] + 0.186 * m.scale,
    m.pos[1] + 0.14 * m.scale,
    m.pos[2] + 0.187 * m.scale,
  ];
}

/**
 * Where the shot cup stands under the group head, in WORLD space. The cup is
 * drawn by EspressoMachine while you pull, and then carried to the finishing
 * station — so both ends of that journey need the same number, and it is a
 * fact about the machine.
 */
export function cupPose() {
  const m = LAYOUT.machine;
  return [m.pos[0], m.pos[1] + 0.14 * m.scale, m.pos[2] + 0.17 * m.scale];
}

/**
 * How the GRINDER is framed while you hold it — see useHeldPose, which the
 * fridge's shelf items share.
 *
 * Note what is NOT here: a distance. It used to be 0.40m, hand-picked for this
 * one prop, and the moment a second thing could be held that constant was
 * wrong for it and the blur focused on empty air. `fit` is the fraction of
 * frame HEIGHT the object should fill and the distance falls out of the
 * object's own size, so everything you pick up reads the same size whatever it
 * actually measures.
 *
 * frameX/frameY are fractions of frame WIDTH/HEIGHT, so the composition holds
 * at any aspect instead of drifting on a wide monitor.
 */
export const HOLD_POSE = {
  fit: 0.61,
  frameX: 0.03,
  // biased slightly up: the meter owns the bottom band of the screen
  frameY: 0.04,
  // turned off-axis so the crank arm sweeps across the view instead of
  // spinning edge-on, and tipped back into the hopper
  tilt: [0.12, -0.62, 0.04],
};
