import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, useCursor, useGLTF } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import * as THREE from "three";
import { PALETTE } from "@/features/coffee/palette";
import { swallowClicks } from "@/features/coffee/clickGate";
import {
  setHovered as setHoveredLabel,
  clearHovered,
} from "@/features/coffee/hover";
import { POUR_COLOUR, stackOf } from "@/features/coffee/data/drinks";
import { espressoCss, espressoBandCss } from "@/features/coffee/data/beans";
import {
  CUP,
  CUP_FLOOR,
  CUP_FILL,
  SERVE,
  MUG,
  useCupMaterial,
  useGlassMaterial,
  useGlassRimMaterial,
  useIceMaterial,
  useStackGlassMaterial,
  ESPRESSO_SURFACE,
  CREMA_SURFACE,
  CREMA_T,
} from "@/features/coffee/cup";
import { Contents, CupBody } from "@/features/coffee/scene/Vessel";
import Steam from "@/features/coffee/scene/Steam";
import { IdTag } from "@/features/coffee/scene/SceneIds";
import { useSceneId } from "@/features/coffee/ids";

// Everything painted on a thing in this room is LETTERED in the same hand;
// see scene/WallSign. A mix of faces reads as accidental.
const FONT = `${import.meta.env.BASE_URL}fonts/Tealand.ttf`;

// The finishing station: where a shot becomes a drink.
//
// THE ORDER IS THE DRINK. You take a glass, then put things in it in whatever
// sequence you like, and the sequence is what you get judged on: long black
// and americano are the same two things poured in opposite orders, and so are
// latte and latte macchiato. See data/drinks.
//
// A POUR IS A CARRY. The vessel leaves its place, travels over the glass,
// tips, runs, tips back and goes home, and the level rises while the stream
// is actually falling. It used to tip over where it stood: a bottle 100mm
// from the glass fell on its face, liquid appeared in mid-air above a glass
// that did not change, and the level jumped on the single frame the stream
// switched off. Three clocks, none of them agreeing.
//
// NOTHING IS ON THE SERVE STATION THAT IS NOT IN PLAY. Milk, juice and ice come out of
// the fridge and only appear once fetched; the shot cup arrives from the
// machine. Six permanent objects wanted about half a metre of counter and
// there is 0.38m, and no arrangement of x ever fixed that — so the fix is
// that most of them are not permanent.
//
//   rack      click to take a glass. Nothing goes in until you have one.
//   carton    THE MILK YOU CARRIED OUT OF THE FRIDGE — cold, straight in
//   jug       the same milk after the WAND on the machine has been in it.
//             Two vessels, because one click cannot mean both.
//   ice well  SUNK INTO THE COUNTER, scooped with the scoop resting in it
//   carafe    hot water            syrup   chocolate
//   shot cup  arrives from the machine — click to pour the espresso
//   oj box    orange juice         bell    click to serve
const FOAM = "#fffdf8";
const STEEL = "#c3c7cb";
const GLASS = "#cfe0e6";
const SYRUP = "#4a2c1b";
const BRASS = "#c9974a";
const JUICE = "#e08a24";
const CARTON = "#f2efe6";

// A RAISED BACK SHELF for the tall sources. Shuffling x only ever traded one
// collision for another — the serving glass ended up in front of the carafe,
// two transparent things stacked into soup. Standing them 50mm up turns that
// overlap into depth, which is what a real bar does with its bottles.
// A PREP BOARD, not a tray: 45mm thick, because the ice well is sunk into it
// and you cannot sink anything into 16mm. Widened 0.38 -> 0.42 to buy the
// well its corner — the station moved inboard at the same time, so there is
// counter under all of it now (see layout.serve).
const TRAY = { w: 0.42, d: 0.26, t: 0.045 };
const SHELF = { z: -0.085, d: 0.09, h: 0.05 };
const TOP = TRAY.t;
const SHELF_TOP = TOP + SHELF.h;
const FRONT_Z = 0.055;

// TWO VESSELS, and the rack holds both as SEPARATE targets: a stack of cups
// and a stack of tall glasses, and you take the one you want. (This comment
// used to claim the rack was a single control that chose for you. It never
// was — onTakeGlass has always been handed the kind you clicked — and the
// claim only looked true because the whole station was inert until the shot
// was pulled, so nobody got to choose anything.)
//
// You cannot know which vessel you need before you know what you are making,
// so the choice stays open: swap freely until the first pour lands.
//
// Front and back rather than side by side, because side by side does not fit.
// Two stacks need 160mm of x; the board has 420mm and the well, the shot cup
// and the drink itself want the rest. Widening it is not available either —
// at 500mm it hangs off the counter edge again at one end and hits the
// machine at the other. Depth was the axis with room in it.
const SHAPES = { mug: MUG, tall: SERVE };
// WHAT EACH TARGET IS CALLED, for the readout over the hotbar. Keyed off
// the same strings the hover/outline already uses, so a control cannot be
// hoverable without being nameable.
const SAY = {
  ice: "ice — from the well",
  carton: "cold milk",
  jug: "steamed milk",
  water: "hot water",
  choc: "chocolate syrup",
  oj: "orange juice",
  shot: "the shot you pulled",
  stir: "the drink — click to stir it",
  bell: "the bell — ring to serve",
};
const GLASS_X = -0.1;
const SHOT_X = 0.01;

// WHERE THE VESSELS LIVE, and there is no shelf any more.
//
// There was one: a wooden ledge on the wall with the glasses hung under it.
// It had to go for the same reason the cup dispenser could not stay on it —
// the riser stands directly in front of that wall and the steam jug is
// taller than the shelf's underside, so everything kept there was behind a
// jug from the only angle this station is seen at. A shelf you cannot see
// the contents of is a shelf carrying nothing.
//
// So the two vessels are wall fixtures instead, side by side, LEFT of the
// riser where nothing on the counter can get in front of them. Measured
// against the riser rather than chosen: the board ends at x -0.21, so
// anything past that is clear.
// z puts the bracket's back face ON the wall (the room's wall face is at
// world -0.38, which is -0.42 in this group), rather than through it.
//
// TWO DISPENSERS, NOT A DISPENSER AND A RACK. The tall glass used to hang
// upside down in a wire ring, which is how a bar keeps glass so it drains --
// honest, and beside a loaded cup dispenser it read as the one vessel there
// was only one of. A stack says "take one, there are more"; a single hanging
// glass says "this is the glass".
//
// So it is the same fixture twice, in two lengths, which is also what a
// self-serve corner actually has: paper cups for hot, clear cups for cold,
// a tube of each. `top` is where the clear tube ends -- see Dispenser, which
// stretches the one model to it.
const DISP_MODEL = `${import.meta.env.BASE_URL}models/cup-dispenser.glb`;
const FIX = {
  mug: { x: -0.225, y: 0.085, z: -0.37, top: 0.195 },
  // 27mm longer, and that is the whole difference. Four 147mm glasses at a
  // 30mm pitch stand 209mm up from the mouth, so the tube tops out at 222
  // and the cap at 240 -- against a frame that crops this wall at 0.39 local.
  // (The 286mm first cut of the paper dispenser ran off the top of it. Both
  // numbers came off a view-projection probe rather than a guess.)
  tall: { x: -0.345, y: 0.085, z: -0.37, top: 0.222 },
};
// where each vessel starts its trip to the mat: the mouth of its own tube,
// which is where the bottom one of the stack is drawn
const HOME = {
  mug: [FIX.mug.x, FIX.mug.y - 0.028, FIX.mug.z],
  tall: [FIX.tall.x, FIX.tall.y - 0.028, FIX.tall.z],
};
// THE ICE WELL. A cafe does not keep a tub of ice on the bar; it keeps a
// LIDDED well in the counter with a scoop in it, because ice on the counter
// is a puddle in ten minutes and an open well is a puddle in an hour. The
// well is always full: what the freezer is for is the drink, not the bin.
//
// SHALLOW IN Z, and that is the lid's doing. At 98mm deep, a lid over this
// is a 120mm steel plate standing in the middle of a 420mm bar the moment it
// opens — taller than the tall glass, straight across the juice and the
// bell. At 56mm the open lid lands on the riser's front edge instead and
// stops at the riser's own height, so it adds nothing to the silhouette.
// The width took the capacity back, and the 42mm it gave up in front is
// clear board.
// GROWN ~20% (was 0.09 x 0.056). At the old size the well and its lid read
// as a detail on the board rather than a fitting you use, and the lid -- the
// bit that actually moves -- was the smallest moving thing in the room.
//
// The depth is still the lid's constraint, not the well's: LID_OPEN is
// derived from where the open lid lands on the riser, so `d` growing moves
// that landing rather than breaking it. Clearance re-checked: the well now
// spans x 0.091..0.199 against a board half-width of 0.21, and the bell at
// x 0.18 sits on the riser at z -0.085 while the well is at z -0.009..0.057,
// so they miss each other in depth rather than by luck.
// BIGGER AGAIN, and moved off the edge. 0.09 -> 0.108 was too timid to
// read as a change at all; 0.13 is half as wide again as the original and
// the lid, being WELL.w + 0.02, grows with it.
//
// x came in from 0.145 to 0.115 because the old right edge was 0.199
// against a board edge of 0.21 — 11mm, which is what "on the edge" meant.
// It now sits 0.05..0.18 with 30mm of board outside it, and still clears
// the shot cup (0.032) by 18mm.
//
// The bell at x 0.18 overlaps in x and misses in DEPTH: the bell is on the
// riser at z -0.085 and the well runs z -0.015..0.063, so the open lid --
// which stops on the riser's front edge at -0.04 — never reaches it.
const WELL = { x: 0.115, z: 0.024, w: 0.13, d: 0.078, deep: 0.032 };
const WELL_CUBE = 0.0155; // ice in the well, sized to the well not the glass

