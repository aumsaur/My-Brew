import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { footprint, topOf } from "@/features/coffee/layout";

// A bobbing arrow over whichever station the loop wants next.
//
// This exists so "where do I go" is answered in the SCENE rather than by a
// line of HUD text.
//
// It used to be a ring on the surface, and a ring was the wrong shape twice
// over. Lying flat it is foreshortened to a sliver from the standing camera
// and hidden under the prop from the close one — the same reason the progress
// gauge had to move to the HUD. And a ring only says HERE; an arrow says
// here AND points, which is what a guide is for. It sits above the prop's
// measured top, in clear air, where nothing occludes it from any angle the
// camera can reach.
//
// Non-interactive — raycast off on the whole group, or it would eat the
// clicks meant for the station it is pointing at.
const CLEARANCE = 0.05; // gap between the prop's top and the arrow's tip
const HEAD_H = 0.055;
const HEAD_R = 0.028;
const BOB = 0.018;

const NO_RAYCAST = () => null;

export default function Beacon({ station = null, busy = false }) {
  const bob = useRef();
  const mat = useRef();
  // Handed in, not worked out here: the loop knows whether the next thing it
  // wants is the bar or a trip to the fridge, and two components guessing at
  // that separately is how the fridge ended up in neither of them.
  const key = station;

  // one shared material instance, so the fade below cannot leak into anything
  // else the way drei's cached GLB materials do
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffc27a",
        emissive: new THREE.Color("#ff9a3c"),
        emissiveIntensity: 0.7,
        roughness: 0.45,
        transparent: true,
        opacity: 0.95,
      }),
    []
  );
  mat.current = material;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (bob.current) {
      // eased bob — hangs at the top, dips quickly, so it reads as pointing
      // rather than drifting
      bob.current.position.y = (Math.sin(t * 2.4) * 0.5 + 0.5) * BOB;
      bob.current.rotation.y += delta * 0.9;
    }
    // calms right down once you are at the station — its job is done, and a
    // marker bouncing over the thing you are already using is just noise
    material.opacity = THREE.MathUtils.damp(
      material.opacity,
      busy ? 0.18 : 0.95,
      5,
      delta
    );
    material.emissiveIntensity = THREE.MathUtils.damp(
      material.emissiveIntensity,
      busy ? 0.15 : 0.7,
      5,
      delta
    );
  });

  if (!key) return null;
  // x/z from the FOOTPRINT, so the arrow is over where the prop stands rather
  // than over the middle of a bounding box skewed by a crank or a steam wand
  const f = footprint(key);

  return (
    <group
      position={[f.x, topOf(key) + CLEARANCE, f.z]}
      raycast={NO_RAYCAST}
      // the tip sits at this group's origin, so CLEARANCE means what it says
    >
      <group ref={bob}>
        <mesh
          position={[0, HEAD_H / 2, 0]}
          rotation={[Math.PI, 0, 0]}
          material={material}
          raycast={NO_RAYCAST}
        >
          {/* 6 sides, to sit with the faceted low-poly props rather than
              reading as a smooth UI gizmo dropped into the scene */}
          <coneGeometry args={[HEAD_R, HEAD_H, 6]} />
        </mesh>
        <mesh
          position={[0, HEAD_H + 0.017, 0]}
          material={material}
          raycast={NO_RAYCAST}
        >
          <boxGeometry args={[0.015, 0.034, 0.015]} />
        </mesh>
      </group>
    </group>
  );
}
