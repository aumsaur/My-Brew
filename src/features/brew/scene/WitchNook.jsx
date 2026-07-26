import * as THREE from "three";
import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles, useCursor } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import LowPolyFire from "@/shared/components/LowPolyFire";
import { useStore } from "@/shared/store/ui";
import { useBrew } from "@/features/brew/store";

// Outer-scene dressing: a witch's nook around the cauldron. Floating candles,
// an open spellbook, potion bottles and a hat resting on the floor — cozy
// coven clutter so the approach isn't an empty void. All procedural primitives,
// matching IngredientModel / Candles conventions (seed-driven flicker, no
// per-frame allocations).

const GROUND_Y = -2.25; // matches the floor plane in Experience.jsx

// ── A candle drifting in mid-air, gently bobbing, flame flickering ───────────
function FloatingCandle({ pos, h = 0.5 }) {
  const group = useRef();
  const light = useRef();
  const seed = useMemo(() => Math.random() * 10, []);
  const baseY = pos[1];

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    // lazy vertical bob + a touch of sway
    if (group.current) {
      group.current.position.y = baseY + Math.sin(t * 0.8) * 0.12;
      group.current.position.x = pos[0] + Math.sin(t * 0.5) * 0.05;
      group.current.rotation.z = Math.sin(t * 0.6) * 0.05;
    }
    const f = 0.78 + Math.sin(t * 9) * 0.14 + Math.sin(t * 23) * 0.07;
    if (light.current) light.current.intensity = f * 1.6;
  });

  return (
    <group ref={group} position={pos}>
      {/* tapered faceted wax body (flat-shaded hexagonal prism) */}
      <mesh position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[0.085, 0.11, h, 6]} />
        <meshStandardMaterial color="#e8dcc0" roughness={0.85} flatShading />
      </mesh>
      {/* melted wax pool at the top (low-poly dome) */}
      <mesh position={[0, h + 0.02, 0]} scale={[1, 0.45, 1]}>
        <icosahedronGeometry args={[0.1, 0]} />
        <meshStandardMaterial color="#f3ecd6" roughness={0.9} flatShading />
      </mesh>
      {/* wick */}
      <mesh position={[0, h + 0.06, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.06, 4]} />
        <meshStandardMaterial color="#2a2018" roughness={1} />
      </mesh>
      {/* low-poly flame */}
      <group position={[0, h + 0.1, 0]}>
        <LowPolyFire size={0.5} />
      </group>
      <pointLight
        ref={light}
        position={[0, h + 0.14, 0]}
        color="#b76dff"
        intensity={1.6}
        distance={5}
        decay={2}
        castShadow={false}
      />
    </group>
  );
}