// A SCOOP IS A SHOVEL. This was a hemisphere on a stick, which is a ladle —
// a shape for liquid, and the one thing a scoop must not be, because a
// scoop is pushed THROUGH the ice and a round bottom will not do that. The
// real thing is a trough: flat-ish bottom, sides that come up past half,
// closed at the handle end, and wide open at the other, with the bottom
// running on past the sides as a lip. It is built along x with the mouth at
// -x, because -x is where the glass is and the pour tips it that way.
const SCOOP = { r: 0.0155, len: 0.04, h: 0.023, grip: 0.03 };
// MODELLED IN BLENDER, unlike the rest of this bar. The primitive
// version of the scoop was a half-cylinder, a disc, a box and a rod,
// and it kept reading as a gutter with a stick in it: a real scoop's
// mouth is RAKED, the floor reaching forward of the sides to get under
// the ice, and that curve is free in a mesh and awkward in primitives.
// Authored at the numbers above, in metres, so it needs no scale entry.
const SCOOP_MODEL = `${import.meta.env.BASE_URL}models/ice-scoop.glb`;
const CARAFE_MODEL = `${import.meta.env.BASE_URL}models/water-carafe.glb`;
// ONE BOTTLE, MANY FLAVOURS. A pump bottle is a pump bottle whether it
// holds vanilla or chocolate, so the model is shared and the FILL and
// LABEL nodes carry the flavour. The old chocolate was a stubby capped
// cylinder, which is a protein powder tub, not a syrup bottle -- the
// pump is the entire silhouette.
const SYRUP_MODEL = `${import.meta.env.BASE_URL}models/syrup-bottle.glb`;
const JUICE_MODEL = `${import.meta.env.BASE_URL}models/juice-jug.glb`;
// what each flavour paints on the shared bottle
const SYRUPS = {
  chocolate: { fill: "#1a0d05", label: "#5c3320" },
  vanilla: { fill: "#c79a52", label: "#e8d3a8" },
};
// It rests NOSE DOWN in the ice and turned a few degrees off square,
// because that is how a scoop that has been used is lying. Square to the
// well and level, it reads as a part of the fitting rather than a tool
// somebody put down. The pour blends out of both.
const SCOOP_REST = -0.26;
const SCOOP_SKEW = 0.22;

// WHAT STANDS BEHIND THE SERVING GLASS IS A DECISION, not a leftover. The
// glass is transparent and the carafe is transparent, and with the carafe on
// the shelf directly behind it the two stacked into exactly the soup the
// riser was built to avoid — you could not tell where the drink ended. The
// jug is opaque steel and as wide as the glass, so it goes there instead and
// the drink reads against it.
const JUG = { x: -0.093, r: 0.034, rTop: 0.04, h: 0.098 };
// THE CARTON, and the reason it exists.
//
// The milk used to be one steel jug doing two jobs — cold milk and steamed
// milk poured from the same object — so the white carton you picked off the
// fridge shelf arrived at the bar as a completely different thing. It was
// the only prop in the room that changed shape while you were carrying it,
// and it made the fridge trip read as a menu tick rather than as fetching
// something: you went and got the milk, and the milk was not there.
//
// So the carton comes with you. It stands to the LEFT of the jug, which is
// the one gap on the riser wide enough for it: the riser runs -0.21..0.21
// and the jug's shoulder reaches -0.14, leaving 70mm for a 40mm box with
// 18mm of daylight either side.
// THE SAME CARTON THE FRIDGE HOLDS, and that is the fix. It used to be a
// 40x86mm box of primitives here while the fridge shelf held a 132x260mm
// one, so the thing you carried out changed size as well as shape on the
// way to the bar. One model, one set of numbers, both places.
//
// 62x139mm, and the width is not a taste decision: the riser's left slot
// runs from its edge at -0.21 to the jug's shoulder at -0.14, so 70mm is all
// there is. At 80mm the carton hung off the end of the board. x is pinned
// the same way -- 4mm of daylight either side is the whole budget.
//
// The fridge's groceries are chunkier than the bar's props (its jar is
// 129mm across), so one honest size cannot flatter both rooms. The bar wins
// because that is where the carton is a tool rather than set dressing.
const CTN = { x: -0.179, w: 0.062, h: 0.1395 };
const CARTON_MODEL = `${import.meta.env.BASE_URL}models/milk-carton.glb`;
// The modelled carafe is 86mm across the handle and spout, and the gap
// between the jug's shoulder (-0.060) and the syrup (0.036) is 96mm — so x
// is centred in it rather than left at -0.01, which put the handle 1mm into
// the syrup. `r`/`h` stay: they are what the water level and the pour maths
// read, not the vessel's own size.
const CAR = { x: 0.005, r: 0.028, rTop: 0.032, h: 0.104 };
// `h` is the POUR MOUTH height, not the model's -- the bottle stands 148mm
// but it dispenses from the pump's spout at 134mm, and the pour maths aims
// by the lip.
const SYR = { x: 0.088, r: 0.0253, h: 0.134 };
// A SMALL-GALLON JUICE JUG, 80 x 58 x 132. The squat rounded-square body a
// supermarket half gallon comes in, sleeved with a label, a moulded loop
// handle off one side and a short neck leaning the other way under a big
// screw cap.
//
// It replaces a tall 2L bottle, and the shape carries the difference: a
// bottle next to the water carafe and the syrup was a third tall cylinder
// in a row of them. This is the only thing on the riser you could not
// mistake for a bottle at a glance, which is the whole job of a prop that
// has to be recognised in a 40-pixel silhouette.
//
// THE PROPORTIONS ARE THE REAL JUG'S, not eyeballed: the handle stands a
// third of the body's width proud and the hole through it is about a fifth
// of that width. Held to that it comes out 80mm across — NARROWER than the
// bottle it replaces, and 24mm shorter, which the riser wanted both of.
//
// The origin is NOT its centre: the body is centred on x but the handle
// reaches to +0.049, so the jug occupies -0.031..+0.049 around it. `h` is
// the pour mouth — the cap, which is where the lip actually is.
const OJ = { x: 0.158, w: 0.0798, h: 0.132 };
// on the back shelf, out of the prep space. It is a bell, not an ingredient —
// the front row is for things that go in the glass.
// THE BELL CAME OFF THE RISER. With a 2L jug in the row, six vessels came
// to 405mm of a 420mm shelf -- 3mm gaps, which is touching. The bell is the
// one thing up there that is not a pour source, and the back of a shelf was
// always the wrong home for it: you ring a service bell at the counter
// EDGE, where a customer can reach it, not behind the bottles.
//
// Front-right of the board, clear of the ice well (which ends at z 0.063).
// The four vessels left on the riser get 14.8mm gaps: carton -0.179,
// pitcher -0.093, carafe 0.005, syrup 0.088, jug 0.158.
const BELL = { x: 0.185, z: 0.1, r: 0.022 };
// The demitasse, at the SAME size the machine draws it: the machine builds it
// in model units inside a group scaled 0.58, and drawing it at 0.8 here meant
// the cup grew 38% on the flight over. It is also the wrong read — a 104mm
// mug next to a 68mm glass looks like the serving vessel.
const CUP_SCALE = 0.58;

// The board, cut into four rails around the well's opening. A recess has to
// be an actual HOLE: a well drawn inside a solid slab sits behind the slab's
// own top face, and from the only angle this station is ever seen from that
// is not a well at all.
const W0 = WELL.x - WELL.w / 2;
const W1 = WELL.x + WELL.w / 2;
const Z0 = WELL.z - WELL.d / 2;
const Z1 = WELL.z + WELL.d / 2;
const HX = TRAY.w / 2;
const HZ = TRAY.d / 2;
const BOARD = [
  // [centre x, width, centre z, depth]
  [(-HX + W0) / 2, W0 + HX, 0, TRAY.d],
  [(W1 + HX) / 2, HX - W1, 0, TRAY.d],
  [WELL.x, WELL.w, (-HZ + Z0) / 2, Z0 + HZ],
  [WELL.x, WELL.w, (Z1 + HZ) / 2, HZ - Z1],
];
// the stainless collar around the opening, 1mm proud
const COLLAR = [
  [W0 - 0.004, 0.008, WELL.z, WELL.d + 0.016],
  [W1 + 0.004, 0.008, WELL.z, WELL.d + 0.016],
  [WELL.x, WELL.w, Z0 - 0.004, 0.008],
  [WELL.x, WELL.w, Z1 + 0.004, 0.008],
];
// THE LID, hinged along the back edge just behind the collar.
//
// HOW FAR IT OPENS IS NOT A TASTE. It is the angle at which the lid's
// underside comes down on the front top edge of the riser — so it leans on
// the shelf, the way a lid on a counter actually ends up. Derived from the
// two of them: move the well or the riser and the angle follows.
const LID = { w: WELL.w + 0.02, d: WELL.d + 0.02, t: 0.0045 };
const HINGE_Z = Z0 - 0.012;
const LID_OPEN = -Math.atan2(SHELF.h, HINGE_Z - (SHELF.z + SHELF.d / 2));

