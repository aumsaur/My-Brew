import * as THREE from "three";
import { useMemo } from "react";

// ── Roman numerals ─────────────────────────────────────────────────────────
export function toRoman(n) {
  if (!n || n < 1) return "0";
  const table = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let out = "";
  for (const [v, sym] of table) {
    while (n >= v) {
      out += sym;
      n -= v;
    }
  }
  return out;
}

// easeOutBack — slight overshoot as shards finish growing
export function easeOutBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

// Merge geometries without importing BufferGeometryUtils
export function mergeGeometries(geos) {
  const positions = [];
  const normals = [];
  const uvs = [];
  let indexOffset = 0;
  const indices = [];

  for (const geo of geos) {
    const pos = geo.attributes.position;
    const nor = geo.attributes.normal;
    const uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      normals.push(nor.getX(i), nor.getY(i), nor.getZ(i));
      uvs.push(uv.getX(i), uv.getY(i));
    }
    if (geo.index) {
      for (let i = 0; i < geo.index.count; i++) {
        indices.push(geo.index.getX(i) + indexOffset);
      }
    }
    indexOffset += pos.count;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  merged.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  merged.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  if (indices.length) merged.setIndex(indices);
  return merged;
}

// ── Crystal shard geometry ──────────────────────────────────────────────────
// Hexagonal prism body + pyramid tip. Base sits at y=0 so the shard pivots from
// the ground (grows upward, and leans without its corner lifting off the floor).
export function useShardGeo() {
  return useMemo(() => {
    const bodyH = 0.9,
      tipH = 0.55,
      radius = 0.22;
    const body = new THREE.CylinderGeometry(radius * 0.85, radius, bodyH, 6, 1);
    const tip = new THREE.CylinderGeometry(0, radius * 0.85, tipH, 6, 1);
    tip.translate(0, (bodyH + tipH) / 2, 0);
    const merged = mergeGeometries([body, tip]);
    merged.translate(0, bodyH / 2, 0); // base -> y=0
    return merged;
  }, []);
}

// Local tip height of one shard (base at y=0), for sizing cluster labels
export const SHARD_TOP = 1.45; // bodyH(0.9) + tipH(0.55)

// ── Rounded "geode" geometry (the drop-in shapes) ────────────────────────────
// buckyball   = faceted geodesic ball (low subdivision, flat shaded)
// hexasphere  = finer geodesic ball with hex/tri facets
// dodeca      = 12-faced pentagonal solid
// egg         = tapered, vertically stretched sphere (smooth)
// Returns geometry with its base resting at y=0 and boundingBox computed so the
// caller can place the floating label exactly at the shape's true top.
export function useGeoGeo(form) {
  return useMemo(() => {
    let geo;
    if (form === "egg") {
      geo = new THREE.SphereGeometry(0.58, 28, 22);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        const taper = 1 - 0.16 * (y / 0.58); // narrower toward the top
        pos.setX(i, pos.getX(i) * taper);
        pos.setZ(i, pos.getZ(i) * taper);
        pos.setY(i, y * 1.42);
      }
      geo.computeVertexNormals();
    } else if (form === "hexasphere") {
      geo = new THREE.IcosahedronGeometry(0.64, 2);
    } else if (form === "dodeca") {
      geo = new THREE.DodecahedronGeometry(0.66, 0);
    } else {
      geo = new THREE.IcosahedronGeometry(0.62, 1); // buckyball / geode
    }
    geo.computeBoundingBox();
    geo.translate(0, -geo.boundingBox.min.y, 0); // base -> y=0
    geo.computeBoundingBox();
    return geo;
  }, [form]);
}

// ── Brand icon -> canvas texture ─────────────────────────────────────────────
// simple-icons gives a 24×24 SVG path; draw it (tinted) onto a canvas texture
// so it can sit on a 3D plane in the floating label.
export function useIconTexture(icon, color = "#ffffff") {
  return useMemo(() => {
    if (!icon || typeof document === "undefined") return null;
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    const pad = size * 0.12;
    const scale = (size - pad * 2) / 24;
    ctx.translate(pad, pad);
    ctx.scale(scale, scale);
    ctx.fillStyle = color;
    ctx.fill(new Path2D(icon.path));
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [icon, color]);
}
