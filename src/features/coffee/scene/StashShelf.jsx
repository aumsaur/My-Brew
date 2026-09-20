import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGLTF, useCursor, Text } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import { LAYOUT } from "@/features/coffee/layout";
import { STASH } from "@/features/coffee/data/stash";
import { useHeldPose } from "@/features/coffee/useHeldPose";

// The portfolio, sitting on the fridge shelves as groceries.
//
// These live OUTSIDE the <Fridge> group even though their geometry comes from
// fridge.glb, because picking one up flies it to the camera in WORLD space. As
// children of a translated, scaled fridge that would mean converting a
// camera-space target back through the parent's matrix every frame; at the
// root the rest pose is just arithmetic on LAYOUT.fridge and the held pose is
// the camera's own transform. Same reason the grinder is a sibling of the
// board rather than a child of it.
//
// LABELS are the point of the redesign. Before, three unlabelled groceries
// meant the only way to discover a project was to click a jar and find out —
// which is not discovery, it is guessing. Now the shelf edge names them, but
// only once the door is open: the closed fridge is still an innocent
// appliance, so the reveal survives while the guessing does not.
const MODEL = `${import.meta.env.BASE_URL}models/fridge.glb`;

// fraction of frame height a held item fills, and where it sits — pushed
// right so the project card owns the left of the screen
const FIT = 0.52;
const FRAME_X = 0.13;
const FRAME_Y = 0.02;
const TILT = [0.06, -0.5, 0.03];

// front edge of fridge_shelves, in MODEL units — where a shop puts its tags
const SHELF_FRONT_Z = 0.255;

// Shelf tag, sized in WORLD metres (not model units) so the type stays legible
// whatever the fridge is scaled to. Bare floating text read as debris; giving
// it a plate in the project's own colour makes it a printed label, which is
// what it is — and it borrows the bean bags' treatment, accent plate with pale
// type, so the two shelves in this room speak the same language.
const TAG_H = 0.033;
const TAG_PAD = 0.024;
const TAG_CHAR = 0.012;
const TAG_FONT = 0.019;
const TAG_TILT = -0.42; // leaned back, so the face angles up at the viewer

export default function StashShelf({
  open = false,
  activeItem = null,
  onPick,
  onHeldDistance,
}) {
  const reveal = useRef(0);

  useFrame((_state, delta) => {
    // labels fade with the door rather than popping with the click
    reveal.current +=
      ((open ? 1 : 0) - reveal.current) * Math.min(1, delta * 6);
  });

  return (
    <group>
      {STASH.map((entry) => (
        <StashItem
          key={entry.node}
          entry={entry}
          open={open}
          held={activeItem === entry.node}
          anyHeld={activeItem !== null}
          reveal={reveal}
          onPick={onPick}
          onHeldDistance={onHeldDistance}
        />
      ))}
    </group>
  );
}

function StashItem({
  entry,
  open,
  held,
  anyHeld,
  reveal,
  onPick,
  onHeldDistance,
}) {
  const { nodes, materials } = useGLTF(MODEL);
  const [hovered, setHovered] = useState(false);
  const label = useRef();
  const plate = useRef();
  const type = useRef();
  useCursor(hovered && open && !anyHeld);

  const node = nodes[entry.node];
  const f = LAYOUT.fridge;

  // geometry's own AABB, so framing needs no hand-measured table
  const { centre, height, baseY } = useMemo(() => {
    const g = node.geometry;
    if (!g.boundingBox) g.computeBoundingBox();
    const bb = g.boundingBox;
    return {
      centre: [
        (bb.min.x + bb.max.x) / 2,
        (bb.min.y + bb.max.y) / 2,
        (bb.min.z + bb.max.z) / 2,
      ],
      height: bb.max.y - bb.min.y,
      baseY: bb.min.y,
    };
  }, [node]);

  const rest = useMemo(
    () => [
      f.pos[0] + node.position.x * f.scale,
      f.pos[1] + node.position.y * f.scale,
      f.pos[2] + node.position.z * f.scale,
    ],
    [f, node]
  );

  const { ref, distance } = useHeldPose({
    held,
    rest,
    scale: f.scale,
    centre,
    height,
    fit: FIT,
    frameX: FRAME_X,
    frameY: FRAME_Y,
    tilt: TILT,
  });

  // the blur has to focus on the plane this item is actually held at, or the
  // one sharp thing in the shot is the only thing that isn't
  useEffect(() => {
    if (held) onHeldDistance?.(distance);
  }, [held, distance, onHeldDistance]);

  useFrame(() => {
    if (!label.current) return;
    // hidden while the item is in your hand — it is no longer on the shelf,
    // and a price tag floating where it used to be is just debris
    const o = reveal.current * (held ? 0 : 1);
    label.current.visible = o > 0.02;
    if (plate.current) plate.current.opacity = o;
    if (type.current?.material) {
      type.current.material.transparent = true;
      type.current.material.opacity = o;
      type.current.material.depthWrite = false;
    }
  });

  const pickable = open && (!anyHeld || held);

  // Stays a FUNCTION at all times. Handing R3F `undefined` to restore default
  // picking looks right and is not: it treats an undefined prop value as "no
  // change", so the mesh keeps whatever it had at mount — here the no-op,
  // forever, and every click sails past the item into the fridge behind it.
  const pickableRef = useRef(pickable);
  pickableRef.current = pickable;
  const itemRaycast = useCallback(function itemRaycast(raycaster, intersects) {
    if (!pickableRef.current) return;
    THREE.Mesh.prototype.raycast.call(this, raycaster, intersects);
  }, []);

  return (
    <>
      <group
        ref={ref}
        position={rest}
        scale={f.scale}
        onClick={(e) => {
          if (!pickable) return;
          e.stopPropagation();
          onPick?.(held ? null : entry.node); // click it again to put it back
        }}
        onPointerOver={(e) => {
          if (!pickable) return;
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <Select enabled={hovered && pickable && !held}>
          <mesh
            geometry={node.geometry}
            material={materials[entry.material]}
            castShadow
            raycast={itemRaycast}
          />
        </Select>
      </group>

      {/* Shelf tag. The TEXT is outside any <Select>: the outline pass
          overrides materials for its mask and discards troika's alpha cutout,
          so text inside a selection outlines as its bounding rectangle — the
          "mesh behind the coffee bag" bug. */}
      <group
        ref={label}
        position={[
          f.pos[0] + node.position.x * f.scale,
          f.pos[1] + (node.position.y + baseY) * f.scale + 0.016,
          f.pos[2] + SHELF_FRONT_Z * f.scale,
        ]}
        rotation={[TAG_TILT, 0, 0]}
      >
        <mesh raycast={NO_RAYCAST}>
          <boxGeometry
            args={[
              TAG_PAD + entry.project.label.length * TAG_CHAR,
              TAG_H,
              0.004,
            ]}
          />
          <meshStandardMaterial
            ref={plate}
            color={entry.project.color}
            roughness={0.55}
            transparent
          />
        </mesh>
        <Text
          ref={type}
          position={[0, 0, 0.0028]}
          fontSize={TAG_FONT}
          color="#1b1412"
          anchorX="center"
          anchorY="middle"
          raycast={NO_RAYCAST}
        >
          {entry.project.label}
        </Text>
      </group>
    </>
  );
}

const NO_RAYCAST = () => null;

useGLTF.preload(MODEL);
