import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useCursor, Text } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import Steam from "@/features/coffee/scene/Steam";
import * as THREE from "three";
import { espressoCss } from "@/features/coffee/data/beans";
import {
  ESPRESSO_SURFACE,
  CREMA_SURFACE,
  CREMA_T,
} from "@/features/coffee/cup";

// Everything painted on a thing in this room is LETTERED in the same hand;
// see scene/WallSign. A mix of faces reads as accidental.
const FONT = `${import.meta.env.BASE_URL}fonts/Tealand.ttf`;

// Espresso machine — the coffee corner's brewing station, replacing the cauldron
// as the thing the pour/stir loop happens at.
//
// Two variants on disk:
//   espresso-machine.glb      7k tris, Ascaso-style  (hero)
//   espresso-machine-lo.glb   2.6k tris, wooden toy  (fallback / far LOD)
// They have DIFFERENT node names, so `lo` swaps the whole component, not just
// the url — see ToyEspressoMachine below.
//
// Materials come from the file. Do not route this through GlbModel: it replaces
// every mesh's material with a single flat vertex-coloured one, which would
// collapse body/chrome/black/gauge/grate into one hue.
const MODEL = `${import.meta.env.BASE_URL}models/espresso-machine.glb`;
const MODEL_LO = `${import.meta.env.BASE_URL}models/espresso-machine-lo.glb`;

// +Z is toward the barista: glTF is Y-up and Blender's front (-Y) maps to +Z.
// WHERE AN UNLOCKED PORTAFILTER ACTUALLY IS. It used to slide 160mm
// straight out of the group head on z and stop there, hanging 370mm above
// the drip tray with nothing under it — a heavy brass thing floating in mid
// air, waiting. It rests on the TRAY now, which is where a barista puts it
// down, with the handle overhanging the front the way it does on a real bar.
//
// Measured off the GLB rather than eyeballed: the portafilter's mesh runs to
// -0.083 below its own origin (the spouts) and the tray's top face is at
// y 0.12, so the origin has to sit at 0.203 for it to stand on the tray. z
// 0.12 centres the basket over the grate and leaves the handle — which
// reaches z 0.244 — hanging over the edge.
const PORTA_DOWN = [0, 0.203, 0.12];

// The cup is NOT in the GLB — the model has body, group head, portafilter,
// wand, tray and grate and nothing to catch a shot in. It is built here from
// primitives instead of going back to Blender for it: an espresso cup is a
// tube and a disc, the room already draws its counter and shelves the same
// way, and keeping it in JS means the coffee level is just a number.
//
// MODEL units (the machine is scaled 0.58 at the room level). The grate tops
// out at y = 0.14, which is what the cup stands on.
const CUP = {
  y: 0.14,
  z: 0.17, // under the portafilter spout
  r: 0.052,
  rInner: 0.047,
  h: 0.088,
  baseR: 0.038,
  baseH: 0.009,
  floorH: 0.008, // the inside bottom — see the cup block below
};
const CUP_FLOOR = CUP.baseH + CUP.floorH; // top of the inside, where coffee starts
const CUP_FILL = CUP.h - CUP.floorH - 0.004; // usable depth

const SPOUT_Y = 0.287; // portafilter underside, where the stream starts

