import {
  Cylinder,
  MeshReflectorMaterial,
  OrbitControls,
} from "@react-three/drei";
import { CylinderCollider, RigidBody } from "@react-three/rapier";
import { Box } from "@react-three/drei";
import { BoxGeometry } from "three";
import { EspressoMachine } from "./models/EspressoMachine";

export default function Experience() {
  const dimensionScale = 2.5;

  return (
    <>
      <OrbitControls />

      {/* LIGHTS */}
      <ambientLight intensity={1} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.8}
        color={"#9e69da"}
        castShadow
      />

      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[50, 50]} />
        <MeshReflectorMaterial
          blur={[400, 400]}
          resolution={1024}
          mixBlur={1}
          mixStrength={15}
          depthScale={1}
          minDepthThreshold={0.85}
          color="#dbecfb"
          metalness={0.6}
          roughness={1}
        />
      </mesh>

      {/* BACKGROUND */}
      <EspressoMachine
        scale={[dimensionScale, dimensionScale, dimensionScale]}
        position={[0, dimensionScale, 0]}
      />

      {/* STATION */}
      <RigidBody colliders={false} type="fixed" position-y={-0.5}>
        <CylinderCollider args={[0.5, 5]} />
        <Cylinder scale={[5, 1, 5]} receiveShadow>
          <meshStandardMaterial color={"white"} />
        </Cylinder>
      </RigidBody>
    </>
  );
}
