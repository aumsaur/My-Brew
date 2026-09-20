import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useCursor } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import * as THREE from "three";
import { HOLD_POSE } from "@/features/coffee/layout";
import { useHeldPose } from "@/features/coffee/useHeldPose";

// Tube hand grinder — the "grind" beat between picking a bean and brewing.
//
// Hand-crank over electric on purpose: the app's mechanic vocabulary is
// hold-to-pour and hold-to-stir, and a crank is the third member of that family
// (hold and rotate). An electric grinder is a button press — a dead interaction.
//
// PICKED UP, NOT APPROACHED. Every other station is an appliance you walk to,
// so the camera flies to it. This one is a handheld: it flies to the CAMERA and
// the camera stays put. The previous version moved both at once — the route
// dollied to 0.20m while the prop lifted 0.11m toward a look-at point computed
// from its resting position, so it climbed out of the top of the frame and
// through the near plane. Two things converging on each other with no shared
// reference will always do that; one thing moving cannot.
//
// A box-grinder variant is also on disk (grinder-box.glb) but its node names are
// completely different (hopper/drawer vs grip/cup), so swapping it means
// swapping this component, not just the url.
//
// Materials are baked — load via `materials`, never through GlbModel, which
// would flatten bone/charcoal/wood/steel into one hue.
const MODEL = `${import.meta.env.BASE_URL}models/grinder.glb`;

const CUP_DROP = -0.055; // how far the catch cup drops when detached

// The held pose itself lives in useHeldPose, shared with the fridge's shelf
// items — one mechanism, so a fix to how holding works cannot land in only
// half the places that hold things. HOLD_POSE carries this prop's share of it.

export default function Grinder({
  held = false, // in hand: flies to the camera and holds there
  modelCentre = [0, 0, 0], // measured AABB centre, in MODEL units
  modelHeight = 1, // measured AABB height, in MODEL units — sets the framing
  onHeldDistance, // so InspectBlur can focus on the plane it is held at
  cranking = false, // hold-to-crank: spins while true
  enabled = true, // false = nothing roasted yet, so cranking does nothing
  cupOff = false, // catch cup detached, e.g. to tip grounds into the portafilter
  rpm = 54,
  highlight = true,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onClick,
  onPointerDown,
  onPointerUp,
}) {
  const { nodes, materials } = useGLTF(MODEL);
  const crank = useRef();
  const cup = useRef();
  const body = useRef();
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const { ref: root, distance } = useHeldPose({
    held,
    rest: position,
    restRotation: rotation,
    scale,
    centre: modelCentre,
    height: modelHeight,
    fit: HOLD_POSE.fit,
    frameX: HOLD_POSE.frameX,
    frameY: HOLD_POSE.frameY,
    tilt: HOLD_POSE.tilt,
  });

  useEffect(() => {
    if (held) onHeldDistance?.(distance);
  }, [held, distance, onHeldDistance]);

  // a press must not be cancelled by the prop sliding out from under the
  // cursor as it rises — see onPointerOut
  const pressed = useRef(false);

  useFrame((state, delta) => {
    // cranking is felt as a small kick in the body, not a lift — the lift is
    // what the hold pose is for
    if (body.current) {
      const kick =
        cranking && enabled ? Math.sin(state.clock.elapsedTime * 9) : 0;
      body.current.rotation.z = THREE.MathUtils.damp(
        body.current.rotation.z,
        kick * 0.018,
        12,
        delta
      );
    }

    // The crank's origin sits ON the shaft axis, so this is a plain spin.
    if (crank.current && cranking && enabled) {
      crank.current.rotation.y += (rpm / 60) * Math.PI * 2 * delta;
    }
    if (cup.current) {
      // glTF is Y-up, so "down" for the cup is -Y.
      cup.current.position.y = THREE.MathUtils.damp(
        cup.current.position.y,
        nodes.grinder_cup.position.y + (cupOff ? CUP_DROP : 0),
        5,
        delta
      );
    }
  });

  const release = (e) => {
    if (!pressed.current) return;
    pressed.current = false;
    e?.target?.releasePointerCapture?.(e.pointerId);
    onPointerUp?.(e);
  };

  const grinder = (
    <group
      ref={root}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={onClick}
      onPointerDown={(e) => {
        e.stopPropagation();
        // capture, or the pickup animation pulls the grinder out from under
        // the cursor and the release is lost
        e.target.setPointerCapture?.(e.pointerId);
        pressed.current = true;
        onPointerDown?.(e);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        release(e);
      }}
      onLostPointerCapture={() => {
        // the real safety net: fires if the browser takes the capture back
        if (pressed.current) {
          pressed.current = false;
          onPointerUp?.();
        }
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => {
        // hover only. Releasing here used to cancel the grind the instant the
        // prop moved off the cursor, which is exactly what picking it up does.
        setHovered(false);
      }}
    >
      <group ref={body}>
        <mesh
          geometry={nodes.grinder_body.geometry}
          material={materials.m_gt_bone}
          castShadow
          receiveShadow
        />
        <mesh
          geometry={nodes.grinder_grip.geometry}
          material={materials.m_gt_char}
          castShadow
        />
        <mesh
          ref={cup}
          geometry={nodes.grinder_cup.geometry}
          material={materials.m_gt_wood}
          position={nodes.grinder_cup.position}
          castShadow
        />

        {/* knob is a child node in the glTF, so this group carries both */}
        <group ref={crank} position={nodes.grinder_crank.position}>
          <mesh
            geometry={nodes.grinder_crank.geometry}
            material={materials.m_gt_steel}
            castShadow
          />
          <mesh
            geometry={nodes.grinder_crank_knob.geometry}
            material={materials.m_gt_wood}
            castShadow
          />
        </group>
      </group>
    </group>
  );

  // no outline while held — it is already the only thing in focus, and the
  // outline pass just draws a bright rim around most of the screen
  return highlight ? (
    <Select enabled={hovered && !held}>{grinder}</Select>
  ) : (
    grinder
  );
}

useGLTF.preload(MODEL);