// WHAT IS IN THE WELL, as [x, layer, z, spin] in well-normalised units.
//
// Two layers, and the top one is at 0.9 rather than half way: a well filled
// to the middle is a well you cannot see into from a camera that is nearly
// level with the counter, and "still no ice" was exactly that. 0.9 puts the
// top faces 2mm under the board — heaped, the way a bin that gets used is,
// and still clear of the closed lid.
//
// The heap is weighted to the BACK (negative z) for the same reason the
// scoop was moved to the front: the back of the hole is the part in view.
const WELL_ICE = [
  [-0.7, 0.0, -0.62, 0.4],
  [0.0, 0.06, -0.7, 1.2],
  [0.7, 0.0, -0.58, 2.1],
  [-0.72, 0.1, 0.1, 0.8],
  [0.05, 0.0, 0.0, 1.7],
  [0.72, 0.08, 0.15, 0.3],
  [-0.3, 0.02, 0.7, 2.8],
  [0.45, 0.0, 0.72, 1.9],
  [-0.52, 0.9, -0.55, 1.1],
  [0.24, 0.88, -0.62, 2.4],
  [-0.06, 0.9, -0.12, 0.6],
  [0.6, 0.86, -0.2, 1.5],
];

const MILK_LEVEL = 0.055;
const WATER_LEVEL = 0.056;
// HOW MUCH ESPRESSO ARRIVED. This was a flat CUP_FILL * 0.32, so a
// ristretto and a lungo both turned up as a third of a cup: the machine
// fills its cup with `shot * CUP_FILL` and the bar redrew it at a constant.
// The volume you pulled is the one thing the walk between the two stations
// must not lose. Same formula as EspressoMachine now, so they agree by
// construction rather than by two numbers being kept in step.
const shotLevel = (shot) => CUP_FILL * Math.max(0.04, shot);
const PUFFS = 6;

// How high a vessel hangs while it pours, and where its lip must land.
// Derived, not typed: the glass rim is at TOP + (baseH + h) * CUP_SCALE.
const TILT = 1.4; // ~80 degrees: a vessel emptying, not one merely leaning
const MOUTH_X = GLASS_X;
const MOUTH_UP = 0.05; // how far above the rim the pouring lip hangs

// Two milk POURS, and now two VESSELS to match. Keeping the kinds distinct is
// what lets the art be earned rather than assumed: with a single "milk" kind,
// `pours` could not say whether the milk that went in was the textured one.
// They shared the jug until the carton arrived, and that sharing is what this
// map used to paper over — it is a real fork now, not an alias.
const VESSEL = { milk: "carton", "milk-steamed": "jug" };
const vesselOf = (k) => (k ? (VESSEL[k] ?? k) : null);

const _v = new THREE.Vector3();
const _home = {
  jug: new THREE.Vector3(JUG.x, SHELF_TOP, SHELF.z),
  carton: new THREE.Vector3(CTN.x, SHELF_TOP, SHELF.z),
  water: new THREE.Vector3(CAR.x, SHELF_TOP, SHELF.z),
  chocolate: new THREE.Vector3(SYR.x, SHELF_TOP, SHELF.z),
  orange: new THREE.Vector3(OJ.x, SHELF_TOP, SHELF.z),
  // The scoop rests in the well, on the ice, and FORWARD in it. Looking
  // down into a hole from in front, the part you can see is the far side —
  // so a scoop parked in the middle is a scoop parked over the only ice
  // there was any point drawing.
  ice: new THREE.Vector3(WELL.x, TOP - 0.012, WELL.z + 0.008),
  espresso: new THREE.Vector3(SHOT_X, TOP, FRONT_Z),
};
// where each vessel's mouth is above its own base, so the stream starts there
const _mouthH = {
  jug: JUG.h,
  carton: CTN.h,
  water: CAR.h,
  chocolate: SYR.h, // the pump's spout, already the mouth height
  orange: OJ.h,
  ice: SCOOP.h,
  espresso: (CUP.baseH + CUP.h) * CUP_SCALE,
};
// Each vessel approaches from the side it already stands on and tips TOWARDS
// the glass. Two things are derived here rather than typed:
//
//   the SIGN — tilt() used to be flatly negative, so most of them tipped away
//   from the glass they were supposed to be filling;
//
//   the POSITION, backed out from where the LIP must be. Placing the base and
//   letting the lip fall where it may put a 104mm carafe pouring from 70mm
//   above the rim: a stream longer than the glass is tall, arriving from a
//   vessel that was plainly not over it. A pour is aimed by its spout.
//
// A FUNCTION of the rim, now that there are two vessels: a cup's rim is 60mm
// lower than a tall glass's, and pouring at the glass's height into the cup
// would hang every source in mid-air. Memoised per shape in the component —
// the sign rule and the beats are untouched, only the two anchor numbers
// move.
function targetsFor(rim) {
  const mouthY = TOP + rim + MOUTH_UP;
  return Object.fromEntries(
    Object.entries(_home).map(([kind, home]) => {
      const rot = (home.x < GLASS_X ? -1 : 1) * TILT;
      const h = _mouthH[kind];
      return [
        kind,
        {
          rot,
          at: new THREE.Vector3(
            MOUTH_X + Math.sin(rot) * h,
            mouthY - Math.cos(rot) * h,
            FRONT_Z
          ),
        },
      ];
    })
  );
}

/**
 * One pour, split into the beats a pour actually has.
 *
 *   0.00-0.30  carry it over
 *   0.30-0.44  tip
 *   0.44-0.72  RUN - stream on, source drains, level rises, all three at once
 *   0.72-0.86  tip back
 *   0.86-1.00  carry it home
 */
function beats(t) {
  const ss = THREE.MathUtils.smoothstep;
  return {
    carry: ss(t, 0, 0.3) - ss(t, 0.86, 1),
    tip: ss(t, 0.3, 0.44) - ss(t, 0.72, 0.86),
    flow: THREE.MathUtils.clamp((t - 0.44) / 0.28, 0, 1),
  };
}

/**
 * THE CUP DISPENSER, modelled — see .dev/blender. A clear tube with a cap
 * on top and an opaque shroud at the bottom, screwed to the wall, with the
 * stack visible through the tube and the lowest cup poking out under the
 * shroud where your hand goes.
 *
 * The first two attempts were a loose stack on a shelf and then a wire
 * cage, and both were a different object: a cage is something you hang cups
 * IN, and this is a column you pull them OUT of. The shroud is the tell.
 *
 * THE CUPS ARE NOT IN THE MODEL. They are the same paper-cup.glb the bar
 * serves in, instanced up the tube, so the stack shortens when you take one
 * and the cup you pull is the cup you drink from. A dispenser modelled with
 * its cups baked in could not do either.
 */
// The modelled tube runs from here to here. Both read off the GLB rather than
// assumed, because the stretch below is computed against them.
const TUBE_BASE = 0.05;
const TUBE_TOP = 0.195;

function Dispenser({ shape, taken, top = TUBE_TOP, material, rim = null }) {
  const { nodes, materials } = useGLTF(DISP_MODEL);
  const n = (shape.stack ?? 8) - (taken ? 1 : 0);
  // ONE MODEL, TWO LENGTHS. The tube is a plain straight double-walled
  // cylinder -- two vertex rings, nothing rounded at either end -- so scaling
  // it along its own axis produces exactly the tube that would have been
  // modelled, and a second GLB would only be a copy of it that could drift.
  // The offset puts the stretched bottom back on the shroud where it started;
  // the cap rides up by whatever the tube grew.
  const k = (top - TUBE_BASE) / (TUBE_TOP - TUBE_BASE);
  const lift = top - TUBE_TOP;
  return (
    <group>
      <mesh
        geometry={nodes.Disp_Tube.geometry}
        material={materials.m_disp_clear}
        position={[0, TUBE_BASE * (1 - k), 0]}
        scale={[1, k, 1]}
      />
      <mesh
        geometry={nodes.Disp_Cap.geometry}
        material={materials.m_disp_body}
        position={[0, lift, 0]}
        castShadow
      />
      <mesh
        geometry={nodes.Disp_Shroud.geometry}
        material={materials.m_disp_body}
        castShadow
      />
      <mesh
        geometry={nodes.Disp_Bracket.geometry}
        material={materials.m_disp_body}
      />
      {/* rim UP and nested, which is how a sleeve of cups is loaded. The
          lowest sits 28mm below the shroud's mouth -- far enough to take
          hold of, not so far it looks dropped. */}
      {Array.from({ length: n }, (_, i) => (
        <group key={i} position={[0, -0.028 + i * shape.nest, 0]}>
          <CupBody shape={shape} material={material} rim={rim} />
        </group>
      ))}
    </group>
  );
}

