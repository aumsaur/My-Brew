import {
  siReact,
  siThreedotjs,
  siNodedotjs,
  siPython,
  siTypescript,
  siVite,
  siEslint,
  siTailwindcss,
  siGreensock,
} from "simple-icons";

// How far a crystal base sinks into the floor (so nothing ever looks floaty)
export const EMBED = 0.12;

// ── Skills ──────────────────────────────────────────────────────────────────
// shape: "geo"     = rounded solid, DROPS from above
//          form: "buckyball" | "hexasphere" | "dodeca" | "egg"
//        "cluster" = crystal chunk, GROWS up from the ground
//          type: "spire" | "fan" | "dense" | "iris" | "elestial" | "tangerine"
// Positions are scattered around a ring so drop & grow types interleave.
// years = experience, shown as Roman numerals on hover.
export const SKILLS = [
  {
    id: "react",
    label: "React",
    icon: siReact,
    color: "#61dafb",
    x: 4.4,
    z: 0.0,
    years: 4,
    shape: "geo",
    form: "hexasphere",
  },
  {
    id: "threejs",
    label: "Three.js",
    icon: siThreedotjs,
    color: "#9d4edd",
    x: 3.4,
    z: 2.8,
    years: 3,
    shape: "cluster",
    type: "elestial",
  },
  {
    id: "nodejs",
    label: "Node.js",
    icon: siNodedotjs,
    color: "#68a063",
    x: 0.8,
    z: 4.3,
    years: 5,
    shape: "geo",
    form: "egg",
  },
  {
    id: "python",
    label: "Python",
    icon: siPython,
    color: "#ffd343",
    x: -2.2,
    z: 3.8,
    years: 6,
    shape: "cluster",
    type: "tangerine",
  },
  {
    id: "ts",
    label: "TypeScript",
    icon: siTypescript,
    color: "#3178c6",
    x: -4.1,
    z: 1.5,
    years: 4,
    shape: "geo",
    form: "buckyball",
  },
  {
    id: "vite",
    label: "Vite",
    icon: siVite,
    color: "#bd34fe",
    x: -4.1,
    z: -1.5,
    years: 3,
    shape: "cluster",
    type: "iris",
  },
  {
    id: "eslint",
    label: "ESLint",
    icon: siEslint,
    color: "#4b32c3",
    x: -2.2,
    z: -3.8,
    years: 4,
    shape: "cluster",
    type: "dense",
  },
  {
    id: "css",
    label: "CSS/Tailwind",
    icon: siTailwindcss,
    color: "#c77dff",
    x: 0.8,
    z: -4.3,
    years: 5,
    shape: "geo",
    form: "dodeca",
  },
  {
    id: "gsap",
    label: "GSAP",
    icon: siGreensock,
    color: "#88ce02",
    x: 3.4,
    z: -2.8,
    years: 3,
    shape: "cluster",
    type: "spire",
  },
];

