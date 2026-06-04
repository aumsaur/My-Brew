import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Stylized low-poly ingredient props ───────────────────────────────────────
// Each prop takes a base `color` and derives a darker/lighter tone from it so
// facets read under the moody lighting. Geometry stays low-poly + flat-shaded
// to match the art direction; the shape (silhouette) does the heavy lifting.

const WHITE = new THREE.Color("#ffffff");
const BLACK = new THREE.Color("#000000");

// Memoized light/dark tones derived from the ingredient's base colour.
function useTones(color) {
  return useMemo(() => {
    const base = new THREE.Color(color);
    return {
      base,
      light: base.clone().lerp(WHITE, 0.22),
      dark: base.clone().lerp(BLACK, 0.58),
    };
  }, [color]);
}

// Coffee Bean — a plump faceted kidney with a deep central groove. Low-poly +
// flat-shaded for sharp clean facets, a touch of metalness for the polished
// sheen of a fresh roasted bean.
function Bean({ color }) {
  const { base, dark } = useTones(color);
  return (
    <group rotation={[0.3, 0.4, 0]}>
      {/* plump faceted body */}
      <mesh scale={[0.52, 0.4, 0.66]}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial
          color={base}
          roughness={0.34}
          metalness={0.14}
          flatShading
        />
      </mesh>
      {/* deep central groove — a dark wedge sunk along the bean's length */}
      <mesh position={[0, 0.09, 0]} scale={[0.09, 0.24, 0.62]}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial color={dark} roughness={0.6} flatShading />
      </mesh>
    </group>
  );
}

// Cream — a little creamer pitcher: rounded body, pour spout, C-handle, cream fill.
function Jug({ color }) {
  const { base, dark, light } = useTones(color);
  const profile = useMemo(
    () =>
      [
        [0.0, -0.26],
        [0.17, -0.26],
        [0.22, -0.12],
        [0.22, 0.08],
        [0.16, 0.2],
        [0.14, 0.26],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
    []
  );
  return (
    <group>
      <mesh>
        <latheGeometry args={[profile, 14]} />
        <meshStandardMaterial color={base} roughness={0.5} flatShading />
      </mesh>
      {/* pour spout — pinched lip at the front rim */}
      <mesh
        position={[0, 0.24, 0.15]}
        rotation={[0.6, 0, 0]}
        scale={[0.1, 0.1, 0.12]}
      >
        <coneGeometry args={[1, 1.2, 4]} />
        <meshStandardMaterial color={base} roughness={0.5} flatShading />
      </mesh>
      {/* C-handle on the side — a vertical half-loop whose ends meet the body */}
      <mesh position={[0.2, 0.0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <torusGeometry args={[0.12, 0.025, 6, 14, Math.PI]} />
        <meshStandardMaterial color={base} roughness={0.5} flatShading />
      </mesh>
      {/* cream fill near the rim */}
      <mesh position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.135, 0.13, 0.04, 14]} />
        <meshStandardMaterial
          color={light}
          emissive={light}
          emissiveIntensity={0.25}
          roughness={0.3}
        />
      </mesh>
      {/* rim band */}
      <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.145, 0.012, 6, 14]} />
        <meshStandardMaterial color={dark} roughness={0.5} />
      </mesh>
    </group>
  );
}

// Cola Nut — a rounded reddish kola seed with a flat, lighter cut face + seam.
function Nut({ color }) {
  const { base, light, dark } = useTones(color);
  return (
    <group rotation={[0.35, 0.5, 0]}>
      {/* rounded nut body */}
      <mesh scale={[0.46, 0.52, 0.42]}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial color={base} roughness={0.4} flatShading />
      </mesh>
      {/* flat cut face — lighter interior, facing +z */}
      <mesh position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.04, 14]} />
        <meshStandardMaterial color={light} roughness={0.5} flatShading />
      </mesh>
      {/* central seam on the cut face */}
      <mesh position={[0, 0, 0.225]} scale={[0.03, 0.34, 0.01]}>
        <boxGeometry />
        <meshStandardMaterial color={dark} roughness={0.7} />
      </mesh>
    </group>
  );
}

