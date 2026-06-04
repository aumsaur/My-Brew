// Procedural low-poly apothecary cabinet (stands in for the Meshy mesh). Local
// origin sits at the centre of the base: +y is up, the open front faces +Z.
// A 3×3 grid of open cubbies (recessed shadowbox back) holds the ingredient
// models; a closed two-door section sits below, with a plinth, a framed grid
// and a gabled pediment crown. Wood is flat-shaded with slight tone variation
// to fit the low-poly art direction.
// Grid/cubby layout lives in @/features/brew/data/cabinet (shared with CabinetShelf).

import {
  CABINET,
  ROW_BOTTOMS,
  GRID_TOP,
  ROW_COLS,
} from "@/features/brew/data/cabinet";

const WOOD = "#5b3a24"; // main carcass
const WOOD_D = "#3a2416"; // shadowed / back boards
const WOOD_L = "#6e4a2f"; // highlights / pediment
const TRIM = "#6b4a2e"; // posts, crown, frame
const BACK = "#43301c"; // warm cubby backing (faint glow so items read)
const BRASS = "#caa15a";

function Plank({ args, position, rotation, color = WOOD }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.85} flatShading />
    </mesh>
  );
}

function Knob({ position }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.055, 10, 10]} />
      <meshStandardMaterial
        color={BRASS}
        metalness={0.55}
        roughness={0.35}
        emissive={BRASS}
        emissiveIntensity={0.15}
      />
    </mesh>
  );
}

// A lower door: a recessed inset panel framed by a proud border, plus a knob.
function Door({ x, w, h, y, z, knobX }) {
  return (
    <group position={[x, y, z]}>
      {/* door slab */}
      <Plank args={[w, h, 0.04]} color={WOOD} />
      {/* raised border frame (slightly proud of the slab) */}
      <Plank
        args={[w - 0.06, h - 0.06, 0.05]}
        position={[0, 0, 0.005]}
        color={WOOD_D}
      />
      {/* inset centre panel */}
      <Plank
        args={[w - 0.18, h - 0.18, 0.06]}
        position={[0, 0, 0.01]}
        color={WOOD_L}
      />
      <Knob position={[knobX, 0, 0.08]} />
    </group>
  );
}

export default function CabinetModel() {
  const { W, H, D } = CABINET;
  const innerW = W - 0.4;
  const boards = [...ROW_BOTTOMS, GRID_TOP]; // 4 boards → 3 rows
  const gridMid = (ROW_BOTTOMS[0] + GRID_TOP) / 2;
  const gridH = GRID_TOP - ROW_BOTTOMS[0];
  const frontZ = D / 2 - 0.04; // proud frame plane
  const lowerH = ROW_BOTTOMS[0] - 0.3; // closed section height (plinth → grid)
  const lowerMid = 0.3 + lowerH / 2;

  return (
    <group>
      {/* back panel */}
      <Plank
        args={[W - 0.1, H - 0.2, 0.06]}
        position={[0, H / 2, -D / 2 + 0.03]}
        color={WOOD_D}
      />

      {/* warm recessed backing behind the cubby grid — faint glow so dark
          ingredients still read against it (kept below the bloom threshold) */}
      <mesh position={[0, gridMid, -D / 2 + 0.09]}>
        <boxGeometry args={[innerW - 0.02, gridH, 0.02]} />
        <meshStandardMaterial
          color={BACK}
          emissive={BACK}
          emissiveIntensity={0.22}
          roughness={0.9}
          flatShading
        />
      </mesh>

      {/* side posts */}
      <Plank
        args={[0.24, H, D]}
        position={[-(W / 2 - 0.12), H / 2, 0]}
        color={TRIM}
      />
      <Plank
        args={[0.24, H, D]}
        position={[W / 2 - 0.12, H / 2, 0]}
        color={TRIM}
      />

      {/* plinth / base */}
      <Plank
        args={[W + 0.12, 0.3, D + 0.12]}
        position={[0, 0.15, 0]}
        color={TRIM}
      />

      {/* crown shelf + gabled pediment with a finial */}
      <Plank
        args={[W + 0.2, 0.2, D + 0.14]}
        position={[0, H - 0.1, 0]}
        color={TRIM}
      />
      <Plank
        args={[W - 0.1, 0.14, D + 0.05]}
        position={[0, H + 0.05, 0]}
        color={WOOD}
      />
      <Plank
        args={[W * 0.6, 0.12, D * 0.7]}
        position={[-W * 0.23, H + 0.2, 0]}
        rotation={[0, 0, 0.46]}
        color={WOOD_L}
      />
      <Plank
        args={[W * 0.6, 0.12, D * 0.7]}
        position={[W * 0.23, H + 0.2, 0]}
        rotation={[0, 0, -0.46]}
        color={WOOD_L}
      />
      <mesh position={[0, H + 0.5, 0]}>
        <sphereGeometry args={[0.08, 10, 10]} />
        <meshStandardMaterial
          color={BRASS}
          metalness={0.5}
          roughness={0.4}
          emissive={BRASS}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* grid shelves (horizontal boards) */}
      {boards.map((y, i) => (
        <Plank
          key={`b${i}`}
          args={[innerW, 0.06, D - 0.1]}
          position={[0, y, 0.02]}
        />
      ))}
      {/* per-row vertical dividers (column count varies row to row: 4/3/3) */}
      {ROW_BOTTOMS.map((yb, r) => {
        const n = ROW_COLS[r];
        const cell = innerW / n;
        const rowMid = yb + 0.4;
        return Array.from({ length: n - 1 }, (_, i) => (
          <Plank
            key={`d${r}-${i}`}
            args={[0.06, 0.74, D - 0.1]}
            position={[-innerW / 2 + cell * (i + 1), rowMid, 0.02]}
          />
        ));
      })}

      {/* proud frame moulding around the cubby grid (top/bottom rails + stiles) */}
      <Plank
        args={[innerW + 0.04, 0.07, 0.05]}
        position={[0, GRID_TOP + 0.02, frontZ]}
        color={TRIM}
      />
      <Plank
        args={[innerW + 0.04, 0.07, 0.05]}
        position={[0, ROW_BOTTOMS[0] - 0.02, frontZ]}
        color={TRIM}
      />
      <Plank
        args={[0.07, gridH + 0.1, 0.05]}
        position={[-(innerW / 2), gridMid, frontZ]}
        color={TRIM}
      />
      <Plank
        args={[0.07, gridH + 0.1, 0.05]}
        position={[innerW / 2, gridMid, frontZ]}
        color={TRIM}
      />

      {/* lower closed section with two framed doors */}
      <Plank
        args={[innerW, lowerH, 0.05]}
        position={[0, lowerMid, -D / 2 + 0.1]}
        color={WOOD_D}
      />
      <Door
        x={-(innerW / 4)}
        w={innerW / 2 - 0.04}
        h={lowerH - 0.06}
        y={lowerMid}
        z={D / 2 - 0.06}
        knobX={innerW / 4 - 0.12}
      />
      <Door
        x={innerW / 4}
        w={innerW / 2 - 0.04}
        h={lowerH - 0.06}
        y={lowerMid}
        z={D / 2 - 0.06}
        knobX={-(innerW / 4) + 0.12}
      />
    </group>
  );
}
