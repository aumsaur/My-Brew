import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useCursor, Text } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import * as THREE from "three";

// One bag model, varied per origin by DATA:
//   label colour = roast level, <Text> = origin name, jitter = not-cloned look.
// Adding a bean is a row in data/beans.js, never a new mesh.
const MODEL = `${import.meta.env.BASE_URL}models/bean-bag.glb`;

export default function BeanBag({
  name = "",
  labelColor = "#f0ead8", // origin accent — what tells bags apart
  tieColor = "#3a3a3c", // roast shade — secondary, reads up close
  selected = false,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onSelect,
}) {
  const { nodes, materials } = useGLTF(MODEL);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  // CLONE the label material per instance. useGLTF's materials are SHARED from
  // drei's cache, so mutating m_bag_label.color directly would recolour every
  // bag on the shelf at once — the exact failure the tint() note in palette.js
  // warns about. Geometry stays shared, which is what we want.
  const labelMat = useMemo(() => {
    const m = materials.m_bag_label.clone();
    m.color = new THREE.Color(labelColor);
    return m;
  }, [materials, labelColor]);

  const tieMat = useMemo(() => {
    const m = materials.m_bag_tie.clone();
    m.color = new THREE.Color(tieColor);
    return m;
  }, [materials, tieColor]);

  // THE CHOSEN BAG STEPS OUT OF THE ROW. Picking one used to change nothing
  // you could see on the shelf — an outline you had to already be looking
  // for, and a line of HUD text across the screen — so the most important
  // choice in the loop was also its least visible. Now it comes forward and
  // lifts, the way you would actually pull a bag off a shelf, and stays
  // there for as long as it is yours.
  const g = useRef();
  useFrame((_state, delta) => {
    if (!g.current) return;
    const k = selected ? 1 : 0;
    g.current.position.z = THREE.MathUtils.damp(
      g.current.position.z,
      position[2] + k * 0.07,
      6,
      delta
    );
    g.current.position.y = THREE.MathUtils.damp(
      g.current.position.y,
      position[1] + k * 0.018,
      6,
      delta
    );
    g.current.rotation.y = THREE.MathUtils.damp(
      g.current.rotation.y,
      rotation[1] + k * (0.5 - rotation[1]),
      5,
      delta
    );
  });

  return (
    <group
      ref={g}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* <Select> wraps ONLY the geometry. Keeping <Text> out of it is not
          cosmetic: the Outline pass overrides materials to build its selection
          mask, which discards troika's alpha cutout, so a selected text mesh
          outlines as its full bounding QUAD — a rectangle floating behind the
          bag. Same reason the machine's wordmark sits outside its Select. */}
      <Select enabled={hovered || selected}>
        <mesh
          geometry={nodes.bag_body.geometry}
          material={materials.m_bag_kraft}
          castShadow
          receiveShadow
        />
        <mesh
          geometry={nodes.bag_tie.geometry}
          material={materials.m_bag_tie}
        />
        <mesh geometry={nodes.bag_label.geometry} material={labelMat} />
      </Select>

      {name ? (
        <Text
          position={[0, 0.067, -0.0345]}
          fontSize={0.0095}
          letterSpacing={0.08}
          color="#fdf6ea"
          anchorX="center"
          anchorY="middle"
        >
          {name}
        </Text>
      ) : null}
    </group>
  );
}

useGLTF.preload(MODEL);
