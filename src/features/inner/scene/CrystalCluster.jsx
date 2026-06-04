import * as THREE from "three";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import { useShardGeo, easeOutBack, SHARD_TOP } from "@/shared/utils/lib";
import { EMBED, ARRANGEMENTS, TREATMENTS } from "@/features/inner/data/skills";
import NameLabel from "@/features/inner/overlay/NameLabel";
import InfoCard from "@/features/inner/overlay/InfoCard";

// Material per crystal "treatment"
function ShardMaterial({ treatment, color, hovered }) {
  if (treatment === "iris") {
    // Iridescent clear quartz — rainbow film over the surface
    return (
      <meshPhysicalMaterial
        color={color}
        emissive={color}
        emissiveIntensity={hovered ? 0.7 : 0.35}
        iridescence={1}
        iridescenceIOR={1.8}
        roughness={0.08}
        metalness={0.1}
        transparent
        opacity={0.9}
      />
    );
  }
  if (treatment === "elestial") {
    // Smoky, etched skeletal quartz — darker, rougher
    return (
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={hovered ? 0.7 : 0.3}
        roughness={0.5}
        metalness={0.15}
        transparent
        opacity={0.86}
      />
    );
  }
  if (treatment === "tangerine") {
    // Frosted, warm hematite-dusted quartz
    return (
      <meshStandardMaterial
        color={color}
        emissive="#ff7d2e"
        emissiveIntensity={hovered ? 0.6 : 0.3}
        roughness={0.55}
        metalness={0.1}
        transparent
        opacity={0.9}
      />
    );
  }
  return (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={hovered ? 1.0 : 0.5}
      roughness={0.28}
      metalness={0.12}
      transparent
      opacity={0.9}
    />
  );
}

// A chunk of crystal shards that grows up out of the ground.
export default function CrystalCluster({
  data,
  hovered,
  setHovered,
  play = true,
}) {
  const group = useRef();
  const shardsRef = useRef();
  const geo = useShardGeo();
  const grow = useRef(0);
  const lift = useRef(0);
  const baseRot = useMemo(() => Math.random() * Math.PI * 2, []);
  const size = useMemo(() => 0.8 + Math.random() * 0.5, []); // ~0.8–1.3
  const shards = ARRANGEMENTS[data.type] ?? ARRANGEMENTS.fan;
  const treatment = TREATMENTS[data.type] ?? "standard";
  // Tallest shard (scaled) sets where the floating label sits
  const topY = useMemo(
    () => Math.max(...shards.map((c) => c.s * c.hy)) * SHARD_TOP * size,
    [shards, size]
  );

  useCursor(hovered);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    // Stay un-grown (hidden) until the inner world is actually reached
    if (!play) {
      grow.current = 0;
      g.position.y = -EMBED;
      if (shardsRef.current) shardsRef.current.scale.setScalar(0);
      return;
    }
    if (grow.current < 1)
      grow.current = Math.min(1, grow.current + delta * 1.4);
    lift.current = THREE.MathUtils.lerp(
      lift.current,
      hovered ? 0.28 : 0,
      delta * 8
    );
    g.position.y = -EMBED + lift.current;
    // Only the shards grow/scale — the label keeps a constant size
    if (shardsRef.current)
      shardsRef.current.scale.setScalar(size * easeOutBack(grow.current));
  });

  return (
    <group
      ref={group}
      position={[data.x, -EMBED, data.z]}
      rotation={[0, baseRot, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <group ref={shardsRef}>
        {shards.map((c, i) => (
          <mesh
            key={i}
            geometry={geo}
            position={[c.dx, 0, c.dz]}
            rotation={[c.tx, i * 1.1, c.tz]}
            scale={[c.s, c.s * c.hy, c.s]}
            castShadow
          >
            <ShardMaterial
              treatment={treatment}
              color={data.color}
              hovered={hovered}
            />
          </mesh>
        ))}
      </group>
      <pointLight
        color={data.color}
        intensity={hovered ? 1.5 : 0.85}
        distance={2.8}
        decay={2}
        position={[0, 0.9, 0]}
      />
      <NameLabel
        icon={data.icon}
        text={data.label}
        color={data.color}
        y={topY + 0.32}
      />
      {hovered && <InfoCard data={data} top={topY + 0.95} />}
    </group>
  );
}
