import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useBrew } from "@/features/brew/store";

// A single expanding/fading ring at the liquid surface. Foam-white (a brightened
// tint of the brew color) so it reads against the glowing liquid from any angle.
function Splash({ color, onDone }) {
  const ring = useRef();
  const t = useRef(0);
  const foam = useMemo(
    () => new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.65),
    [color]
  );
  useFrame((_, delta) => {
    if (!ring.current) return;
    t.current += delta;
    const k = Math.min(1, t.current / 0.85);
    const s = 0.2 + k * 1.9;
    ring.current.scale.set(s, s, s);
    ring.current.material.opacity = (1 - k) * 0.8;
    if (k >= 1) onDone();
  });
  return (
    <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} renderOrder={5}>
      <ringGeometry args={[0.55, 0.66, 40]} />
      <meshBasicMaterial
        color={foam}
        transparent
        opacity={0.95}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

// Watches the brew pulse and emits a splash (+ a brief light flash) each time an
// ingredient lands in the cauldron. Sits at the liquid surface.
export default function BrewFX({ position = [0, 0.45, 0] }) {
  const pulse = useBrew((s) => s.pulse);
  const color = useBrew((s) => s.color);
  const [splashes, setSplashes] = useState([]);
  const flash = useRef();

  useEffect(() => {
    if (pulse === 0) return;
    setSplashes((s) => [...s, { id: pulse, color }]);
    if (flash.current) flash.current.intensity = 6;
  }, [pulse]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    if (flash.current && flash.current.intensity > 0) {
      flash.current.intensity = Math.max(
        0,
        flash.current.intensity - delta * 14
      );
    }
  });

  return (
    <group position={position}>
      <pointLight
        ref={flash}
        color={color}
        intensity={0}
        distance={5}
        decay={2}
        position={[0, 0.4, 0]}
      />
      {splashes.map((s) => (
        <Splash
          key={s.id}
          color={s.color}
          onDone={() => setSplashes((v) => v.filter((x) => x.id !== s.id))}
        />
      ))}
    </group>
  );
}
