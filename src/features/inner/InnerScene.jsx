import * as THREE from "three";
import { useMemo, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { rollSkills } from "@/features/inner/data/skills";
import SkillNode from "./scene/SkillNode";
import Ruins from "./scene/Ruins";
import Particles from "./scene/Particles";
import Candles from "./scene/Candles";
import CameraOrbit from "./scene/CameraOrbit";

// This scene's Canvas is mounted well before it's ever visible (InnerWorld.jsx
// mounts it at the start of the dive, frameloop paused) specifically so its
// shaders can compile before the reveal — but R3F never calls
// renderer.render() while frameloop is "never", so nothing actually compiles
// just from mounting early. Measured: without this, the FIRST real render
// (when frameloop flips on at the reveal) stalls the main thread for
// 2.7-3.8s — this scene mixes several distinct material permutations
// (flat-shaded vs smooth geo forms, standard vs the iridescent
// meshPhysicalMaterial one cluster type gets) each needing its own shader
// program, plus up to 9 dynamically-added per-crystal point lights. Forcing
// the compile explicitly, once, right on mount pays that cost while the dive
// transition is covering the screen instead of mid-scroll-gesture later.
function Precompile() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    gl.compileAsync(scene, camera);
  }, [gl, scene, camera]);
  return null;
}

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
      <Precompile />
    </>
  );
}