// ── An open spellbook lying on the floor, faintly glowing, page flicking ─────
// Pass `onActivate` to make it THE interactive grimoire: it highlights on hover
// (glow + outline, like the broom/stir-stick) and opens the Grimoire nav on
// click. Without it, it's just glowing dressing.
function Spellbook({ pos, rot = 0, onActivate }) {
  const page = useRef();
  const sigil = useRef();
  const pageL = useRef();
  const pageR = useRef();
  const glow = useRef();
  const seed = useMemo(() => Math.random() * 10, []);
  const [hovered, setHovered] = useState(false);
  const interactive = !!onActivate;
  useCursor(interactive && hovered);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    // a page lifts and flips over every few seconds (sawtooth on a slow cycle)
    if (page.current) {
      const cycle = (t * 0.18) % 1;
      const lift = cycle < 0.35 ? Math.sin((cycle / 0.35) * Math.PI) : 0;
      page.current.rotation.z = -lift * Math.PI * 0.9;
    }
    // a rune sigil hovers and slowly turns above the open book — it lifts and
    // spins faster while hovered, so the book feels like it "wakes" to the cursor
    if (sigil.current) {
      sigil.current.rotation.z = t * (hovered ? 0.9 : 0.3);
      sigil.current.position.y =
        (hovered ? 0.42 : 0.32) + Math.sin(t * 1.2) * 0.04;
    }
    // brighten the pages + glow light on hover (invites the click)
    const em = 0.5 + (hovered ? 0.85 : 0);
    if (pageL.current) pageL.current.material.emissiveIntensity = em;
    if (pageR.current) pageR.current.material.emissiveIntensity = em;
    if (glow.current) glow.current.intensity = 0.9 + (hovered ? 1.8 : 0);
  });

  const book = (
    <>
      {/* leather cover, slightly open like a tented book */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0.04]}
        position={[-0.31, 0.02, 0]}
        castShadow
      >
        <boxGeometry args={[0.62, 0.84, 0.04]} />
        <meshStandardMaterial color="#3a2418" roughness={0.8} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, -0.04]}
        position={[0.31, 0.02, 0]}
        castShadow
      >
        <boxGeometry args={[0.62, 0.84, 0.04]} />
        <meshStandardMaterial color="#3a2418" roughness={0.8} />
      </mesh>
      {/* glowing pages */}
      <mesh ref={pageL} rotation={[-Math.PI / 2, 0, 0]} position={[-0.3, 0.05, 0]}>
        <planeGeometry args={[0.58, 0.8]} />
        <meshStandardMaterial
          color="#f3e9cf"
          emissive="#caa24a"
          emissiveIntensity={0.5}
          roughness={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={pageR} rotation={[-Math.PI / 2, 0, 0]} position={[0.3, 0.05, 0]}>
        <planeGeometry args={[0.58, 0.8]} />
        <meshStandardMaterial
          color="#f3e9cf"
          emissive="#caa24a"
          emissiveIntensity={0.5}
          roughness={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* the flipping page, pivoting at the spine */}
      <group position={[0, 0.05, 0]}>
        <mesh ref={page} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[0.58, 0.78]} />
          <meshStandardMaterial
            color="#efe4c6"
            emissive="#caa24a"
            emissiveIntensity={0.3}
            roughness={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      {/* floating rune sigil above the book */}
      <mesh ref={sigil} position={[0, 0.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.16, 0.012, 6, 6]} />
        <meshBasicMaterial color="#9d4edd" toneMapped={false} />
      </mesh>
    </>
  );

  return (
    <group
      position={pos}
      rotation={[0, rot, 0]}
      onPointerOver={
        interactive
          ? (e) => {
              e.stopPropagation();
              setHovered(true);
            }
          : undefined
      }
      onPointerOut={interactive ? () => setHovered(false) : undefined}
      onClick={
        interactive
          ? (e) => {
              e.stopPropagation();
              onActivate();
            }
          : undefined
      }
    >
      {interactive ? <Select enabled={hovered}>{book}</Select> : book}
      <pointLight
        ref={glow}
        position={[0, 0.3, 0]}
        color="#caa24a"
        intensity={0.9}
        distance={2.5}
        decay={2}
      />
      <Sparkles
        count={10}
        scale={[0.8, 0.6, 0.8]}
        position={[0, 0.35, 0]}
        size={3}
        speed={0.3}
        color="#d8b85a"
      />
    </group>
  );
}

// ── A round-bellied potion bottle with glowing, gently pulsing contents ───────
// Profile is a lathe silhouette (wide belly → pinched neck); a brighter inner
// "liquid" bulb fills the belly and the glow softly throbs like it's alive.
const BOTTLE_PROFILE = [
  [0.0, 0.0],
  [0.13, 0.0],
  [0.17, 0.06],
  [0.16, 0.2],
  [0.1, 0.3],
  [0.055, 0.36],
  [0.06, 0.46],
  [0.075, 0.5],
].map(([x, y]) => new THREE.Vector2(x, y));

