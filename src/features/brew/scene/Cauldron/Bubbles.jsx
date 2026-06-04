import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useBrew } from "@/features/brew/store";

export default function Bubbles({
  count = 15,
  color = "#D6BCFA",
  position = [0, 0.3, 0],
  size = 0.1,
  radius = 1.2,
}) {
  const mesh = useRef(null);
  const groupRef = useRef(null);
  const brewPulse = useBrew((s) => s.brewPulse);
  const swirl = useRef(0);
  const prevPulse = useRef(0);

  const bubbleGeometry = useMemo(() => new THREE.SphereGeometry(1, 16, 16), []);
  // Created once; the color eases toward the current brew color each frame.
  const bubbleMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.7,
        emissive: color,
        emissiveIntensity: 0.5,
      }),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const targetColor = useMemo(() => new THREE.Color(color), [color]);

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

  useFrame((_, delta) => {
    if (!mesh.current) return;

    // ease bubble color toward the brew color
    bubbleMaterial.color.lerp(targetColor, 0.08);
    bubbleMaterial.emissive.lerp(targetColor, 0.08);

    // a brew spins the bubbles around the cauldron
    if (brewPulse !== prevPulse.current) {
      prevPulse.current = brewPulse;
      swirl.current = 1;
    }
    if (groupRef.current && swirl.current > 0) {
      groupRef.current.rotation.y += delta * swirl.current * 5;
      swirl.current = Math.max(0, swirl.current - delta * 0.5);
    }

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
    <group ref={groupRef} position={position}>
      <instancedMesh
        ref={mesh}
        args={[bubbleGeometry, bubbleMaterial, count]}
        castShadow
      />
    </group>
  );
}
