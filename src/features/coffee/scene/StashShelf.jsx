import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGLTF, useCursor, Text } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import { LAYOUT } from "@/features/coffee/layout";
import { GROCERIES, FRIDGE_DRESSING } from "@/features/coffee/data/stash";

// WHAT IS IN THE COLD STORE.
//
// It used to be the portfolio in disguise: three groceries that were secretly
// projects, each opening a card when you picked it up. The cake case has the
// portfolio now, and leaving the disguise here meant the projects existed
// twice over — with a shelf tag reading "Stocktomate" on a jar of sauce,
// which is the joke the case was brought in to replace.
//
// So these are groceries. Clicking one puts its ingredient in your hotbar and
// nothing else happens: no card, and no flying the item up to the camera,
// because there is no longer anything on it to read. That is the same
// argument the bean bags' lift lost — the inventory slot IS the feedback.
//
// WHAT IS ON THESE SHELVES IS SUPPLY, not the bar's own containers: a
// gallon of syrup rather than the pump bottle it fills, a bag-in-box rather
// than the carton it fills. The reasoning, and why this is NOT the carton
// bug coming back, is in data/stash.js — read it there before swapping a
// model back to a bar prop.
//
// They live OUTSIDE the <Fridge> group even though the shelf positions come
// from fridge.glb: the fridge is translated and scaled, and these are
// authored in real metres, so parenting them would scale them by 0.88.
const MODEL = `${import.meta.env.BASE_URL}models/fridge.glb`;
const url = (m) => `${import.meta.env.BASE_URL}models/${m}`;

// front edge of fridge_shelves, in MODEL units — where a shop puts its tags
const SHELF_FRONT_Z = 0.255;

// Shelf tag, sized in WORLD metres so the type stays legible whatever the
// fridge is scaled to. Bare floating text read as debris; a plate behind it
// makes it a printed label, which is what it is.
const TAG_H = 0.03;
const TAG_PAD = 0.022;
const TAG_CHAR = 0.0108;
const TAG_FONT = 0.017;
const TAG_TILT = -0.42; // leaned back, so the face angles up at the viewer
const TAG_INK = "#f3ece0";
const TAG_PLATE = "#3f4b45";
const FONT = `${import.meta.env.BASE_URL}fonts/Tealand.ttf`;

const NO_RAYCAST = () => null;

/**
 * Every mesh in a GLB, cloned so instances do not share a transform — and
 * RECOLOURED, so they do not share a material either.
 *
 * `Object3D.clone()` copies the transform and keeps the material by
 * reference, which is exactly what you want until two instances want
 * different colours: tinting the chocolate gallon would otherwise tint the
 * milk one, in a way that looks like a bad export rather than like aliasing.
 * The same clone-the-material-not-the-geometry rule the cakes' icing and the
 * bean bags' labels already follow.
 *
 * @param tint  { [materialName]: cssColour } — only the named ones change
 */
