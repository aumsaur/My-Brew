import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Steam, and the only way anything in this room says "this is hot".
//
// It replaced a glowing ring on the machine and then a point light under the
// group head, and both of those were the same mistake: a light source on a
// chrome espresso machine reads as an objective marker in a game, not as a
// cafe. Steam says the same thing — something here is hot, something here is
// happening — in the language the object itself would use.
//
// UNITS ARE THE PARENT'S. The machine draws its own in model units inside a
// group scaled 0.58; the milk bar is at scale 1 and passes metres. Every
// size here is a prop for that reason.
//
// Non-interactive, always: a plume over a cup sits exactly where the cursor
// needs to go to click the cup.
const NO_RAYCAST = () => null;

export default function Steam({
  at = [0, 0, 0],
  count = 6,
  rise = 0.3,
  spread = 0.045,
  speed = 0.24,
  size = 0.03,
  peak = 0.24,
  seed = 0,
  visible = true,
}) {
  const g = useRef();
  const mats = useMemo(
    () =>
      Array.from(
        { length: count },
        () =>
          new THREE.MeshStandardMaterial({
            color: "#fff6ea",
            roughness: 1,
            transparent: true,
            opacity: 0,
            depthWrite: false,
          })
      ),
    [count]
  );

  useFrame((state) => {
    if (!g.current) return;
    g.current.visible = visible;
    if (!visible) return;
    const t = state.clock.elapsedTime * speed + seed;
    g.current.children.forEach((m, i) => {
      const u = (t + i / count) % 1;
      // drifts wider as it rises, the way a plume actually opens out
      m.position.set(
        Math.sin(u * 4.2 + i * 1.7) * spread * u,
        u * rise,
        Math.cos(u * 3.1 + i * 2.3) * spread * u
      );
      m.scale.setScalar(size * (0.4 + u * 1.6));
      mats[i].opacity = Math.sin(u * Math.PI) * peak;
    });
  });

  return (
    <group ref={g} position={at}>
      {mats.map((m, i) => (
        <mesh key={i} material={m} raycast={NO_RAYCAST}>
          <sphereGeometry args={[1, 7, 5]} />
        </mesh>
      ))}
    </group>
  );
}
