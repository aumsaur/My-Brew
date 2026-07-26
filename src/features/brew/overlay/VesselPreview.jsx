import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import ServedVessel from "@/features/brew/scene/RecipeVessel";

// Same slow spin the served vessel gets in the main scene (RisingVessel in
// BrewScene.jsx) — kept consistent so this reads as "the same thing," not a
// different illustration of it.
function SpinningVessel({ recipeId, vessel, color }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.6;
  });
  return (
    <group ref={ref} position={[0, -0.15, 0]}>
      <ServedVessel recipeId={recipeId} vessel={vessel} color={color} />
    </group>
  );
}

// A small LIVE render of the brew's actual vessel model — the bespoke
// per-recipe one if a recipe was matched, otherwise the generic category shape
// (same dispatch RisingVessel uses in the main scene) — the share card's hero
// image is this real 3D asset, not a flat icon. `onReady` hands back the
// underlying WebGL canvas so "Save image" can snapshot it straight into the
// exported PNG (preserveDrawingBuffer keeps the buffer readable after each
// frame presents).
export default function VesselPreview({ recipeId, vessel, color, secret, size = 176, onReady }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        margin: "0 auto",
        filter: secret ? "drop-shadow(0 0 16px #e8c27a)" : `drop-shadow(0 0 20px ${color}77)`,
      }}
    >
      <Canvas
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
        dpr={[1, 2]}
        camera={{ position: [0, 0.15, 3], fov: 30 }}
        onCreated={({ gl }) => onReady?.(gl.domElement)}
      >
        <ambientLight intensity={0.95} color="#c7bbff" />
        <directionalLight position={[2, 3, 2]} intensity={1.4} color="#fff2d8" />
        <directionalLight position={[-2, 1, -1.5]} intensity={0.55} color="#d8c9ff" />
        <pointLight position={[-1.5, -0.4, 1.6]} intensity={0.6} color={color} />
        <SpinningVessel recipeId={recipeId} vessel={vessel} color={color} />
      </Canvas>
    </div>
  );
}
