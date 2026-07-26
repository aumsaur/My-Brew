import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Drop-in loader for Meshy-generated GLBs. Normalizes an arbitrarily-sized,
// arbitrarily-centered generated mesh into the same ~unit space as the hand-built
// primitive props, and re-materials it flat-shaded in the ingredient's own colour
// so a texture-free low-poly mesh reads under the moody lighting (matching the
// art direction). One GLB per `kind`; colour comes from the ingredient data.
//
// Geometry is shared across instances (clone() copies the graph, not the buffers),
// so recolouring the same kind for several ingredients is cheap. We do NOT dispose
// the mesh's original material — it belongs to drei's useGLTF cache, not to us.
const TARGET_SIZE = 0.9; // longest bounding-box dimension, in world units

const WHITE = new THREE.Color("#ffffff");
const BLACK = new THREE.Color("#000000");
// Neutral accent for "stem-like" thin parts — matches the cream the hand-built
// props already use for stems/quills/seeds regardless of the ingredient's own
// hue (e.g. Mushroom's stem is always "#efe7d0", cap is always the ingredient
// colour). Fixed rather than derived from `color` on purpose: the whole point
// is a genuinely DIFFERENT hue, not another tint of the same one.
const ACCENT = new THREE.Color("#efe7d0");

// Deterministic ~0..1 value from a 3D point that varies SMOOTHLY across
// space — same input always gives the same output, and no relation to any
// particular direction (unlike a normal), but crucially LOW frequency: a
// classic hash (large multipliers, e.g. 127.1/311.7) oscillates so fast that
// on a mesh with many small same-sized faces (a geodesic crystal blob,
// mandrake) two ADJACENT faces get essentially uncorrelated values — that
// read as literal TV static, not a tasteful colour variation. Summing a few
// low-frequency sine waves instead gives a few smooth blotchy regions, closer
// to how real uneven glaze/dye coloring actually looks.
function smoothNoise(x, y, z) {
  const n =
    Math.sin(x * 4.1 + y * 2.3) + Math.sin(y * 3.7 + z * 5.1) + Math.sin(z * 4.9 + x * 3.3);
  return n / 6 + 0.5; // ~0..1
}

