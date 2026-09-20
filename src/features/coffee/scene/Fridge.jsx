import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useCursor } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import * as THREE from "three";

// Retro fridge — the coffee corner's ingredient store, replacing CabinetShelf's
// paginated shelves (a fridge has shelves AND door racks, so the two "pages"
// become physical).
//
// Loaded as `nodes` + `materials` and drawn mesh by mesh, NOT through a
// generic GLB component. The generic kind replaces o.material on every mesh
// with one flat vertex-coloured material to rescue untextured single-mesh
// blobs; push this model through that and all 7 baked materials collapse into
// one hue.
//
// BASE_URL rather than a hardcoded "/" so it still resolves when the app is
// served from a subpath (GitHub Pages' "/My-Brew/").
const MODEL = `${import.meta.env.BASE_URL}models/fridge.glb`;

// Blender's +Z opening rotation maps to +Y here. If the door swings INTO the
// fridge instead of toward the room, flip this sign — one-character fix.
const OPEN_ANGLE = Math.PI * 0.55;

export default function Fridge({
  open = false,
  highlight = true, // hover outline; needs an ancestor <Selection>
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onClick,
}) {
  const { nodes, materials } = useGLTF(MODEL);
  const door = useRef();
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  useFrame((_state, delta) => {
    if (!door.current) return;
    // damp() rather than lerp() so the swing is frame-rate independent — the
    // same reason the rig damps its camera routes.
    door.current.rotation.y = THREE.MathUtils.damp(
      door.current.rotation.y,
      open ? OPEN_ANGLE : 0,
      4,
      delta
    );
  });

  const fridge = (
    <group
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <mesh
        geometry={nodes.fridge_body.geometry}
        material={materials.m_shell}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={nodes.fridge_shelves.geometry}
        material={materials.m_shelf}
        castShadow
        receiveShadow
      />

      {/* The door node's own translation IS the hinge, and fridge_handle is its
          child in the glTF, so rotating this one node swings both. */}
      <group
        ref={door}
        position={nodes.fridge_door.position}
        rotation={nodes.fridge_door.rotation}
      >
        <mesh
          geometry={nodes.fridge_door.geometry}
          material={materials.m_door}
          castShadow
        />
        <mesh
          geometry={nodes.fridge_handle.geometry}
          material={materials.m_chrome}
          castShadow
        />
      </group>

      {/* The shelf items are NOT here. They are the portfolio, and picking
          one up flies it to the camera in world space — see scene/StashShelf,
          mounted at the room root so that is plain arithmetic rather than a
          matrix conversion through this group every frame. */}
    </group>
  );

  return highlight ? <Select enabled={hovered}>{fridge}</Select> : fridge;
}

useGLTF.preload(MODEL);
