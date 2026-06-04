import * as THREE from "three";
import { useRef } from "react";
import { Billboard, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useDebug } from "@/shared/store/debug";
import { HOTSPOTS } from "@/features/brew/data/hotspots";

// One pulsing ring + floating label marking a click target. Billboarded so it
// always faces the camera through the dive.
function Marker({ spot }) {
  const ring = useRef();
  const seed = useRef(Math.random() * 6).current;

  useFrame(({ clock }) => {
    if (ring.current) {
      const p = 1 + Math.sin(clock.elapsedTime * 3 + seed) * 0.12;
      ring.current.scale.setScalar(p);
    }
  });

  const dim = spot.active ? 1 : 0.45;

  return (
    <group position={spot.pos}>
      <Billboard>
        <mesh ref={ring}>
          <ringGeometry args={[spot.radius * 0.84, spot.radius, 48]} />
          <meshBasicMaterial
            color={spot.color}
            transparent
            opacity={0.9 * dim}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh>
          <circleGeometry args={[spot.radius * 0.84, 48]} />
          <meshBasicMaterial
            color={spot.color}
            transparent
            opacity={0.1 * dim}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </Billboard>

      <Html
        center
        distanceFactor={9}
        position={[0, spot.radius + 0.35, 0]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 13,
            lineHeight: 1.25,
            whiteSpace: "nowrap",
            textAlign: "center",
            color: "#fff",
            background: "rgba(8,3,20,0.78)",
            border: `1px solid ${spot.color}`,
            borderRadius: 7,
            padding: "4px 9px",
            boxShadow: `0 0 12px ${spot.color}66`,
          }}
        >
          <div style={{ color: spot.color, fontWeight: 700 }}>
            {spot.active ? "●" : "○"} {spot.label}
          </div>
          <div style={{ opacity: 0.7, fontSize: 11 }}>{spot.hint}</div>
          <div style={{ opacity: 0.4, fontSize: 10 }}>
            [{spot.pos.map((n) => n.toFixed(2)).join(", ")}]
          </div>
        </div>
      </Html>
    </group>
  );
}

// In-scene overlay of all registered click targets. Gated by the debug store.
export default function Hotspots() {
  const show = useDebug((s) => s.showHotspots);
  if (!show) return null;
  return HOTSPOTS.map((s) => <Marker key={s.id} spot={s} />);
}