// Meshy's preview mesh is untextured and we recolour it to ONE flat hue, which
// on its own reads as a featureless blob — no per-part colour variation
// survives, unlike the hand-built props (which give genuinely DIFFERENT parts
// genuinely different hues, e.g. Mushroom's cream stem vs coloured cap, not
// just a lighter/darker version of the same hue). Can't ask Meshy for that
// since we discard its colours anyway, so this fakes it from the mesh's own
// geometry. Geometry is de-indexed first so each face gets its own 3
// vertices — otherwise a shared vertex couldn't hold two different tints for
// two different adjacent faces.
//
// `twoTone` (opt-in, see MODEL_URLS/VESSEL_MODEL_URLS callers) adds a hue
// split BEFORE the shading: how close is this face to the mesh's central
// vertical axis, relative to the mesh's own XZ extent? Close-to-axis (thin,
// stem/stalk-like) leans toward the neutral ACCENT cream; far from axis (the
// main bulk) stays the ingredient's own colour — the same "stem vs cap" split
// Mushroom's hand-built version uses, derived from shape instead of authored
// by hand. Turned out NOT universal: it only reads as meaningful on shapes
// that actually HAVE a thin core + wider body (a mushroom, a berry cluster on
// a stem). On anything else (a jug, a nut, a flask) there's no real "thin
// part" for it to find, so it just paints an arbitrary cream patch nowhere in
// particular — confirmed by eye to look wrong on those, so it's opt-in now,
// enabled only where it was actually checked and confirmed to help.
//
// The per-facet light/dark shading underneath (normal-Y for a coherent
// top/bottom gradient + a low-frequency position noise so vertical-walled
// shapes like a cup still get variation even though their faces don't point
// up/down much) always applies, on top of whichever hue was picked.
function applyFacetedTint(mesh, colorHex, twoTone = false) {
  const base = new THREE.Color(colorHex);
  const light = base.clone().lerp(WHITE, 0.32);
  const dark = base.clone().lerp(BLACK, 0.4);
  const accentLight = ACCENT.clone().lerp(WHITE, 0.15);
  const accentDark = ACCENT.clone().lerp(BLACK, 0.25);

  const geo = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry;
  geo.computeVertexNormals(); // per-face normals now that vertices aren't shared
  geo.computeBoundingBox();

  const bb = geo.boundingBox;
  const sizeX = bb.max.x - bb.min.x || 1;
  const sizeY = bb.max.y - bb.min.y || 1;
  const sizeZ = bb.max.z - bb.min.z || 1;
  const axisX = (bb.min.x + bb.max.x) / 2;
  const axisZ = (bb.min.z + bb.max.z) / 2;
  const radiusXZ = Math.max(sizeX, sizeZ) / 2 || 1;

  const normal = geo.attributes.normal;
  const pos = geo.attributes.position;
  const count = pos.count;
  const colors = new Float32Array(count * 3);
  const tone = new THREE.Color();

  for (let f = 0; f < count; f += 3) {
    let ny = 0,
      cx = 0,
      cy = 0,
      cz = 0;
    for (let v = 0; v < 3; v++) {
      ny += normal.getY(f + v);
      cx += pos.getX(f + v);
      cy += pos.getY(f + v);
      cz += pos.getZ(f + v);
    }
    ny /= 3;
    cx /= 3;
    cy /= 3;
    cz /= 3;

    // optional hue split by radial distance from the vertical axis
    let faceBase = base,
      faceLight = light,
      faceDark = dark;
    if (twoTone) {
      const radial = Math.hypot(cx - axisX, cz - axisZ) / radiusXZ;
      const stemFactor = 1 - THREE.MathUtils.smoothstep(radial, 0.16, 0.5); // 1 near axis → 0 at the body
      faceBase = base.clone().lerp(ACCENT, stemFactor);
      faceLight = light.clone().lerp(accentLight, stemFactor);
      faceDark = dark.clone().lerp(accentDark, stemFactor);
    }

    // per-facet light/dark shading on top of that hue
    const nx = (cx - bb.min.x) / sizeX;
    const nyy = (cy - bb.min.y) / sizeY;
    const nz = (cz - bb.min.z) / sizeZ;
    const hSignal = (smoothNoise(nx, nyy, nz) - 0.5) * 2; // -1..1
    const t = THREE.MathUtils.clamp(ny * 0.5 + hSignal * 0.7, -1, 1);
    if (t >= 0) tone.copy(faceBase).lerp(faceLight, t);
    else tone.copy(faceBase).lerp(faceDark, -t);

    for (let v = 0; v < 3; v++) colors.set([tone.r, tone.g, tone.b], (f + v) * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  mesh.geometry = geo;
}

export default function GlbModel({ url, color = "#b0b0b0", fit = TARGET_SIZE, twoTone = false }) {
  const { scene } = useGLTF(url);

  const object = useMemo(() => {
    const inner = scene.clone(true);

    inner.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      applyFacetedTint(o, color, twoTone);
      o.material = new THREE.MeshStandardMaterial({
        color: "#ffffff", // vertex colours carry the actual tint — this must stay neutral
        vertexColors: true,
        roughness: 0.62,
        metalness: 0.06,
        flatShading: true, // faceted look via screen-space normals (no geo edit)
      });
    });

    // Recenter + uniform-scale to `fit`. Split across two nodes so the maths stay
    // decoupled: the inner offset centers the mesh, the outer wrapper scales it.
    const box = new THREE.Box3().setFromObject(inner);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    inner.position.sub(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const wrapper = new THREE.Group();
    wrapper.add(inner);
    wrapper.scale.setScalar(fit / maxDim);
    return wrapper;
  }, [scene, color, fit, twoTone]);

  return <primitive object={object} />;
}
