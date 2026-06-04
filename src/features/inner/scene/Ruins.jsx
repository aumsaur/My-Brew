import * as THREE from "three";
import { useMemo } from "react";

const PILLARS = [
  { x: -7.5, z: -4.0, h: 2.8, r: 0.32, ry: 0.3 },
  { x: 8.2, z: -2.5, h: 1.6, r: 0.28, ry: -0.5 },
  { x: -5.5, z: 7.2, h: 3.4, r: 0.3, ry: 0.8 },
  { x: 6.8, z: 6.5, h: 2.1, r: 0.26, ry: 1.2 },
  { x: 0.5, z: -8.5, h: 2.5, r: 0.3, ry: -0.2 },
  { x: -9.0, z: 1.5, h: 1.8, r: 0.28, ry: 0.6 },
];
const FALLEN = [
  { x: -6.0, z: 2.2, l: 4.5, r: 0.26, ry: 0.15 },
  { x: 5.5, z: -5.5, l: 3.8, r: 0.24, ry: 0.9 },
  { x: 2.0, z: 7.0, l: 3.2, r: 0.25, ry: 1.8 },
];
const BLOCKS = [
  { x: -4.2, z: -6.0, w: 1.2, h: 0.5, d: 0.8, ry: 0.4 },
  { x: 7.2, z: 3.5, w: 0.9, h: 0.7, d: 1.2, ry: -0.6 },
  { x: -2.5, z: 6.5, w: 1.1, h: 0.4, d: 0.9, ry: 1.0 },
  { x: 4.5, z: 0.5, w: 0.7, h: 0.5, d: 0.7, ry: 2.3 },
];

// Broken stone scattered around the chamber.
export default function Ruins() {
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1e0e38",
        roughness: 0.93,
        metalness: 0.05,
      }),
    []
  );
  return (
    <group>
      {PILLARS.map((p, i) => (
        <mesh
          key={i}
          position={[p.x, p.h / 2, p.z]}
          rotation={[0, p.ry, 0]}
          material={mat}
          castShadow
        >
          <cylinderGeometry args={[p.r * 0.85, p.r, p.h, 8]} />
        </mesh>
      ))}
      {FALLEN.map((f, i) => (
        <mesh
          key={i}
          position={[f.x, f.r, f.z]}
          rotation={[Math.PI / 2, f.ry, 0]}
          material={mat}
          castShadow
        >
          <cylinderGeometry args={[f.r, f.r, f.l, 8]} />
        </mesh>
      ))}
      {BLOCKS.map((b, i) => (
        <mesh
          key={i}
          position={[b.x, b.h / 2, b.z]}
          rotation={[0, b.ry, 0]}
          material={mat}
          castShadow
        >
          <boxGeometry args={[b.w, b.h, b.d]} />
        </mesh>
      ))}
    </group>
  );
}
