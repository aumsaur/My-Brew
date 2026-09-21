import { useCallback, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useCursor, useGLTF, Text } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import { LAYOUT, framingDistance, viewDir } from "@/features/coffee/layout";
import { CAKES } from "@/features/coffee/data/stash";
import {
  setHovered as setHoveredLabel,
  clearHovered,
} from "@/features/coffee/hover";

// THE CAKE FRIDGE, and where the portfolio lives now.
//
// The projects used to be three groceries hiding on the cold store's shelves,
// and the tags naming them were the tell: a milk carton labelled
// "Stocktomate" is a joke that works once and reads as a bug every time
// after. A cake cabinet is a thing a cafe labels — the whole point of the
// glass is that you read what is behind it — so the name plate stops being an
// oddity and becomes the furniture doing its job.
//
// IT COSTS THE LOOP ITS PORTFOLIO. Fetching milk used to mean opening a
// project card, so the work was unavoidable on the way to a coffee. It is not
// any more, and that was accepted deliberately.
//
// A STANDING CABINET, NOT A COUNTER RECESS. The first build cut it into the
// counter's front, which is neither what a cafe looks like nor what was asked
// for — the cake case is its own piece of furniture you walk up to. It
// bookends the room against the cold store; see the note on LAYOUT.display.
//
// MODELLED IN BLENDER, and it should have been from the first line. The
// first build was a heap of inline boxes, which is exactly the habit that put
// the serve station's props out of step with the rest of the room.
//
// BUILT FROM .dev/ref/image copy 3.png, the upright merchandiser. The first
// model was a green cupboard with a pale liner, and the reference is nothing
// like it: the defining trait is GLASS ON THE SIDES AS WELL AS THE DOOR, so
// the thing is a transparent box standing on a solid vented base. Also from
// the ref: a thin BRIGHT METAL frame rather than dark timber, five thin
// shelves rather than three chunky ones, louvres and a control panel on the
// base, and castors lifting it off the floor.
//
// FIVE NODES, one material each, and the split is functional rather than
// tidy-minded: the glass has to stay its own mesh so it can drop out of the
// raycast while you are AT the cabinet (see glassRaycast below).
//
// Every node's transform is IDENTITY because the Blender build applies
// location before export. That matters: this file reads `nodes.X.geometry`
// and discards node translations, so an unapplied origin collapses every
// part onto the group origin — which is exactly what the first export did.
const CASE_MODEL = `${import.meta.env.BASE_URL}models/cake-case.glb`;
const CAKE_MODEL = `${import.meta.env.BASE_URL}models/cake.glb`;

const C = LAYOUT.display;
const [W, H, D] = C.model.size;
const X0 = C.pos[0];
const Y0 = C.pos[1]; // the floor
const Z0 = C.pos[2];

// Mirrors the Blender build exactly -- castors 0.05, base 0.22, canopy 0.09,
// five shelves at these fractions of the glazed height. LOCAL to the cabinet
// group, which sits on the floor, so these are heights above its own base.
const GZ0 = 0.05 + 0.22;
const GLASS_H = H - GZ0 - 0.09;
const SHELVES = [0.06, 0.25, 0.44, 0.63, 0.82].map((f) => GZ0 + GLASS_H * f);
// the projects take the three shelves nearest the eye; the outer two are
// dressing, so a cake is never at ankle height or over your head
const CAKE_SHELVES = [SHELVES[1], SHELVES[2], SHELVES[3]];
const CAKE_R = 0.07;

// THE DOOR OPENS BECAUSE YOU ARRIVED, like the cold store's: one gesture,
// one beat. A door needing its own click would put a step in front of the
// cakes, and a cabinet you have walked up to that stays shut reads as
// locked rather than as closed.
//
// Hinged on the LEFT front post, because the handle is on the right. It
// swings towards the viewer: rotating about +y maps +x to (cos, 0, -sin), so
// the free edge comes forward only for a NEGATIVE angle.
const HINGE = [-0.278, 0, 0.266];
const LEAF = -HINGE[0] * 2; // the leaf runs from the hinge to the far post

