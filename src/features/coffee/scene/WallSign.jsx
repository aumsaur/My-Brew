import { useState } from "react";
import { Text, useCursor } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";

// THE HANGING SIGN. A couple of painted boards on twine off a hook, and the
// way you get around the room.
//
// It started as six plaques, one hung over each station, which read nicely
// and navigated badly: a sign is only clickable when it is on screen, and
// spread across two metres of wall they were never all in frame at once —
// the fridge's landed at x=1516 in a 1440-wide frame, which is nowhere. One
// hang fixes that: every direction in one place, read from wherever you
// happen to be standing.
//
// IT IS A DECORATION THAT HAPPENS TO NAVIGATE, NOT A SIGNPOST.
//
// This took three goes to get right and the first two both fixed the wrong
// end of it. The boards used to be ARROWS — a box with a wedge on the +x
// end, every one pointing right because every station is to the right —
// and the argument for that was that a row of arrows reads as a plan of the
// room. It does. That is the problem: an arrow plaque is wayfinding, the
// thing bolted to a hospital corridor or an airport concourse, and no
// amount of better hanging hardware makes one read as something you would
// decorate a café with. The silhouette does the talking. Twice I changed
// what it hung FROM (a projecting arm, then a rail) while leaving the
// arrows alone, and twice that missed.
//
// So: a plain board, a wooden frame round a painted face, hung off a single
// hook on two lengths of twine in a V, with the second board hung off the
// bottom of the first. Direction survives as a small painted chevron at the
// end of the line, which is where a café puts it anyway.
//
// WHAT IT SAYS IS THE SITE, NOT THE FURNITURE.
//
// It listed the six stations first — milk bar, espresso, roaster, grinder,
// beans, cold store — which is a map of the room and not a reason to be
// here. A shop's sign advertises what you came for. So each board is a part
// of the PORTFOLIO and the station is only where that part happens to live:
// `projects` goes to the fridge because the three groceries on its shelves
// are the projects, and the visitor never needs to know that is what a
// fridge is for until the door opens.
//
// Moving between stations is not this thing's job and does not need to be.
// The beacon points at whatever the brew wants next, and from the room view
// every station is already one click. This is for the people who came to
// look at the work rather than to make a coffee.
//
// `tilt` is the detail that sells it. A board on rope is never dead level,
// and a degree of lean is the difference between hung and bolted. It is not
// decoration on the maths either — the two cords of a pair are measured to
// the board's actual tilted corners, so the lean IS one cord running a
// couple of millimetres shorter, which is what makes a real one crooked.
const SIGNS = [
  { key: "fridge", label: "projects", tint: "#41618c", tilt: 0.013 },
  { key: "beans", label: "make a coffee", tint: "#a85d3d", tilt: -0.01 },
];
// There was a third, "the whole shop", which stepped back to the room view.
// Measured: it is unreachable. From the room you are already there, and from
// a station the sign is off screen — the same geometry that killed the
// per-station signs. Esc does that job and is always available.

// x is pinned between two walls of its own: any further right and the
// boards run into the machine, whose body reaches x -0.611 and y 1.384; any
// further left and the hang falls out of the overview frame on a narrower
// monitor. Losing the arrow wedges gave 58mm back on the right — that is
// headroom, not a reason to move.
const X = -0.88;
// AGAINST THE WALL, not floating 380mm off it.
//
// It used to hang at z=0 on an arm reaching out from the wall, which is how
// a projecting shop sign works — and a projecting sign is read edge-on from
// the street, so to read this one face-on the arm had to come straight at
// the camera. From the front that arm was a black stick going nowhere.
//
// A thing you READ from the front hangs FLAT on the wall. 18mm proud of the
// wall's face at -0.38 — enough to catch a shadow.
const WALL_Z = -0.38;
const Z = -0.362;
// The twine sits 4mm behind the boards' centre plane, i.e. INSIDE their
// 16mm thickness, so it genuinely meets the wood instead of floating behind
// it — and is hidden by the board everywhere except the gaps, which is all
// you ever see of a real one.
const ROPE_Z = -0.366;

