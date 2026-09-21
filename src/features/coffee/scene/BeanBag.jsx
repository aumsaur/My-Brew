import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useCursor, Text } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import * as THREE from "three";

// Everything painted on a thing in this room is LETTERED in the same hand;
// see scene/WallSign. A mix of faces reads as accidental.
const FONT = `${import.meta.env.BASE_URL}fonts/Tealand.ttf`;

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

  // THE BAG STAYS IN THE ROW. It used to step forward 70mm and lift, as a
  // way of showing which one was yours — that was written before there was
  // an inventory, when the only other cue was an outline you had to already
  // be looking for. The hotbar names the bean and shows its roast now, so
  // the shelf does not also have to mime it, and a bag that is supposedly in
  // your hands while still sitting on the shelf was always the odd part of
  // it. The hover/selected outline stays; that is a cursor cue, not a claim
  // about where the bag is.

  return (
    <group
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
      {/* <Select> wraps ONLY the geometry. Keeping <Text
        font={FONT}> out of it is not
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
          font={FONT}
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
