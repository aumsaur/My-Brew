import * as THREE from "three";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";

// Soft round sprite for each mote
function useDotTexture() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const s = 64;
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.4, "rgba(220,200,255,0.6)");
    g.addColorStop(1, "rgba(220,200,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    const tex = new THREE.CanvasTexture(c);
    return tex;
  }, []);
}

// Ambient dust drifting slowly upward inside the dome.
export default function Particles({ count = 420 }) {
  const ref = useRef();
  const tex = useDotTexture();
  const ceiling = 15;

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = Math.sqrt(Math.random()) * 16;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3 + 0] = Math.cos(a) * r;
      positions[i * 3 + 1] = Math.random() * ceiling;
      positions[i * 3 + 2] = Math.sin(a) * r;
      speeds[i] = 0.25 + Math.random() * 0.6;
    }
    return { positions, speeds };
  }, [count, ceiling]);

  useFrame((state, delta) => {
    const geo = ref.current;
    if (!geo) return;
    const arr = geo.attributes.position.array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      let y = arr[i * 3 + 1] + speeds[i] * delta;
      if (y > ceiling) y -= ceiling; // wrap to the floor
      arr[i * 3 + 1] = y;
      // gentle horizontal sway
      arr[i * 3 + 0] += Math.sin(t * 0.3 + i) * delta * 0.04;
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={ref}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={tex}
        size={0.12}
        sizeAttenuation
        color="#c9b6ff"
        transparent
        opacity={0.8}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
