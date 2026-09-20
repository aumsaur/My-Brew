import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { swallowClicks } from "@/features/coffee/clickGate";

// A SMALL orbit laid on top of the scripted camera, for depth perception.
//
// Not drei's OrbitControls, and not because of NIH: OrbitControls owns
// camera.position and camera.quaternion outright, and the rig writes both
// every frame from the route blend. Two writers, last one wins, and the routes
// are the thing worth keeping — the whole point of this scene is that clicking
// a station gives you a composed shot. So this is an OFFSET instead. The rig
// computes the pose it wants, then this rotates it a few degrees around the
// look point. The composition survives; you just get to lean.
//
// A still 3D render is a flat image. A couple of degrees of parallax is what
// tells you the grinder is in front of the roaster rather than painted on it,
// which is exactly what a static camera cannot say.
const MAX_YAW = 0.32; // ~18°, enough to see round a prop, not enough to leave the shot
const MAX_PITCH = 0.17; // ~10°, and clamped harder below so you never go under the counter
const MIN_PITCH = -0.13;
const MIN_DOLLY = 0.87;
const MAX_DOLLY = 1.16;
const SENS = 0.0042; // radians per pixel
const WHEEL_SENS = 0.00042;
const DRAG_START = 4; // px before a click becomes a drag
const EASE = 7; // how fast the offset follows the input
const RECENTRE = 2.6; // how fast it gives the framing back on a route change

const _v = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

/**
 * Returns `apply(pos, look, delta)`, which rotates `pos` about `look` IN PLACE.
 *
 * Pass a scratch vector, never the rig's own damped route state. Writing the
 * lean back into the state the route damps from compounds it every frame —
 * see the note in CoffeeApp's useFrame.
 *
 * `enabled` is read at POINTERMOVE time, not pointerdown: React has not
 * committed the hold state yet when the DOM pointerdown fires, so a press on
 * the roaster's button would otherwise arm a drag before anyone knew a hold
 * had started. By the first move it is settled.
 *
 * `resetKey` recentres when it changes — arriving at a station should always
 * give you the framed shot, not the angle you left the last one at.
 */
export function useCameraNudge({ enabled = true, resetKey = null } = {}) {
  const gl = useThree((s) => s.gl);

  const target = useRef({ yaw: 0, pitch: 0, dolly: 1 });
  const current = useRef({ yaw: 0, pitch: 0, dolly: 1 });
  const drag = useRef(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    // recentre on arrival; the damping in apply() makes this a glide
    target.current.yaw = 0;
    target.current.pitch = 0;
    target.current.dolly = 1;
  }, [resetKey]);

  useEffect(() => {
    const el = gl.domElement;

    const down = (e) => {
      if (e.button !== 0 && e.button !== 2) return;
      drag.current = { x: e.clientX, y: e.clientY, live: false };
    };

    const move = (e) => {
      const d = drag.current;
      if (!d) return;
      if (!enabledRef.current) {
        drag.current = null; // a hold started; this press is not ours
        return;
      }
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!d.live && Math.hypot(dx, dy) < DRAG_START) return;
      // Deliberately NO setPointerCapture here. R3F captures the pointer to
      // the mesh you pressed (the roaster's button does exactly that), and
      // capturing it to the canvas would steal it back and fire that mesh's
      // lostpointercapture — ending the hold mid-gesture. The canvas is
      // fullscreen and move/up are bound to the window, so capture buys
      // nothing and costs that.
      d.live = true;
      d.x = e.clientX;
      d.y = e.clientY;
      const t = target.current;
      t.yaw = THREE.MathUtils.clamp(t.yaw - dx * SENS, -MAX_YAW, MAX_YAW);
      t.pitch = THREE.MathUtils.clamp(
        t.pitch - dy * SENS,
        MIN_PITCH,
        MAX_PITCH
      );
    };

    const up = () => {
      const d = drag.current;
      drag.current = null;
      if (!d?.live) return;
      // the click that follows this drag is not a click on anything
      swallowClicks();
    };

    const wheel = (e) => {
      if (!enabledRef.current) return;
      e.preventDefault();
      const t = target.current;
      t.dolly = THREE.MathUtils.clamp(
        t.dolly + e.deltaY * WHEEL_SENS,
        MIN_DOLLY,
        MAX_DOLLY
      );
    };

    // down on the CANVAS (a drag has to start in the scene, not on the HUD),
    // move/up on the WINDOW so a drag that leaves the canvas still tracks and
    // still ends
    el.addEventListener("pointerdown", down);
    el.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("wheel", wheel);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [gl]);

  return function apply(pos, look, delta) {
    const c = current.current;
    const t = target.current;
    // Two speeds. EASE while dragging, so the camera tracks the pointer.
    // RECENTRE otherwise — which is what a route change rides when it zeroes
    // the target, and why arriving somewhere glides into the framed shot
    // instead of snapping to it. Letting go of a drag does NOT spring back:
    // the lean is an adjustment you made and it is yours until you leave.
    const k = drag.current?.live ? EASE : RECENTRE;
    c.yaw = THREE.MathUtils.damp(c.yaw, t.yaw, k, delta);
    c.pitch = THREE.MathUtils.damp(c.pitch, t.pitch, k, delta);
    c.dolly = THREE.MathUtils.damp(c.dolly, t.dolly, k, delta);

    if (
      Math.abs(c.yaw) < 1e-4 &&
      Math.abs(c.pitch) < 1e-4 &&
      Math.abs(c.dolly - 1) < 1e-4
    ) {
      return pos;
    }

    _v.copy(pos).sub(look);
    _v.applyAxisAngle(_up, c.yaw);
    // pitch about the camera's OWN right axis, or looking up near the poles
    // would roll the horizon
    _right.crossVectors(_v, _up).normalize();
    _v.applyAxisAngle(_right, c.pitch);
    _v.multiplyScalar(c.dolly);
    return pos.copy(look).add(_v);
  };
}
