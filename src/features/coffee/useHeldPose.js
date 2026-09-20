import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FOV } from "@/features/coffee/layout";

// Brings an object TO the camera, instead of moving the camera to it.
//
// This is the mechanism Grinder.jsx proved out, generalised so the fridge's
// shelf items can use it too. The rule it encodes: a thing you PICK UP comes
// to your hand and the camera holds still. Moving both sends them toward each
// other with no shared reference, which is how the grinder ended up climbing
// through the near plane.
//
// Framing is DERIVED, not tuned per object. `fit` is the fraction of frame
// HEIGHT the object should fill, and the distance falls out of that — so a
// tall milk carton and a squat jar are held at different distances and read
// the same size. Hand-picking a distance per prop is how they end up
// inconsistent.
const HALF_FOV = ((FOV / 2) * Math.PI) / 180;

const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _sway = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _centre = new THREE.Vector3();

/** Distance at which an object of `worldHeight` fills `fit` of the frame. */
export function heldDistance(worldHeight, fit) {
  return worldHeight / (2 * fit * Math.tan(HALF_FOV));
}

/**
 * @param held        bring it to hand (false = back to `rest`)
 * @param rest        WORLD position it sits at when not held
 * @param restRotation world euler it rests at
 * @param scale       the group's scale, also used to size the model offsets
 * @param centre      the geometry's own AABB centre, in MODEL units
 * @param height      the geometry's own AABB height, in MODEL units
 * @param fit         fraction of frame height to fill
 * @param frameX/Y    where to sit in frame, as fractions of frame width/height
 * @param tilt        euler applied after the camera's own orientation
 *
 * Returns { ref, distance }. Attach `ref` to the group; `distance` is what
 * InspectBlur must focus on, or the held object is the one thing out of focus.
 */
export function useHeldPose({
  held = false,
  rest = [0, 0, 0],
  restRotation = [0, 0, 0],
  scale = 1,
  centre = [0, 0, 0],
  height = 1,
  fit = 0.6,
  frameX = 0,
  frameY = 0,
  tilt = [0, 0, 0],
  speed = 4.5,
  sway = true,
}) {
  const ref = useRef();
  const blend = useRef(0);

  // Spread into the dep list rather than passing the array itself: a caller
  // that builds `rest` inline would otherwise make a new array every render
  // and rebuild these every frame.
  const [rx, ry, rz] = rest;
  const [ox, oy, oz] = restRotation;
  const [tx, ty, tz] = tilt;
  const restPos = useMemo(() => new THREE.Vector3(rx, ry, rz), [rx, ry, rz]);
  const restQuat = useMemo(
    () => new THREE.Quaternion().setFromEuler(new THREE.Euler(ox, oy, oz)),
    [ox, oy, oz]
  );
  const tiltQuat = useMemo(
    () => new THREE.Quaternion().setFromEuler(new THREE.Euler(tx, ty, tz)),
    [tx, ty, tz]
  );
  const distance = useMemo(
    () => heldDistance(height * scale, fit),
    [height, scale, fit]
  );

  useFrame((state, delta) => {
    blend.current = THREE.MathUtils.damp(
      blend.current,
      held ? 1 : 0,
      speed,
      delta
    );
    const k = THREE.MathUtils.smoothstep(blend.current, 0, 1);
    const g = ref.current;
    if (!g) return;

    if (k < 0.0008) {
      g.position.copy(restPos);
      g.quaternion.copy(restQuat);
      g.visible = true;
      return;
    }

    const { camera, size } = state;
    const frameH = 2 * distance * Math.tan(HALF_FOV);
    const aspect = size.height > 0 ? size.width / size.height : 1;

    _pos
      .set(frameX * frameH * aspect, frameY * frameH, -distance)
      .applyQuaternion(camera.quaternion)
      .add(camera.position);
    _quat.copy(camera.quaternion).multiply(tiltQuat);

    if (sway) {
      // a held object is not a rigid decal on the lens
      const t = state.clock.elapsedTime;
      _euler.set(
        Math.sin(t * 0.53) * 0.04,
        Math.sin(t * 0.37) * 0.07,
        Math.sin(t * 0.61) * 0.028
      );
      _quat.multiply(_sway.setFromEuler(_euler));
    }

    // Model origins sit at the object's BASE — that is what makes them stand
    // on a shelf. Aiming the ORIGIN at the target hangs the body off the top
    // of frame, so back out the rotated centre and park the CENTRE there.
    _centre
      .set(centre[0], centre[1], centre[2])
      .multiplyScalar(scale)
      .applyQuaternion(_quat);
    _pos.sub(_centre);

    g.position.lerpVectors(restPos, _pos, k);
    g.quaternion.slerpQuaternions(restQuat, _quat, k);
  });

  return { ref, distance };
}
