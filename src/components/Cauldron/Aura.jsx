import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";

export default function Aura({
  count = 40,
  color = "#9b87f5",
  position = [0, 0.7, 0],
  size = 2,
}) {
  const mesh = useRef(null);

  // Create particles data
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 0.5
      ),
      scale: Math.random() * 0.5 + 0.1,
      rotation: Math.random() * Math.PI,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.01,
        Math.random() * 0.01 + 0.005,
        (Math.random() - 0.5) * 0.01
      ),
      opacity: Math.random() * 0.5 + 0.5,
    }));
  }, [count]);

  // Create a custom shader material for the particles
  const particleMaterial = useMemo(() => {
    const colorRGB = new THREE.Color(color);

    return new THREE.ShaderMaterial({
      uniforms: {
        color: { value: colorRGB },
        time: { value: 0 },
      },
      vertexShader: `
        uniform float time;
        attribute float opacity;
        varying float vOpacity;
        
        void main() {
          vOpacity = opacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = 5.0 / -mvPosition.z;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vOpacity;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float intensity = 1.0 - dist * 2.0;
          gl_FragColor = vec4(color, vOpacity * intensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [color]);

  // Create dummy object for instance manipulation
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Animation loop
  useFrame((state, delta) => {
    if (!mesh.current) return;

    // Update time uniform for shader
    if (particleMaterial.uniforms) {
      particleMaterial.uniforms.time.value = state.clock.elapsedTime;
    }

    // Update particles
    particles.forEach((particle, i) => {
      // Move particle based on velocity
      particle.position.add(particle.velocity);

      // Expand outward as they rise
      if (particle.position.y > 0.2) {
        particle.position.x += (Math.random() - 0.5) * 0.01;
        particle.position.z += (Math.random() - 0.5) * 0.01;
      }

      // Reduce opacity as they rise
      if (particle.position.y > 0.5) {
        particle.opacity -= 0.01;
      }

      // Reset particle if it's too high or faded out
      if (particle.position.y > 1.5 || particle.opacity < 0) {
        particle.position.set(
          (Math.random() - 0.5) * 0.3,
          0,
          (Math.random() - 0.5) * 0.3
        );
        particle.opacity = Math.random() * 0.5 + 0.5;
      }

      // Update instance
      dummy.position.copy(particle.position);
      dummy.scale.set(particle.scale, particle.scale, particle.scale);
      dummy.rotation.set(0, particle.rotation, 0);
      dummy.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.matrix);
    });

    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={position}>
      <Billboard>
        <instancedMesh
          ref={mesh}
          args={[undefined, undefined, count]}
          material={particleMaterial}>
          <circleGeometry args={[size, 32]} />
        </instancedMesh>
      </Billboard>
    </group>
  );
}
