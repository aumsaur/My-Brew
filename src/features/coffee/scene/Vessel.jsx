import { useMemo } from "react";
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

// Cube placements, as fractions of the bore and of the ice column. Fixed
// rather than random so the ice does not reshuffle itself every frame the
// component re-renders — which, during a pour, is every frame. Eight of them,
// stacked the whole way up: a cafe glass is ice with coffee poured through it,
// not a drink with a few cubes floating on top.
const CUBES = [
  [0.72, 0.02, -0.46, 0.7],
  [-0.68, 0.15, 0.4, 0.5],
  [0.08, 0.28, 0.8, 1.1],
  [0.76, 0.4, 0.26, 1.9],
  [-0.48, 0.52, -0.6, 0.3],
  [0.2, 0.64, -0.28, 0.9],
  [-0.8, 0.77, 0.1, 2.3],
  [0.12, 0.9, 0.48, 1.4],
];

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
  const bands = useMemo(() => stackOf(list), [list]);

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

  // Ice fills the glass and the drink is poured THROUGH it — so the column is
  // the taller of the drink and two thirds of the glass, not half the drink.
  // Cubes that stop where the coffee stops look like sediment.
  const iced = list.includes("ice");
  const iceGrow = pouring === "ice" ? grow : 1;
  const iceTop = Math.max(surface, shape.floor + shape.fill * 0.66);
  const cubes = iced ? Math.round(CUBES.length * iceGrow) : 0;
  const cube = shape.cube;

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

      {CUBES.slice(0, cubes).map(([ux, uy, uz, spin], i) => (
        <mesh
          key={`ice${i}`}
          material={iceMat}
          renderOrder={3}
          position={[
            ux * (shape.rInner - cube * 0.62),
            shape.floor + cube * 0.6 + uy * 0.9 * (iceTop - shape.floor),
            uz * (shape.rInner - cube * 0.62),
          ]}
          rotation={[spin, spin * 1.7, spin * 0.6]}
        >
          <boxGeometry args={[cube, cube, cube]} />
        </mesh>
      ))}

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
export function CupBody({ material, rim = null, shape = CUP }) {
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
