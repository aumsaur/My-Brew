import * as THREE from "three";
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import { useBrew } from "@/features/brew/store";

const TWO_PI = Math.PI * 2;
const STIR_TURNS = 2; // full sweeps around the cauldron per stir
const STIR_DUR = 2.4; // seconds — stir runs this long, THEN the product appears

// A wooden stir stick resting in the cauldron. Click it to brew: it stirs the
// pot for STIR_DUR seconds (ease-out) and only THEN reveals the rising product.
// Driven by the store's brewPulse (bumped by startStir).
export default function StirStick() {
  const stir = useRef(); // group we spin to stir
  const startRot = useRef(0); // rotation when this stir began
  const elapsed = useRef(0);
  const spinning = useRef(false);
  const prevPulse = useRef(0);
  const [hovered, setHovered] = useState(false);

  const startStir = useBrew((s) => s.startStir);
  const brew = useBrew((s) => s.brew);
  const brewPulse = useBrew((s) => s.brewPulse);
  const canBrew = useBrew(
    (s) => s.added.length >= 1 && !s.potion && !s.stirring
  );

  useCursor(hovered && canBrew);

  useFrame((_, delta) => {
    const g = stir.current;
    if (!g) return;
    // a stir kicks off STIR_TURNS sweeps over STIR_DUR seconds, easing out and
    // stopping exactly at the resting pose; on completion the product is brewed
    if (brewPulse !== prevPulse.current) {
      prevPulse.current = brewPulse;
      startRot.current = g.rotation.y;
      elapsed.current = 0;
      spinning.current = true;
    }
    if (spinning.current) {
      elapsed.current += delta;
      const k = Math.min(1, elapsed.current / STIR_DUR);
      const ease = 1 - Math.pow(1 - k, 3); // easeOutCubic
      g.rotation.y = startRot.current + ease * TWO_PI * STIR_TURNS;
      if (k >= 1) {
        spinning.current = false;
        brew(); // stir done → reveal the product
      }
    }
  });

  const lit = hovered && canBrew;

  return (
    <group
      position={[0, 0.25, 0]}
      onClick={(e) => {
        e.stopPropagation();
        if (canBrew) startStir();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* glow only while hovering a clickable stick */}
      <Select enabled={hovered && canBrew}>
        <group ref={stir}>
          {/* placed by its two endpoints: grip ≈ (z 0.85, y 0.5) juts OUT over
              the rim toward the camera-side, tip ≈ (z 0, y -0.7) plunges into
              the pink near the center. Lean is in the Z axis so it reads as a
              clear diagonal from the default front view (the X axis points at
              that camera, which is why an X-lean looked vertical).
              (midpoint z0.425,y-0.10 · lean +0.616 rad about X · length 1.47) */}
          <group position={[-0.5, -0.5, 0.75]} rotation={[0.156, 0, 0]}>
            {/* shaft — grip end up/out, tip end down into the liquid */}
            <mesh position={[0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.05, 1.47, 6]} />
              <meshStandardMaterial
                color="#6b4423"
                roughness={0.8}
                flatShading
                emissive={lit ? "#ffae54" : "#000000"}
                emissiveIntensity={lit ? 0.5 : 0}
              />
            </mesh>
            {/* knob on the dry grip end */}
            <mesh position={[0, 0.735, 0]} castShadow>
              <icosahedronGeometry args={[0.1, 0]} />
              <meshStandardMaterial
                color="#7c4f2a"
                roughness={0.7}
                flatShading
                emissive={lit ? "#ffae54" : "#000000"}
                emissiveIntensity={lit ? 0.4 : 0}
              />
            </mesh>
          </group>
        </group>
      </Select>
    </group>
  );
}