const W = 0.34;
const H = 0.078;
// 10mm here and the second board looked glued to the first: the link cords
// existed but had nothing to cross. 38mm is enough gap for the twine to
// visibly do some work.
const GAP = 0.038;
const T = 0.016;
const PITCH = H + GAP;

// Measured, not chosen: at 1.72 the top board projected to y=5 in an
// 860-tall frame, i.e. touching the edge. The topmost hardware is now the
// hook rather than the board, so the hook takes the measured height and TOP
// is derived DOWN from it — otherwise adding the V silently pushed the
// whole hang off the top of the screen.
const HOOK_Y = 1.695;
const DROP = 0.112;
const ROPE_X = W * 0.35;
const TOP = HOOK_Y - DROP - H / 2;
const ROPE_R = 0.004;
// how far a cord runs past the board's edge, so the joint has no seam
const BITE = 0.005;

const INK = "#fbf3e4";
const WOOD = "#7d5a3c";
const TWINE = "#a98a5f";
const IRON = "#2f2823";

/** y of a board's centre. */
const rowY = (i) => TOP - i * PITCH;
/**
 * Where a cord meets a board, on the tilted board.
 * @param i    which board
 * @param sx   -1 left, +1 right
 * @param edge +1 top edge, -1 bottom edge
 */
function knot(i, sx, edge) {
  const { tilt } = SIGNS[i];
  const x = sx * ROPE_X;
  return [X + x, rowY(i) + edge * (H / 2 - BITE) + x * tilt];
}

/** A length of twine between two points in the wall plane. */
function Cord({ from, to, r = ROPE_R }) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  // a cylinder lies along +y; rotating by z maps +y to (-sin, cos), so this
  // is the angle whose axis is (dx, dy)
  return (
    <mesh
      position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, ROPE_Z]}
      rotation={[0, 0, Math.atan2(-dx, dy)]}
    >
      <cylinderGeometry args={[r, r, Math.hypot(dx, dy), 6]} />
      <meshStandardMaterial color={TWINE} roughness={0.95} />
    </mesh>
  );
}

/** A painted board in a wooden frame. Everything visible, nothing pointy. */
function Board({ tint, lit }) {
  // NOT A LIT SIGN any more. Emissive is what made these read as backlit
  // plastic chips; paint on wood does not glow. A whisper keeps the colour
  // from going muddy in the room's warm light, and hover adds just enough
  // to confirm the cursor — the outline and the 14mm push forward are what
  // actually answer "is this one live".
  const glow = lit ? 0.24 : 0.06;
  return (
    <>
      <mesh castShadow>
        <boxGeometry args={[W, H, T]} />
        <meshStandardMaterial color={WOOD} roughness={0.78} />
      </mesh>
      {/* the painted face, inset to leave an 11mm wood border. This is the
          only thing here allowed a colour, and it is what tells the two
          boards apart now that neither of them is shaped like anything. */}
      <mesh position={[0, 0, 0.0015]}>
        <boxGeometry args={[W - 0.022, H - 0.018, T]} />
        <meshStandardMaterial
          color={tint}
          emissive={tint}
          emissiveIntensity={glow}
          roughness={0.7}
        />
      </mesh>
    </>
  );
}

