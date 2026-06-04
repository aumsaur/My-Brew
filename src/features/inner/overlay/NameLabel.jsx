import { Billboard, Text } from "@react-three/drei";
import { useIconTexture } from "@/shared/utils/lib";

// Always-visible floating label: brand icon above the skill name. Billboarded to
// face the camera and rendered on top (depthTest off) so crystals never hide it.
export default function NameLabel({ icon, text, color, y }) {
  const tex = useIconTexture(icon, color);
  return (
    <Billboard position={[0, y, 0]}>
      {tex && (
        <mesh position={[0, 0.52, 0]} renderOrder={999}>
          <planeGeometry args={[0.44, 0.44]} />
          <meshBasicMaterial
            map={tex}
            transparent
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      )}
      <Text
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