// HOW FAR IT OPENS IS NOT A TASTE, the same way the ice well's lid is not.
//
// It was 66 degrees, held back from "sweeping through the camera" — and the
// camera was never the constraint. The leaf's free edge reaches z 0.80 at its
// furthest and the station camera sits 2.3m in front of that; it could swing
// through a full half turn and never come near it.
//
// What 66 degrees WAS doing is standing in the way. The route comes in from
// the front LEFT and the door hinges on the left, so a half-open leaf is
// between the viewer and the shelves: measured against this route it clears
// the middle cake only past 81 degrees and the left of the shelf behind it
// past 99.
//
// So it is solved rather than chosen — the swing at which the free edge
// clears the line from the station camera to the far left of what is on
// show, plus six degrees of daylight. Move the cabinet or re-aim its route
// and the door follows, which is the whole reason it is written this way.
function clearanceSwing() {
  const dir = new THREE.Vector3(...viewDir("display")).normalize();
  const d = framingDistance("display");
  // camera and target in the cabinet's OWN frame, flattened to the floor
  const cx = C.model.c[0] + dir.x * d;
  const cz = C.model.c[2] + dir.z * d;
  const tx = -(W / 2 - 0.04); // far left of the glazed bay
  const tz = 0.02; // the depth the cakes stand at
  const vx = tx - cx;
  const vz = tz - cz;
  // edge(t) = hinge + LEAF * (cos t, sin t); solve for it landing ON the
  // camera->target line, i.e. cross(target - camera, edge - camera) = 0
  const a = LEAF * vx;
  const b = -LEAF * vz;
  const k = vz * (HINGE[0] - cx) - vx * (HINGE[2] - cz);
  const r = Math.hypot(a, b) || 1;
  const t =
    Math.PI - Math.asin(THREE.MathUtils.clamp(k / r, -1, 1)) - Math.atan2(b, a);
  // clamped, because a route aimed straight down the front has no solution
  // worth having and a door is still a door: never less than square, never
  // folded back against the side.
  return THREE.MathUtils.clamp(t + 0.105, Math.PI / 2, 2.1);
}
const DOOR_OPEN = -clearanceSwing(); // ~105 degrees as the room stands
const FONT = `${import.meta.env.BASE_URL}fonts/Tealand.ttf`;

/** One cake on a stand, with the card that names it. */
function Cake({ entry, y, hovered, onOver, onOut, onClick }) {
  const { nodes, materials } = useGLTF(CAKE_MODEL);

  // ONLY THE ICING IS TINTED. Everything else is the same cake every time,
  // so the material is cloned per project rather than the geometry — the
  // same reason BeanBag clones only its label material.
  const icing = useMemo(() => {
    const m = materials.m_cake_icing.clone();
    m.color = new THREE.Color(entry.tint);
    m.emissive = new THREE.Color(entry.tint);
    return m;
  }, [materials, entry.tint]);
  icing.emissiveIntensity = hovered ? 0.32 : 0.06;

  return (
    <group position={[0, y, 0.02]}>
      <Select enabled={hovered}>
        <mesh
          geometry={nodes.Cake_Stand.geometry}
          material={materials.m_cake_stand}
          castShadow
        />
        <mesh
          geometry={nodes.Cake_Sponge.geometry}
          material={materials.m_cake_sponge}
          castShadow
        />
        <mesh
          geometry={nodes.Cake_Icing.geometry}
          material={icing}
          castShadow
        />
        <mesh
          geometry={nodes.Cake_Cherry.geometry}
          material={materials.m_cake_cherry}
          castShadow
        />
      </Select>

      {/* THE HIT BOX, outside the Select: outlining an invisible box draws a
          rectangle in mid-air, the trap the bean bags already document. */}
      <mesh
        position={[0, 0.05, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onOver?.();
        }}
        onPointerOut={() => onOut?.()}
      >
        <boxGeometry args={[CAKE_R * 2.3, 0.11, CAKE_R * 2.3]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* the card, propped on the shelf IN FRONT of the cake. Against the
          cake it sat under its overhang and the longest name came out
          clipped. */}
      <group position={[0, 0.01, CAKE_R * 1.45]} rotation={[-0.95, 0, 0]}>
        <mesh>
          <boxGeometry
            args={[0.026 + entry.label.length * 0.0118, 0.028, 0.003]}
          />
          <meshStandardMaterial color={entry.tint} roughness={0.55} />
        </mesh>
        <Text
          font={FONT}
          position={[0, 0, 0.0025]}
          fontSize={0.016}
          letterSpacing={0.03}
          color="#fbf3e4"
          anchorX="center"
          anchorY="middle"
        >
          {entry.label}
        </Text>
      </group>
    </group>
  );
}

