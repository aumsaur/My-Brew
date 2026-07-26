import * as THREE from "three";
import { Suspense, useMemo } from "react";
import { Billboard, useGLTF } from "@react-three/drei";
import Vessel from "@/features/brew/scene/Vessel";
import GlbModel from "@/features/brew/scene/GlbModel";

// ── Bespoke, ONE-OF-A-KIND vessels — one per curated recipe ──────────────────
// Vessel.jsx's 5 generic shapes (cup/can/colabottle/bottle/flask) are the
// CATEGORY-level fallback used for off-recipe oddities. Once you've actually
// matched a real recipe in the book, you get ITS specific vessel instead —
// every recipe in recipes.js has its own here. Same low-poly, flat-shaded
// primitive-combination style as Vessel.jsx / IngredientModel.jsx; `color` is
// the brew's own computed colour (still varies a little pour to pour).

const GLASS = "#dfe8ff";
const CORK = "#6b4a2f";
const METAL = "#b8b8c2";

// `open` = the shape has a genuine opening the camera can see inside (an
// open-ended cylinder, a half-sphere shell) → needs DoubleSide so the inner
// wall renders. A FULLY CLOSED shell (a plain sphere/icosahedron bulb) does
// NOT need DoubleSide — the camera never gets inside a small vessel — and
// asking for it anyway is what caused the "see-through at some angles"
// flicker: DoubleSide + depthWrite:false on a closed convex shape has no
// reliable front/back triangle ordering. FrontSide-only sidesteps the whole
// problem for closed shells.
function glassMat(opacity = 0.18, open = false) {
  return {
    color: GLASS,
    transparent: true,
    opacity,
    depthWrite: false,
    roughness: 0.06,
    metalness: 0.1,
    side: open ? THREE.DoubleSide : THREE.FrontSide,
    flatShading: true,
  };
}

// Espresso Hex — a squat demitasse: short and wide (NOT a tall cup — the
// previous build's saucer-under-a-tall-cylinder silhouette read as a top hat,
// not a cup). Warm dark ceramic (not near-black) so the handle/rim actually
// read against the card's dark background, with a glossy crema ring.
function EspressoHex({ color }) {
  const clay = "#3d2a1f";
  return (
    <group>
      <mesh position={[0, -0.17, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.025, 16]} />
        <meshStandardMaterial color={clay} roughness={0.35} metalness={0.08} flatShading />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.18, 0.14, 0.2, 16, 1, true]} />
        <meshStandardMaterial color={clay} roughness={0.3} metalness={0.08} side={THREE.DoubleSide} flatShading />
      </mesh>
      <mesh position={[0, -0.155, 0]}>
        <cylinderGeometry args={[0.14, 0.12, 0.02, 16]} />
        <meshStandardMaterial color={clay} roughness={0.3} metalness={0.08} flatShading />
      </mesh>
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.165, 0.155, 0.045, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.2} flatShading />
      </mesh>
      <mesh position={[0.155, -0.05, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <torusGeometry args={[0.075, 0.02, 6, 12, Math.PI]} />
        <meshStandardMaterial color={clay} roughness={0.35} metalness={0.08} flatShading />
      </mesh>
    </group>
  );
}

// Graveyard Latte — a tall clear glass with the espresso pooled dark at the
// bottom and a "ghost of cream" layer floating pale on top, plus a thin wisp
// curling free of the rim.
function GraveyardLatte({ color }) {
  const cream = useMemo(() => new THREE.Color(color).lerp(new THREE.Color("#f4efe6"), 0.75), [color]);
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.24, 0.2, 0.7, 14, 1, true]} />
        <meshStandardMaterial {...glassMat(0.16, true)} />
      </mesh>
      <mesh position={[0, -0.14, 0]}>
        <cylinderGeometry args={[0.215, 0.185, 0.4, 14]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} roughness={0.25} flatShading />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.225, 0.215, 0.14, 14]} />
        <meshStandardMaterial color={cream} emissive={cream} emissiveIntensity={0.25} roughness={0.35} flatShading />
      </mesh>
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.19, 0.19, 0.02, 14]} />
        <meshStandardMaterial color="#dfe8ff" transparent opacity={0.3} depthWrite={false} flatShading />
      </mesh>
      {/* ghostly wisp curling up off the rim */}
      <mesh position={[0.05, 0.42, 0]} rotation={[0.4, 0.3, 0]}>
        <torusGeometry args={[0.08, 0.012, 6, 12, Math.PI * 1.4]} />
        <meshStandardMaterial color="#e9e2f4" transparent opacity={0.4} roughness={0.5} />
      </mesh>
    </group>
  );
}