function PotionBottle({ pos, color = "#5ed0a8", h = 0.34, rot = 0 }) {
  const light = useRef();
  const liquid = useRef();
  const seed = useMemo(() => Math.random() * 10, []);
  const s = h / 0.34; // h drives overall size (keeps the old call sites varied)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    const pulse = 0.5 + Math.sin(t * 2.1) * 0.18 + Math.sin(t * 5.3) * 0.06;
    if (light.current) light.current.intensity = pulse;
    if (liquid.current)
      liquid.current.material.emissiveIntensity = 0.55 + pulse * 0.4;
  });

  return (
    <group position={pos} rotation={[0, rot, 0]} scale={s}>
      {/* glass body */}
      <mesh>
        <latheGeometry args={[BOTTLE_PROFILE, 14]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.4}
          roughness={0.15}
          metalness={0.1}
          flatShading
        />
      </mesh>
      {/* glowing liquid bulb sitting in the belly */}
      <mesh ref={liquid} position={[0, 0.16, 0]} scale={[1, 0.85, 1]}>
        <sphereGeometry args={[0.13, 14, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          roughness={0.3}
        />
      </mesh>
      {/* cork */}
      <mesh position={[0, 0.53, 0]}>
        <cylinderGeometry args={[0.055, 0.045, 0.07, 10]} />
        <meshStandardMaterial color="#9c6b3f" roughness={0.9} flatShading />
      </mesh>
      <pointLight
        ref={light}
        position={[0, 0.18, 0]}
        color={color}
        intensity={0.5}
        distance={1.4}
        decay={2}
      />
    </group>
  );
}

// ── A classic witch's hat: drooping wide brim + straight tall cone + band ────
function WitchHat({ pos, rot = 0 }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {/* drooping wide brim — a shallow wide cone so the edges dip down */}
      <mesh position={[0, 0.0, 0]}>
        <coneGeometry args={[0.62, 0.16, 24]} />
        <meshStandardMaterial color="#1c1426" roughness={0.9} flatShading />
      </mesh>
      {/* straight tall cone */}
      <mesh position={[0, 0.55, 0]}>
        <coneGeometry args={[0.3, 1.0, 24]} />
        <meshStandardMaterial color="#241834" roughness={0.9} flatShading />
      </mesh>
      {/* band hugging the cone base, just above the brim + buckle */}
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.29, 0.33, 0.1, 24]} />
        <meshStandardMaterial color="#0f0a17" roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0, 0.13, 0.32]}>
        <boxGeometry args={[0.1, 0.07, 0.02]} />
        <meshStandardMaterial
          color="#caa24a"
          metalness={0.6}
          roughness={0.4}
          emissive="#caa24a"
          emissiveIntensity={0.2}
        />
      </mesh>
    </group>
  );
}

