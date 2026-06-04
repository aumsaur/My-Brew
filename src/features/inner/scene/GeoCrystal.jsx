import * as THREE from "three";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import { useGeoGeo } from "@/shared/utils/lib";
import { EMBED } from "@/features/inner/data/skills";
import NameLabel from "@/features/inner/overlay/NameLabel";
import InfoCard from "@/features/inner/overlay/InfoCard";

const MIN_THICKNESS = 0.55; // gems never get flatter than this on the depth axis

// Rounded solid (buckyball / hexasphere / dodeca / egg) that drops in from above
// and settles into the floor. Label height is derived from the geometry's bbox.
export default function GeoCrystal({ data, hovered, setHovered, play = true }) {
  const group = useRef();
  const geo = useGeoGeo(data.form);
  const startY = useMemo(() => 9 + Math.random() * 4, []);
  const y = useRef(startY);
  const vy = useRef(0);
  const settled = useRef(false);
  const lift = useRef(0);
  const spin = useMemo(() => Math.random() * Math.PI * 2, []);
  const size = useMemo(() => 0.78 + Math.random() * 0.62, []); // ~0.78–1.4
  // Depth (thickness) varies for cut-gem vs chunky look, clamped so it never
  // goes paper-thin.
  const thickness = useMemo(
    () => MIN_THICKNESS + Math.random() * (1 - MIN_THICKNESS),
    []
  );
  const faceted = data.form !== "egg";

  const restY = -EMBED; // base sinks into floor
  const topY = restY + geo.boundingBox.max.y * size; // true world top (scaled)

  useCursor(hovered);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    // Hidden + armed until the inner world is actually reached
    if (!play) {
      settled.current = false;
      y.current = startY;
      vy.current = 0;
      g.scale.setScalar(0);
      return;
    }
    g.scale.setScalar(1);
    if (!settled.current) {
      vy.current -= 16 * delta;
      y.current += vy.current * delta;
      if (y.current <= restY) {
        y.current = restY;
        vy.current *= -0.32;
        if (Math.abs(vy.current) < 0.1) {
          settled.current = true;
          y.current = restY;
        }
      }
    }
    lift.current = THREE.MathUtils.lerp(
      lift.current,
      hovered ? 0.4 : 0,
      delta * 8
    );
    g.position.y = y.current + lift.current;
    g.rotation.y += (hovered ? 0.6 : 0.1) * delta;
  });

  return (
    <group
      ref={group}
      position={[data.x, 12, data.z]}
      rotation={[0, spin, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh geometry={geo} scale={[size, size, size * thickness]} castShadow>
        <meshStandardMaterial
          color={data.color}
          emissive={data.color}
          emissiveIntensity={hovered ? 1.0 : 0.45}
          flatShading={faceted}
          roughness={faceted ? 0.28 : 0.12}
          metalness={0.12}
          transparent
          opacity={0.92}
        />
      </mesh>
      <pointLight
        color={data.color}
        intensity={hovered ? 1.6 : 0.85}
        distance={3.2}
        decay={2}
        position={[0, 0.7, 0]}
      />
      <NameLabel
        icon={data.icon}
        text={data.label}
        color={data.color}
        y={topY + 0.32}
      />
      {hovered && <InfoCard data={data} top={topY + 1.0} />}
    </group>
  );
}
