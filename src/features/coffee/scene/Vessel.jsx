import { memo, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { CUP, useArtTexture, useIceMaterial } from "@/features/coffee/cup";
import { stackOf } from "@/features/coffee/data/drinks";

// A vessel, and whatever is banded up inside it.
//
// The bands are the pour order, bottom first, and that is the entire visual
// story of the finishing station: a latte is dark under pale because the shot
// went in first, and a latte macchiato is pale under dark because the milk
// did. No fluid simulation, no blending special case — blending them by
// default would make the two drinks look identical, which is the one thing
// they must not.
//
// But a hard cut between them was reading as two slabs of paint rather than
// as a drink. Two things fix that without giving up the mechanic: the seam
// between adjacent bands is a short GRADIENT rather than an edge, and the
// drink can be STIRRED, which is the one move that really does turn a
// layered glass into one colour. Stirring is a choice you make, so the
// layers are still there to be read until you make it.
//
// SHAPE is passed in, because there are two vessels and they are not the
// same drink: the cup (MUG) for anything hot, the tall glass (SERVE) for
// anything over ice. Everything below is written against the shape record.

// ICE IS THE ONE THING IN THE GLASS THAT IS NOT A LIQUID, and it used to be
// animated as though it were: eight cubes at fixed fractions of the bore,
// switched on one at a time as the pour ran. They appeared at the height they
// would end up at, with air under them, while a SECOND set of three cubes —
// owned by the serve station — fell from the scoop and vanished on arrival.
// Nothing that left the scoop was anything that landed in the glass.
//
// One system now, and it is the cubes themselves: a cube leaves the scoop,
// falls under gravity, bounces once or twice, and settles into the pile. The
// pile floats a little as the drink comes up around it, and swirls when the
// drink is stirred.
//
// WHY A PILE OF THREES. Ice is stacked in rings of three because three is
// what fits a cafe glass's bore without interpenetrating: at ring radius
// 0.8 x cube the neighbours sit 1.39 cube-widths apart, and the corners of
// a cube turned any which way still clear the wall.
//
// HOW MANY RINGS IS DERIVED, and the number it is derived from is the one
// the old lattice was reaching for by force: a glass is filled with ice to
// about two thirds and the drink is poured THROUGH it. Cubes that stop where
// the coffee stops look like sediment. So the pile is as many rings of three
// as SETTLE to that line — six for the tall glass, four for the cup — rather
// than eight cubes hung at fractions of it.
const RING = (Math.PI * 2) / 3;
const NO_RAYCAST = () => null;
const G = 7.5; // m/s^2, eased off 9.81: real ice falls faster than it reads
const BOUNCE = 0.28;
const REST_V = 0.11; // below this, it has landed rather than bounced

/** Deterministic -1..1 from an integer, so the ice never reshuffles. */
const jitter = (i) => {
  const v = Math.sin(i * 12.9898) * 43758.5453;
  return (v - Math.floor(v)) * 2 - 1;
};

/** Where every cube ends up, and how tall the heap is once it is all there. */
function packing(shape) {
  const cube = shape.cube;
  const step = cube * 0.85; // rings interlock rather than stack square
  const r = Math.min(shape.rInner - cube * 0.78, cube * 0.8);
  const base = shape.floor + cube * 0.55;
  const want = shape.floor + shape.fill * 0.66; // the ice line, see above
  const rings = Math.max(2, Math.round((want - base - cube * 0.5) / step) + 1);
  const slots = [];
  for (let i = 0; i < rings * 3; i++) {
    const ring = Math.floor(i / 3);
    slots.push({
      r,
      // each ring turned off the one below it, so the cubes above drop into
      // the gaps instead of sitting on each other's shoulders
      a: ring * 0.7 + (i % 3) * RING,
      y: base + ring * step,
      ring,
      // this cube's share of the heap's stretch when it floats — see the
      // buoyancy note in <Ice>
      rise: rings > 1 ? ring / (rings - 1) : 1,
    });
  }
  return { slots, top: base + (rings - 1) * step + cube * 0.5 };
}

/**
 * The ice, simulated rather than placed.
 *
 * MEMOISED, and everything below the first render is done through refs, for
 * the reason the old lattice comment gave: Contents re-renders every frame a
 * pour is running. A cube's position cannot be a prop or it restarts each
 * frame, and the mesh list cannot be sliced to the live count or the meshes
 * remount each frame. Fixed meshes, state in a ref, visibility in the loop.
 *
 * @param poured  how far through the ice pour, 0..1 -- how many cubes have
 *                left the scoop is this times the heap
 * @param surface the drink's surface, cup-local metres
 * @param drop    ref to where the scoop's mouth is, cup-local; cubes are born
 *                there, which is the whole point — see the note at the top
 * @param mixed   how far through a stir, 0..1; its RATE is what swirls them
 */
const Ice = memo(function Ice({
  shape,
  poured,
  surface,
  drop,
  mixed,
  material,
}) {
  const { slots, top } = useMemo(() => packing(shape), [shape]);
  const cube = shape.cube;
  const geom = useMemo(() => new THREE.BoxGeometry(cube, cube, cube), [cube]);
  // AIRBORNE ICE IS DEPTH-TESTED, ice in the drink is not. The material in
  // the glass has to draw through the opaque bands or it is not in the drink
  // at all; a cube still in the air over the bar, drawn through everything,
  // is just a sticker.
  const air = useMemo(() => {
    const m = material.clone();
    m.depthTest = true;
    m.opacity = 0.8;
    return m;
  }, [material]);

  const meshes = useRef([]);
  const cubes = useRef([]);
  const swirl = useRef(0);
  const spin = useRef(0);
  const lift = useRef(0);
  const wasMixed = useRef(0);
  const out = useRef(0); // cubes released so far, which trails `want`
  const since = useRef(0);
  // props the loop reads, mirrored so it always has this frame's value
  const now = useRef({ poured, surface, mixed });
  now.current = { poured, surface, mixed };

  useFrame((state, delta) => {
    // CAPPED, NOT CLAMPED. A cap of 1/30 sounds prudent and is not: on a
    // machine drawing 10fps every frame is over it, so gravity runs at a
    // third speed and the ice drifts down like snow. The step is capped at
    // 100ms against a tab coming back from the background, and anything
    // under that is spent in full — in slices, so the integration stays
    // stable when a frame is long.
    const dt = Math.min(delta, 0.1);
    const t = state.clock.elapsedTime;
    const { poured: done, surface: fluid, mixed: mix } = now.current;
    const want = Math.round(slots.length * THREE.MathUtils.clamp(done, 0, 1));

    // RELEASED ON A CLOCK, not on the pour's progress directly. `poured` is
    // read at React's cadence, and when that stutters the heap arrives in one
    // lump: measured at 10fps it went from nothing to thirteen cubes between
    // two frames. The pour decides how many are due, this decides when they
    // leave, so the cascade looks the same however the app is running.
    since.current += dt;
    if (out.current > want) out.current = want; // a new drink; start over
    // as many as are DUE, not one per frame: at 3fps one-per-frame stretched
    // an 18-cube pour over seven seconds and the drink was finished before
    // the ice arrived
    while (out.current < want && since.current >= 0.03) {
      since.current -= 0.03;
      out.current += 1;
    }
    if (out.current >= want) since.current = 0;

    // A STIR SWIRLS THE ICE, and what says a stir is running is the stir
    // MOVING: `mixed` sits at 1 afterwards, so its value cannot tell a drink
    // being stirred from one that has been.
    const stirring = mix > wasMixed.current + 1e-4;
    wasMixed.current = mix;
    spin.current = THREE.MathUtils.damp(
      spin.current,
      stirring ? 5.5 : 0,
      stirring ? 7 : 1.4,
      dt
    );
    swirl.current += spin.current * dt;

    // BUOYANCY, AND THE HEAP STRETCHES RATHER THAN RISING.
    //
    // Both of the obvious readings are wrong. Leave the heap where it settled
    // and a full glass is ice sitting on the bottom with clear milk over it,
    // which is not ice, it is gravel. Float the heap as one rigid body and it
    // rides up to the surface and leaves a band of clear drink UNDERNEATH,
    // which is just as wrong the other way up.
    //
    // A loose pile of floating ice does neither: it comes apart. The top of
    // it reaches the surface, the bottom stays on the floor of the glass, and
    // the rings in between space out — so the drink is poured through the ice
    // rather than around it, which is the reading the old fixed lattice was
    // reaching for by placing cubes at fractions of the level.
    lift.current = THREE.MathUtils.damp(
      lift.current,
      Math.max(0, fluid - top),
      3,
      dt
    );

    for (let i = 0; i < slots.length; i++) {
      const mesh = meshes.current[i];
      if (!mesh) continue;
      const c = (cubes.current[i] ??= { live: false });
      if (i >= out.current) {
        // the drink was cleared: forget everything, so the next glass does
        // not open with the last one's ice already floating in it
        c.live = false;
        mesh.visible = false;
        continue;
      }
      if (!c.live) {
        const from = drop?.current;
        c.live = true;
        c.falling = true;
        c.x = (from?.x ?? 0) + jitter(i) * 0.004;
        c.z = (from?.z ?? 0) + jitter(i + 31) * 0.004;
        c.y = from?.y ?? shape.top + 0.06;
        c.vy = -0.05 - Math.abs(jitter(i + 7)) * 0.06;
        c.rx = jitter(i) * 3;
        c.ry = jitter(i + 11) * 3;
        c.rz = jitter(i + 17) * 3;
        c.wx = jitter(i + 3) * 7;
        c.wy = jitter(i + 13) * 7;
        c.wz = jitter(i + 23) * 7;
      }

      const slot = slots[i];
      // the whole heap turns as one, the top rings a touch faster — a stir
      // drags the surface round harder than it does the bottom
      const a = slot.a + swirl.current * (0.6 + slot.ring * 0.1);
      const sx = Math.cos(a) * slot.r;
      const sz = Math.sin(a) * slot.r;
      // the stretch, shared out by ring: none at the bottom, all of it at
      // the top. `slot.rise` is 0..1 up the heap.
      const rest = slot.y + lift.current * slot.rise;

      if (c.falling) {
        // SLICED. A 100ms frame integrated in one go steps a cube 130mm --
        // most of the glass -- and it lands through the bottom of the heap
        // rather than on it. Twenty-millisecond slices keep the arc and the
        // bounce honest whatever the frame rate.
        let rem = dt;
        while (rem > 1e-5 && c.falling) {
          const h = Math.min(rem, 0.02);
          rem -= h;
          c.vy -= G * h;
          c.y += c.vy * h;
          if (c.y <= rest) {
            c.y = rest;
            c.vy = -c.vy * BOUNCE;
            if (c.vy < REST_V) {
              c.vy = 0;
              c.falling = false;
            }
          }
        }
        c.x = THREE.MathUtils.damp(c.x, sx, 7, dt);
        c.z = THREE.MathUtils.damp(c.z, sz, 7, dt);
      } else {
        // landed: it follows its slot rather than integrating, so a heap
        // riding a rising drink stays a heap
        c.y = THREE.MathUtils.damp(c.y, rest, 6, dt);
        c.x = THREE.MathUtils.damp(c.x, sx, 8, dt);
        c.z = THREE.MathUtils.damp(c.z, sz, 8, dt);
        const k = Math.exp(-dt * 4);
        c.wx *= k;
        c.wy = c.wy * k + spin.current * 0.8 * dt;
        c.wz *= k;
      }
      c.rx += c.wx * dt;
      c.ry += c.wy * dt;
      c.rz += c.wz * dt;

      const wet = fluid > c.y;
      mesh.position.set(
        c.x,
        c.y + (wet && !c.falling ? Math.sin(t * 2.3 + i) * cube * 0.035 : 0),
        c.z
      );
      mesh.rotation.set(c.rx, c.ry, c.rz);
      mesh.material = c.falling ? air : material;
      mesh.visible = true;
    }
  });

  return slots.map((_, i) => (
    <mesh
      key={i}
      ref={(m) => {
        meshes.current[i] = m;
      }}
      geometry={geom}
      material={material}
      renderOrder={3}
      visible={false}
      raycast={NO_RAYCAST}
    />
  ));
});

// Slices across each seam. Eight is enough to read as a gradient at this
// size and cheap enough to recolour every frame while a stir is running.
const BLEND = 8;
const BLEND_MAX = 0.016; // metres; a seam, not a third band

// COLOUR MATHS IN sRGB, deliberately, and not with THREE.Color.
//
// THREE.Color converts to linear on the way in, so .lerp() interpolates in
// LINEAR light — physically right for mixing photons, wrong for everything
// here. Measured down the seam it put the espresso/milk ramp at 84, 161,
// 199: eight even steps landing as two, because linear space races to the
// bright end. It also made a stirred latte come out at 202 — near white —
// since the milk's linear value swamps the shot's.
//
// Mixing bytes is what a painter would expect and what the eye reads as
// halfway: the same ramp becomes an even 84 → 199, and a stirred latte
// lands on a tan instead of on cream.
const rgb = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const hex = (c) =>
  "#" +
  c
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, "0")
    )
    .join("");