// ── A short stack of closed books, with page edges + a bookmark ribbon ───────
function BookStack({ pos, rot = 0 }) {
  const books = [
    { y: 0.04, w: 0.5, d: 0.36, c: "#5a2d3a", r: 0 },
    { y: 0.12, w: 0.46, d: 0.34, c: "#2d3a5a", r: 0.18 },
    { y: 0.2, w: 0.42, d: 0.3, c: "#3a5a2d", r: -0.12 },
  ];
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {books.map((b, i) => (
        <group key={i} position={[0, b.y, 0]} rotation={[0, b.r, 0]}>
          {/* cover */}
          <mesh castShadow>
            <boxGeometry args={[b.w, 0.08, b.d]} />
            <meshStandardMaterial color={b.c} roughness={0.85} flatShading />
          </mesh>
          {/* cream page block, inset so the cover reads as a spine/edge */}
          <mesh position={[0, 0, 0.01]}>
            <boxGeometry args={[b.w - 0.05, 0.06, b.d - 0.04]} />
            <meshStandardMaterial color="#e8dcc0" roughness={0.8} flatShading />
          </mesh>
        </group>
      ))}
      {/* a thin ribbon bookmark trailing out of the top book */}
      <mesh position={[0.05, 0.18, 0.18]} rotation={[0.5, 0.18, 0]}>
        <boxGeometry args={[0.03, 0.001, 0.16]} />
        <meshStandardMaterial
          color="#9d4edd"
          emissive="#9d4edd"
          emissiveIntensity={0.25}
          roughness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ── A coat rack with a witch's coat hanging on it + hat on top ──────────────
// A proper hall-tree: tripod base, tall pole, curved hooks + finial (all
// visible above the coat). The coat is a fluted geometry — its radius ripples
// around the circumference, folds deepening toward the hem — so it reads as
// draped, folded cloth hanging from the hanger rather than a smooth cone.
const CLOAK = "#2c2140";
const CLOAK_D = "#221934";
const STAND_WOOD = "#4a3018";

function CoatStand() {
  const coatGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.24, 0.5, 1.4, 56, 1, true);
    const pos = g.attributes.position;
    const folds = 12;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i),
        y = pos.getY(i),
        z = pos.getZ(i);
      const ang = Math.atan2(z, x);
      const r = Math.hypot(x, z);
      const fracFromTop = (0.7 - y) / 1.4; // 0 at the shoulders → 1 at the hem
      const depth = 0.025 + 0.06 * fracFromTop; // folds deepen as the cloth falls
      const nr = r + Math.sin(ang * folds) * depth;
      pos.setX(i, Math.cos(ang) * nr);
      pos.setZ(i, Math.sin(ang) * nr);
    }
    g.computeVertexNormals();
    return g;
  }, []);

  return (
    <group>
      {/* ── the coat rack (hall tree) ── */}
      {/* hub + three splayed feet */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.13, 0.16, 0.16, 10]} />
        <meshStandardMaterial color={STAND_WOOD} roughness={0.8} flatShading />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = (i * Math.PI * 2) / 3;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.22, 0.06, Math.sin(a) * 0.22]}
            rotation={[0, -a, 0.6]}
          >
            <cylinderGeometry args={[0.03, 0.045, 0.42, 6]} />
            <meshStandardMaterial
              color={STAND_WOOD}
              roughness={0.8}
              flatShading
            />
          </mesh>
        );
      })}
      {/* pole + finial */}
      <mesh position={[0, 1.28, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 2.35, 8]} />
        <meshStandardMaterial color={STAND_WOOD} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0, 2.46, 0]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshStandardMaterial color={STAND_WOOD} roughness={0.8} flatShading />
      </mesh>
      {/* four curved hooks near the top */}
      {[0, 1, 2, 3].map((i) => (
        <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
          <mesh position={[0.1, 2.02, 0]} rotation={[0, 0, -0.5]}>
            <cylinderGeometry args={[0.02, 0.024, 0.2, 6]} />
            <meshStandardMaterial
              color={STAND_WOOD}
              roughness={0.8}
              flatShading
            />
          </mesh>
          <mesh position={[0.17, 2.08, 0]} rotation={[0, 0, 0.7]}>
            <cylinderGeometry args={[0.018, 0.02, 0.08, 6]} />
            <meshStandardMaterial
              color={STAND_WOOD}
              roughness={0.8}
              flatShading
            />
          </mesh>
        </group>
      ))}

      {/* ── the coat hanging on it (folded cloth) ── */}
      {/* triangular hanger shoulders, flattened front-to-back like a hung coat */}
      <mesh position={[0, 1.74, 0]} scale={[1, 1, 0.62]}>
        <coneGeometry args={[0.34, 0.34, 16]} />
        <meshStandardMaterial color={CLOAK} roughness={0.9} flatShading />
      </mesh>
      {/* fluted, folded body — flattened in z so it hangs like a coat */}
      <mesh
        geometry={coatGeo}
        position={[0, 1.1, 0]}
        scale={[1, 1, 0.72]}
        castShadow
      >
        <meshStandardMaterial
          color={CLOAK}
          roughness={0.9}
          flatShading
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* sleeves hanging at the sides, hugging the body */}
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[s * 0.27, 1.18, 0]}
          rotation={[0, 0, s * 0.13]}
        >
          <cylinderGeometry args={[0.075, 0.1, 0.9, 8]} />
          <meshStandardMaterial color={CLOAK_D} roughness={0.9} flatShading />
        </mesh>
      ))}
      {/* round brooch at the collar */}
      <mesh position={[0, 1.66, 0.18]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial
          color="#caa24a"
          metalness={0.6}
          roughness={0.4}
          emissive="#caa24a"
          emissiveIntensity={0.25}
          flatShading
        />
      </mesh>

      {/* the hat perched on the finial */}
      <group position={[0, 2.46, 0]} scale={0.66}>
        <WitchHat pos={[0, 0, 0]} rot={0.5} />
      </group>
    </group>
  );
}

// ── A witch's broom: a clean flared bristle bundle + binding + handle ────────
// Origin sits at the centre of the handle, length along local +Y, so it can be
// rotated flat to lie on the floor.
function Broom() {
  return (
    <group>
      {/* bristle bundle — a single clean flared cone */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <coneGeometry args={[0.15, 0.5, 9]} />
        <meshStandardMaterial color="#b8893f" roughness={0.95} flatShading />
      </mesh>
      {/* binding wrap where bristles meet the handle */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.045, 0.1, 8]} />
        <meshStandardMaterial color="#4a3018" roughness={0.85} flatShading />
      </mesh>
      {/* handle */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.03, 1.7, 8]} />
        <meshStandardMaterial color="#7a4f29" roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}

// ── A sentient broom: rests leaning on the crate pile, wakes on click ────────
// At rest it leans ~21° with its bristles on the floor and does NOT move. Click
// it and it stands up and sweeps the floor — upright, bristles skimming the
// ground, rocking side-to-side in sweep strokes and hopping as it roams the nook
// for a while — then settles back against the pile. Rest↔sweep poses are blended
// with a position lerp + quaternion slerp so getting up and settling are smooth.

