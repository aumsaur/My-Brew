import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import LowPolyFire from "@/shared/components/LowPolyFire";

// Candle stubs scattered around the chamber — warm, flickering coven light.
const CANDLES = [
  { x: -6.6, z: -3.4, h: 0.55 },
  { x: 7.2, z: -2.2, h: 0.34 },
  { x: -5.0, z: 6.2, h: 0.7 },
  { x: 5.8, z: 5.6, h: 0.46 },
  { x: 0.5, z: -7.8, h: 0.6 },
  { x: -8.2, z: 1.0, h: 0.4 },
  { x: 3.2, z: 7.4, h: 0.5 },
];

function Candle({ x, z, h }) {
  const light = useRef();
  const seed = useMemo(() => Math.random() * 10, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    const f = 0.78 + Math.sin(t * 9) * 0.14 + Math.sin(t * 23) * 0.07;
    if (light.current) light.current.intensity = f * 1.7;
  });

  return (
    <group position={[x, 0, z]}>
      {/* tapered faceted wax body (flat-shaded hexagonal prism) */}
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.12, h, 6]} />
        <meshStandardMaterial color="#e8dcc0" roughness={0.85} flatShading />
      </mesh>
      {/* melted wax pool at the top */}
      <mesh position={[0, h + 0.02, 0]} scale={[1, 0.45, 1]}>
        <icosahedronGeometry args={[0.11, 0]} />
        <meshStandardMaterial color="#f3ecd6" roughness={0.9} flatShading />
      </mesh>
      {/* wick */}
      <mesh position={[0, h + 0.07, 0]}>
        <cylinderGeometry args={[0.013, 0.013, 0.06, 4]} />
        <meshStandardMaterial color="#2a2018" roughness={1} />
      </mesh>
      {/* low-poly flame */}
      <group position={[0, h + 0.11, 0]}>
        <LowPolyFire size={0.55} />
      </group>
      <pointLight
        ref={light}
        position={[0, h + 0.15, 0]}
        color="#b76dff"
        intensity={1.7}
        distance={4.5}
        decay={2}
        castShadow={false}
      />
    </group>
  );
}

export default function Candles() {
  return CANDLES.map((c, i) => <Candle key={i} {...c} />);
}