const mixRgb = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/**
 * Stacked bands from an ordered pour list, plus the things that are not
 * bands: ice, which is cubes through the drink, and latte art, which is a
 * decal on the surface.
 *
 * `pouring` is the kind CURRENTLY being poured, and it is not in `pours` yet —
 * the flow only commits a pour when its animation lands. Contents therefore
 * has to append it itself and grow it with `rising`. Reading `pours` alone
 * meant no band ever grew: the level jumped from empty to full on the single
 * frame the stream switched off, which is exactly what a pour must not look
 * like.
 *
 * `mixed` is 0..1 — how far through a stir. At 1 every band has been pulled
 * to the volume-weighted average of the whole drink, so the boundaries do not
 * need hiding: they are gone because the colours either side are equal.
 */
export function Contents({
  pours = [],
  rising = 1,
  pouring = null,
  mixed = 0,
  shape = CUP,
  drop = null,
  // PER-KIND COLOUR OVERRIDES. Every pour but one is a fixed colour; the
  // espresso is the colour of the bean that was roasted, so the station
  // that knows the roast hands it in rather than this file guessing.
  inks = null,
}) {
  const art = useArtTexture();
  // Cubes sit INSIDE opaque bands, so they have to be drawn THROUGH them:
  // ice hidden behind the coffee it is chilling is just not in the glass.
  // depthTest off and an explicit order is what puts it back — and the art
  // has to come one step later again, or the ice covers the heart.
  const wellIce = useIceMaterial();
  const iceMat = useMemo(() => {
    const m = wellIce.clone();
    m.depthTest = false;
    m.opacity = 0.55;
    return m;
  }, [wellIce]);

  const list = useMemo(
    () => (pouring && !pours.includes(pouring) ? [...pours, pouring] : pours),
    [pours, pouring]
  );
  const bands = useMemo(() => {
    const out = stackOf(list);
    return inks
      ? out.map((b) => (inks[b.kind] ? { ...b, colour: inks[b.kind] } : b))
      : out;
  }, [list, inks]);

  const grow = THREE.MathUtils.clamp(rising, 0, 1);
  const mix = THREE.MathUtils.clamp(mixed, 0, 1);

  // only the last band grows, and only while it is the one being poured
  const growingAt =
    pouring && bands.length && bands[bands.length - 1].kind === pouring
      ? bands.length - 1
      : -1;

  // What a stir pulls everything towards: the whole drink averaged by volume,
  // which is what it would actually be if you mixed it.
  const average = useMemo(() => {
    if (!bands.length) return [0, 0, 0];
    let vol = 0;
    const acc = [0, 0, 0];
    for (const band of bands) {
      const c = rgb(band.colour);
      acc[0] += c[0] * band.h;
      acc[1] += c[1] * band.h;
      acc[2] += c[2] * band.h;
      vol += band.h;
    }
    return acc.map((v) => v / vol);
  }, [bands]);

  /** A band's colour, pulled towards the average by however stirred it is. */
  const shade = (c) => (mix <= 0 ? hex(c) : hex(mixRgb(c, average, mix)));
  /** Part way across a seam, then pulled towards the average as well. */
  const seam = (from, to, t) => shade(mixRgb(from, to, t));

  const last = bands[bands.length - 1];
  const fill = last ? last.y + last.h * (growingAt >= 0 ? grow : 1) : 0;
  const surface = shape.floor + fill * shape.fill;

  // Where two bands meet, in metres, with the colour either side. The bottom
  // of band i+1 IS the top of band i, so there is one seam per adjacent pair
  // — and none above a band that is still growing, because its top is the
  // surface, not a boundary.
  const seams = [];
  for (let i = 1; i < bands.length; i++) {
    const upper = bands[i];
    const drawn = i === growingAt ? upper.h * grow : upper.h;
    if (drawn < 0.02) continue; // nothing above it yet — no seam to soften
    const h = Math.min(
      BLEND_MAX,
      bands[i - 1].h * shape.fill * 0.6,
      drawn * shape.fill * 0.6
    );
    if (h < 0.001) continue;
    seams.push({
      y: shape.floor + upper.y * shape.fill,
      h,
      from: rgb(bands[i - 1].colour),
      to: rgb(upper.colour),
    });
  }

  // The ice is its own thing entirely — see <Ice>. All this end has to say
  // is whether there is any and how much of it has come out of the scoop.
  const iced = list.includes("ice");
  const iceGrow = pouring === "ice" ? grow : 1;

  // Textured milk poured LAST. Fades in over the end of that pour, so the
  // pattern arrives as the surface settles rather than snapping on — and a
  // stir takes it straight back off again, which is exactly what stirring a
  // heart does.
  const artOn = list[list.length - 1] === "milk-steamed";
  const artScale =
    (artOn && pouring === "milk-steamed"
      ? THREE.MathUtils.smoothstep(grow, 0.72, 1)
      : artOn
        ? 1
        : 0) *
    (1 - mix);

  return (
    <>
      {bands.map((b, i) => {
        const g = i === growingAt ? grow : 1;
        const hgt = b.h * shape.fill * g;
        if (hgt < 0.0008) return null;
        return (
          <mesh
            key={`${b.kind}-${i}`}
            position={[0, shape.floor + b.y * shape.fill + hgt / 2, 0]}
          >
            <cylinderGeometry
              args={[shape.rInner * 0.97, shape.rInner * 0.95, hgt, 16]}
            />
            <meshStandardMaterial
              color={shade(rgb(b.colour))}
              roughness={0.62}
              envMapIntensity={0.25}
            />
          </mesh>
        );
      })}

      {/* The seams. Drawn a hair WIDER than the bands so they cover the cut
          instead of sitting behind it — from outside the glass, which is the
          only side anyone sees it from, wider means in front. */}
      {seams.map((s, j) =>
        Array.from({ length: BLEND }, (_, i) => (
          <mesh
            key={`seam${j}-${i}`}
            position={[0, s.y - s.h / 2 + (s.h * (i + 0.5)) / BLEND, 0]}
          >
            <cylinderGeometry
              args={[
                shape.rInner * 0.98,
                shape.rInner * 0.98,
                s.h / BLEND + 0.0004,
                16,
              ]}
            />
            <meshStandardMaterial
              color={seam(s.from, s.to, (i + 0.5) / BLEND)}
              roughness={0.62}
              envMapIntensity={0.25}
            />
          </mesh>
        ))
      )}

      {iced && (
        <Ice
          shape={shape}
          poured={iceGrow}
          surface={surface}
          drop={drop}
          mixed={mix}
          material={iceMat}
        />
      )}

      {artScale > 0.01 && (
        <mesh
          position={[0, surface + 0.0012, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={artScale}
          renderOrder={4}
        >
          <planeGeometry args={[shape.rInner * 1.75, shape.rInner * 1.75]} />
          <meshBasicMaterial
            map={art}
            transparent
            opacity={0.94}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
    </>
  );
}

/** The vessel itself — foot, inside floor, open wall, and a handle if it is
    the kind of vessel that has one. The tall glass is not. */
/** A vessel that is a MODEL rather than a stack of primitives. Its own
    component so the GLB hook is not called conditionally. */
function ModelledCup({ file }) {
  const { nodes, materials } = useGLTF(
    `${import.meta.env.BASE_URL}models/${file}`
  );
  return (
    <>
      <mesh
        geometry={nodes.Cup_Body.geometry}
        material={materials.m_paper}
        castShadow
      />
      <mesh geometry={nodes.Cup_Rim.geometry} material={materials.m_paper} />
      <mesh
        geometry={nodes.Cup_Band.geometry}
        material={materials.m_paper_band}
      />
    </>
  );
}

export function CupBody({ material, rim = null, shape = CUP }) {
  if (shape.model) return <ModelledCup file={shape.model} />;
  return (
    <>
      <mesh position={[0, shape.baseH / 2, 0]} material={material} castShadow>
        <cylinderGeometry
          args={[shape.baseR, shape.baseR * 0.92, shape.baseH, 16]}
        />
      </mesh>
      {/* the foot is narrower than the bore, so without this the cup is a
          tube with a hole in it and the drink floats */}
      <mesh
        position={[0, shape.baseH + shape.floorH / 2, 0]}
        material={material}
      >
        <cylinderGeometry
          args={[shape.rInner, shape.baseR, shape.floorH, 16]}
        />
      </mesh>
      <mesh
        position={[0, shape.baseH + shape.h / 2, 0]}
        material={material}
        castShadow
      >
        <cylinderGeometry
          args={[shape.r, shape.rInner, shape.h, 16, 1, true]}
        />
      </mesh>
      {/* The lip, which is the whole of how a glass is seen — see
          useGlassRimMaterial. */}
      {shape.rim && rim && (
        <mesh
          position={[0, shape.baseH + shape.h, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={rim}
        >
          <torusGeometry args={[shape.r, 0.0013, 6, 24]} />
        </mesh>
      )}
      {/* A half torus, so BOTH open ends land on the wall at radius r. The
          old 1.25π arc put one flat end at radius 0.039, inside the bore —
          it came through the rim as a notch chipped out of the cup. */}
      {shape.handle && (
        <mesh
          position={[shape.r, shape.baseH + shape.h * 0.52, 0]}
          rotation={[0, 0, -Math.PI / 2]}
          material={material}
          castShadow
        >
          <torusGeometry args={[shape.r * 0.5, 0.005, 6, 12, Math.PI]} />
        </mesh>
      )}
    </>
  );
}
