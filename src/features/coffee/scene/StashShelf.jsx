import { useMemo, useState } from "react";
import * as THREE from "three";
import { useGLTF, useCursor } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import { LAYOUT } from "@/features/coffee/layout";
import { GROCERIES, FRIDGE_DRESSING } from "@/features/coffee/data/stash";
import {
  setHovered as setHoveredLabel,
  clearHovered,
} from "@/features/coffee/hover";

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
// NO SHELF TAGS EITHER. Each item used to carry a lettered plate standing in
// front of it, and at the distance the station camera actually watches from
// they were three unreadable smudges competing with the things they named.
// Naming moved to the hover readout over the hotbar, which is sized for the
// screen instead of for the shelf — see features/coffee/hover.
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

function Grocery({ entry, open, taken, onStock }) {
  const { nodes } = useGLTF(MODEL);
  const prop = useProp(entry.model, entry.tint);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered && open && !taken);

  // the SLOT comes from fridge.glb — that node is where this thing stands —
  // while the thing itself is its own model at its own scale
  const slot = nodes[entry.node];
  const pos = worldAt([slot.position.x, slot.position.y, slot.position.z]);
  const live = open && !taken;
  // what the readout says. `taken` is part of it: pointing at a gap where
  // the milk was should say so, not go silent.
  const say = taken ? `${entry.label} — taken` : entry.label;

  return (
    <group position={pos}>
      <Select enabled={hovered && live}>
        <primitive object={prop.object} />
      </Select>
      {/* ONE HIT BOX over the whole thing rather than per-mesh raycasts.
          These props are four to six meshes each — a gallon is body, fill,
          label, cap, handle — and a box round the lot is both cheaper and
          kinder to aim at than the gaps between them. */}
      <mesh
        position={[0, prop.size.y / 2, 0]}
        visible={live}
        onClick={(e) => {
          if (!live) return;
          e.stopPropagation();
          onStock?.(entry.stocks);
        }}
        onPointerOver={(e) => {
          if (!open) return;
          e.stopPropagation();
          setHovered(true);
          say && setHoveredLabel(say);
        }}
        onPointerOut={() => {
          setHovered(false);
          clearHovered(say);
        }}
      >
        <boxGeometry
          args={[prop.size.x * 1.1, prop.size.y, prop.size.z * 1.1]}
        />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
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
  return (
    <group>
      {GROCERIES.map((entry) => (
        <Grocery
          key={entry.node}
          entry={entry}
          open={open}
          taken={stocked.includes(entry.stocks)}
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