// Rest pose: a ~21° lean, handle tipping toward -X/-Z (into the pile).
const BROOM_REST_QUAT = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(-0.22, 0, 0.3, "XYZ")
);
// The broom group is centre-pivoted (Broom is offset -1.1 inside it), so place
// the group centre such that the bristle end lands on the floor just in front of
// the crate pile (world ≈ [-3.05, floor, -1.0]).
const BROOM_REST_POS = new THREE.Vector3(-3.05, GROUND_Y, -1.0).add(
  new THREE.Vector3(0, 1.1, 0).applyQuaternion(BROOM_REST_QUAT)
);

// wake sequence timing: eases up, stays lively a good while, then eases home
const BROOM_RAMP = 1.6; // lift-off
const BROOM_HOLD = 18; // seconds of free roaming
const BROOM_DOWN = 2.6; // flight back + settle
// scratch reused every frame (no per-frame allocations)
const _bpos = new THREE.Vector3();
const _bquat = new THREE.Quaternion();
const _btip = new THREE.Quaternion();
const _byaw = new THREE.Quaternion();
const _xAxis = new THREE.Vector3(1, 0, 0);
const _yAxis = new THREE.Vector3(0, 1, 0);
const _zAxis = new THREE.Vector3(0, 0, 1);
const _emit = new THREE.Vector3(); // bristle floor-contact point
const _vel = new THREE.Vector3(); // broom's own velocity (flicks dust along)

