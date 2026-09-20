import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DepthOfField } from "@react-three/postprocessing";
import * as THREE from "three";

// Throws the room out of focus while something is held up to the camera.
//
// This is the other half of the pickup: a handheld brought to the lens still
// reads as "a prop that happens to be near" until the background stops
// competing with it. Depth of field is what makes it read as HELD.
//
// Focus is locked to the plane the held object is ACTUALLY parked on, passed
// in by whoever is holding it. It used to be the grinder's constant, which was
// fine until a second thing could be held: a fridge item is framed by its own
// height and sits further out, so a fixed focus made the one object you are
// looking at the only blurred thing in the shot.
//
// The effect stays MOUNTED and animates `bokehScale` from zero. Conditionally
// rendering an effect rebuilds the composer's pass chain, which hitches at the
// worst possible moment: the frame the pickup starts.
const MAX_BOKEH = 4.6;

export default function InspectBlur({
  active = false,
  distance = 0.4,
  speed = 4.5,
}) {
  const dof = useRef();
  const blend = useRef(0);

  useFrame((_state, delta) => {
    blend.current = THREE.MathUtils.damp(
      blend.current,
      active ? 1 : 0,
      speed,
      delta
    );
    if (dof.current) {
      // matches Grinder's own smoothstep, so blur and pickup arrive together
      dof.current.bokehScale =
        THREE.MathUtils.smoothstep(blend.current, 0, 1) * MAX_BOKEH;
    }
  });

  return (
    <DepthOfField
      ref={dof}
      worldFocusDistance={distance}
      worldFocusRange={0.16}
      bokehScale={0}
    />
  );
}