// ── Cluster arrangements ─────────────────────────────────────────────────────
// Each shard: dx/dz offset, s scale, hy height multiplier, tx/tz lean
export const ARRANGEMENTS = {
  spire: [
    { dx: 0.0, dz: 0.0, s: 1.2, hy: 1.4, tx: 0.0, tz: 0.0 },
    { dx: 0.24, dz: 0.16, s: 0.6, hy: 0.8, tx: 0.25, tz: 0.12 },
    { dx: -0.22, dz: 0.2, s: 0.55, hy: 0.75, tx: -0.2, tz: 0.22 },
  ],
  fan: [
    { dx: 0.0, dz: 0.0, s: 1.0, hy: 1.1, tx: 0.05, tz: 0.0 },
    { dx: 0.3, dz: 0.05, s: 0.8, hy: 0.95, tx: 0.1, tz: 0.28 },
    { dx: -0.28, dz: 0.1, s: 0.78, hy: 0.9, tx: 0.1, tz: -0.26 },
    { dx: 0.05, dz: 0.3, s: 0.7, hy: 0.8, tx: 0.28, tz: 0.05 },
  ],
  dense: [
    { dx: 0.0, dz: 0.0, s: 1.0, hy: 1.2, tx: 0.0, tz: 0.0 },
    { dx: 0.2, dz: 0.14, s: 0.8, hy: 0.9, tx: 0.18, tz: 0.1 },
    { dx: -0.18, dz: 0.16, s: 0.75, hy: 0.95, tx: -0.16, tz: 0.2 },
    { dx: 0.16, dz: -0.2, s: 0.66, hy: 0.7, tx: 0.12, tz: -0.18 },
    { dx: -0.2, dz: -0.16, s: 0.62, hy: 0.78, tx: -0.14, tz: -0.16 },
  ],
  // Iris — a few tall, clear, upright points fanned out (gets iridescent material)
  iris: [
    { dx: 0.0, dz: 0.0, s: 1.05, hy: 1.25, tx: 0.0, tz: 0.0 },
    { dx: 0.22, dz: 0.1, s: 0.85, hy: 1.05, tx: 0.12, tz: 0.16 },
    { dx: -0.2, dz: 0.14, s: 0.8, hy: 1.0, tx: -0.1, tz: 0.2 },
    { dx: 0.02, dz: -0.22, s: 0.7, hy: 0.85, tx: 0.18, tz: -0.12 },
  ],
  // Elestial — central mass ringed by many small skeletal terminations
  elestial: [
    { dx: 0.0, dz: 0.0, s: 1.25, hy: 1.45, tx: 0.0, tz: 0.0 },
    { dx: 0.3, dz: 0.1, s: 0.5, hy: 0.7, tx: 0.4, tz: 0.15 },
    { dx: -0.28, dz: 0.16, s: 0.45, hy: 0.65, tx: -0.35, tz: 0.25 },
    { dx: 0.12, dz: 0.32, s: 0.5, hy: 0.6, tx: 0.45, tz: -0.1 },
    { dx: -0.14, dz: -0.3, s: 0.48, hy: 0.7, tx: -0.4, tz: -0.2 },
    { dx: 0.32, dz: -0.18, s: 0.42, hy: 0.6, tx: 0.3, tz: -0.35 },
    { dx: -0.32, dz: -0.1, s: 0.46, hy: 0.68, tx: -0.3, tz: 0.35 },
    { dx: 0.04, dz: -0.34, s: 0.44, hy: 0.62, tx: 0.2, tz: -0.4 },
  ],
  // Tangerine — a chunky frosted pile (gets warm material)
  tangerine: [
    { dx: 0.0, dz: 0.0, s: 1.1, hy: 1.0, tx: 0.05, tz: 0.0 },
    { dx: 0.26, dz: 0.16, s: 0.9, hy: 0.8, tx: 0.2, tz: 0.12 },
    { dx: -0.24, dz: 0.18, s: 0.85, hy: 0.85, tx: -0.16, tz: 0.22 },
    { dx: 0.14, dz: -0.24, s: 0.75, hy: 0.7, tx: 0.14, tz: -0.2 },
    { dx: -0.18, dz: -0.2, s: 0.7, hy: 0.75, tx: -0.12, tz: -0.18 },
  ],
};

// Material treatment per cluster type
export const TREATMENTS = {
  spire: "standard",
  fan: "standard",
  dense: "standard",
  iris: "iris",
  elestial: "elestial",
  tangerine: "tangerine",
};

// ── Randomized shape assignment ───────────────────────────────────────────────
const GEO_FORMS = ["buckyball", "hexasphere", "dodeca", "egg"];
const CLUSTER_TYPES = Object.keys(ARRANGEMENTS);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Grid-occupancy scatter: carve the placement annulus into grid cells, give each
// skill one distinct cell ("its chunk"), then place it anywhere inside that cell.
// Jitter is clamped to the cell minus the crystal footprint (`pad`), so two
// neighbours can never overlap. Random cell choice + in-cell jitter keeps it
// organic instead of a rigid grid or a perfect ring.
function scatterPositions(
  n,
  { rMin = 2.4, rMax = 6.4, cell = 2.8, pad = 1.05 } = {}
) {
  const half = Math.ceil(rMax / cell);
  const cells = [];
  for (let gx = -half; gx <= half; gx++) {
    for (let gz = -half; gz <= half; gz++) {
      const cx = gx * cell,
        cz = gz * cell;
      const r = Math.hypot(cx, cz);
      if (r >= rMin && r <= rMax) cells.push([cx, cz]); // cell center in the ring
    }
  }
  // Shuffle so each skill claims a distinct, random cell
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  const jit = Math.max(0, cell / 2 - pad);
  return Array.from({ length: n }, (_, i) => {
    const c = cells[i % cells.length];
    return [
      c[0] + (Math.random() * 2 - 1) * jit,
      c[1] + (Math.random() * 2 - 1) * jit,
    ];
  });
}

// Pool-based roll: exactly round(count * chunkRatio) skills become grow-from-
// ground chunk clusters, the rest become rounded "gem" drops. Form/type and a
// scattered position are then chosen at random. (A fixed split across the pool —
// not a per-skill independent chance.) Keeps each skill's id/label/icon/color/years.
export function rollSkills(chunkRatio = 0.35) {
  const order = SKILLS.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const chunkCount = Math.round(SKILLS.length * chunkRatio);
  const chunks = new Set(order.slice(0, chunkCount));
  const pos = scatterPositions(SKILLS.length);

  return SKILLS.map((s, i) => {
    const base = { ...s, x: pos[i][0], z: pos[i][1] };
    return chunks.has(i)
      ? { ...base, shape: "cluster", type: pick(CLUSTER_TYPES) }
      : { ...base, shape: "geo", form: pick(GEO_FORMS) };
  });
}
