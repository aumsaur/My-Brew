import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useCursor } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import * as THREE from "three";
import { roastRampAt } from "@/features/coffee/data/beans";

// Electric drum roaster, stand-mixer form — the "roast" beat between picking a
// bean and grinding. HOLD THE BUTTON to run: the motor spins the drum AND the
// element heats, which is why one `running` flag drives both.
//
// The dial is intentionally NOT wired to anything yet. It is there for the
// "pick a roast level and let it run to that" mode — when that lands, it drives
// `dialTurn`, and whatever owns this component holds `running` true until
// `roast` reaches the chosen level. No geometry change needed for that switch;
// the button and the dial are already separate nodes.
//
// Deliberately NOT the usual black box with a letterbox window. The drum stays
// fully exposed, so you watch the bean mass walk the roast colour ladder rather
// than reading a number. Overshooting into `burnt` is visible before it bites.
//
// A hand-crank variant is on disk (roaster-hand.glb) but its nodes differ
// (candle/flame/crank vs motor/element/dial), so swapping it means swapping
// this component, not the url.
const MODEL = `${import.meta.env.BASE_URL}models/roaster.glb`;

const _from = new THREE.Color();
const _to = new THREE.Color();

export default function Roaster({
  running = false, // hold-to-roast: spins the drum and powers the element
  enabled = true, // false = no bean in the drum, so the button does nothing
  hasBeans = false, // drum stands EMPTY until a bean is picked
  roast = 0, // 0..1 along the roast ladder
  dialTurn = 0, // radians, if you wire the dial to a heat setting
  rpm = 34,
  highlight = true,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onClick, // fires on the BODY, for focus
  onPointerDown, // fires on the BUTTON only, to start running
  onPointerUp,
}) {
  const { nodes, materials } = useGLTF(MODEL);
  const drum = useRef();
  const element = useRef();
  const button = useRef();
  const beans = useRef();
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  // a press must survive the camera moving the button out from under the
  // cursor — see onPointerOut on the body
  const pressed = useRef(false);

  // Clone so tinting never reaches other instances through drei's shared
  // material cache — the same hazard BeanBag hits with its label.
  const beanMat = useMemo(() => materials.m_r_beans.clone(), [materials]);
  const elemMat = useMemo(() => materials.m_r_element.clone(), [materials]);
  const lampMat = useMemo(() => materials.m_r_lamp.clone(), [materials]);

  useFrame((state, delta) => {
    if (drum.current && running) {
      drum.current.rotation.x += (rpm / 60) * Math.PI * 2 * delta;
    }

    const { from, to, mix } = roastRampAt(roast);
    _from.set(from);
    _to.set(to);
    beanMat.color.copy(_from).lerp(_to, mix);

    // Element glows only while powered, with a slight mains-ish waver so it is
    // not a dead flat value.
    const t = state.clock.elapsedTime;
    const target = running ? 1.35 + Math.sin(t * 9) * 0.12 : 0.0;
    elemMat.emissiveIntensity = THREE.MathUtils.damp(
      elemMat.emissiveIntensity ?? 0,
      target,
      6,
      delta
    );
    if (element.current) element.current.visible = true;

    // The lamp lens is ALWAYS present and just lights up. Toggling .visible
    // made it pop into existence out of nowhere, which read as a glitch.
    lampMat.emissiveIntensity = THREE.MathUtils.damp(
      lampMat.emissiveIntensity ?? 0,
      running ? 2.4 : 0,
      8,
      delta
    );

    // Beans tumble in when picked, rather than being permanently present.
    if (beans.current) {
      const t2 = THREE.MathUtils.damp(
        beans.current.scale.x,
        hasBeans ? 1 : 0.001,
        7,
        delta
      );
      beans.current.scale.setScalar(t2);
      beans.current.visible = t2 > 0.01;
    }

    // Button physically depresses while held. Its origin is at its seat, and
    // glTF is Y-up, so "down" is -Y.
    if (button.current) {
      button.current.position.y = THREE.MathUtils.damp(
        button.current.position.y,
        nodes.roaster_button.position.y - (running ? 0.005 : 0),
        14,
        delta
      );
    }
  });

  const roaster = (
    <group
      position={position}
      rotation={rotation}
      scale={scale}
      // THE WHOLE MACHINE IS THE BUTTON once you are standing at it. The
      // red button is 40mm across on a model seen at an angle from a metre
      // away, and missing it does nothing at all, which reads as the scene
      // being broken rather than as a near miss. So the button is still
      // there and still works — it is the thing that depresses — but any
      // part of the roaster starts the roast, and only while you are
      // actually at the station, where there is nothing else a press on it
      // could possibly mean.
      onPointerDown={(e) => {
        if (!enabled) return; // not here yet: let the click fly you over
        e.stopPropagation();
        e.target.setPointerCapture?.(e.pointerId);
        pressed.current = true;
        onPointerDown?.(e);
      }}
      onPointerUp={(e) => {
        if (!pressed.current) return;
        e.stopPropagation();
        e.target.releasePointerCapture?.(e.pointerId);
        pressed.current = false;
        onPointerUp?.(e);
      }}
      onLostPointerCapture={() => {
        if (!pressed.current) return;
        pressed.current = false;
        onPointerUp?.();
      }}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => {
        // hover only. Releasing here cancelled the roast the moment the
        // camera slid the button out from under the cursor — which is what
        // focusing this station does. The pointer is captured on the button;
        // onLostPointerCapture is the release that can be trusted.
        setHovered(false);
      }}
    >
      <mesh
        geometry={nodes.roaster_base.geometry}
        material={materials.m_r_body}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={nodes.roaster_motor.geometry}
        material={materials.m_r_body}
        castShadow
      />
      <mesh
        geometry={nodes.roaster_dial.geometry}
        material={materials.m_r_dial}
        rotation={[0, 0, dialTurn]}
      />
      {/* Hold-to-run lives on the BUTTON, not the body. Clicking the body
          used to fire pointerdown AND click, so focusing the camera also
          started a roast. stopPropagation keeps a press from bubbling up as a
          focus click. */}
      <mesh
        ref={button}
        geometry={nodes.roaster_button.geometry}
        material={materials.m_r_button}
        position={nodes.roaster_button.position}
        castShadow
        onPointerDown={(e) => {
          // A DEAD BUTTON MUST NOT EAT THE CLICK. While you are not at the
          // roaster this control does nothing, and swallowing the event
          // anyway meant the click never reached the station behind it —
          // so the one thing you would obviously click to GET here was the
          // one thing that could not bring you.
          if (!enabled) return;
          e.stopPropagation();
          // CAPTURE the pointer: focusing a station moves the camera, so
          // without this the button slides out from under the cursor mid-hold
          // and pointerup lands on empty space — the hold never ends cleanly
          // and the stage never advances.
          e.target.setPointerCapture?.(e.pointerId);
          pressed.current = true;
          onPointerDown?.(e);
        }}
        onPointerUp={(e) => {
          if (!pressed.current) return;
          e.stopPropagation();
          e.target.releasePointerCapture?.(e.pointerId);
          pressed.current = false;
          onPointerUp?.(e);
        }}
        onLostPointerCapture={() => {
          if (pressed.current) {
            pressed.current = false;
            onPointerUp?.();
          }
        }}
        onClick={(e) => enabled && e.stopPropagation()}
      />
      <mesh geometry={nodes.roaster_lamp.geometry} material={lampMat} />
      <mesh
        ref={element}
        geometry={nodes.roaster_element.geometry}
        material={elemMat}
      />
      {running && (
        <pointLight
          position={[0, 0, 0.055]}
          intensity={0.26}
          distance={0.2}
          color="#ff5a1e"
        />
      )}

      {/* beans are NOT a child of the drum — they rest at the bottom under
          gravity; spinning them with the cage would look glued to the wall. */}
      <mesh
        ref={beans}
        geometry={nodes.roaster_beans.geometry}
        material={beanMat}
      />

      <mesh
        ref={drum}
        geometry={nodes.roaster_drum.geometry}
        material={materials.m_r_steel}
        position={nodes.roaster_drum.position}
        castShadow
      />
    </group>
  );

  return highlight ? <Select enabled={hovered}>{roaster}</Select> : roaster;
}

useGLTF.preload(MODEL);