// Sparkling Hex — a hexagonal frosted tumbler (matches its name), rimed with
// little ice-shard facets, fizzing.
function SparklingHex({ color }) {
  const bubbles = [
    [0.06, -0.1, 0.03],
    [-0.05, 0.05, -0.04],
    [0.02, 0.2, 0.05],
    [-0.07, -0.22, 0.02],
  ];
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.24, 0.21, 0.62, 6, 1, true]} />
        <meshStandardMaterial {...glassMat(0.2, true)} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.22, 0.2, 0.42, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.15} flatShading />
      </mesh>
      {bubbles.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial color="#eafcff" emissive="#eafcff" emissiveIntensity={0.6} />
        </mesh>
      ))}
      {/* frost shards around the rim */}
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.23, 0.3, Math.sin(a) * 0.23]} rotation={[0.3, -a, 0]} scale={[0.03, 0.08, 0.03]}>
            <coneGeometry args={[1, 1, 4]} />
            <meshStandardMaterial color="#eafcff" roughness={0.2} flatShading />
          </mesh>
        );
      })}
    </group>
  );
}

// Cinder Fizz — a rough charred stone tankard, cracked through with glowing
// ember lines, a curl of smoke off the rim.
function CinderFizz({ color }) {
  const cracks = [
    [0.02, 0.05, 0.19, 1.1],
    [-0.06, -0.08, 0.14, -0.6],
    [0.08, -0.15, 0.1, 0.4],
  ];
  return (
    <group>
      <mesh scale={[0.62, 0.72, 0.62]}>
        <icosahedronGeometry args={[0.42, 1]} />
        <meshStandardMaterial color="#2a2422" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.22, 0.24, 0.1, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.3} flatShading />
      </mesh>
      {cracks.map(([x, y, len, rot], i) => (
        <mesh key={i} position={[x, y, 0.24]} rotation={[0, 0, rot]} scale={[0.012, len, 0.012]}>
          <boxGeometry />
          <meshStandardMaterial color="#ff7a3d" emissive="#ff7a3d" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0.22, -0.02, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <torusGeometry args={[0.11, 0.028, 6, 12, Math.PI]} />
        <meshStandardMaterial color="#2a2422" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

// Bitter Green Tonic — a slim apothecary vial with a rubber-bulb dropper cap.
// Lathe profiles for the vial — a SINGLE continuous revolved surface each for
// glass and liquid (rounded bottom flowing straight into the cylindrical
// sides), not a cylinder-plus-separate-hemisphere. The old two-mesh version
// left a visible seam ring where the two pieces almost-but-not-quite lined up
// — glaring on the glass since both pieces were transparent (depthWrite off)
// and any misalignment shows as an inconsistent alpha blend at the boundary.
// A lathe has no such seam by construction. Computed once at module scope
// (doesn't depend on colour).
const VIAL_GLASS_PROFILE = [
  [0.001, -0.32],
  [0.07, -0.3],
  [0.09, -0.2],
  [0.09, 0.25],
].map(([x, y]) => new THREE.Vector2(x, y));
const VIAL_LIQUID_PROFILE = [
  [0.001, -0.3],
  [0.06, -0.28],
  [0.075, -0.19],
  [0.075, 0.08],
].map(([x, y]) => new THREE.Vector2(x, y));
// Dropper cap — neck and bulb as ONE lathed piece instead of a cylinder glued
// to a sphere, which read as visibly disjointed (two unrelated primitives
// touching, not a single moulded dropper top).
const DROPPER_CAP_PROFILE = [
  [0.001, 0],
  [0.05, 0.01],
  [0.048, 0.1],
  [0.06, 0.14],
  [0.078, 0.19],
  [0.06, 0.25],
  [0.001, 0.28],
].map(([x, y]) => new THREE.Vector2(x, y));

function BitterGreenTonic({ color }) {
  const glassGeo = useMemo(() => new THREE.LatheGeometry(VIAL_GLASS_PROFILE, 12), []);
  const liquidGeo = useMemo(() => new THREE.LatheGeometry(VIAL_LIQUID_PROFILE, 12), []);
  const capGeo = useMemo(() => new THREE.LatheGeometry(DROPPER_CAP_PROFILE, 10), []);
  return (
    <group>
      <mesh geometry={glassGeo}>
        <meshStandardMaterial {...glassMat(0.22, true)} />
      </mesh>
      <mesh geometry={liquidGeo}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.2} flatShading />
      </mesh>
      <mesh geometry={capGeo} position={[0, 0.23, 0]}>
        <meshStandardMaterial color="#4a2a1f" roughness={0.5} flatShading />
      </mesh>
    </group>
  );
}

// Toadstool Tincture — a round honey jar capped with a little mushroom-cap
// stopper (spotted, domed) instead of a plain cork.
function ToadstoolTincture({ color }) {
  const spots = [
    [0.05, 0.02, 0.06],
    [-0.05, 0.03, -0.02],
    [0.01, 0.04, -0.06],
  ];
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.26, 14, 12]} />
        <meshStandardMaterial {...glassMat(0.24, false)} />
      </mesh>
      <mesh scale={[0.86, 0.86, 0.86]}>
        <sphereGeometry args={[0.26, 14, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} roughness={0.3} flatShading />
      </mesh>
      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 0.1, 10]} />
        <meshStandardMaterial color="#efe7d0" roughness={0.7} flatShading />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.16, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#c94f4f" roughness={0.5} flatShading />
      </mesh>
      {spots.map((p, i) => (
        <mesh key={i} position={[p[0], 0.35 + p[1], p[2]]} scale={[1, 0.4, 1]}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshStandardMaterial color="#f6efdc" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// Dragon's Draught — a rugged dark-iron chalice on a stem, its bowl scored
// with glowing ember cracks (same crack technique as Cinder Fizz below, so the
// two "warmth" vessels read as kin) and a spiked rim.
function DragonsDraught({ color }) {
  const iron = "#332420";
  const cracks = [
    [0.02, 0.05, 0.14, 1.2],
    [-0.06, -0.02, 0.12, -0.5],
    [0.07, -0.06, 0.1, 0.5],
  ];
  return (
    <group>
      {/* bowl */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.22, 0.1, 0.28, 10, 1, true]} />
        <meshStandardMaterial color={iron} roughness={0.7} side={THREE.DoubleSide} flatShading />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.19, 0.16, 0.14, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.2} flatShading />
      </mesh>
      {/* spiked rim */}
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.2, 0.22, Math.sin(a) * 0.2]} rotation={[0, -a, 0]} scale={[0.02, 0.06, 0.02]}>
            <coneGeometry args={[1, 1, 4]} />
            <meshStandardMaterial color={iron} roughness={0.6} flatShading />
          </mesh>
        );
      })}
      {/* stem + foot */}
      <mesh position={[0, -0.14, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.24, 8]} />
        <meshStandardMaterial color={iron} roughness={0.6} flatShading />
      </mesh>
      <mesh position={[0, -0.28, 0]}>
        <cylinderGeometry args={[0.13, 0.15, 0.04, 10]} />
        <meshStandardMaterial color={iron} roughness={0.6} flatShading />
      </mesh>
      {/* ember cracks scoring the bowl */}
      {cracks.map(([x, y, len, rot], i) => (
        <mesh key={i} position={[x, y + 0.08, 0.16]} rotation={[0, 0, rot]} scale={[0.012, len, 0.012]}>
          <boxGeometry />
          <meshStandardMaterial color="#ff7a3d" emissive="#ff7a3d" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

// A genuine crescent. A torus ARC reads as an open ring ("C"), not a moon,
// because its tube stays a uniform width end to end; a real crescent tapers to
// points at both horns. (A Shape-with-a-hole cutout — the textbook way to draw
// this — turned out NOT to subtract in this Three.js version; verified by
// inspecting the resulting geometry's vertices, the "hole" circle was being
// unioned in instead. This traces the lune's outline directly as one
// continuous path instead: the two circles' actual intersection points,
// computed via the law of cosines, joined by their outer/inner arcs — no hole
// mechanism involved, so nothing to silently fail.)
function useCrescentGeometry() {
  return useMemo(() => {
    // R1-R2 was only 0.01 apart (a hairline sliver) — read as invisible at
    // any distance. Widened the band and the whole shape so it reads as a
    // solid stopper, not a thin scratch.
    const R1 = 0.15; // outer circle (the moon's outer edge)
    const R2 = 0.12; // inner "bite" circle, offset — what makes it a crescent
    const d = 0.09; // offset between the two circles' centers
    const alpha = Math.acos((R1 * R1 + d * d - R2 * R2) / (2 * R1 * d)); // intersection angle at O1
    const p1 = [R1 * Math.cos(alpha), R1 * Math.sin(alpha)]; // top horn
    const p2 = [R1 * Math.cos(-alpha), R1 * Math.sin(-alpha)]; // bottom horn
    const angleP1O2 = Math.atan2(p1[1], p1[0] - d);
    const angleP2O2 = Math.atan2(p2[1], p2[0] - d);

    const shape = new THREE.Shape();
    shape.moveTo(p2[0], p2[1]);
    shape.absarc(0, 0, R1, -alpha, alpha, true); // outer belly — the long way around, through the far side
    shape.absarc(d, 0, R2, angleP1O2, angleP2O2, false); // inner cusp, back to the start
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false });
    geo.center();
    return geo;
  }, []);
}

// Dream Draught — a round bulb flask stoppered with a crescent moon, tiny
// stars drifting around it.
function DreamDraught({ color }) {
  const crescent = useCrescentGeometry();
  return (
    <group>
      <mesh position={[0, -0.08, 0]}>
        <icosahedronGeometry args={[0.23, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.15} flatShading />
      </mesh>
      <mesh position={[0, -0.04, 0]}>
        <icosahedronGeometry args={[0.29, 1]} />
        <meshStandardMaterial {...glassMat(0.16, false)} />
      </mesh>
      <mesh position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.28, 8, 1, true]} />
        <meshStandardMaterial {...glassMat(0.18, true)} />
      </mesh>
      {/* Billboarded — a flat crescent mounted on a spinning vessel is edge-on
          (a thin line, not a moon) half the time otherwise. Always facing the
          camera keeps it reading as a crescent regardless of spin/view angle.
          Sits close to the neck top (≈0.38) so it reads as a stopper, not a
          separate object floating above the flask. */}
      <Billboard position={[0, 0.4, 0]}>
        <mesh geometry={crescent} scale={1.4}>
          <meshStandardMaterial
            color="#f2e6c4"
            emissive="#f2e6c4"
            emissiveIntensity={0.9}
            roughness={0.35}
            flatShading
          />
        </mesh>
      </Billboard>
      {[[0.14, 0.5, 0.05], [-0.13, 0.46, -0.04], [0.02, 0.56, -0.08]].map((p, i) => (
        <mesh key={i} position={p} scale={0.02}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#f2e9ff" emissive="#f2e9ff" emissiveIntensity={1} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

// Midnight Philter — the same globe-flask, but rooted: gnarled taproot legs
// instead of a flat foot.
function MidnightPhilter({ color }) {
  return (
    <group>
      <mesh position={[0, 0.02, 0]}>
        <icosahedronGeometry args={[0.24, 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} roughness={0.15} flatShading />
      </mesh>
      <mesh position={[0, 0.06, 0]}>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial {...glassMat(0.15, false)} />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.22, 8, 1, true]} />
        <meshStandardMaterial {...glassMat(0.18, true)} />
      </mesh>
      <mesh position={[0, 0.46, 0]}>
        <cylinderGeometry args={[0.07, 0.085, 0.08, 6]} />
        <meshStandardMaterial color={CORK} roughness={0.6} flatShading />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.1, -0.22, 0]} rotation={[0, 0, s * 0.5]}>
          <coneGeometry args={[0.06, 0.28, 5]} />
          <meshStandardMaterial color="#241a2e" roughness={0.9} flatShading />
        </mesh>
      ))}
      <mesh position={[0, -0.1, 0]} rotation={[0, 0, 0.15]}>
        <coneGeometry args={[0.045, 0.14, 5]} />
        <meshStandardMaterial color="#241a2e" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

// Raven's Elixir — a slender flask with two wings flaring from its shoulders
// and a feather-shaped stopper.
function RavensElixir({ color }) {
  return (
    <group>
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.11, 0.16, 0.38, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} roughness={0.15} flatShading />
      </mesh>
      <mesh position={[0, -0.1, 0]} scale={[1.15, 1.06, 1.15]}>
        <cylinderGeometry args={[0.11, 0.16, 0.38, 10]} />
        <meshStandardMaterial {...glassMat(0.16, false)} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.055, 0.08, 0.14, 8, 1, true]} />
        <meshStandardMaterial {...glassMat(0.18, true)} />
      </mesh>
      {/* wings — bright enough to actually read against a dark card (near-black
          on a near-black background is just invisible, tried that already) */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.17, -0.02, 0]} rotation={[0, 0, s * 0.55]} scale={[0.2, 0.32, 0.055]}>
          <icosahedronGeometry args={[0.5, 1]} />
          <meshStandardMaterial
            color="#9a97b8"
            emissive="#6a63a8"
            emissiveIntensity={0.35}
            roughness={0.3}
            metalness={0.3}
            flatShading
          />
        </mesh>
      ))}
      {/* feather-quill stopper */}
      <mesh position={[0, 0.3, 0]} rotation={[0, 0, 0.25]} scale={[0.11, 0.32, 0.035]}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial
          color="#8a87a8"
          emissive="#6a63a8"
          emissiveIntensity={0.3}
          roughness={0.3}
          metalness={0.3}
          flatShading
        />
      </mesh>
    </group>
  );
}