/**
 * @param active  the camera is here, so the cakes are pickable
 * @param onPick  (node) => void — opens that project's card
 * @param onClick fly here / leave, same contract as the other stations
 */
export default function DisplayCase({ active = false, onPick, onClick }) {
  const [hot, setHot] = useState(null);
  const { nodes, materials } = useGLTF(CASE_MODEL);
  useCursor(!!hot && active);

  // THE DOOR IS IN FRONT OF THE CAKES, and a raycast sorts by distance, not by
  // draw order — left alone the glass swallowed every pick. At the cabinet the
  // cakes are the targets and the glass steps aside; from across the room the
  // glass is the whole cabinet's fly-to.
  //
  // Stays a FUNCTION at all times: handing R3F `undefined` to restore default
  // picking reads as "no change", so the mesh keeps whatever it had at mount.
  const activeRef = useRef(active);
  activeRef.current = active;
  const door = useRef();
  const swing = useRef(0);
  useFrame((_state, delta) => {
    swing.current = THREE.MathUtils.damp(
      swing.current,
      active ? 1 : 0,
      4,
      delta
    );
    if (door.current) door.current.rotation.y = DOOR_OPEN * swing.current;
  });
  const glassRaycast = useCallback(function glassRaycast(raycaster, hits) {
    if (activeRef.current) return;
    THREE.Mesh.prototype.raycast.call(this, raycaster, hits);
  }, []);

  return (
    <group position={[X0, Y0, Z0]}>
      <mesh
        geometry={nodes.CakeCase_Metal.geometry}
        material={materials.m_case_metal}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={nodes.CakeCase_Vent.geometry}
        material={materials.m_case_vent}
        receiveShadow
      />
      <mesh
        geometry={nodes.CakeCase_Back.geometry}
        material={materials.m_case_back}
        castShadow
      />
      <mesh
        geometry={nodes.CakeCase_Shelves.geometry}
        material={materials.m_case_glass}
      />
      {/* FIXED side panes. They used to share an object with the door, which
          is why the door could not move without taking them along. */}
      <mesh
        geometry={nodes.CakeCase_SideGlass.geometry}
        material={materials.m_case_glass}
        onClick={onClick}
        raycast={glassRaycast}
      />

      {/* THE DOOR LEAF. Two nested groups: the outer one sits on the hinge
          and turns, the inner one undoes that offset so the geometry — which
          is authored in cabinet space — lands back where it was modelled. */}
      <group ref={door} position={HINGE}>
        <group position={[-HINGE[0], -HINGE[1], -HINGE[2]]}>
          <mesh
            geometry={nodes.CakeCase_Door.geometry}
            material={materials.m_case_metal}
            castShadow
          />
          <mesh
            geometry={nodes.CakeCase_DoorGlass.geometry}
            material={materials.m_case_glass}
            onClick={onClick}
            raycast={glassRaycast}
          />
        </group>
      </group>

      {CAKES.slice(0, 3).map((entry, i) => (
        <Cake
          key={entry.node}
          entry={entry}
          y={CAKE_SHELVES[i] + 0.006}
          hovered={hot === entry.node && active}
          onOver={() => {
            setHot(entry.node);
            setHoveredLabel(entry.label);
          }}
          onOut={() => {
            setHot((h) => (h === entry.node ? null : h));
            clearHovered(entry.label);
          }}
          // From across the room a cake is not dead, it IS the cabinet: it
          // stopPropagation()s, so without this the click would be eaten and
          // the fly-to would never happen.
          onClick={() => (active ? onPick?.(entry.node) : onClick?.())}
        />
      ))}
    </group>
  );
}

useGLTF.preload(CASE_MODEL);
useGLTF.preload(CAKE_MODEL);
