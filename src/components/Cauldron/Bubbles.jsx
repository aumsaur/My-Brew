import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export default function Bubbles({
  count = 15,
  color = "#D6BCFA",
  position = [0, 0.3, 0],
  size = 0.1,
  radius = 1.2,
}) {
  const mesh = useRef(null);

  const bubbleGeometry = useMemo(() => new THREE.SphereGeometry(1, 16, 16), []);
  const bubbleMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.7,
        emissive: color,
        emissiveIntensity: 0.5,
      }),
    [color]
  );

  // Initialize bubbles
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const bubbles = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * radius,
          Math.random() * 0.5,
          (Math.random() - 0.5) * radius
        ),
        scale: Math.random() * 0.2 + 0.1,
        speed: Math.random() * 0.2 + 0.1,
      })),
    [count, radius]
  );

  useFrame((state) => {
    if (!mesh.current) return;

    bubbles.forEach((bubble, i) => {
      // Move bubbles upward
      bubble.position.y += bubble.speed * 0.01;

      // If bubble reaches the top, reset its position
      if (bubble.position.y > 0.5) {
        bubble.position.y = -0.1;
        bubble.position.x = (Math.random() - 0.5) * radius;
        bubble.position.z = (Math.random() - 0.5) * radius;
        bubble.scale = Math.random() * 0.2 + 0.1;
      }

      dummy.position.copy(bubble.position);
      dummy.scale.set(bubble.scale, bubble.scale, bubble.scale);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });

    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={position}>
      <instancedMesh
        ref={mesh}
        args={[bubbleGeometry, bubbleMaterial, count]}
        castShadow
      />
    </group>
  );
}