function Crystal({ color }) {
  const { base, light } = useTones(color);
  // a cluster of pointed shards rather than a single gem
  const shards = [
    { p: [0, 0.02, 0], s: [1, 1.9, 1], r: [0.15, 0.3, 0] },
    { p: [0.17, -0.06, 0.05], s: [0.6, 1.3, 0.6], r: [0.3, 0, 0.5] },
    { p: [-0.16, -0.09, -0.03], s: [0.5, 1.1, 0.5], r: [-0.2, 0.4, -0.35] },
    { p: [0.03, -0.04, -0.16], s: [0.45, 1.0, 0.45], r: [0.1, -0.3, 0.25] },
  ];
  return (
    <group rotation={[0.1, 0.3, 0]}>
      {shards.map((sh, i) => (
        <mesh
          key={i}
          position={sh.p}
          rotation={sh.r}
          scale={sh.s.map((v) => v * 0.22)}
        >
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={i === 0 ? base : light}
            emissive={base}
            emissiveIntensity={0.5}
            flatShading
            roughness={0.12}
            metalness={0.25}
            transparent
            opacity={0.92}
          />
        </mesh>
      ))}
    </group>
  );
}

function Mushroom({ color }) {
  const { base, dark } = useTones(color);
  // a few spots scattered on the cap
  const spots = [
    [0.12, 0.04, 0.08],
    [-0.1, 0.06, 0.05],
    [0.04, 0.1, -0.12],
    [-0.06, 0.02, -0.1],
  ];
  return (
    <group rotation={[0.08, 0, 0.05]}>
      {/* cream stem, fatter at the base */}
      <mesh position={[0, -0.16, 0]}>
        <cylinderGeometry args={[0.1, 0.16, 0.5, 10]} />
        <meshStandardMaterial color="#efe7d0" roughness={0.85} flatShading />
      </mesh>
      {/* gills tucked under the cap */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.3, 0.12, 0.06, 14]} />
        <meshStandardMaterial color={dark} roughness={0.8} flatShading />
      </mesh>
      {/* domed cap */}
      <mesh position={[0, 0.14, 0]}>
        <sphereGeometry args={[0.34, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={base}
          emissive={base}
          emissiveIntensity={0.2}
          roughness={0.5}
          flatShading
        />
      </mesh>
      {/* speckles */}
      {spots.map((p, i) => (
        <mesh key={i} position={[p[0], 0.14 + p[1], p[2]]} scale={[1, 0.4, 1]}>
          <sphereGeometry args={[0.05, 8, 6]} />
          <meshStandardMaterial color="#f6efdc" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// Eyeball — a glistening specimen for the brine jar: pale sclera, a glowing iris,
// a dark pupil, a wet glint and a few bloodshot veins creeping over the white.
function Eyeball({ color }) {
  const { base } = useTones(color);
  const veins = [
    [0.42, 0.3],
    [-0.5, 0.12],
    [0.2, -0.55],
    [-0.32, -0.4],
  ];
  return (
    <group rotation={[0.1, 0, 0]}>
      {/* sclera */}
      <mesh>
        <sphereGeometry args={[0.2, 20, 16]} />
        <meshStandardMaterial color="#ece4d6" roughness={0.22} />
      </mesh>
      {/* glowing iris */}
      <mesh position={[0, 0, 0.182]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.085, 0.085, 0.03, 16]} />
        <meshStandardMaterial
          color={base}
          emissive={base}
          emissiveIntensity={0.4}
          roughness={0.2}
        />
      </mesh>
      {/* pupil */}
      <mesh position={[0, 0, 0.2]}>
        <sphereGeometry args={[0.038, 12, 10]} />
        <meshStandardMaterial color="#080808" roughness={0.1} />
      </mesh>
      {/* wet glint */}
      <mesh position={[0.06, 0.06, 0.19]} scale={0.022}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.05} />
      </mesh>
      {/* bloodshot veins */}
      {veins.map(([vx, vy], i) => (
        <mesh
          key={i}
          position={[vx * 0.12, vy * 0.12, 0.15]}
          rotation={[0, 0, vx * vy * 5]}
          scale={[0.006, 0.13, 0.006]}
        >
          <boxGeometry />
          <meshStandardMaterial color="#a83232" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Berries({ color }) {
  const { base, dark, light } = useTones(color);
  const berries = [
    { p: [0, 0.13, 0], r: 0.15, c: base },
    { p: [-0.14, -0.04, 0.05], r: 0.13, c: dark },
    { p: [0.14, -0.04, -0.05], r: 0.13, c: base },
    { p: [0.02, -0.12, 0.08], r: 0.1, c: dark },
  ];
  return (
    <group>
      {berries.map((b, i) => (
        <group key={i} position={b.p}>
          <mesh>
            <sphereGeometry args={[b.r, 14, 14]} />
            <meshStandardMaterial
              color={b.c}
              emissive={b.c}
              emissiveIntensity={0.18}
              roughness={0.28}
            />
          </mesh>
          {/* tiny specular glint */}
          <mesh position={[b.r * 0.35, b.r * 0.4, b.r * 0.4]}>
            <sphereGeometry args={[b.r * 0.22, 6, 6]} />
            <meshStandardMaterial color={light} roughness={0.1} />
          </mesh>
        </group>
      ))}
      {/* stem */}
      <mesh position={[0, 0.24, 0]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.012, 0.018, 0.18, 6]} />
        <meshStandardMaterial color="#4a3a1c" roughness={0.9} />
      </mesh>
      {/* leaf */}
      <mesh
        position={[0.1, 0.26, 0]}
        rotation={[0, 0.4, -0.7]}
        scale={[0.14, 0.04, 0.08]}
      >
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#4f7a32" roughness={0.7} flatShading />
      </mesh>
    </group>
  );
}

// Moonpetal — soft violet petals twisting upward into a cupped bloom around a
// pulsing golden core that casts a warm glow. Smooth-shaded petals so the
// flowing, fabric-like curves read; the core breathes via useFrame.
function Flower({ color }) {
  const { base } = useTones(color);
  const core = useRef();
  const coreLight = useRef();
  const petals = 6;
  useFrame((state) => {
    const pulse = 0.65 + Math.sin(state.clock.elapsedTime * 2.2) * 0.3;
    if (core.current) core.current.material.emissiveIntensity = pulse;
    if (coreLight.current) coreLight.current.intensity = 0.3 + pulse * 0.5;
  });
  return (
    <group rotation={[Math.PI / 2.3, 0, 0]}>
      {Array.from({ length: petals }).map((_, i) => {
        const a = (i / petals) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.15, 0.02, Math.sin(a) * 0.15]}
            rotation={[0.6, -a, 0.35]} // tilt up + twist into a cup
            scale={[0.13, 0.05, 0.3]}
          >
            <sphereGeometry args={[1, 12, 10]} />
            <meshStandardMaterial
              color={base}
              emissive={base}
              emissiveIntensity={0.45}
              roughness={0.4}
            />
          </mesh>
        );
      })}
      {/* pulsing golden core + the warm light it casts on the petals */}
      <mesh ref={core}>
        <icosahedronGeometry args={[0.11, 0]} />
        <meshStandardMaterial
          color="#ffe0a0"
          emissive="#ffb938"
          emissiveIntensity={0.8}
          flatShading
        />
      </mesh>
      <pointLight
        ref={coreLight}
        color="#ffcf6a"
        intensity={0.5}
        distance={1.3}
        decay={2}
      />
    </group>
  );
}

// Raven Feather — an inky, faceted elongated-oval vane with a central rachis and
// a strong triangular quill base. Flat-shaded so every polygon edge reads sharp.
function Feather({ color }) {
  const { base, dark, light } = useTones(color);
  return (
    <group rotation={[0, 0, 0.32]}>
      {/* elongated oval vane — flattened faceted body */}
      <mesh position={[0, 0.06, 0]} scale={[0.17, 0.52, 0.05]}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial
          color={dark}
          roughness={0.5}
          metalness={0.18}
          flatShading
        />
      </mesh>
      {/* central rachis ridge running the vane */}
      <mesh position={[0, 0.08, 0.025]} scale={[0.014, 0.52, 0.02]}>
        <boxGeometry />
        <meshStandardMaterial color={base} roughness={0.55} flatShading />
      </mesh>
      {/* strong triangular quill base */}
      <mesh position={[0, -0.27, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.05, 0.24, 3]} />
        <meshStandardMaterial color={light} roughness={0.5} flatShading />
      </mesh>
    </group>
  );
}

// Mandrake — a gnarled, knotty taproot: a chunky faceted body with forked legs
// and stubby arms, deep ancient brown, threaded with glowing azure veins and a
// little sprig of greens on its crown.
function Mandrake({ color }) {
  const { base, dark } = useTones(color);
  const AZURE = "#2f7bd6";
  const veins = [
    [0.05, 0.12, 0.26, 0.3],
    [-0.05, -0.02, 0.3, -0.5],
    [0.03, 0.16, 0.22, 0.9],
  ];
  return (
    <group rotation={[0.1, 0.5, 0.08]}>
      {/* bulbous knotty body */}
      <mesh position={[0, 0.04, 0]} scale={[0.27, 0.36, 0.27]}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial color={base} roughness={0.9} flatShading />
      </mesh>
      {/* two forked legs tapering down */}
      {[-1, 1].map((s) => (
        <mesh
          key={`leg${s}`}
          position={[s * 0.08, -0.22, 0]}
          rotation={[0, 0, s * 0.4]}
        >
          <coneGeometry args={[0.075, 0.36, 5]} />
          <meshStandardMaterial color={dark} roughness={0.9} flatShading />
        </mesh>
      ))}
      {/* two stubby arms */}
      {[-1, 1].map((s) => (
        <mesh
          key={`arm${s}`}
          position={[s * 0.19, 0.1, 0]}
          rotation={[0, 0, s * 1.15]}
        >
          <coneGeometry args={[0.045, 0.2, 5]} />
          <meshStandardMaterial color={dark} roughness={0.9} flatShading />
        </mesh>
      ))}
      {/* glowing azure veins */}
      {veins.map(([vx, vy, len, rot], i) => (
        <mesh
          key={`v${i}`}
          position={[vx, vy, 0.16]}
          rotation={[0, 0, rot]}
          scale={[0.014, len, 0.014]}
        >
          <boxGeometry />
          <meshStandardMaterial
            color={AZURE}
            emissive={AZURE}
            emissiveIntensity={1.5}
            toneMapped={false}
          />
        </mesh>
      ))}
      {/* sprig of leaves on the crown */}
      {[-0.5, 0, 0.5].map((r, i) => (
        <mesh
          key={`leaf${i}`}
          position={[Math.sin(r) * 0.05, 0.3, Math.cos(r) * 0.05]}
          rotation={[0.3, r * 2, r]}
          scale={[0.045, 0.18, 0.02]}
        >
          <coneGeometry args={[1, 1.4, 4]} />
          <meshStandardMaterial color="#4f7a32" roughness={0.7} flatShading />
        </mesh>
      ))}
    </group>
  );
}

const KINDS = {
  bean: Bean,
  jug: Jug,
  nut: Nut,
  crystal: Crystal,
  mushroom: Mushroom,
  eyeball: Eyeball,
  berries: Berries,
  flower: Flower,
  feather: Feather,
  mandrake: Mandrake,
};

// A glass specimen jar (murky brine + wooden lid) that holds `children` inside.
// Used on the cabinet for "preserved" ingredients; clicking still drops the raw
// contents (see CabinetShelf / BrewScene), not the jar.
export function Jar({ children, tint = "#6f7a45" }) {
  return (
    <group>
      {/* glass body — depthWrite off (like the vessels) so the transparent
          jar surfaces blend over the opaque specimens instead of occluding
          them at certain angles */}
      <mesh>
        <cylinderGeometry args={[0.27, 0.25, 0.62, 16, 1, true]} />
        <meshStandardMaterial
          color="#cfe3e8"
          transparent
          opacity={0.16}
          depthWrite={false}
          roughness={0.1}
          metalness={0.1}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>
      {/* base */}
      <mesh position={[0, -0.31, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.04, 16]} />
        <meshStandardMaterial
          color="#cfe3e8"
          transparent
          opacity={0.24}
          depthWrite={false}
          roughness={0.1}
        />
      </mesh>
      {/* murky preserving brine */}
      <mesh position={[0, -0.04, 0]}>
        <cylinderGeometry args={[0.245, 0.235, 0.48, 16]} />
        <meshStandardMaterial
          color={tint}
          transparent
          opacity={0.34}
          depthWrite={false}
          roughness={0.3}
        />
      </mesh>
      {/* the specimen(s) suspended inside */}
      <group position={[0, -0.04, 0]}>{children}</group>
      {/* shoulder */}
      <mesh position={[0, 0.33, 0]}>
        <cylinderGeometry args={[0.2, 0.27, 0.08, 16, 1, true]} />
        <meshStandardMaterial
          color="#cfe3e8"
          transparent
          opacity={0.18}
          depthWrite={false}
          roughness={0.1}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>
      {/* cork-and-wood lid */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.205, 0.2, 0.07, 16]} />
        <meshStandardMaterial color="#5b3a24" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0, 0.46, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.04, 16]} />
        <meshStandardMaterial color="#6e4a2f" roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}

// One ingredient prop.
//  • autoRotate — slow spin (shelf/thumbnail use); spins faster while hovered.
//  • idle       — gentle phase-offset bob + sway so the prop feels alive at rest.
//  • hovered    — springy squash-&-stretch "pop" (drives the cabinet hover feel).
// idle/hover act on a nested inner group, so callers that animate the outer
// group (e.g. the falling-ingredient drop) are unaffected.
export default function IngredientModel({
  kind,
  color,
  scale = 1,
  autoRotate = false,
  spin = 0.6,
  idle = false,
  hovered = false,
  seed,
}) {
  const ref = useRef(); // outer — spin
  const inner = useRef(); // inner — idle bob/sway + hover pop
  const phase = useMemo(() => seed ?? Math.random() * Math.PI * 2, [seed]);
  const pop = useRef(0); // 0→1 hover amount (spring)
  const popVel = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05); // clamp keeps the spring stable on hitches
    if (autoRotate && ref.current) {
      ref.current.rotation.y += spin * dt * (hovered ? 2.4 : 1);
    }

    // under-damped spring toward the hover target → a little overshoot/bounce
    const target = hovered ? 1 : 0;
    popVel.current += (-(pop.current - target) * 90 - popVel.current * 14) * dt;
    pop.current += popVel.current * dt;

    const g = inner.current;
    if (!g) return;
    const t = state.clock.elapsedTime + phase;
    const p = pop.current;
    if (idle) {
      g.position.y = Math.sin(t * 1.3) * 0.03 + p * 0.06; // bob + hover lift
      g.rotation.z = Math.sin(t * 0.9) * 0.05; // lazy sway
      g.rotation.x = Math.sin(t * 1.1 + 1.7) * 0.03;
    } else {
      g.position.y = p * 0.06;
    }
    // squash & stretch on the pop: taller + thinner at the peak
    g.scale.set(1 - p * 0.08, 1 + p * 0.14, 1 - p * 0.08);
  });

  const Comp = KINDS[kind] ?? Crystal;
  return (
    <group ref={ref} scale={scale}>
      <group ref={inner}>
        <Comp color={color} />
      </group>
    </group>
  );
}