function useProp(model, tint = null) {
  const { scene } = useGLTF(url(model));
  const key = tint ? JSON.stringify(tint) : "";
  return useMemo(() => {
    const c = scene.clone(true);
    if (tint) {
      c.traverse((o) => {
        const m = o.material;
        if (!m || !tint[m.name]) return;
        const copy = m.clone();
        copy.color = new THREE.Color(tint[m.name]);
        o.material = copy;
      });
    }
    const box = new THREE.Box3().setFromObject(c);
    return { object: c, size: box.getSize(new THREE.Vector3()) };
    // `key` stands in for `tint`, which is a fresh object literal on every
    // render of the data module's consumers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, key]);
}

/** Where a fridge-model point lands in the world. */
function worldAt(at) {
  const f = LAYOUT.fridge;
  return [
    f.pos[0] + at[0] * f.scale,
    f.pos[1] + at[1] * f.scale,
    f.pos[2] + at[2] * f.scale,
  ];
}

function Grocery({ entry, open, taken, reveal, onStock }) {
  const { nodes } = useGLTF(MODEL);
  const prop = useProp(entry.model, entry.tint);
  const [hovered, setHovered] = useState(false);
  const label = useRef();
  const plate = useRef();
  const type = useRef();
  useCursor(hovered && open && !taken);

  // the SLOT comes from fridge.glb — that node is where this thing stands —
  // while the thing itself is its own model at its own scale
  const slot = nodes[entry.node];
  const pos = worldAt([slot.position.x, slot.position.y, slot.position.z]);

  useFrame(() => {
    if (!label.current) return;
    const o = reveal.current * (taken ? 0.25 : 1);
    label.current.visible = o > 0.02;
    if (plate.current) plate.current.opacity = o;
    if (type.current?.material) {
      type.current.material.transparent = true;
      type.current.material.opacity = o;
      type.current.material.depthWrite = false;
    }
  });

  const live = open && !taken;

  return (
    <>
      <group position={pos}>
        <Select enabled={hovered && live}>
          <primitive object={prop.object} />
        </Select>
        {/* ONE HIT BOX over the whole thing rather than per-mesh raycasts.
            These props are four to six meshes each — a jug is body, neck,
            handle, label, cap, fill — and a box round the lot is both
            cheaper and kinder to aim at than the gaps between them. */}
        <mesh
          position={[0, prop.size.y / 2, 0]}
          visible={live}
          onClick={(e) => {
            if (!live) return;
            e.stopPropagation();
            onStock?.(entry.stocks);
          }}
          onPointerOver={(e) => {
            if (!live) return;
            e.stopPropagation();
            setHovered(true);
          }}
          onPointerOut={() => setHovered(false)}
        >
          <boxGeometry
            args={[prop.size.x * 1.1, prop.size.y, prop.size.z * 1.1]}
          />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      {/* The TEXT is outside any <Select>: the outline pass overrides
          materials for its mask and discards troika's alpha cutout, so text
          inside a selection outlines as its bounding rectangle. */}
      <group
        ref={label}
        position={worldAt([slot.position.x, slot.position.y, SHELF_FRONT_Z])}
        rotation={[TAG_TILT, 0, 0]}
      >
        <mesh raycast={NO_RAYCAST}>
          <boxGeometry
            args={[TAG_PAD + entry.label.length * TAG_CHAR, TAG_H, 0.004]}
          />
          <meshStandardMaterial
            ref={plate}
            color={TAG_PLATE}
            roughness={0.7}
            transparent
          />
        </mesh>
        <Text
          ref={type}
          font={FONT}
          position={[0, 0, 0.004]}
          fontSize={TAG_FONT}
          letterSpacing={0.02}
          color={TAG_INK}
          anchorX="center"
          anchorY="middle"
          raycast={NO_RAYCAST}
        >
          {taken ? "taken" : entry.label}
        </Text>
      </group>
    </>
  );
}

/** Stock behind the stock. No tag, no click — see data/stash. */
function Dressing({ item }) {
  const prop = useProp(item.model, item.tint);
  return (
    <group
      position={worldAt(item.at)}
      rotation={[0, item.turn, 0]}
      raycast={NO_RAYCAST}
    >
      <primitive object={prop.object} />
    </group>
  );
}

/**
 * @param open     the door is open, so the shelves are reachable
 * @param stocked  what has already been taken
 * @param onStock  (kind) => void
 */
export default function StashShelf({ open = false, stocked = [], onStock }) {
  const reveal = useRef(0);
  useFrame((_state, delta) => {
    // tags fade with the door rather than popping with the click
    reveal.current +=
      ((open ? 1 : 0) - reveal.current) * Math.min(1, delta * 6);
  });

  return (
    <group>
      {GROCERIES.map((entry) => (
        <Grocery
          key={entry.node}
          entry={entry}
          open={open}
          taken={stocked.includes(entry.stocks)}
          reveal={reveal}
          onStock={onStock}
        />
      ))}
      {FRIDGE_DRESSING.map((item, i) => (
        <Dressing key={i} item={item} />
      ))}
    </group>
  );
}

useGLTF.preload(MODEL);