const DUST_COUNT = 16;
// soft round dust sprite, drawn once to a canvas (no external asset needed)
function makeDustTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.5, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function InteractiveBroom() {
  const grp = useRef();
  const seed = useMemo(() => Math.random() * 10, []);
  const [hovered, setHovered] = useState(false);
  const active = useRef(false); // currently in a wander cycle
  const startAt = useRef(null); // clock time the cycle began
  const activation = useRef(0); // 0 = resting/leaning, 1 = fully wandering

  // dust puffs kicked up while sweeping — a small reused pool
  const dustTex = useMemo(makeDustTexture, []);
  const dust = useMemo(
    () =>
      Array.from({ length: DUST_COUNT }, () => ({
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        life: 0,
        max: 1,
        size: 0.16,
      })),
    []
  );
  const sprites = useRef([]);
  const spawnAcc = useRef(0);
  const prevPos = useRef(new THREE.Vector3());

  useCursor(hovered);

  useFrame(({ clock }, delta) => {
    const g = grp.current;
    if (!g) return;
    const now = clock.elapsedTime;

    // activation envelope: ramp up on click → hold while roaming → ramp down as
    // it flies home → dormant. Everything else blends off this single 0..1.
    let target = 0;
    let e = 0; // seconds since the click
    if (active.current) {
      if (startAt.current === null) startAt.current = now;
      e = now - startAt.current;
      const total = BROOM_RAMP + BROOM_HOLD + BROOM_DOWN;
      if (e < BROOM_RAMP) target = e / BROOM_RAMP;
      else if (e < BROOM_RAMP + BROOM_HOLD) target = 1;
      else if (e < total) target = 1 - (e - BROOM_RAMP - BROOM_HOLD) / BROOM_DOWN;
      else {
        active.current = false;
        startAt.current = null;
      }
    }
    activation.current = THREE.MathUtils.smoothstep(target, 0, 1);
    const a = activation.current;

    // ── sweep pose (weight 0 → ignored, broom stays leaning at rest) ──
    // Awake it stands upright with its bristles skimming the floor, rocking
    // side-to-side in sweep strokes and hopping lightly as it roams the nook.
    const t = now + seed;
    const stroke = t * 2.4; // the sweep rhythm (one swing per ~1.3s)
    // roam the open floor: variable-speed loop + breathing radius, kept in the
    // ring between the cauldron and the surrounding clutter
    const th = t * 0.14 + Math.sin(t * 0.17) * 0.7;
    const R = 2.2 + Math.sin(t * 0.2) * 0.6;
    // a quick hop + shiver in the first ~2s, like it's shaking itself awake
    const wake = active.current ? Math.max(0, 1 - e / 2.0) : 0;
    // little bounces off the floor, quicker than the sweep swing
    const hop =
      Math.abs(Math.sin(stroke)) * 0.05 + Math.max(0, Math.sin(stroke * 2)) * 0.03;
    _bpos.set(
      Math.cos(th) * R + Math.sin(t * 0.4) * 0.2,
      GROUND_Y + 1.08 + hop + wake * Math.sin(e * 20) * 0.1, // bristles ~on the floor
      Math.sin(th) * R * 0.85 + Math.cos(t * 0.3) * 0.2
    );
    // upright, facing its travel, rocking side-to-side (sweep) + a forward push
    const sway = Math.sin(stroke) * 0.4 + wake * Math.sin(e * 24) * 0.2; // sweep arc
    const push = 0.12 + Math.sin(stroke * 2) * 0.1; // forward push into each stroke
    _byaw.setFromAxisAngle(_yAxis, th + Math.PI / 2 + Math.sin(t * 0.5) * 0.2); // heading
    _btip.setFromAxisAngle(_xAxis, push); // lean forward
    _bquat.setFromAxisAngle(_zAxis, sway); // sway side-to-side
    _btip.multiply(_bquat);
    _bquat.copy(_byaw).multiply(_btip);

    // blend rest ↔ sweep
    g.position.copy(BROOM_REST_POS).lerp(_bpos, a);
    g.quaternion.copy(BROOM_REST_QUAT).slerp(_bquat, a);

    // ── swept-up dust ──
    // emit from the bristle floor-contact point (broom centre + the -1.1 offset,
    // rotated into world), flicked slightly along the broom's own travel
    _emit.set(0, -1.1, 0).applyQuaternion(g.quaternion).add(g.position);
    _vel.copy(g.position).sub(prevPos.current);
    if (delta > 0) _vel.multiplyScalar(1 / delta);
    prevPos.current.copy(g.position);

    if (a > 0.25) {
      spawnAcc.current += delta * 18 * a; // emission rate scales with how awake
      while (spawnAcc.current >= 1) {
        spawnAcc.current -= 1;
        let p = null;
        for (let j = 0; j < dust.length; j++)
          if (dust[j].life <= 0) {
            p = dust[j];
            break;
          }
        if (!p) break;
        p.pos.copy(_emit);
        p.pos.x += (Math.random() - 0.5) * 0.18;
        p.pos.z += (Math.random() - 0.5) * 0.18;
        p.pos.y = GROUND_Y + 0.03 + Math.random() * 0.05;
        const ang = Math.random() * Math.PI * 2;
        const out = 0.15 + Math.random() * 0.25;
        p.vel.set(
          Math.cos(ang) * out + _vel.x * 0.25,
          0.25 + Math.random() * 0.35,
          Math.sin(ang) * out + _vel.z * 0.25
        );
        p.max = 0.7 + Math.random() * 0.6;
        p.life = p.max;
        p.size = 0.12 + Math.random() * 0.12;
      }
    } else {
      spawnAcc.current = 0;
    }

    for (let i = 0; i < dust.length; i++) {
      const p = dust[i];
      const s = sprites.current[i];
      if (!s) continue;
      if (p.life > 0) {
        p.life -= delta;
        p.vel.y -= delta * 0.5; // drift back down
        p.vel.multiplyScalar(Math.max(0, 1 - delta * 1.4)); // air drag / settle
        p.pos.addScaledVector(p.vel, delta);
        if (p.pos.y < GROUND_Y + 0.02) {
          p.pos.y = GROUND_Y + 0.02;
          p.vel.y = 0;
        }
        const k = Math.max(0, p.life / p.max); // 1 → 0 over its life
        s.position.copy(p.pos);
        s.scale.setScalar(p.size * (1.4 - k * 0.6)); // billows out as it fades
        s.material.opacity = 0.35 * k;
        s.visible = true;
      } else if (s.visible) {
        s.visible = false;
      }
    }
  });

  return (
    <>
      <group
        ref={grp}
        position={BROOM_REST_POS.toArray()}
        quaternion={BROOM_REST_QUAT.toArray()}
        onClick={(e) => {
          e.stopPropagation();
          if (!active.current) active.current = true; // wake it (ignored mid-flight)
          useBrew.getState().reset(); // sweep the cauldron clean — no need to stir first
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        {/* pivot around the broom's mid-length, not the bristle end */}
        <group position={[0, -1.1, 0]}>
          {/* glow outline on hover, matching the stir stick / other clickables */}
          <Select enabled={hovered}>
            <Broom />
          </Select>
        </group>
      </group>

      {/* dust puffs live in world space (not under the moving broom group) */}
      <group>
        {dust.map((_, i) => (
          <sprite
            key={i}
            ref={(el) => (sprites.current[i] = el)}
            visible={false}
            scale={0}
          >
            <spriteMaterial
              map={dustTex}
              color="#c9b79a"
              transparent
              opacity={0}
              depthWrite={false}
              toneMapped={false}
            />
          </sprite>
        ))}
      </group>
    </>
  );
}

// ── A wooden supply crate (box + corner posts + slats), origin at its centre ─
// Trim is applied to all four vertical faces (top/bottom band + diagonal brace)
// so the crate reads as a built box from every angle, not just front/back.
function Crate({ size = 0.6 }) {
  const half = size / 2;
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial color="#6b4a2e" roughness={0.85} flatShading />
      </mesh>
      {/* corner posts */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * half, 0, sz * half]}>
            <boxGeometry args={[0.06, size + 0.02, 0.06]} />
            <meshStandardMaterial
              color="#4a3018"
              roughness={0.85}
              flatShading
            />
          </mesh>
        ))
      )}
      {/* plank trim on each of the four faces: a band top + bottom and a
          diagonal cross-brace, parented to a face that rotates around Y */}
      {[0, 1, 2, 3].map((f) => (
        <group key={f} rotation={[0, (f * Math.PI) / 2, 0]}>
          <group position={[0, 0, half + 0.005]}>
            {[-1, 1].map((sy) => (
              <mesh key={sy} position={[0, sy * (half - 0.05), 0]}>
                <boxGeometry args={[size, 0.06, 0.02]} />
                <meshStandardMaterial
                  color="#4a3018"
                  roughness={0.85}
                  flatShading
                />
              </mesh>
            ))}
            <mesh rotation={[0, 0, 0.7]}>
              <boxGeometry args={[size * 1.18, 0.06, 0.02]} />
              <meshStandardMaterial
                color="#4a3018"
                roughness={0.85}
                flatShading
              />
            </mesh>
          </group>
        </group>
      ))}
      {/* planked lid — three boards + two framing rails. This face is what the
          down-view actually looks at, so it must read as a built top, not a
          blank cube face */}
      <group position={[0, half + 0.012, 0]}>
        {[-1, 0, 1].map((i) => (
          <mesh key={i} position={[i * (size / 3), 0, 0]}>
            <boxGeometry args={[size / 3 - 0.03, 0.03, size - 0.02]} />
            <meshStandardMaterial color="#6b4a2e" roughness={0.8} flatShading />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0, 0.006, s * (half - 0.03)]}>
            <boxGeometry args={[size, 0.04, 0.06]} />
            <meshStandardMaterial
              color="#4a3018"
              roughness={0.85}
              flatShading
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ── A bulged wooden barrel with metal hoops, origin at its base ──────────────
function Barrel() {
  const geo = useMemo(() => {
    const profile = [
      [0.0, 0.0],
      [0.26, 0.0],
      [0.3, 0.18],
      [0.32, 0.45],
      [0.3, 0.72],
      [0.26, 0.9],
      [0.0, 0.9],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const g = new THREE.LatheGeometry(profile, 12);
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color="#6e4a2f" roughness={0.8} flatShading />
      </mesh>
      {/* iron hoops */}
      {[0.12, 0.45, 0.78].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <cylinderGeometry args={[0.327, 0.327, 0.05, 12, 1, true]} />
          <meshStandardMaterial
            color="#3a3a44"
            metalness={0.6}
            roughness={0.4}
            flatShading
          />
        </mesh>
      ))}
      {/* planked head — boards + an iron rim + a centre bung, so the top (the
          face the down-view sees) is as detailed as the staved sides */}
      <group position={[0, 0.9, 0]}>
        {[-1, 0, 1].map((i) => (
          <mesh key={i} position={[i * 0.17, 0, 0]}>
            <boxGeometry args={[0.15, 0.03, i === 0 ? 0.52 : 0.4]} />
            <meshStandardMaterial
              color="#5b3a24"
              roughness={0.85}
              flatShading
            />
          </mesh>
        ))}
        {/* iron rim hugging the head */}
        <mesh position={[0, 0.006, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.265, 0.02, 6, 16]} />
          <meshStandardMaterial
            color="#3a3a44"
            metalness={0.6}
            roughness={0.4}
            flatShading
          />
        </mesh>
        {/* centre bung */}
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 0.04, 8]} />
          <meshStandardMaterial color="#3a2416" roughness={0.9} flatShading />
        </mesh>
      </group>
    </group>
  );
}

