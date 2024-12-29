import { OrbitControls } from "@react-three/drei";

export default function Experience() {
  return (
    <>
      <OrbitControls />
      <ambientLight intensity={0.2} />
      <directionalLight intensity={0.8} color={"#9e69da"} castShadow />
      <Studio />
    </>
  );
}
