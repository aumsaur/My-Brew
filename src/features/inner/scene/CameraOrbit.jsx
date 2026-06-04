import { useFrame, useThree } from "@react-three/fiber";

// Slow automatic orbit around the chamber.
export default function CameraOrbit() {
  const { camera } = useThree();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.07;
    camera.position.set(Math.sin(t) * 8.5, 4.5, Math.cos(t) * 8.5);
    camera.lookAt(0, 0.5, 0);
  });
  return null;
}