// ── A reading lectern holding the open spellbook ─────────────────────────────
// Local base at y=0; a slanted board (tilted back) holds the book, with a ledge
// lip along the low edge.
function Lectern({ tilt = 0.72, onActivate }) {
  return (
    <group>
      {/* foot */}
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.38, 0.08, 12]} />
        <meshStandardMaterial color="#3a2416" roughness={0.85} flatShading />
      </mesh>
      {/* post */}
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 1.1, 8]} />
        <meshStandardMaterial color="#5b3a24" roughness={0.8} flatShading />
      </mesh>
      {/* slanted reading board (tips back by `tilt`) */}
      <group position={[0, 1.18, 0]} rotation={[-tilt, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.72, 0.52, 0.05]} />
          <meshStandardMaterial color="#6b4a2e" roughness={0.8} flatShading />
        </mesh>
        {/* ledge lip along the low edge */}
        <mesh position={[0, -0.26, 0.05]}>
          <boxGeometry args={[0.72, 0.05, 0.07]} />
          <meshStandardMaterial color="#5b3a24" roughness={0.8} flatShading />
        </mesh>
        {/* the open spellbook lying on the board face */}
        <group
          position={[0, -0.02, 0.07]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={0.6}
        >
          <Spellbook pos={[0, 0, 0]} rot={0} onActivate={onActivate} />
        </group>
      </group>
    </group>
  );
}

