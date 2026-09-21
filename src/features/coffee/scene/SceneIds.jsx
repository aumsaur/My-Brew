import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { sceneIdEntries, useSceneId } from "@/features/coffee/ids";
import { LAYOUT } from "@/features/coffee/layout";

const _v = new THREE.Vector3();

// Projects every registered scene id to screen space for ui/IdOverlay.
//
// It lives INSIDE the Canvas so it can use the live camera directly. The
// `data-vp` matrix on the wrapper would have done the same job, but that one
// is gated on import.meta.env.DEV and this overlay deliberately is not — see
// the note in CoffeeApp about the production build.
//
// THROTTLED TO ~12fps. The camera flies between stations, so the labels have
// to follow, but they are labels: a frame of lag is invisible and a setState
// per frame at 120Hz is not free.
export default function SceneIds({ enabled, onPositions }) {
  const { camera, size } = useThree();
  const acc = useRef(0);
  const was = useRef(false);

  useFrame((_state, delta) => {
    if (!enabled) {
      // hand back one empty list on the way down, or the badges freeze
      // on screen where they last were
      if (was.current) {
        was.current = false;
        onPositions?.([]);
      }
      return;
    }
    was.current = true;
    acc.current += delta;
    if (acc.current < 0.08) return;
    acc.current = 0;

    const out = [];
    for (const [id, obj] of sceneIdEntries()) {
      // an unmounted object keeps its entry until the cleanup runs, and a
      // hidden one should not be labelled at all
      if (!obj || !obj.parent || !obj.visible) continue;
      obj.getWorldPosition(_v).project(camera);
      if (_v.z > 1) continue; // behind the camera
      out.push({
        id,
        x: (_v.x * 0.5 + 0.5) * size.width,
        y: (-_v.y * 0.5 + 0.5) * size.height,
      });
    }
    onPositions?.(out);
  });

  return null;
}

/**
 * Tag whatever it wraps with a scene id.
 *
 * A plain <group> with an identity transform, so it can go round anything
 * without moving it — which matters because these are sprinkled onto props
 * that already carry carefully measured positions.
 */
export function IdTag({ id, position, children }) {
  const ref = useSceneId(id);
  // POSITION GOES ON THE TAGGED GROUP, not on a child. The registry reads the
  // registered object's world position, so an offset applied to a child left
  // every marker reporting its parent's origin -- which stacked all six
  // station badges on top of each other at the centre of the room.
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  );
}

// The six stations, tagged from LAYOUT rather than by wrapping each prop.
//
// That is deliberate: `scene.station.grinder` should name the LAYOUT entry,
// because that entry is what a "move it inboard" request actually edits. The
// marker sits at the prop's model centre so the badge lands on the object
// instead of on the floor under it.
const STATIONS = [
  "serve",
  "machine",
  "roaster",
  "grinder",
  "beans",
  "fridge",
  "display",
];

export function StationIds() {
  return (
    <>
      {STATIONS.map((k) => {
        const e = LAYOUT[k];
        if (!e) return null;
        const c = e.model?.c ?? [0, 0, 0];
        const s = e.scale ?? 1;
        return (
          <IdTag
            key={k}
            id={`scene.station.${k}`}
            position={[
              e.pos[0] + c[0] * s,
              e.pos[1] + c[1] * s,
              e.pos[2] + c[2] * s,
            ]}
          />
        );
      })}
    </>
  );
}
