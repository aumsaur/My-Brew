import React, { useMemo } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { GradientTexture } from "@react-three/drei";
import * as THREE from "three";

function ToonWater({ size = 10, waveSpeed = 0.03, waveScale = 0.1 }) {
  // 1. load a tileable water-normal map (ripple pattern)
  const normalMap = useLoader(THREE.TextureLoader, "/textures/waterNormal.png");
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;

  // 2. create a small 3-stop gradient for toon shading
  const gradientMap = useMemo(() => {
    const tex = new THREE.DataTexture(
      new Uint8Array([
        // R, G, B triplets: dark, mid, light
        20, 60, 100, 60, 160, 220, 120, 200, 255,
      ]),
      3,
      1,
      THREE.RGBFormat
    );
    tex.needsUpdate = true;
    return tex;
  }, []);

  // 3. animate the normals scrolling
  useFrame(({ clock }, delta) => {
    normalMap.offset.y = (normalMap.offset.y + waveSpeed * delta) % 1;
    normalMap.offset.x = (normalMap.offset.x + waveSpeed * delta * 0.5) % 1;
  });

  return (
    <mesh rotation-x={-Math.PI / 2}>
      <planeGeometry args={[size, size, 32, 32]} />
      <meshToonMaterial
        color="#4db6ac"
        gradientMap={gradientMap}
        normalMap={normalMap}
        normalScale={[waveScale, waveScale]}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}
