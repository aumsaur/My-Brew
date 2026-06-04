import * as THREE from "three";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import LowPolyFire from "@/shared/components/LowPolyFire";

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
function Spellbook({ pos, rot = 0 }) {
  const page = useRef();
  const sigil = useRef();
  const seed = useMemo(() => Math.random() * 10, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    // a page lifts and flips over every few seconds (sawtooth on a slow cycle)
    if (page.current) {
      const cycle = (t * 0.18) % 1;
      const lift = cycle < 0.35 ? Math.sin((cycle / 0.35) * Math.PI) : 0;
      page.current.rotation.z = -lift * Math.PI * 0.9;
    }
    // a rune sigil hovers and slowly turns above the open book
    if (sigil.current) {
      sigil.current.rotation.z = t * 0.3;
      sigil.current.position.y = 0.32 + Math.sin(t * 1.2) * 0.04;
    }
  });

  return (
    <group position={pos} rotation={[0, rot, 0]}>
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.3, 0.05, 0]}>
        <planeGeometry args={[0.58, 0.8]} />
        <meshStandardMaterial
          color="#f3e9cf"
          emissive="#caa24a"
          emissiveIntensity={0.5}
          roughness={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.3, 0.05, 0]}>
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
      <pointLight
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
function Lectern({ tilt = 0.72 }) {
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
          <Spellbook pos={[0, 0, 0]} rot={0} />
        </group>
      </group>
    </group>
  );
}

export default function WitchNook() {
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
          <Lectern />
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
      <group
        position={[-1.55, GROUND_Y + 0.1, 0.7]}
        rotation={[Math.PI / 2, 0.9, 0]}
      >
        <Broom />
      </group>

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
