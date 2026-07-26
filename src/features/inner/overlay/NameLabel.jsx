import { Billboard, Text } from "@react-three/drei";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useIconTexture } from "@/shared/utils/lib";

// Always-visible floating label: brand icon above the skill name. Billboarded to
// face the camera and rendered on top (depthTest off) so crystals never hide it.
// On hover it cross-fades OUT as the InfoCard hover label fades in.
export default function NameLabel({ icon, text, color, y, hovered = false }) {
  const tex = useIconTexture(icon, color);
  const iconMat = useRef();
  const textRef = useRef();
  const op = useRef(1);

  useFrame((_, delta) => {
    // ease toward 0 (hovered) / 1 (idle) so the floating label dissolves in/out
    op.current = THREE.MathUtils.damp(op.current, hovered ? 0 : 1, 10, delta);
    if (iconMat.current) iconMat.current.opacity = op.current;
    const t = textRef.current;
    if (t) {
      t.fillOpacity = op.current;
      t.outlineOpacity = op.current;
    }
  });

  return (
    <Billboard position={[0, y, 0]}>
      {tex && (
        <mesh position={[0, 0.52, 0]} renderOrder={999}>
          <planeGeometry args={[0.44, 0.44]} />
          <meshBasicMaterial
            ref={iconMat}
            map={tex}
            transparent
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      )}
      <Text
        ref={textRef}
        fontSize={0.2}
        color={color}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.014}
        outlineColor="#05010f"
        renderOrder={999}
        material-depthTest={false}
        material-depthWrite={false}
        material-transparent
      >
        {text}
      </Text>
    </Billboard>
  );
}