// Thai Tea — the signature: a tall glass, orange tea and cream in visible
// layers, ice, a striped straw. The most detailed piece in the book.
function ThaiTeaVessel({ color }) {
  const cream = "#f6ead0";
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[0.2, 0.17, 0.72, 14, 1, true]} />
        <meshStandardMaterial {...glassMat(0.15, true)} />
      </mesh>
      <mesh position={[0, -0.14, 0]}>
        <cylinderGeometry args={[0.185, 0.16, 0.42, 14]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.2} flatShading />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.195, 0.185, 0.1, 14]} />
        <meshStandardMaterial color={cream} emissive={cream} emissiveIntensity={0.25} roughness={0.35} flatShading />
      </mesh>
      {[[0.08, 0.24, 0.05], [-0.07, 0.28, -0.04], [0.02, 0.32, 0.06]].map((p, i) => (
        <mesh key={i} position={p} rotation={[0.3, i, 0.2]} scale={[0.055, 0.045, 0.055]}>
          <boxGeometry />
          <meshStandardMaterial color="#eafcff" transparent opacity={0.55} roughness={0.1} flatShading />
        </mesh>
      ))}
      <mesh position={[0.06, 0.5, 0]} rotation={[0, 0, 0.18]}>
        <cylinderGeometry args={[0.012, 0.012, 0.42, 6]} />
        <meshStandardMaterial color="#e8542f" roughness={0.4} flatShading />
      </mesh>
    </group>
  );
}

