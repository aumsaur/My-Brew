import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import { useBrew } from "@/features/brew/store";
import { POT_CAPACITY, MIN_FILL_RATIO } from "@/features/brew/data/recipes";

const MIN_FILL = POT_CAPACITY * MIN_FILL_RATIO;

const STIR_HOLD = 1.6; // seconds of holding the stick to complete a stir

// A wooden stir stick resting in the cauldron. PRESS AND HOLD it to stir: the
// stick spins and the stir gauge fills over STIR_HOLD seconds, then the brew is
// judged (store.serve()). There must be something poured in first (beginStir
// guards it). Progress persists between holds, so you can stir in bursts.
export default function StirStick() {
  const stir = useRef(); // group we spin while stirring
  const [hovered, setHovered] = useState(false);
  const [holding, setHolding] = useState(false);

  const beginStir = useBrew((s) => s.beginStir);
  const addStir = useBrew((s) => s.addStir);
  const canStir = useBrew(
    (s) =>
      s.phase !== "served" &&
      Object.values(s.pours).reduce((a, b) => a + b, 0) >= MIN_FILL
  );

  useCursor((hovered && canStir) || holding);

  // advance the stir while held (frame-rate independent)
  useFrame((_, delta) => {
    if (!holding) return;
    if (useBrew.getState().phase !== "stirring") return; // done / served
    if (stir.current) stir.current.rotation.y += delta * 7;
    addStir(Math.min(delta, 0.05) / STIR_HOLD);
  });

  // release safety — catch the pointerup even if it lands off the stick
  useEffect(() => {
    if (!holding) return;
    const up = () => setHolding(false);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [holding]);

  const lit = (hovered && canStir) || holding;

  return (
    <group
      position={[0, 0.25, 0]}
      onPointerDown={(e) => {
        e.stopPropagation();
        const started = beginStir();
        if (started || useBrew.getState().phase === "stirring") {
          e.target?.setPointerCapture?.(e.pointerId);
          setHolding(true);
        }
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        e.target?.releasePointerCapture?.(e.pointerId);
        setHolding(false);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <Select enabled={lit}>
        <group ref={stir}>
          {/* grip juts OUT over the rim toward the camera side, tip plunges into
              the near-center of the liquid. */}
          <group position={[-0.5, -0.5, 0.75]} rotation={[0.156, 0, 0]}>
            {/* shaft */}
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
