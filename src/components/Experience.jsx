import { MeshReflectorMaterial, OrbitControls } from "@react-three/drei";
import Studio from "./Studio";

export default function Experience() {
  return (
    <>
      <OrbitControls
        // ref={controlsRef}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 4}
        minDistance={10}
        maxDistance={20}
        enableDamping
        dampingFactor={0.1}
      />

      <fog attach={"fog"} args={["#dbecfb", 45, 50]} />

      {/* LIGHTS */}
      <ambientLight intensity={1} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.8}
        color={"#9e69da"}
        castShadow
      />

      {/* GROUND */}
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

      <Studio />
    </>
  );
}
