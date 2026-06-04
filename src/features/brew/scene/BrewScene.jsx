import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useCursor } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import { useBrew } from "@/features/brew/store";
import { INGREDIENTS } from "@/features/brew/data/ingredients";
import IngredientModel from "./IngredientModel";
import Vessel from "./Vessel";
import StirStick from "./StirStick";
import BrewFX from "@/features/brew/scene/Cauldron/BrewFX";

const SURFACE_Y = -0.5; // where a dropped ingredient lands, sinks & dissolves
const RIPPLE_Y = -0.5; // where the splash ring shows (draws over the bubbles
// via depthTest:false, so it can sit low on the surface)

// A dropped ingredient model that falls into the pot, then sinks and dissolves.
function FallingIngredient({ ing, onDone }) {
  const ref = useRef();
  const y = useRef(2.0);
  const vy = useRef(0);
  const landed = useRef(false);
  const start = useRef([
    (Math.random() - 0.5) * 0.4,
    2.0,
    (Math.random() - 0.5) * 0.4,
  ]);

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    g.rotation.x += delta * 3;
    g.rotation.y += delta * 2;
    if (!landed.current) {
      vy.current -= 9 * delta;
      y.current += vy.current * delta;
      if (y.current <= SURFACE_Y) {
        y.current = SURFACE_Y;
        landed.current = true;
      }
      g.position.y = y.current;
    } else {
      g.position.y -= delta * 0.4; // sink
      g.scale.multiplyScalar(1 - delta * 3.2); // dissolve
      if (g.scale.x < 0.06) onDone();
    }
  });

  return (
    <group ref={ref} position={start.current} scale={0.7}>
      <IngredientModel kind={ing.kind} color={ing.color} />
    </group>
  );
}

function FallingIngredients() {
  const pulse = useBrew((s) => s.pulse);
  const lastAdded = useBrew((s) => s.lastAdded);
  const [drops, setDrops] = useState([]);

  useEffect(() => {
    if (pulse === 0 || !lastAdded) return;
    setDrops((d) => [...d, { id: pulse, ing: INGREDIENTS[lastAdded] }]);
  }, [pulse]); // eslint-disable-line react-hooks/exhaustive-deps

  return drops.map((d) => (
    <FallingIngredient
      key={d.id}
      ing={d.ing}
      onDone={() => setDrops((v) => v.filter((x) => x.id !== d.id))}
    />
  ));
}

// The brewed product rises out of the cauldron, then collapses back down to
// nothing when the brew is reset (exiting) instead of just vanishing.
function RisingVessel({ potion, exiting, onExited }) {
  const ref = useRef();
  const t = useRef(0);
  const s = useRef(0.2);
  const [hovered, setHovered] = useState(false);
  const setInspecting = useBrew((st) => st.setInspecting);
  useCursor(hovered && !exiting);
  // intense brews are smaller (a shot), milder ones bigger (a tall latte)
  const sizeFactor = 1.15 - (potion.intensity ?? 0.6) * 0.35;
  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    if (!exiting) {
      t.current += delta;
      const k = Math.min(1, t.current / 1.2);
      const ease = 1 - Math.pow(1 - k, 3);
      g.position.y = -0.2 + ease * 1.1;
      s.current = 0.2 + ease * 0.95;
      if (k >= 1) g.position.y = 0.9 + Math.sin(t.current * 1.6) * 0.04;
    } else {
      s.current = THREE.MathUtils.lerp(s.current, 0, delta * 9);
      if (s.current < 0.04) {
        onExited();
        return;
      }
    }
    g.rotation.y += delta * 0.6;
    g.scale.setScalar(s.current * sizeFactor);
  });
  return (
    <group
      ref={ref}
      position={[0, -0.2, 0]}
      scale={0.2}
      onClick={(e) => {
        e.stopPropagation();
        if (!exiting) setInspecting(true);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* glow only while hovering (signals it's clickable to inspect) */}
      <Select enabled={hovered && !exiting}>
        <Vessel vessel={potion.vessel} color={potion.color} />
      </Select>
      <pointLight color={potion.color} intensity={1.6} distance={4} decay={2} />
    </group>
  );
}

// Keeps the vessel mounted through its collapse animation after a reset.
function BrewProduct() {
  const potion = useBrew((s) => s.potion);
  const [shown, setShown] = useState(null);
  useEffect(() => {
    if (potion) setShown(potion);
  }, [potion]);
  if (!shown) return null;
  return (
    <RisingVessel
      key={shown.name}
      potion={shown}
      exiting={!potion}
      onExited={() => setShown(null)}
    />
  );
}

// All the in-canvas brewing reactions, mounted once in the Experience scene.
export default function BrewScene() {
  return (
    <>
      <BrewFX position={[0, RIPPLE_Y, 0]} />
      <FallingIngredients />
      <BrewProduct />
      <StirStick />
    </>
  );
}
