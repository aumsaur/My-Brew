import * as THREE from "three";
import Cauldron from "@/components/Cauldron";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import {
  Environment,
  OrbitControls,
  PerspectiveCamera,
  useHelper,
} from "@react-three/drei";
import { BlendFunction } from "postprocessing";
import { useControls, folder } from "leva";
import { Suspense, useRef, useEffect } from "react";

function Lights() {
  const spotRef = useRef(null);

  // 🔍 uncomment this so you can see the cone
  useHelper(spotRef, THREE.SpotLightHelper, /* size */ 1, /* color */ "yellow");

  useFrame(({ clock }) => {
    if (!spotRef.current) return;

    const t = clock.getElapsedTime();

    const flicker = Math.sin(t * 2) * 1.5;

    spotRef.current.intensity = 1.5 + flicker;
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <spotLight
        ref={spotRef}
        position={[0, 5, 0]}
        angle={Math.PI / 6}
        penumbra={0.3}
        distance={20}
        decay={0}
        intensity={1.5}
        color="#ffffff"
        castShadow
      />
      {/* <spotLight
        position={[0, 2, 0]}
        intensity={1.5}
        color="#9d4edd"
        angle={Math.PI / 6}
        distance={5}
        decay={2}
        castShadow
      /> */}
      <pointLight
        position={[2, 1, 1]}
        intensity={0.8}
        color="#3a0ca3"
        distance={5}
        decay={2}
      />
    </>
  );
}

function Camera() {
  return (
    <>
      <PerspectiveCamera makeDefault fov={45} position={[1, 0, 0]} />
      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={10}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

// Main component that sets up the scene
const Experience = () => {
  return (
    <Canvas shadows>
      <fog attach="fog" args={["#12071f", 5, 20]} />
      <color attach="background" args={["#12071f"]} />

      <Suspense fallback={null}>
        <Environment preset="night" />
        {/* Ambient lighting */}
        {/* <ambientLight intensity={0.4} /> */}

        {/* Main directional light with shadows */}
        <Lights />

        {/* Accent lights for the magical effect */}
        {/* <pointLight position={[0, 2, 0]} color="#9d4edd" intensity={0.5} />
        <pointLight position={[-3, 1, -3]} color="#3a0ca3" intensity={0.7} /> */}

        {/* Cauldron and steam */}
        <group position={[0, 0.25, 0]}>
          <Cauldron />
        </group>

        {/* Ground/floor plane */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -2.25, 0]}
          receiveShadow>
          <planeGeometry args={[20, 20]} />
          <meshStandardMaterial color="#1f1135" />
        </mesh>

        <EffectComposer>
          <Bloom
            luminanceThreshold={1}
            luminanceSmoothing={0.8}
            intensity={1}
            mipmapBlur={true}
            blendFunction={BlendFunction.SCREEN}
          />
        </EffectComposer>
        {/* Controls for interactivity */}
        <Camera />
      </Suspense>
    </Canvas>
  );
};

export default Experience;
