import { useRef } from "react";
import * as THREE from "three";
import {
  LAYOUT,
  worldCentre,
  framingDistance,
  viewDir,
} from "@/features/coffee/layout";

// Click-to-move camera destinations for the coffee corner.
//
// The mechanism is a "virtual route": a destination pose that lives outside
// whatever the camera would otherwise be doing, with an eased 0->1 weight, and
// the resting frame lerped toward it. The witch app had exactly this, hardcoded
// to one destination (the lectern book). Here it is a map, so every station is
// the same kind of thing and adding one is a row.
//
// Poses are tuned against LAYOUT in CoffeeRoom.jsx - move a station there and
// its route has to move too.
// Poses are DERIVED, not typed. Earlier they were hand-eyeballed and each prop
// sat 3-5cm off centre - at these distances that is several percent of frame.
// Now `look` is the prop's MEASURED bounding-box centre, and the camera sits
// back along `view` by however far actually frames it at FOV. Move a prop in
// layout.js and its route follows on its own.
function routeFor(key, mode = "focus") {
  const c = worldCentre(key);
  const look = new THREE.Vector3(c[0], c[1], c[2]);
  const dir = new THREE.Vector3(...viewDir(key, mode)).normalize();
  const pos = look.clone().addScaledVector(dir, framingDistance(key, mode));
  return { pos, look };
}

// Two tiers per station: "<key>" is standing back looking at it in place,
// "<key>:inspect" is the close handling view used while it is actually in use.
// Think brewing-sim: you pick the thing up rather than watching it work.
const KEYS = Object.keys(LAYOUT).filter((k) => LAYOUT[k].model);

export const ROUTES = Object.fromEntries(
  KEYS.flatMap((k) => [
    [k, routeFor(k, "focus")],
    [`${k}:inspect`, routeFor(k, "inspect")],
  ])
);

// Where the camera rests when nothing is focused.
//
// Close enough that the hero fills the frame — sitting back at 2.4m was what
// made everything look small. But the counter is 2.2m wide and at 1.5m only
// 1.98m of it is in shot, which left the milk bar hanging off the left edge
// looking like a mistake rather than a station. 1.66m covers the full 2.2m
// with a little air, and costs about a tenth of the apparent size.
export const OVERVIEW = {
  pos: new THREE.Vector3(-0.12, 1.24, 1.68),
  look: new THREE.Vector3(-0.08, 1.1, -0.04),
};

/**
 * Blends a base (scroll-driven) camera frame toward whichever route is active.
 *
 * Returns a step(basePos, baseLook, delta) -> {pos, look} that the rig calls
 * each frame. `damp` rather than `lerp` so the ease is frame-rate independent —
 * the existing CameraRig makes the same choice for its book blend, while its
 * final follow uses a fixed-alpha lerp that is not.
 *
 * Passing null/undefined as the active route returns the base frame untouched,
 * so scroll control resumes on its own once nothing is selected.
 */
export function makeRouteBlend(speed = 3) {
  const prog = { current: 0 };
  const lastRoute = { current: null };
  const _pos = new THREE.Vector3();
  const _look = new THREE.Vector3();

  return function step(basePos, baseLook, activeRouteKey, delta) {
    const route = activeRouteKey ? ROUTES[activeRouteKey] : null;
    // Hold the last target while easing back out, or the pose would snap to the
    // origin on release instead of retreating from where it was.
    if (route) lastRoute.current = route;

    prog.current = THREE.MathUtils.damp(
      prog.current,
      route ? 1 : 0,
      speed,
      delta
    );
    const t = THREE.MathUtils.smoothstep(prog.current, 0, 1);

    _pos.copy(basePos);
    _look.copy(baseLook);
    if (lastRoute.current && t > 0.0001) {
      _pos.lerp(lastRoute.current.pos, t);
      _look.lerp(lastRoute.current.look, t);
    }
    return { pos: _pos, look: _look };
  };
}

/** Hook wrapper, so a rig component can just hold one stable blender. */
export function useRouteBlend(speed = 3) {
  const ref = useRef(null);
  if (ref.current === null) ref.current = makeRouteBlend(speed);
  return ref.current;
}