// NOTE: the hero model's knobs are ONE mesh, so there is no per-dial rotation
// here. The toy variant does have a separate `espresso_dial` node — see its
// `dialTurn` prop below.
export default function EspressoMachine({
  brewing = false, // pulling right now: stream runs, cup fills
  pourable = false, // locked and ready — the knobs become a control
  lockable = false, // portafilter is out and waiting to go in
  shot = 0, // 0..1, how much is in the cup
  roast = 0, // 0..1 — how dark the bean was, which is how dark the shot is
  cup = false, // a cup is under the group head at all
  portafilterOut = false,
  label = "", // wordmark on the front, e.g. the ref's "ascaso"
  grounds = 0, // 0..1 — a visible puck building in the basket
  highlight = true, // hover outline; needs an ancestor <Selection>
  steamable = false, // the wand is live: there is milk waiting to be textured
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  onClick,
  onLock, // click the portafilter to seat it
  onPourDown, // press and hold the knobs to pull
  onPourUp,
  onSteam, // click the wand to steam the jug of milk
}) {
  const { nodes, materials } = useGLTF(MODEL);
  const porta = useRef();
  const stream = useRef();
  const [hovered, setHovered] = useState(false);
  const [hotControl, setHotControl] = useState(false);
  const [hotWand, setHotWand] = useState(false);
  useCursor(hovered || hotControl || hotWand);

  // cloned so tinting the crema never reaches another instance through drei's
  // shared material cache — the hazard BeanBag hit with its label
  const brewMat = useMemo(
    () => new THREE.MeshStandardMaterial({ ...ESPRESSO_SURFACE }),
    []
  );
  // THE SHOT IS THE COLOUR OF THE BEAN YOU ROASTED. It was a constant, so a
  // green bean and a burnt one poured the same brown -- and the same
  // constant disagreed with the one the serve station used for the very
  // same cup. One function owns it now; see espressoCss in data/beans.
  // KEYED ON THE NUMBERS, not on the string espressoCss returns: `shot`
  // moves every frame of a pull, so a memo keyed on the colour string would
  // rebuild a THREE.Color per frame in the render path.
  const { ink, streamInk } = useMemo(() => {
    const css = espressoCss(roast, shot);
    const c = new THREE.Color(css);
    c.offsetHSL(0, 0, 0.07);
    return { ink: css, streamInk: c };
  }, [roast, shot]);
  brewMat.color.set(ink);
  const cremaMat = useMemo(
    () => new THREE.MeshStandardMaterial({ ...CREMA_SURFACE }),
    []
  );
  const cupMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#efe7db",
        roughness: 0.55,
        // the wall is an OPEN cylinder, so the inside of the far wall is a
        // back face. Single-sided it is culled and you see straight through
        // the cup to the drip tray — which is exactly what it looked like.
        side: THREE.DoubleSide,
      }),
    []
  );

  const pressed = useRef(false);
  // The damped position, kept apart from what is rendered, so the lift below
  // can be added on top without the damping eating it.
  const portaAt = useRef(new THREE.Vector3());
  const portaReady = useRef(false);

  useFrame((state, delta) => {
    if (!porta.current) return;
    // Two places only: seated in the group head, or standing on the tray.
    // Both ABSOLUTE, not offsets from 0 — damping toward a bare 0 yanked the
    // portafilter 170mm back into the machine on the first frame, and the
    // model was always fine; that was the bug.
    const home = nodes.espresso_portafilter.position;
    if (!portaReady.current) {
      portaAt.current.copy(home);
      portaReady.current = true;
    }
    const to = portafilterOut ? PORTA_DOWN : [home.x, home.y, home.z];
    portaAt.current.set(
      THREE.MathUtils.damp(portaAt.current.x, to[0], 5, delta),
      THREE.MathUtils.damp(portaAt.current.y, to[1], 5, delta),
      THREE.MathUtils.damp(portaAt.current.z, to[2], 5, delta)
    );
    porta.current.position.copy(portaAt.current);
    // A SMALL LIFT WHEN IT IS YOUR TURN, added AFTER the damping or the
    // damping smooths it away. The machine is a grey box that never moves,
    // which made it the hardest thing in the room to tell was interactive,
    // and the fix for that must not be a glowing marker. Only while it is
    // the next thing to touch: a part that fidgets permanently is noise.
    if (lockable) {
      porta.current.position.y +=
        Math.abs(Math.sin(state.clock.elapsedTime * 2.2)) * 0.008;
    }

    // the stream is a thin cylinder that shortens as the cup fills, so it
    // always lands ON the coffee rather than through it
    if (stream.current) {
      const top = CUP.y + CUP_FLOOR + shot * CUP_FILL;
      const len = Math.max(0.001, SPOUT_Y - top);
      stream.current.scale.y = len;
      stream.current.position.y = top + len / 2;
      stream.current.visible = brewing && len > 0.004;
    }
  });

  const meshes = (
    <>
      <mesh
        geometry={nodes.espresso_body.geometry}
        material={materials.m_a_body}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={nodes.espresso_tray.geometry}
        material={materials.m_a_body}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={nodes.espresso_grate.geometry}
        material={materials.m_a_dark}
        receiveShadow
      />
      <mesh
        geometry={nodes.espresso_gauge.geometry}
        material={materials.m_a_gauge}
      />
      {/* The knobs row IS the brew control. It is one mesh in the GLB, so
          there is no isolating a single dial — press and hold anywhere along
          it. Same gesture as the roaster's button and the grinder's crank,
          which is the point: one verb for "make this machine run". */}
      <mesh
        geometry={nodes.espresso_knobs.geometry}
        material={materials.m_a_chrome}
        onPointerDown={(e) => {
          if (!pourable) return;
          e.stopPropagation();
          e.target.setPointerCapture?.(e.pointerId);
          pressed.current = true;
          onPourDown?.(e);
        }}
        onPointerUp={(e) => {
          if (!pressed.current) return;
          e.stopPropagation();
          e.target.releasePointerCapture?.(e.pointerId);
          pressed.current = false;
          onPourUp?.(e);
        }}
        onLostPointerCapture={() => {
          if (!pressed.current) return;
          pressed.current = false;
          onPourUp?.();
        }}
        onPointerOver={(e) => {
          if (!pourable) return;
          e.stopPropagation();
          setHotControl(true);
        }}
        onPointerOut={() => setHotControl(false)}
        // A dead control lets the click through to the machine behind it, or
        // the first click on the knobs could never fly you here.
        onClick={(e) => pourable && e.stopPropagation()}
      />
      <mesh
        geometry={nodes.espresso_group.geometry}
        material={materials.m_a_chrome}
        castShadow
      />

      {/* espresso_grip is the portafilter's child in the glTF, so this group
          carries both. Rotate it to twist into the lock; translate to remove. */}
      <group
        ref={porta}
        position={nodes.espresso_portafilter.position}
        onClick={(e) => {
          if (!lockable) return;
          e.stopPropagation(); // seating it must not also toggle focus off
          onLock?.(e);
        }}
        onPointerOver={(e) => {
          if (!lockable) return;
          e.stopPropagation();
          setHotControl(true);
        }}
        onPointerOut={() => setHotControl(false)}
      >
        <mesh
          geometry={nodes.espresso_portafilter.geometry}
          material={materials.m_a_chrome}
          castShadow
        />
        <mesh
          geometry={nodes.espresso_grip.geometry}
          material={materials.m_a_black}
          castShadow
        />
        {/* Grounds puck. Geometry in JS, not in the GLB, because its height is
            state — this is what makes "I ground some coffee" visible at the
            machine instead of only in a HUD number. */}
        {grounds > 0.02 ? (
          <mesh position={[0, -0.052 + grounds * 0.018, 0]}>
            <cylinderGeometry
              args={[0.058, 0.055, Math.max(0.004, grounds * 0.036), 14]}
            />
            <meshStandardMaterial color="#4a3526" roughness={0.95} />
          </mesh>
        ) : null}
      </group>

      {/* The cup, and the shot going into it. Both are state made visible:
          the level IS `shot`, so the thing you are judging when you decide to
          let go is the coffee, not a number on the HUD. */}
      {cup && (
        <group position={[0, CUP.y, CUP.z]}>
          {/* foot */}
          <mesh position={[0, CUP.baseH / 2, 0]} material={cupMat} castShadow>
            <cylinderGeometry
              args={[CUP.baseR, CUP.baseR * 0.92, CUP.baseH, 14]}
            />
          </mesh>

          {/* Inside bottom. The foot is narrower than the bore, so without
              this the cup is a tube with a hole in it and the shot floats. */}
          <mesh position={[0, CUP.baseH + CUP.floorH / 2, 0]} material={cupMat}>
            <cylinderGeometry args={[CUP.rInner, CUP.baseR, CUP.floorH, 14]} />
          </mesh>

          {/* wall — open at the top so you can see the shot land in it */}
          <mesh
            position={[0, CUP.baseH + CUP.h / 2, 0]}
            material={cupMat}
            castShadow
          >
            <cylinderGeometry args={[CUP.r, CUP.rInner, CUP.h, 14, 1, true]} />
          </mesh>

          {/* handle: what makes it read as a cup rather than a beaker */}
          <mesh
            position={[CUP.r * 0.94, CUP.baseH + CUP.h * 0.52, 0]}
            rotation={[0, 0, -Math.PI * 0.62]}
            material={cupMat}
            castShadow
          >
            <torusGeometry args={[0.026, 0.0058, 6, 14, Math.PI * 1.25]} />
          </mesh>

          {shot > 0.01 && (
            <>
              <mesh
                position={[0, CUP_FLOOR + (shot * CUP_FILL) / 2, 0]}
                material={brewMat}
              >
                <cylinderGeometry
                  args={[
                    CUP.rInner * 0.97,
                    CUP.rInner * 0.94,
                    Math.max(0.002, shot * CUP_FILL),
                    14,
                  ]}
                />
              </mesh>
              {/* crema sits on top, and is the tell that it is a real shot */}
              <mesh
                position={[0, CUP_FLOOR + shot * CUP_FILL + 0.0012, 0]}
                material={cremaMat}
              >
                <cylinderGeometry
                  args={[CUP.rInner * 0.97, CUP.rInner * 0.97, CREMA_T, 14]}
                />
              </mesh>
            </>
          )}
        </group>
      )}

      {/* the pour itself — a thin column, resized each frame in useFrame */}
      <mesh ref={stream} position={[0, 0, CUP.z]} visible={false}>
        <cylinderGeometry args={[0.0045, 0.0045, 1, 8]} />
        {/* the falling stream reads lighter than the pool it lands in --
            it is thin and lit from all sides -- but it is the same coffee,
            so it is the same ink brightened rather than its own colour */}
        <meshStandardMaterial
          color={streamInk}
          roughness={0.3}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Wand + its black valve knob (a child node) — swivels as one. */}
      <group position={nodes.espresso_steamwand.position}>
        <mesh
          geometry={nodes.espresso_steamwand.geometry}
          material={materials.m_a_chrome}
          castShadow
        />
        <mesh
          geometry={nodes.espresso_wandknob.geometry}
          material={materials.m_a_black}
          castShadow
        />
      </group>

      {/* THE WAND IS A TARGET, not just set dressing. Steaming used to be the
          jug's third click, which stopped working the moment cold milk became
          pourable too: one click cannot mean both "carry this to the wand"
          and "pour it now". Two objects, two meanings.

          An invisible hotspot on a chrome pipe is not an affordance, so
          something has to mark it. That something used to be a glowing
          ring on the drip tray — replaced by live steam off the wand, which
          marks the same spot, is brighter and busier than the machine's
          idle wisp so it still reads as "here", and is a thing a steam wand
          actually does. */}
      {steamable && (
        <group>
          <Steam
            at={[0.186, 0.152, 0.187]}
            count={9}
            rise={0.34}
            spread={0.07}
            speed={0.5}
            size={0.032}
            peak={0.36}
            seed={0.4}
          />
          <mesh
            position={[0.186, 0.2, 0.187]}
            onClick={(e) => {
              e.stopPropagation();
              onSteam?.();
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHotWand(true);
            }}
            onPointerOut={() => setHotWand(false)}
          >
            <sphereGeometry args={[0.13, 10, 8]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          {/* hovering thickens the plume — the hover feedback the ring's
              emissive bump used to carry */}
          {hotWand && (
            <Steam
              at={[0.186, 0.152, 0.187]}
              count={7}
              rise={0.38}
              spread={0.09}
              speed={0.62}
              size={0.036}
              peak={0.4}
              seed={2.1}
            />
          )}
        </group>
      )}

      {/* STEAM COMES OFF THE COFFEE, and off the wand while it is live.
          Not off the machine itself: an idle plume from the group head was
          there to say "this is the interesting prop", which is a marker's
          job wearing a kettle's clothes. The lift on the portafilter does
          that now, and only when there is actually something to do. */}
      {cup && shot > 0.03 && (
        <Steam
          at={[0, CUP.y + CUP.baseH + CUP.h, CUP.z]}
          count={7}
          // harder while the shot is actually falling, then a drift: a cup
          // that stopped steaming the moment you let go of the knobs read
          // as switched off rather than as full of hot coffee
          rise={brewing ? 0.3 : 0.22}
          spread={0.035}
          speed={brewing ? 0.5 : 0.28}
          size={0.024}
          peak={brewing ? 0.36 : 0.24}
          seed={3.7}
        />
      )}
    </>
  );

  return (
    <group
      position={position}
      rotation={rotation}
      scale={scale}
      // THE WHOLE MACHINE IS THE CONTROL once you are standing at it, and
      // which control depends on the beat: a click seats the portafilter, a
      // press-and-hold pulls the shot. The knobs and the portafilter still
      // work as themselves — they stop propagation while they are live — but
      // a chrome knob 30mm wide at this angle is a hard target, and missing
      // it did nothing at all. Both gates already say you are here and it is
      // your turn, so there is nothing else a press could mean.
      onPointerDown={(e) => {
        if (!pourable) return; // not your turn: let the click fly you here
        e.stopPropagation();
        e.target.setPointerCapture?.(e.pointerId);
        pressed.current = true;
        onPourDown?.(e);
      }}
      onPointerUp={(e) => {
        if (!pressed.current) return;
        e.stopPropagation();
        e.target.releasePointerCapture?.(e.pointerId);
        pressed.current = false;
        onPourUp?.(e);
      }}
      onLostPointerCapture={() => {
        if (!pressed.current) return;
        pressed.current = false;
        onPourUp?.();
      }}
      onClick={(e) => {
        if (lockable) {
          e.stopPropagation();
          onLock?.(e);
          return;
        }
        onClick?.(e);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* <Select> wraps ONLY geometry. The Outline pass overrides materials to
          build its mask, which discards troika's alpha cutout — a selected
          <Text
        font={FONT}> would outline as its full bounding QUAD, a rectangle hanging
          in mid-air. Same fix as BeanBag. */}
      {highlight ? <Select enabled={hovered}>{meshes}</Select> : meshes}

      {/* Wordmark. troika needs no UVs, which matters because these GLBs export
          POSITION+NORMAL only; a decal would need unwrapping in Blender. */}
      {label ? (
        <Text
          font={FONT}
          position={[0, 0.3, -0.283]}
          fontSize={0.038}
          letterSpacing={0.04}
          color="#e8ecee"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      ) : null}

      {/* NO LAMP HERE. There was a point light under the group head while
          brewing, and before that a glowing ring on the drip tray. Both lit
          the machine up like an objective marker. Steam off the cup says
          "this is running, this is hot" without the machine having to
          pretend to be a light source. */}
    </group>
  );
}
// Low-poly variant. Different node names entirely, so it gets its own component
// rather than a url prop — worth it for a 2.6k-tri stand-in at distance.
export function ToyEspressoMachine({
  dialTurn = 0, // radians — the toy DOES have a separate dial node
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}) {
  const { nodes, materials } = useGLTF(MODEL_LO);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh
        geometry={nodes.espresso_body.geometry}
        material={materials.m_t_mint}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={nodes.espresso_lid.geometry}
        material={materials.m_t_cream}
      />
      <mesh
        geometry={nodes.espresso_panel.geometry}
        material={materials.m_t_cream}
      />
      <mesh
        geometry={nodes.espresso_dial.geometry}
        material={materials.m_t_mint2}
        rotation={[0, dialTurn, 0]}
      />
      <mesh
        geometry={nodes.espresso_buttons.geometry}
        material={materials.m_t_mint2}
      />
      <mesh
        geometry={nodes.espresso_dispenser.geometry}
        material={materials.m_t_mint}
      />
      <mesh
        geometry={nodes.espresso_dispenser_face.geometry}
        material={materials.m_t_cream}
      />
      <mesh
        geometry={nodes.espresso_spouts.geometry}
        material={materials.m_t_dark}
      />
      <mesh
        geometry={nodes.espresso_tray.geometry}
        material={materials.m_t_cream}
      />
    </group>
  );
}

useGLTF.preload(MODEL);

const NO_RAYCAST = () => null;