const RECIPE_VESSELS = {
  "espresso-hex": EspressoHex,
  "graveyard-latte": GraveyardLatte,
  "sparkling-hex": SparklingHex,
  "cinder-fizz": CinderFizz,
  "bitter-green-tonic": BitterGreenTonic,
  "toadstool-tincture": ToadstoolTincture,
  "dragons-draught": DragonsDraught,
  "dream-draught": DreamDraught,
  "midnight-philter": MidnightPhilter,
  "ravens-elixir": RavensElixir,
  "thai-tea": ThaiTeaVessel,
};

// Recipes with a Meshy-generated GLB in /public/models would override the
// hand-built bespoke component above (same pattern as IngredientModel's
// MODEL_URLS) — but user feedback after actually trying the Meshy vessels was
// "even the vial doesn't work, old one before using meshy is better," so this
// is back to EMPTY on purpose. The hand-built vessels (all bugfixed earlier —
// transparency sorting on closed glass shells, a properly-geometric crescent
// moon) are the real deal here, not a placeholder fallback. GLBs are still on
// disk (public/models/*.glb) and prompts still live in scripts/meshy if this
// gets revisited, just not wired in.
const VESSEL_MODEL_URLS = {};

// Preload only the registered GLBs, so an empty map (fresh checkout) fetches nothing.
Object.values(VESSEL_MODEL_URLS).forEach((m) => useGLTF.preload(m.url));

// Renders a served brew's vessel: a Meshy GLB if one's registered for this
// recipe, else the hand-built bespoke component if a recipe was matched
// (`recipeId`), else Vessel.jsx's generic category-level shape (off-recipe
// oddities — no specific recipe to be bespoke FOR). Single source of truth so
// BrewScene's rising vessel and the share card's preview always agree on what
// a given brew looks like.
export default function ServedVessel({ recipeId, vessel, color, scale = 1 }) {
  const Comp = recipeId && RECIPE_VESSELS[recipeId];
  const modelDef = recipeId && VESSEL_MODEL_URLS[recipeId];
  const fallback = Comp ? <Comp color={color} /> : <Vessel vessel={vessel} color={color} />;
  return (
    <group scale={scale}>
      {modelDef ? (
        <Suspense fallback={fallback}>
          <GlbModel url={modelDef.url} color={color} fit={modelDef.fit} />
        </Suspense>
      ) : (
        fallback
      )}
    </group>
  );
}
