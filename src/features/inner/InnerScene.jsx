import * as THREE from "three";
import { useMemo } from "react";
import { rollSkills } from "@/features/inner/data/skills";
import SkillNode from "./scene/SkillNode";
import Ruins from "./scene/Ruins";
import Particles from "./scene/Particles";
import Candles from "./scene/Candles";
import CameraOrbit from "./scene/CameraOrbit";

// ── Scene root ────────────────────────────────────────────────────────────────
export default function InnerScene({ play = true }) {
  // Roll shapes once per mount: ~35% chunk clusters, the rest gem drops
  const skills = useMemo(() => rollSkills(0.35), []);

  return (
    <>
      <fog attach="fog" args={["#060218", 9, 22]} />
      <color attach="background" args={["#060218"]} />

      <ambientLight intensity={0.12} />
      <pointLight
        position={[0, 10, 0]}
        color="#9d4edd"
        intensity={3.5}
        distance={20}
        decay={1.5}
      />
      <pointLight
        position={[0, 4, 0]}
        color="#c77dff"
        intensity={0.6}
        distance={8}
        decay={2}
      />

      {/* Dome interior */}
      <mesh>
        <sphereGeometry args={[24, 32, 32]} />
        <meshStandardMaterial
          color="#0e0620"
          side={THREE.BackSide}
          roughness={1}
        />
      </mesh>

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[20, 72]} />
        <meshStandardMaterial
          color="#0a0418"
          roughness={0.96}
          metalness={0.04}
        />
      </mesh>

      <Ruins />
      <Candles />
      <Particles />

      {skills.map((s) => (
        <SkillNode key={s.id} data={s} play={play} />
      ))}

      <CameraOrbit />
    </>
  );
}