export default function ServeStation({
  active = false,
  // THE CAMERA IS HERE, which is not the same as the station being in
  // service. `active` is gated on the loop having reached the finishing
  // stage; the lid is not, because a shut lid on a bar you have walked up
  // to is the "there is no ice here" reading all over again.
  arrived = false,
  glass = false,
  stocked = [],
  shot = 0, // how full the cup that arrived from the machine is
  roast = 0, // and how dark it is -- the same bean, so the same colour
  steamed = false,
  stirred = false,
  pours = [],
  pouring = null,
  phase = null,
  phaseT = 0,
  pourable = {},
  canServe = false,
  canTakeGlass = false,
  canStir = false,
  atWand = false,
  wandPose = null, // WORLD — layout.steamPose()
  cupFrom = null, // WORLD — layout.cupPose(), where the shot cup starts
  hasShot = false, // the loop has reached the finishing stage
  onTakeGlass,
  onStir,
  onPour,
  onServe,
  position = [0, 0, 0],
  onClick,
}) {
  const [hot, setHot] = useState(null);
  useCursor(active && hot !== null);
  const jug = useRef();
  const carton = useRef();
  const shotCup = useRef();
  const shotCrema = useRef();
  const carafe = useRef();
  const syrup = useRef();
  const juice = useRef();
  const scoop = useRef();
  const lid = useRef(); // the ice well's, hinged at the back
  const lidA = useRef(0);
  const cup = useRef(); // the serving glass, which slides off the rack
  const froth = useRef();
  const puffs = useRef();
  const bell = useRef();
  const spoon = useRef();
  const stream = useRef();
  // WHERE THE SCOOP'S MOUTH IS, in the serving glass's own space, written
  // every frame of an ice pour and read by the ice in the glass. A plain
  // object rather than a prop because the cubes are born at it inside a
  // frame loop -- see <Ice> in scene/Vessel.
  const iceDrop = useRef({ x: 0, y: 0, z: 0 });
  // Scene ids for the F2 overlay. These props already own a ref that the
  // frame loop drives, so the id ref is bound alongside it rather than by
  // wrapping them in another group -- a wrapper here would sit between a
  // carefully placed prop and its measured position.
  const lidId = useSceneId("scene.serve.lid");
  const scoopId = useSceneId("scene.serve.scoop");
  const cartonId = useSceneId("scene.serve.carton");
  const bind = (a2, b2) => (o) => {
    a2.current = o;
    b2.current = o;
  };
  const { nodes } = useGLTF(SCOOP_MODEL);
  const { nodes: cartonNodes } = useGLTF(CARTON_MODEL);
  const { nodes: carafeNodes } = useGLTF(CARAFE_MODEL);
  const syrupGlb = useGLTF(SYRUP_MODEL);
  const juiceGlb = useGLTF(JUICE_MODEL);
  // the flavour is a tint on the shared bottle, so the material is
  // cloned rather than the geometry -- as the cakes do with icing
  const chocMats = useMemo(() => {
    const f = syrupGlb.materials.m_syrup_fill.clone();
    const l = syrupGlb.materials.m_syrup_label.clone();
    f.color = new THREE.Color(SYRUPS.chocolate.fill);
    l.color = new THREE.Color(SYRUPS.chocolate.label);
    return { fill: f, label: l };
  }, [syrupGlb]);
  const milkLvl = useRef();
  const waterLvl = useRef();
  const juiceLvl = useRef();
  const shotLvl = useRef();
  const lift = useRef(0);
  const arrive = useRef(0);
  const glassIn = useRef(0);

  const cupMat = useCupMaterial();
  const glassMat = useGlassMaterial();
  const rimMat = useGlassRimMaterial();
  const stackMat = useStackGlassMaterial();
  const iceMat = useIceMaterial();
  const mats = useMemo(
    () => ({
      steel: new THREE.MeshStandardMaterial({
        color: STEEL,
        roughness: 0.32,
        metalness: 0.55,
        side: THREE.DoubleSide,
      }),
      milk: new THREE.MeshStandardMaterial({
        color: POUR_COLOUR.milk,
        roughness: 0.6,
      }),
      // dark liquids read wrong under the HDRI unless they are rough and
      // mostly deaf to it — see the note in Vessel.jsx
      // THE DEMITASSE IS CERAMIC, so this is the liquid's own colour, not
      // the through-glass one. It used to take POUR_COLOUR.espresso -- the
      // band colour, mixed dark on purpose to survive the serving glass --
      // and applied it to an opaque cup, so the shot you carried from the
      // machine visibly darkened on the walk over. See espressoCss.
      // see ESPRESSO_SURFACE -- the machine draws this same cup
      shot: new THREE.MeshStandardMaterial({ ...ESPRESSO_SURFACE }),
      crema: new THREE.MeshStandardMaterial({ ...CREMA_SURFACE }),
      foam: new THREE.MeshStandardMaterial({ color: FOAM, roughness: 0.95 }),
      steam: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 1,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: GLASS,
        roughness: 0.15,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
      }),
      // WATER HAS TO LOOK LIKE WATER, and opacity is what decides that, not
      // hue. At 0.62 any pale fill is an opaque column -- and an opaque pale
      // column in a jug on the back shelf is a jug of MILK, which put two
      // milk-looking things on a bar where one of them is the carton you
      // just carried from the cold store. Recolouring it alone did not fix
      // that; it has to be see-through.
      water: new THREE.MeshStandardMaterial({
        color: POUR_COLOUR.water,
        roughness: 0.08,
        transparent: true,
        opacity: 0.26,
      }),
      juice: new THREE.MeshStandardMaterial({ color: JUICE, roughness: 0.4 }),
      carton: new THREE.MeshStandardMaterial({
        color: CARTON,
        roughness: 0.85,
      }),
      syrup: new THREE.MeshStandardMaterial({ color: SYRUP, roughness: 0.5 }),
      cap: new THREE.MeshStandardMaterial({ color: "#2b2320", roughness: 0.7 }),
      brass: new THREE.MeshStandardMaterial({
        color: BRASS,
        roughness: 0.3,
        metalness: 0.7,
      }),
      wood: new THREE.MeshStandardMaterial({
        color: PALETTE.counterTop,
        roughness: 0.8,
      }),
      // NO COLOUR HERE ON PURPOSE. It is set from the pour that is running,
      // every frame, before the stream is ever visible -- and a fourth copy
      // of the espresso constant sitting in an initialiser is exactly how
      // the shot came to be two different browns in the first place.
      pour: new THREE.MeshStandardMaterial({
        color: "#000000",
        roughness: 0.62,
        envMapIntensity: 0.25,
      }),
    }),
    []
  );

  // SET OUTSIDE THE MEMO, which has no deps on purpose -- these materials
  // are built once. The shot's colour is the one thing here that moves with
  // the loop, so it is assigned per render instead.
  const shotInk = espressoCss(roast, shot);
  mats.shot.color.set(shotInk);
  const bandInks = useMemo(
    () => ({ espresso: espressoBandCss(roast, shot) }),
    [roast, shot]
  );

  // world -> this group's local space; the group is translated only
  const toLocal = useCallback(
    (w) =>
      w
        ? new THREE.Vector3(
            w[0] - position[0],
            w[1] - position[1],
            w[2] - position[2]
          )
        : null,
    [position]
  );
  const wandLocal = useMemo(() => toLocal(wandPose), [toLocal, wandPose]);
  const cupStart = useMemo(() => toLocal(cupFrom), [toLocal, cupFrom]);

  // WHICH VESSEL IS IN PLAY, LATCHED. `glass` goes null the moment you put
  // one back, but the cup is still on screen for the ~200ms it takes to damp
  // home — and read straight, a null would swap the paper cup for a tall
  // glass on that first frame and fly it to the wrong fixture. So the last
  // vessel taken stays the answer until another one is.
  //
  // Written during render on purpose: it is the same latch shape as poursNow
  // in useBrewFlow, and a state update here would re-render the whole station
  // one frame after the click for a value nothing else reads.
  const lastGlass = useRef("tall");
  if (glass) lastGlass.current = glass;
  const vessel = glass ?? lastGlass.current;
  const shape = SHAPES[vessel] ?? SERVE;
  // Everything a pour aims at moves with the rim, so it is derived from the
  // shape and cached per shape — not recomputed per frame.
  const target = useMemo(() => targetsFor(shape.top), [shape]);

  // How far through a stir. The bands do not move — their COLOURS converge
  // on the average, so at 1 the boundaries are gone because there is nothing
  // either side of them to tell apart.
  const mixed = stirred
    ? 1
    : phase === "stir"
      ? THREE.MathUtils.smoothstep(phaseT, 0.15, 0.85)
      : 0;

  // Anything in the glass that arrived hot, and no ice to kill it. NOT
  // `hot` — that name is already the hover key for this station.
  const hotDrink =
    !pours.includes("ice") &&
    (pours.includes("espresso") ||
      pours.includes("water") ||
      pours.includes("milk-steamed"));

  const steaming = phase === "steam";
  const flowing = phase === "pour" && pouring ? beats(phaseT) : null;
  const pv = vesselOf(pouring);
  const got = (k) => stocked.includes(k);
  // THE JUG IS EMPTY UNTIL THE WAND HAS BEEN IN IT. It used to show milk the
  // moment you got back from the fridge, which was the same conflation the
  // carton fixes: the milk was in the carton then, not in the jug. It fills
  // as the wand runs and empties again once the textured milk is in the glass.
  const jugEmpty = (!steaming && !steamed) || pours.includes("milk-steamed");

  // How full the glass is RIGHT NOW, in metres. The stream has to land on the
  // surface, and the surface is rising while it lands.
  const surfaceY = useMemo(() => {
    const list =
      pouring && !pours.includes(pouring) ? [...pours, pouring] : pours;
    const bands = stackOf(list);
    if (!bands.length) return TOP + shape.floor;
    const last = bands[bands.length - 1];
    const grow = pouring && last.kind === pouring ? (flowing?.flow ?? 1) : 1;
    return TOP + shape.floor + (last.y + last.h * grow) * shape.fill;
  }, [pours, pouring, flowing, shape]);

  /** Pose a pouring vessel into `out`; returns its tilt this frame. */
  const posePour = (vessel, out) => {
    const { rot, at } = target[vessel];
    out.lerpVectors(_home[vessel], at, flowing.carry);
    out.y += Math.sin(flowing.carry * Math.PI) * 0.03;
    return flowing.tip * rot;
  };

  /** Home, or over the glass if this is the one pouring. */
  const park = (ref, vessel) => {
    if (!ref.current) return;
    if (flowing && pv === vessel) {
      ref.current.rotation.z = posePour(vessel, _v);
      ref.current.position.copy(_v);
    } else {
      ref.current.position.copy(_home[vessel]);
      ref.current.rotation.z = 0;
    }
  };

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const now = flowing !== null;

    // ---- the glass slides off the rack when you take one ----
    if (cup.current) {
      glassIn.current = THREE.MathUtils.damp(
        glassIn.current,
        glass ? 1 : 0,
        5,
        delta
      );
      const k = THREE.MathUtils.smoothstep(glassIn.current, 0, 1);
      // off its own fixture and onto the mat, and back to the same one when
      // you put it down. `vessel`, not `glass`: see the latch above.
      const from = HOME[vessel] ?? HOME.tall;
      cup.current.position.set(
        THREE.MathUtils.lerp(from[0], GLASS_X, k),
        THREE.MathUtils.lerp(from[1], TOP, k) + Math.sin(k * Math.PI) * 0.03,
        THREE.MathUtils.lerp(from[2], FRONT_Z, k)
      );
      cup.current.visible = glassIn.current > 0.02;
    }

    // ---- jug: to the wand for steaming, or over the glass to pour ----
    // The trip to the wand stays a DAMPED REF rather than a slice of the
    // steam phase. The phase clears the instant phaseT hits 1, so a return
    // leg inside the phase would snap home mid-flight; a damped ref carries
    // on after it.
    if (jug.current) {
      if (now && pv === "jug") {
        jug.current.rotation.z = posePour("jug", _v);
        jug.current.position.copy(_v);
      } else if (wandLocal) {
        lift.current = THREE.MathUtils.damp(
          lift.current,
          atWand ? 1 : 0,
          4,
          delta
        );
        const k = THREE.MathUtils.smoothstep(lift.current, 0, 1);
        _v.lerpVectors(_home.jug, wandLocal, k);
        _v.y += Math.sin(k * Math.PI) * 0.07; // arc over the counter
        jug.current.position.copy(_v);
        jug.current.rotation.z = steaming ? Math.sin(t * 34) * 0.012 : 0;
      }
    }

    // ---- the shot cup is carried over from the machine, then pours ----
    if (shotCup.current) {
      if (now && pv === "espresso") {
        shotCup.current.rotation.z = posePour("espresso", _v);
        shotCup.current.position.copy(_v);
      } else if (cupStart) {
        arrive.current = THREE.MathUtils.damp(
          arrive.current,
          hasShot ? 1 : 0,
          3.2,
          delta
        );
        const k = THREE.MathUtils.smoothstep(arrive.current, 0, 1);
        _v.lerpVectors(cupStart, _home.espresso, k);
        _v.y += Math.sin(k * Math.PI) * 0.06;
        shotCup.current.position.copy(_v);
        shotCup.current.rotation.z = 0;
      }
    }

    park(carton, "carton");
    park(carafe, "water");
    park(syrup, "chocolate");
    park(juice, "orange");

    // ---- the ice lid ----
    // It opens BECAUSE YOU ARRIVED, like the fridge door: one gesture, one
    // beat. A lid that needed its own click would put a step in front of
    // the ice, and the last thing this station needs is another step.
    lidA.current = THREE.MathUtils.damp(
      lidA.current,
      arrived ? 1 : 0,
      5,
      delta
    );
    const lidK = THREE.MathUtils.smoothstep(lidA.current, 0, 1);
    if (lid.current) lid.current.rotation.x = LID_OPEN * lidK;

    // THE SCOOP is parked by hand rather than by park(), because it is the
    // one source with a resting POSE: nose down in the ice and skewed a few
    // degrees. Both blend out over the tip, so the pour still ends at
    // exactly the angle the drop maths assumes.
    //
    // It also lives IN the well, and the well is 32mm deep — nothing like
    // enough to park a scoop in under a flush lid. So while the lid is down
    // the scoop is sunk out of sight, which costs nothing because there is
    // nothing to see through an opaque lid anyway, and it rises once the
    // lid has swung clear of it.
    if (scoop.current) {
      if (now && pv === "ice") {
        const tipped = posePour("ice", _v);
        scoop.current.position.copy(_v);
        const angle = THREE.MathUtils.lerp(SCOOP_REST, tipped, flowing.tip);
        scoop.current.rotation.z = angle;
        scoop.current.rotation.y = SCOOP_SKEW * (1 - flowing.tip);
        scoop.current.visible = true;
        // THE CUBES COME OUT OF THE SCOOP'S MOUTH, so the glass is told
        // where that is rather than guessing at a height above its rim.
        // Off the angle it is actually DRAWN at, not the angle the pour
        // ends on: for most of the tip those are not the same, and ice
        // leaving a scoop that is still turning is the half of the
        // animation you can see.
        //
        // ONLY WHILE IT IS OVER THE GLASS. The scoop keeps moving after the
        // run — it tips back and carries home — and the cubes do not all
        // leave on the same frame, so a cube released a beat late off a
        // live mouth is born in mid-air halfway to the well. Measured: on a
        // machine drawing 3fps the whole pour lands in two frames and every
        // cube came out over the counter.
        if (cup.current && flowing.carry > 0.99) {
          iceDrop.current.x =
            _v.x - Math.sin(angle) * _mouthH.ice - cup.current.position.x;
          iceDrop.current.y =
            _v.y + Math.cos(angle) * _mouthH.ice - cup.current.position.y;
          iceDrop.current.z = _v.z - cup.current.position.z;
        }
      } else {
        const k = THREE.MathUtils.smoothstep(lidK, 0.45, 1);
        scoop.current.position.copy(_home.ice);
        scoop.current.position.y -= (1 - k) * 0.036;
        scoop.current.rotation.set(0, SCOOP_SKEW, SCOOP_REST);
        scoop.current.visible = k > 0.02;
        // and back to where a pour WOULD tip from, which is the same point
        // the maths above converges on: MOUTH_X is the glass, so in the
        // glass's own space the mouth is straight overhead. This is the
        // fallback for a pour so starved of frames that none of them
        // caught the scoop in place.
        iceDrop.current.x = 0;
        iceDrop.current.y = shape.top + MOUTH_UP;
        iceDrop.current.z = 0;
      }
    }

    // ---- what is left in each source, draining as it runs ----
    const left = (vessel, gone) =>
      gone ? 0 : now && pv === vessel ? 1 - flowing.flow : 1;
    const level = (ref, vessel, gone, base, height, cap = null) => {
      if (!ref.current) return;
      const l = left(vessel, gone);
      ref.current.visible = l > 0.02;
      const s = Math.max(0.02, l);
      ref.current.scale.y = s;
      ref.current.position.y = base + (height * s) / 2;
      // anything that floats ON the liquid rather than being some of it --
      // just the crema so far. It rides the surface down as the cup empties.
      if (cap?.current) {
        cap.current.visible = ref.current.visible;
        cap.current.position.y = base + height * s;
      }
    };
    level(milkLvl, "jug", jugEmpty, 0.008, MILK_LEVEL);
    level(waterLvl, "water", pours.includes("water"), 0.008, WATER_LEVEL);
    // the jug's fill is modelled, so it scales from its own base instead of
    // going through level() -- see the note beside it in the JSX
    if (juiceLvl.current) {
      const l = left("orange", pours.includes("orange"));
      juiceLvl.current.visible = l > 0.02;
      juiceLvl.current.scale.y = Math.max(0.02, l);
    }
    level(
      shotLvl,
      "espresso",
      pours.includes("espresso"),
      CUP_FLOOR,
      shotLevel(shot),
      shotCrema
    );

    // ---- steam plume, only once the jug has actually arrived ----
    if (puffs.current) {
      const on = steaming && lift.current > 0.8;
      puffs.current.visible = on;
      if (on) {
        puffs.current.children.forEach((m, i) => {
          const u = (phaseT * 2.2 + i / PUFFS) % 1;
          m.position.set(
            Math.sin(u * 5 + i) * 0.016,
            0.06 + u * 0.16,
            Math.cos(u * 4 + i * 2) * 0.014
          );
          m.scale.setScalar(0.012 + u * 0.03);
          m.material.opacity = Math.sin(u * Math.PI) * 0.5;
        });
      }
    }

    // ---- foam grows over the back half of the steam, then rides the level --
    if (froth.current) {
      const grown = steamed
        ? 1
        : steaming
          ? Math.max(0, (phaseT - 0.35) / 0.65)
          : 0;
      const l = left("jug", jugEmpty);
      froth.current.visible = grown > 0.02 && l > 0.15;
      const w = steaming ? 1 + Math.sin(t * 16) * 0.05 : 1;
      froth.current.scale.set(w, Math.max(0.05, grown), w);
      froth.current.position.y = 0.008 + MILK_LEVEL * l + 0.011;
      froth.current.rotation.y += steaming ? delta * 3 : 0;
    }

    // ---- the stream, hanging from the mouth of whatever is pouring ----
    // Ice does not stream. It drops, which is the whole reason it is not
    // just another coloured band.
    const liquid = now && pv !== "ice";
    if (stream.current) {
      const on = liquid && flowing.flow > 0.02 && flowing.flow < 0.99;
      stream.current.visible = on;
      if (on) {
        // espresso in mid-air is the liquid, not the band: the band's
        // colour is pre-darkened for the glass it will be seen through
        mats.pour.color.set(
          pouring === "espresso" ? shotInk : (POUR_COLOUR[pouring] ?? shotInk)
        );
        const rot = posePour(pv, _v); // _v is the vessel's base
        const h = _mouthH[pv];
        const my = _v.y + Math.cos(rot) * h;
        const len = Math.max(0.004, my - surfaceY);
        stream.current.position.set(
          _v.x - Math.sin(rot) * h,
          surfaceY + len / 2,
          _v.z
        );
        stream.current.scale.y = len;
      }
    }

    // Nothing here for falling ice: the cubes that fall ARE the cubes in the
    // glass, and they are integrated by <Ice> from the mouth written above.

    // ---- the spoon, for a stir ----
    if (spoon.current) {
      const on = phase === "stir";
      spoon.current.visible = on;
      if (on) {
        const dip =
          THREE.MathUtils.smoothstep(phaseT, 0, 0.18) -
          THREE.MathUtils.smoothstep(phaseT, 0.82, 1);
        const spin = phaseT * Math.PI * 7;
        const r = shape.rInner * 0.42;
        const out = TOP + shape.top + 0.035;
        const into = TOP + shape.floor + 0.014;
        spoon.current.position.set(
          GLASS_X + Math.sin(spin) * r * dip,
          THREE.MathUtils.lerp(out, into, dip),
          FRONT_Z + Math.cos(spin) * r * dip
        );
        spoon.current.rotation.z = -Math.sin(spin) * 0.18 * dip;
        spoon.current.rotation.x = Math.cos(spin) * 0.18 * dip;
      }
    }

    // ---- the bell rings ----
    if (bell.current) {
      const ring =
        phase === "serve" ? Math.exp(-phaseT * 7) * Math.sin(phaseT * 46) : 0;
      bell.current.scale.set(1 - ring * 0.14, 1 + ring * 0.2, 1 - ring * 0.14);
    }
  });

  // stopPropagation alone was not enough: the click that took a glass off
  // the rack also reached the station group behind it and toggled the camera
  // back out to the overview. The shared gate is what the rest of the room
  // already uses to say "this click has been spent".
  // WHAT THE DISPENSER OFFERS RIGHT NOW, which is not one fixed thing. The
  // same click takes a vessel, swaps for the other one, or puts the one you
  // are holding back — see takeGlass in useBrewFlow — and a label that only
  // ever said "take one" would be lying two thirds of the time. It also says
  // out loud when the click is destructive, because it always is once there
  // is something in the cup and nothing else in this room warns you.
  const vesselSay = (kind) => {
    const name = kind === "mug" ? "paper cup" : "tall glass";
    const full = pours.length > 0;
    if (glass === kind)
      return full
        ? "put it back — tips the drink out"
        : `${name} — put it back`;
    if (glass)
      return full
        ? `swap to the ${name} — tips the drink out`
        : `swap to the ${name}`;
    return kind === "mug"
      ? "paper cup — for something hot"
      : "tall glass — for something iced";
  };
  const sayNow = (key) =>
    key === "rack-mug"
      ? vesselSay("mug")
      : key === "rack-tall"
        ? vesselSay("tall")
        : SAY[key];

  const tap = (key, fn, allowed) => ({
    onClick: (e) => {
      if (!active || !allowed) return;
      e.stopPropagation();
      swallowClicks(120);
      fn?.();
    },
    onPointerOver: (e) => {
      if (!active || !allowed) return;
      e.stopPropagation();
      setHot(key);
      const say = sayNow(key);
      if (say) setHoveredLabel(say);
    },
    onPointerOut: () => {
      setHot((h) => (h === key ? null : h));
      clearHovered(sayNow(key));
    },
  });

  // A CLICK CHANGES THE LABEL WITHOUT MOVING THE POINTER. Taking the cup you
  // are hovering turns "take one" into "put it back", and pointerover has
  // already fired and will not fire again — so the readout would sit there
  // describing the offer you just accepted until you moved the mouse.
  const hotSay = hot ? sayNow(hot) : null;
  useEffect(() => {
    if (hotSay) setHoveredLabel(hotSay);
  }, [hotSay]);

  return (
    <group position={position}>
      {/* THE COUNTER carries the fly-to/release click, not the whole station.
          It used to sit on this group, so it was an ancestor of every prop —
          and taking a glass off the rack both took the glass AND toggled the
          camera back out to the overview. stopPropagation and the click gate
          both failed to stop it; moving the handler off the ancestor means
          there is nothing left to stop. Clicking a prop is using the bar;
          clicking the bar itself is leaving it. */}
      {BOARD.map(([bx, bw, bz, bd], i) => (
        <mesh
          key={i}
          position={[bx, TOP / 2, bz]}
          onClick={onClick}
          receiveShadow
          castShadow
        >
          <boxGeometry args={[bw, TRAY.t, bd]} />
          <meshStandardMaterial color={PALETTE.counterBody} roughness={0.72} />
        </mesh>
      ))}
      {/* the riser the tall sources stand on */}
      <mesh
        position={[0, TOP + SHELF.h / 2, SHELF.z]}
        onClick={onClick}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[TRAY.w, SHELF.h, SHELF.d]} />
        <meshStandardMaterial color={PALETTE.counterTop} roughness={0.7} />
      </mesh>

      {/* ---- WHERE THE VESSELS HANG. Taking one is the first beat of the
              finishing stage: pouring into thin air was what made the
              station read as a menu rather than as making a drink. ONE of
              each, and which you take is which drink you are making — a
              choice you make rather than one the fridge makes for you,
              since the ice moved to the well and stopped implying anything.

              The same fixture twice, because they are the same object: a
              tube of nested vessels you pull the bottom one out of. The
              stack shortens by one while you are holding it, which is the
              only thing in the room that says a vessel is IN YOUR HAND
              rather than simply missing. ---- */}
      {Object.entries(SHAPES).map(([kind, sh]) => (
        <Select key={kind} enabled={active && hot === `rack-${kind}`}>
          <group
            position={[FIX[kind].x, FIX[kind].y, FIX[kind].z]}
            {...tap(`rack-${kind}`, () => onTakeGlass?.(kind), canTakeGlass)}
          >
            <Dispenser
              shape={sh}
              taken={glass === kind}
              top={FIX[kind].top}
              // the paper cup carries its own materials in the GLB; the
              // tall one is drawn from primitives, and stacked glass is not
              // the same material as glass with a drink in it
              material={sh.model ? undefined : stackMat}
              rim={sh.model ? null : rimMat}
            />
          </group>
        </Select>
      ))}

      {/* ---- the serving vessel: the drink is assembled in here, and
              clicking it STIRS it. The drink is its own control because the
              alternative was another object on a counter the whole point of
              which is that it stays clear. ---- */}
      <Select enabled={active && hot === "stir"}>
        <group
          ref={cup}
          position={HOME.tall}
          visible={false}
          {...tap("stir", onStir, canStir)}
        >
          <CupBody material={glassMat} rim={rimMat} shape={shape} />
          <Contents
            pours={pours}
            pouring={pouring}
            rising={flowing?.flow ?? 1}
            mixed={mixed}
            shape={shape}
            drop={iceDrop}
            // the one band whose colour is not a constant
            inks={bandInks}
          />
          {/* IT IS HOT AND IT SHOULD LOOK IT. Over ice it is not, which is
              the whole difference between the two glasses. */}
          <Steam
            at={[0, surfaceY - TOP + 0.004, 0]}
            visible={hotDrink}
            count={6}
            rise={0.12}
            spread={0.018}
            speed={0.3}
            size={0.014}
            peak={0.22}
            seed={5.2}
          />
        </group>
      </Select>

      {/* the bar spoon, which only exists while it is being used */}
      <group ref={spoon} visible={false}>
        <mesh material={mats.steel} scale={[1, 0.5, 1.35]} castShadow>
          <sphereGeometry args={[0.009, 10, 7]} />
        </mesh>
        <mesh position={[0, 0.056, 0]} material={mats.steel} castShadow>
          <cylinderGeometry args={[0.0022, 0.0028, 0.112, 8]} />
        </mesh>
      </group>

      {/* the pour itself — placed every frame from the mouth above it */}
      <mesh
        ref={stream}
        material={mats.pour}
        visible={false}
        raycast={NO_RAYCAST}
      >
        <cylinderGeometry args={[0.0042, 0.0042, 1, 8]} />
      </mesh>

      {/* ---- shot cup, carried over from the group head ---- */}
      {hasShot && (
        <Select enabled={active && hot === "shot"}>
          <group
            ref={shotCup}
            position={[SHOT_X, TOP, FRONT_Z]}
            scale={CUP_SCALE}
            {...tap("shot", () => onPour?.("espresso"), pourable.espresso)}
          >
            <CupBody material={cupMat} />
            {/* the shot arrives hot and stays hot until it goes in. Hidden
                while it tips, because steam rising out of a cup lying on
                its side is worse than no steam at all. */}
            <Steam
              at={[0, CUP.baseH + CUP.h, 0]}
              visible={!pours.includes("espresso") && pouring !== "espresso"}
              count={9}
              rise={0.34}
              spread={0.04}
              speed={0.28}
              size={0.021}
              peak={0.18}
              seed={1.9}
            />
            <mesh ref={shotLvl} material={mats.shot}>
              <cylinderGeometry
                args={[
                  CUP.rInner * 0.97,
                  CUP.rInner * 0.94,
                  shotLevel(shot),
                  14,
                ]}
              />
            </mesh>
            {/* THE CREMA, which the machine has always drawn and this cup
                never did. It is the same cup: you pull the shot, look into
                it and see pale caramel, then carry it three feet and look
                into it again and see dark coffee. Nobody was ever going to
                read that as one drink. */}
            <mesh ref={shotCrema} material={mats.crema}>
              <cylinderGeometry
                args={[CUP.rInner * 0.97, CUP.rInner * 0.97, CREMA_T, 14]}
              />
            </mesh>
          </group>
        </Select>
      )}

      {/* ---- THE MILK CARTON, carried out of the fridge ----
              Gone once the milk has been steamed, because then the milk is
              in the jug and two milk sources standing side by side is a
              question nobody asked. It DOES stay after a cold pour, which is
              honest -- the carton is still on the bar -- and safe, because
              tap() returns before stopPropagation when a source is not
              pourable, so a spent one never eats the click that would take
              you somewhere else. */}
      {got("milk") && !steamed && (
        <Select enabled={active && hot === "carton"}>
          <group
            ref={bind(carton, cartonId)}
            position={[CTN.x, SHELF_TOP, SHELF.z]}
            {...tap("carton", () => onPour?.("milk"), pourable.milk)}
          >
            {/* the model's origin is its BASE, like fridge.glb's item_milk,
                so it stands on the riser with no offset to keep in step */}
            <mesh
              geometry={cartonNodes.MilkCarton.geometry}
              material={mats.carton}
              castShadow
            />
          </group>
        </Select>
      )}

      {/* ---- frothing pitcher: ALWAYS ON THE BAR ----
              It used to appear only once you had fetched milk, which made a
              piece of equipment behave like an ingredient -- a steel pitcher
              is part of the station, the way the carafe and the bell are,
              and a bar that grows its tools as you need them reads as a menu
              unfolding rather than a place that was already here.
              It stands EMPTY until the wand has been in it (see jugEmpty),
              which is the honest version of the same information.
              It pours the TEXTURED milk only; the cold pour is the carton's
              job. Inert until then, and safely so: tap() returns before
              stopPropagation when a source is not pourable, so it never eats
              a click meant for something else. ---- */}
      <Select enabled={active && hot === "jug" && !steaming}>
        <group
          ref={jug}
          position={[JUG.x, SHELF_TOP, SHELF.z]}
          {...tap(
            "jug",
            () => onPour?.("milk-steamed"),
            pourable["milk-steamed"]
          )}
        >
          <mesh position={[0, JUG.h / 2, 0]} material={mats.steel} castShadow>
            <cylinderGeometry args={[JUG.rTop, JUG.r, JUG.h, 16, 1, true]} />
          </mesh>
          <mesh position={[0, 0.004, 0]} material={mats.steel}>
            <cylinderGeometry args={[JUG.r, JUG.r, 0.008, 16]} />
          </mesh>
          {/* spout on -X, handle on -Z: this jug tips towards -X to pour,
                so the spout has to be the lip that goes down */}
          <mesh
            position={[-JUG.rTop * 0.9, JUG.h * 0.93, 0]}
            rotation={[0, 0, 0.5]}
            material={mats.steel}
            castShadow
          >
            <coneGeometry args={[0.016, 0.03, 6, 1, true]} />
          </mesh>
          <mesh
            position={[0, JUG.h * 0.55, -JUG.rTop * 0.95]}
            rotation={[0, Math.PI / 2, Math.PI * 0.42]}
            material={mats.steel}
            castShadow
          >
            <torusGeometry args={[0.026, 0.005, 6, 12, Math.PI * 1.15]} />
          </mesh>

          <mesh ref={milkLvl} material={mats.milk}>
            <cylinderGeometry
              args={[JUG.r * 1.05, JUG.r * 0.97, MILK_LEVEL, 16]}
            />
          </mesh>
          <mesh ref={froth} material={mats.foam} visible={false}>
            <cylinderGeometry args={[JUG.r * 1.12, JUG.r * 1.05, 0.022, 16]} />
          </mesh>

          <group ref={puffs} visible={false}>
            {Array.from({ length: PUFFS }, (_, i) => (
              <mesh key={i} material={mats.steam.clone()} raycast={NO_RAYCAST}>
                <sphereGeometry args={[1, 7, 5]} />
              </mesh>
            ))}
          </group>
        </group>
      </Select>

      {/* ---- water carafe ---- */}
      <Select enabled={active && hot === "water"}>
        <group
          ref={carafe}
          position={[CAR.x, SHELF_TOP, SHELF.z]}
          {...tap("water", () => onPour?.("water"), pourable.water)}
        >
          {/* Modelled, not a cylinder. A straight-sided pale vessel next
              to a milk carton is a GLASS OF MILK, and no amount of recolour
              or transparency fixed that — the silhouette was the problem.
              A jug is read by its belly, neck, spout and handle, and those
              are the four things a cylinder cannot have. */}
          <mesh
            geometry={carafeNodes.WaterCarafe.geometry}
            material={mats.glass}
            castShadow
          />
          <mesh ref={waterLvl} material={mats.water}>
            <cylinderGeometry
              args={[CAR.r * 0.94, CAR.r * 0.9, WATER_LEVEL, 14]}
            />
          </mesh>
        </group>
      </Select>

      {/* ---- chocolate syrup, out of the fridge ---- */}
      {got("chocolate") && (
        <Select enabled={active && hot === "choc"}>
          <group
            ref={syrup}
            position={[SYR.x, SHELF_TOP, SHELF.z]}
            {...tap("choc", () => onPour?.("chocolate"), pourable.chocolate)}
          >
            <mesh
              geometry={syrupGlb.nodes.Syrup_Body.geometry}
              material={syrupGlb.materials.m_syrup_glass}
              castShadow
            />
            <mesh
              geometry={syrupGlb.nodes.Syrup_Fill.geometry}
              material={chocMats.fill}
            />
            <mesh
              geometry={syrupGlb.nodes.Syrup_Label.geometry}
              material={chocMats.label}
            />
            <mesh
              geometry={syrupGlb.nodes.Syrup_Pump.geometry}
              material={syrupGlb.materials.m_syrup_pump}
              castShadow
            />
          </group>
        </Select>
      )}

      {/* ---- orange juice, out of the fridge ---- */}
      {got("orange") && (
        <Select enabled={active && hot === "oj"}>
          <group
            ref={juice}
            position={[OJ.x, SHELF_TOP, SHELF.z]}
            {...tap("oj", () => onPour?.("orange"), pourable.orange)}
          >
            {/* A JUG, not a second carton and not a third bottle. The milk
                is already a gable box and the bar already has two tall
                cylinders; the handled half gallon is the one juice shape
                that collides with neither. */}
            {[
              ["Juice_Body", "m_juice_glass"],
              ["Juice_Neck", "m_juice_glass"],
              ["Juice_Handle", "m_juice_glass"],
              ["Juice_Label", "m_juice_label"],
              ["Juice_Cap", "m_juice_cap"],
            ].map(([node, material]) => (
              <mesh
                key={node}
                geometry={juiceGlb.nodes[node].geometry}
                material={juiceGlb.materials[material]}
                castShadow
              />
            ))}
            {/* THE FILL DRAINS BY SCALE ALONE, in a group of its own.
                level() also moves what it scales, which is right for a
                unit cylinder centred on its origin and wrong for modelled
                geometry: this mesh's vertices already sit at their real
                heights, so scaling y about the jug's base is the whole
                animation and any reposition on top double-counts it. */}
            <group ref={juiceLvl}>
              <mesh
                geometry={juiceGlb.nodes.Juice_Fill.geometry}
                material={juiceGlb.materials.m_juice_fill}
              />
            </group>
          </group>
        </Select>
      )}

      {/* ---- THE ICE WELL, sunk into the counter ----
              It used to be a tub standing on the back shelf, which is the one
              thing no cafe does with ice. The well is always here because it
              is part of the counter; what comes out of the freezer is what
              goes IN it, so an empty well is the prompt to go and look. ---- */}
      <Select enabled={active && hot === "ice"}>
        <group {...tap("ice", () => onPour?.("ice"), pourable.ice)}>
          {/* The cavity, drawn BackSide: the camera looks down through the
              opening and sees the far wall and the floor, and the near wall
              never gets in the way of them. */}
          <mesh position={[WELL.x, TOP - WELL.deep / 2, WELL.z]}>
            {/* a hair narrower than the opening: flush with the rails, the
                cavity's side faces were coplanar with theirs and the join
                z-fought into a row of spikes along the wall */}
            <boxGeometry args={[WELL.w - 0.0008, WELL.deep, WELL.d - 0.0008]} />
            {/* DARK. It was the same light grey as the collar, the scoop and
                the ice, and four things at one value inside an 80mm box is
                not a well with ice in it, it is a smudge. The inside of a
                bin is in shadow anyway. */}
            <meshStandardMaterial
              color="#4e5559"
              roughness={0.5}
              metalness={0.4}
              side={THREE.BackSide}
            />
          </mesh>
          {/* the stainless collar that makes it an insert rather than a hole */}
          {COLLAR.map(([cx, cw, cz, cd], i) => (
            <mesh
              key={i}
              position={[cx, TOP - 0.0015, cz]}
              material={mats.steel}
              castShadow
            >
              <boxGeometry args={[cw, 0.005, cd]} />
            </mesh>
          ))}
          {/* ALWAYS FULL. It used to fill only once you had been to the
              fridge for it, which left the one piece of ice equipment in
              the room sitting empty in plain sight — a steel hole in the
              counter, reading as broken rather than as waiting. A cafe's
              well is never empty. */}
          {WELL_ICE.map(([ux, uy, uz, spin], i) => (
            <mesh
              key={`w${i}`}
              material={iceMat}
              position={[
                WELL.x + ux * (WELL.w / 2 - WELL_CUBE * 0.7),
                TOP -
                  WELL.deep +
                  WELL_CUBE * 0.55 +
                  uy * (WELL.deep - WELL_CUBE * 1.1),
                WELL.z + uz * (WELL.d / 2 - WELL_CUBE * 0.7),
              ]}
              rotation={[spin, spin * 1.6, spin * 0.8]}
            >
              <boxGeometry args={[WELL_CUBE, WELL_CUBE, WELL_CUBE]} />
            </mesh>
          ))}

          {/* THE SCOOP. A trough laid along x, open at the top and open
              at the -x end, which is both the end that faces the glass and
              the end the pour tips it out of.

              The half-tube is drawn with a 1.3pi sweep rather than a flat
              pi: at exactly half round the sides stop at the widest point
              and the thing reads as a gutter. Past half they lean back in
              and it reads as something that would hold ice. */}
          <group
            ref={bind(scoop, scoopId)}
            position={[WELL.x, TOP - 0.012, WELL.z]}
            {...tap("ice", () => onPour?.("ice"), pourable.ice)}
          >
            {/* Its origin is the BOWL AXIS, which is the point the pour
                tips it about, so it sits at the same +r the primitives used
                to put the floor on this group's y=0. */}
            <mesh
              geometry={nodes.IceScoop.geometry}
              position={[0, SCOOP.r, 0]}
              material={mats.steel}
              castShadow
            />
            {/* what is in it, until it has been tipped into the glass */}
            {!pours.includes("ice") &&
              [
                [-0.42, 0.22, 1.4],
                [0.34, -0.3, 0.6],
              ].map(([ux, uz, spin], i) => (
                <mesh
                  key={`s${i}`}
                  material={iceMat}
                  position={[
                    ux * SCOOP.len * 0.5,
                    SCOOP.r * 0.56,
                    uz * SCOOP.r,
                  ]}
                  rotation={[spin, spin * 1.6, spin * 0.8]}
                >
                  <boxGeometry args={[WELL_CUBE, WELL_CUBE, WELL_CUBE]} />
                </mesh>
              ))}
          </group>
        </group>
      </Select>

      {/* The well is a HOLE, so there is no mesh to hang an id on; this
          marker sits at its centre so `scene.serve.well` has somewhere to
          point. */}
      <IdTag
        id="scene.serve.well"
        position={[WELL.x, TOP - WELL.deep / 2, WELL.z]}
      />

      {/* ---- THE LID. It opens because you arrived; see the frame loop.
              The text is deliberately OUTSIDE the Select: troika renders a
              glyph quad, and the outline pass traces that quad rather than
              the letters, which is a rectangle hanging in mid-air. ---- */}
      <group ref={bind(lid, lidId)} position={[WELL.x, TOP + 0.0015, HINGE_Z]}>
        <Select enabled={active && hot === "ice"}>
          <group {...tap("ice", () => onPour?.("ice"), pourable.ice)}>
            <mesh position={[0, 0, LID.d / 2]} material={mats.steel} castShadow>
              <boxGeometry args={[LID.w, LID.t, LID.d]} />
            </mesh>
            {/* the grip along the front edge — what a hand would lift */}
            <mesh
              position={[0, LID.t * 0.9, LID.d - 0.004]}
              material={mats.steel}
              castShadow
            >
              <boxGeometry args={[LID.w * 0.34, 0.005, 0.007]} />
            </mesh>
          </group>
        </Select>
        {/* the barrels the hinge turns on, one at each end */}
        {[-1, 1].map((sx) => (
          <mesh
            key={sx}
            position={[sx * (LID.w / 2 - 0.009), 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={mats.steel}
          >
            <cylinderGeometry args={[0.0042, 0.0042, 0.016, 10]} />
          </mesh>
        ))}
        {/* SAY WHAT IT IS. A closed lid hides the one thing this station
            was rebuilt to make obvious, and from the overview it would
            otherwise be a steel plate. Flipped in its own plane so it is
            the right way up once the lid is open, which is the only
            distance it can be read from. */}
        <Text
          font={FONT}
          position={[0, LID.t / 2 + 0.0009, LID.d * 0.46]}
          rotation={[-Math.PI / 2, 0, Math.PI]}
          fontSize={0.0135}
          letterSpacing={0.22}
          color="#69726f"
          anchorX="center"
          anchorY="middle"
          raycast={NO_RAYCAST}
        >
          ICE
        </Text>
      </group>

      {/* ---- service bell. It lives on the back shelf at the right-hand
              end, which is clear of the shot cup's handle — the reason it was
              moved to the front row in the first place — and keeps the prep
              space in front for things that actually go in the glass. ---- */}
      <Select enabled={active && hot === "bell"}>
        <group
          position={[BELL.x, TOP, BELL.z]}
          {...tap("bell", onServe, canServe)}
        >
          <mesh position={[0, 0.006, 0]} material={mats.brass} castShadow>
            <cylinderGeometry args={[BELL.r * 1.1, BELL.r * 1.2, 0.012, 14]} />
          </mesh>
          <group ref={bell} position={[0, 0.012, 0]}>
            <mesh material={mats.brass} castShadow>
              <sphereGeometry
                args={[BELL.r, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]}
              />
            </mesh>
            <mesh position={[0, BELL.r, 0]} material={mats.brass}>
              <sphereGeometry args={[0.006, 8, 6]} />
            </mesh>
          </group>
        </group>
      </Select>
    </group>
  );
}

const NO_RAYCAST = () => null;

useGLTF.preload(SCOOP_MODEL);
useGLTF.preload(CARTON_MODEL);
useGLTF.preload(CARAFE_MODEL);
useGLTF.preload(SYRUP_MODEL);
useGLTF.preload(JUICE_MODEL);
useGLTF.preload(DISP_MODEL);