function Sign({ label, tint, tilt, y, active, next, onClick }) {
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);
  const lit = active || hovered;
  const face = T / 2 + 0.0015;

  return (
    /* hovering pushes it a few mm out of the wall, so the feedback is not
       only colour — the same reason the machine got steam */
    <group position={[X, y, Z + (lit ? 0.014 : 0)]} rotation={[0, 0, tilt]}>
      {/* OUTSIDE the Select, with the text, the chevron and the dot.
          Outlining the whole group outlines the invisible hit box and the
          text's bounding quad as well — two rectangles of edge hanging in
          mid-air around the sign, which is the same trap BeanBag and the
          machine's wordmark both document. Only the board gets an outline. */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[W + 0.012, H + 0.012, T]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Select enabled={hovered}>
        <Board tint={tint} lit={lit} />
      </Select>
      <Text
        position={[-0.006, 0, face + 0.002]}
        fontSize={0.026}
        letterSpacing={0.04}
        color={INK}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
      {/* the direction the arrow plaques used to carry, painted on instead
          of cut out of the board. circleGeometry's first vertex sits at
          angle 0, so three segments give a triangle pointing +x. */}
      <mesh position={[0.138, 0, face + 0.002]}>
        <circleGeometry args={[0.0105, 3]} />
        <meshStandardMaterial color={INK} roughness={0.8} />
      </mesh>
      {/* the loop's next stop: a bare bulb on the tail of the sign, where
          the eye already is because that is where the word starts */}
      {next && (
        <mesh position={[-W / 2 + 0.018, 0, face + 0.003]}>
          <circleGeometry args={[0.007, 12]} />
          <meshStandardMaterial
            color="#fff0cf"
            emissive="#ffc46a"
            emissiveIntensity={0.9}
            roughness={0.5}
          />
        </mesh>
      )}
    </group>
  );
}

/**
 * @param focused  the station the camera is at, or null
 * @param next     the station the loop wants next (flow.next), marked with a
 *                 light. The arrow in the scene marks the same one — this is
 *                 the version you can read from across the room.
 * @param onPick   (key) => void — the room's own focus toggle
 */
export default function WallSign({ focused = null, next = null, onPick }) {
  return (
    <group>
      {/* THE HOOK. A rosette screwed to the wall, a peg off it, and a ball
          on the end to stop the twine walking off — the whole reason the
          thing stays up, and the only piece of metal in the assembly. */}
      <mesh
        position={[X, HOOK_Y, WALL_Z + 0.002]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.013, 0.013, 0.006, 12]} />
        <meshStandardMaterial color={IRON} roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh
        position={[X, HOOK_Y, WALL_Z + 0.013]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[0.005, 0.005, 0.024, 10]} />
        <meshStandardMaterial color={IRON} roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[X, HOOK_Y, WALL_Z + 0.025]} castShadow>
        <sphereGeometry args={[0.0085, 12, 8]} />
        <meshStandardMaterial color={IRON} roughness={0.7} metalness={0.3} />
      </mesh>

      {/* THE V. Both cords leave the same hook and land on the top corners
          of the first board — the silhouette that says "hung" before you
          have read a word of it. */}
      {[-1, 1].map((sx) => (
        <Cord key={`v${sx}`} from={[X, HOOK_Y]} to={knot(0, sx, +1)} />
      ))}
      {/* a knot where each one lands */}
      {[-1, 1].map((sx) => {
        const [kx, ky] = knot(0, sx, +1);
        return (
          <mesh key={`k${sx}`} position={[kx, ky, ROPE_Z]}>
            <sphereGeometry args={[0.0062, 8, 6]} />
            <meshStandardMaterial color={TWINE} roughness={0.95} />
          </mesh>
        );
      })}

      {/* THE LINKS. Every board after the first hangs off the bottom
          corners of the one above it, which is how these come in sets. */}
      {SIGNS.slice(1).map((sign, n) =>
        [-1, 1].map((sx) => (
          <Cord
            key={`${sign.key}${sx}`}
            from={knot(n, sx, -1)}
            to={knot(n + 1, sx, +1)}
            r={ROPE_R * 0.9}
          />
        ))
      )}

      {SIGNS.map(({ key, label, tint, tilt }, i) => (
        <Sign
          key={key}
          label={label}
          tint={tint}
          tilt={tilt}
          y={rowY(i)}
          active={focused === key}
          next={key !== null && next === key && focused !== key}
          onClick={() => onPick?.(key)}
        />
      ))}
    </group>
  );
}