export default function WitchNook() {
  // clicking the lectern grimoire flies the camera in + opens its content
  const openBook = useStore((s) => s.grimoireStore.openBook);

  // candles drift in the air, ringing the cauldron at varying heights
  const candles = [
    { pos: [-2.5, -0.2, 1.4], h: 0.5 },
    { pos: [2.4, 0.6, 1.0], h: 0.42 },
    { pos: [-1.6, 1.0, -2.2], h: 0.55 },
    { pos: [2.2, -0.4, -1.8], h: 0.46 },
    { pos: [0.2, 1.4, 2.6], h: 0.5 },
  ];

  return (
    <group>
      {candles.map((c, i) => (
        <FloatingCandle key={i} {...c} />
      ))}

      {/* robed armour-stand + lectern, grouped to the camera-left of the
          cauldron (world +Z reads as screen-left at scroll 0). The group is
          turned to face the camera (+X); the lectern sits to the stand's left. */}
      <group position={[-2, GROUND_Y, 2.95]} rotation={[0, Math.PI / 1.42, 0]}>
        <CoatStand />
        <group position={[-0.95, 0, 0.15]} rotation={[0, 0.3, 0]}>
          <Lectern onActivate={openBook} />
        </group>
      </group>

      {/* broom + crates on the FAR (-X) side behind the cauldron: occluded by
          the pot (and below-frame) at scroll 0, but revealed as the camera rises
          and tips down toward the brew (scroll ~0.2–0.35) where the floor is bare.
          A dedicated dim warm light keeps the cluster from being lost in shadow. */}
      <pointLight
        position={[-1.7, GROUND_Y + 1.4, -0.9]}
        color="#c9924a"
        intensity={2.4}
        distance={4.5}
        decay={2}
      />
      <group position={[-1.75, GROUND_Y, -0.75]} rotation={[0, 0, 0]}>
        <group position={[-1.65, 0, -1.25]}>
          <Barrel />
        </group>
        <group position={[-2.15, 0.34, -0.35]} rotation={[0, 0.5, 0]}>
          <Crate size={0.68} />
        </group>
        <group position={[-1.45, 0.25, -1.85]} rotation={[0, -0.35, 0]}>
          <Crate size={0.5} />
        </group>
        {/* a smaller crate stacked on the big one — gives the pile a triangular
            silhouette (tall barrel → stepped crates) instead of three separate
            lumps, and adds a second visible top face */}
        <group position={[-2.05, 0.89, -0.45]} rotation={[0, 0.9, 0]}>
          <Crate size={0.42} />
        </group>
      </group>
      {/* leans against the crate pile until clicked, then wanders the nook */}
      <InteractiveBroom />

      {/* floor clutter, sitting on the ground plane around the cauldron */}
      <BookStack pos={[2.6, GROUND_Y, 1.6]} rot={-0.4} />
      <PotionBottle
        pos={[3.0, GROUND_Y, 1.9]}
        color="#5ed0a8"
        h={0.34}
        rot={0.3}
      />
      <PotionBottle
        pos={[3.25, GROUND_Y, 1.5]}
        color="#c75ed0"
        h={0.28}
        rot={-0.5}
      />
      <PotionBottle
        pos={[2.75, GROUND_Y, 2.15]}
        color="#d0a85e"
        h={0.4}
        rot={0.1}
      />
    </group>
  );
}
