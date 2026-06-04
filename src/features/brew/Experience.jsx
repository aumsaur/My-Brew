import * as THREE from "three";
import Cauldron from "@/features/brew/scene/Cauldron";
import BrewScene from "@/features/brew/scene/BrewScene";
import CabinetShelf from "@/features/brew/scene/CabinetShelf";
import WitchNook from "@/features/brew/scene/WitchNook";
import Hotspots from "@/features/brew/scene/Hotspots";
import { useBrew } from "@/features/brew/store";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  EffectComposer,
  Bloom,
  Selection,
  Outline,
} from "@react-three/postprocessing";
import { Environment } from "@react-three/drei";
import { BlendFunction } from "postprocessing";
import { Suspense, useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

// Camera path: approaches → hits liquid surface → plunges below → fade takes over
const PATH = [
  { p: 0, pos: [4, 0, 0], look: [0, 0, 0] }, // OrbitControls snapped start
  { p: 0.2, pos: [2, 3, 3], look: [0, 0.3, 0] }, // approaching, looking down at cauldron
  { p: 0.35, pos: [0, 2, 0.5], look: [0, 0.3, 0] }, // hovering above opening, looking into it
  { p: 0.4, pos: [0, 0.5, 0.1], look: [0, -0.3, 0] }, // at liquid surface — gaze tilts down into liquid
  { p: 0.5, pos: [0, -0.7, 0], look: [0, -1.5, 0] }, // fully submerged — looking down into the deep
];

// Reusable vectors — never allocate in the render loop
const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();

function lerpPath(progress) {
  if (progress <= 0) return PATH[0];
  if (progress >= 1) return PATH[PATH.length - 1];
  for (let i = 0; i < PATH.length - 1; i++) {
    const a = PATH[i],
      b = PATH[i + 1];
    if (progress >= a.p && progress <= b.p) {
      const t = (progress - a.p) / (b.p - a.p);
      const ease = t * t * (3 - 2 * t); // smoothstep
      return {
        pos: a.pos.map((v, j) => v + (b.pos[j] - v) * ease),
        look: a.look.map((v, j) => v + (b.look[j] - v) * ease),
      };
    }
  }
}

function CameraRig() {
  const { camera } = useThree();
  const progress = useRef(0);
  const camPos = useRef(new THREE.Vector3(...PATH[0].pos));
  const camLook = useRef(new THREE.Vector3(...PATH[0].look));

  useEffect(() => {
    camera.position.set(...PATH[0].pos);
    camera.fov = 45;
    camera.updateProjectionMatrix();

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          progress.current = self.progress;
        },
      });
    });

    return () => ctx.revert();
  }, [camera]);

  useFrame(() => {
    const state = lerpPath(progress.current);
    if (!state) return;

    _pos.set(...state.pos);
    _look.set(...state.look);

    camPos.current.lerp(_pos, 0.1);
    camLook.current.lerp(_look, 0.1);

    camera.position.copy(camPos.current);
    camera.lookAt(camLook.current);
  });

  return null;
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 2, 0]} color="#9d4edd" intensity={0.5} />
      <pointLight position={[-3, 1, -3]} color="#3a0ca3" intensity={0.7} />
      <spotLight
        position={[0, 5, 0]}
        angle={Math.PI / 6}
        penumbra={0.3}
        distance={20}
        decay={0}
        intensity={1.5}
        color="#ffffff"
        castShadow
      />
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

const Experience = () => {
  const liquidColor = useBrew((s) => s.color);

  return (
    <Canvas shadows style={{ width: "100%", height: "100%" }}>
      {/* fog colour MUST match the background so distant geometry fades into it
          seamlessly — that match is what makes the depth fog actually read */}
      <fog attach="fog" args={["#160a26", 3.5, 16]} />
      <color attach="background" args={["#160a26"]} />

      <Suspense fallback={null}>
        <Environment preset="night" />
        <Lights />

        <Selection>
          <group position={[0, 0.25, 0]}>
            <Cauldron liquidColor={liquidColor} bubbleColor={liquidColor} />
          </group>
          <BrewScene />
          {/* apothecary cabinet behind the cauldron, front facing the camera;
              raised so all the cubbies clear the pot rim (lower body hides
              behind the cauldron) */}
          <CabinetShelf
            position={[-3.6, -2.25, -3.7]}
            rotation={[0, Math.PI / 3.1, 0]}
            scale={1.2}
          />
          <WitchNook />
          {import.meta.env.DEV && <Hotspots />}

          {/* ground floor plane — y=-2.25 matches GROUND_Y in WitchNook.jsx,
              where all the floor dressing (coat stand, crates, broom) sits */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -2.25, 0]}
            receiveShadow
          >
            <planeGeometry args={[50, 50]} />
            <meshStandardMaterial color="#1f1135" />
          </mesh>

          <EffectComposer autoClear={false}>
            {/* glowing outline on hoverable/clickable objects (driven by <Select>) */}
            <Outline
              visibleEdgeColor={0xfff1c0}
              hiddenEdgeColor={0x9d4edd}
              edgeStrength={8}
              blur
              pulseSpeed={0.4}
            />
            <Bloom
              luminanceThreshold={1}
              luminanceSmoothing={0.8}
              intensity={1}
              mipmapBlur={true}
              blendFunction={BlendFunction.SCREEN}
            />
          </EffectComposer>
        </Selection>

        <CameraRig />
      </Suspense>
    </Canvas>
  );
};

export default Experience;
