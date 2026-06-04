import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import Vessel from "@/features/brew/scene/Vessel";
import { useBrew } from "@/features/brew/store";

const FONT = "'Cinzel', Georgia, serif";

// Inspect mode: a foreground canvas holding a CLONE of the brewed vessel that
// you can orbit, over the blurred-but-still-live world scene. Click empty space
// (a click, not a drag) to exit. Triggered by clicking the risen vessel.
export default function InspectOverlay() {
  const potion = useBrew((s) => s.potion);
  const inspecting = useBrew((s) => s.inspecting);
  const setInspecting = useBrew((s) => s.setInspecting);
  const down = useRef(null);

  if (!inspecting || !potion) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 30,
        background: "rgba(12,5,28,0.4)",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 3.4], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
        style={{ position: "absolute", inset: 0 }}
        onPointerDown={(e) => {
          down.current = [e.clientX, e.clientY];
        }}
        onPointerMissed={(e) => {
          // exit only on a click on empty space — ignore orbit drags
          const start = down.current;
          down.current = null;
          if (!start) return setInspecting(false);
          const d = Math.hypot(e.clientX - start[0], e.clientY - start[1]);
          if (d < 6) setInspecting(false);
        }}
      >
        <Environment preset="night" />
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 5]} intensity={1.4} />
        <pointLight
          position={[-3, -2, 2]}
          intensity={0.9}
          color={potion.color}
        />

        <group onClick={(e) => e.stopPropagation()}>
          <Vessel vessel={potion.vessel} color={potion.color} scale={2} />
        </group>

        <OrbitControls
          enablePan={false}
          minDistance={1.8}
          maxDistance={6}
          autoRotate
          autoRotateSpeed={0.8}
        />

        <EffectComposer>
          <Bloom
            luminanceThreshold={1}
            luminanceSmoothing={0.8}
            intensity={1}
            mipmapBlur
            blendFunction={BlendFunction.SCREEN}
          />
        </EffectComposer>
      </Canvas>

      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: "50%",
          transform: "translateX(-50%)",
          color: "#e9ddff",
          fontFamily: FONT,
          fontSize: 14,
          letterSpacing: "0.05em",
          opacity: 0.75,
          pointerEvents: "none",
          textShadow: "0 1px 6px rgba(0,0,0,0.8)",
        }}
      >
        {potion.name} · drag to rotate · click anywhere to exit
      </div>
    </div>
  );
}
