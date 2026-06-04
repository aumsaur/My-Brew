import * as THREE from "three";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";

// Stylized low-poly witch-fire: an upside-down water-droplet (rounded base
// tapering to a point), built as a low-segment lathe so it stays faceted. Three
// pieces — a soft additive aura halo, a translucent violet outer droplet, and a
// bright HDR inner core that blooms. Unlit (toneMapped off). Flickers + sways.
//   size  — overall scale (keep small, ~0.5 for a candle)
//   color — optional tint; defaults to a witchy violet
const PROFILE = [
  [0.0, 0.0],
  [0.18, 0.08],
  [0.28, 0.22],
  [0.3, 0.38],
  [0.26, 0.55],
  [0.16, 0.74],
  [0.06, 0.9],
  [0.0, 1.0],
];

export default function LowPolyFire({ size = 0.5, color }) {
  const grp = useRef();
  const inner = useRef();
  const aura = useRef();
  const seed = useMemo(() => Math.random() * 10, []);

  // teardrop geometry (shared by both droplet layers)
  const geo = useMemo(() => {
    const pts = PROFILE.map(([x, y]) => new THREE.Vector2(x, y));
    const g = new THREE.LatheGeometry(pts, 6);
    g.computeVertexNormals();
    return g;
  }, []);

  const cOuter = useMemo(
    () => (color ? new THREE.Color(color) : new THREE.Color("#7b2ff7")),
    [color]
  );
  // push the core past the bloom threshold (>1) so it glows / auras
  const cInner = useMemo(() => {
    const c = color
      ? new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.55)
      : new THREE.Color("#e0aaff");
    return c.multiplyScalar(2.4);
  }, [color]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    const f = 1 + Math.sin(t * 15) * 0.12 + Math.sin(t * 26) * 0.06;
    if (grp.current) {
      grp.current.scale.set(size, size * f, size);
      grp.current.rotation.y = Math.sin(t * 3) * 0.18;
    }
    if (inner.current)
      inner.current.scale.set(0.55, 0.72 * (1 + Math.sin(t * 22) * 0.12), 0.55);
    if (aura.current)
      aura.current.material.opacity = 0.22 + Math.sin(t * 12) * 0.06;
  });

  return (
    <group ref={grp} scale={size}>
      {/* soft additive glow halo (the aura) */}
      <mesh ref={aura} position={[0, 0.2, 0]} scale={[1.7, 2.1, 1.7]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshBasicMaterial
          color={cOuter}
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* translucent violet outer droplet */}
      <mesh geometry={geo}>
        <meshBasicMaterial
          color={cOuter}
          toneMapped={false}
          transparent
          opacity={0.6}
        />
      </mesh>
      {/* bright blooming inner core */}
      <mesh
        ref={inner}
        geometry={geo}
        position={[0, 0.04, 0]}
        scale={[0.55, 0.72, 0.55]}
      >
        <meshBasicMaterial color={cInner} toneMapped={false} />
      </mesh>
    </group>
  );
}
