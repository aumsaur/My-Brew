import * as THREE from "three";
import { useMemo } from "react";

// ── Themed product vessels (keyed by vessel kind) ────────────────────────────
// Stylized low-poly: low segment counts + flatShading so everything reads
// faceted to match the art direction.
function Cup({ color }) {
  return (
    <group>
      {/* saucer */}
      <mesh position={[0, -0.28, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.04, 16]} />
        <meshStandardMaterial color="#efe9df" roughness={0.5} flatShading />
      </mesh>
      {/* ceramic wall — open at the top so you can see in */}
      <mesh>
        <cylinderGeometry args={[0.3, 0.24, 0.5, 16, 1, true]} />
        <meshStandardMaterial
          color="#f4efe6"
          roughness={0.4}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>
      {/* rolled rim lip */}
      <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.3, 0.018, 6, 16]} />
        <meshStandardMaterial color="#f8f3ea" roughness={0.4} flatShading />
      </mesh>
      {/* foot */}
      <mesh position={[0, -0.24, 0]}>
        <cylinderGeometry args={[0.22, 0.24, 0.03, 16]} />
        <meshStandardMaterial color="#e9e2d6" roughness={0.5} flatShading />
      </mesh>
      {/* coffee pooled inside, with a lighter crema ring on top */}
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.275, 0.26, 0.06, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.55}
          roughness={0.25}
          flatShading
        />
      </mesh>
      <mesh position={[0, 0.195, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.025, 6, 16]} />
        <meshStandardMaterial
          color={new THREE.Color(color).lerp(new THREE.Color("#e9cba0"), 0.6)}
          emissive={color}
          emissiveIntensity={0.3}
          roughness={0.4}
        />
      </mesh>
      {/* C-handle on the side — half-loop whose ends meet the cup wall */}
      <mesh position={[0.27, 0.0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <torusGeometry args={[0.15, 0.035, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#f4efe6" roughness={0.4} flatShading />
      </mesh>
    </group>
  );
}

function Can({ color }) {
  return (
    <group>
      {/* body */}
      <mesh>
        <cylinderGeometry args={[0.26, 0.26, 0.68, 14]} />
        <meshStandardMaterial
          color={color}
          metalness={0.7}
          roughness={0.3}
          emissive={color}
          emissiveIntensity={0.18}
          flatShading
        />
      </mesh>
      {/* label band (two-tone) */}
      <mesh>
        <cylinderGeometry args={[0.262, 0.262, 0.26, 14]} />
        <meshStandardMaterial
          color={new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.25)}
          metalness={0.5}
          roughness={0.4}
          flatShading
        />
      </mesh>
      {/* tapered neck + top rim */}
      <mesh position={[0, 0.37, 0]}>
        <cylinderGeometry args={[0.21, 0.26, 0.06, 14]} />
        <meshStandardMaterial
          color="#c2c2cc"
          metalness={0.9}
          roughness={0.25}
          flatShading
        />
      </mesh>
      <mesh position={[0, 0.41, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.205, 0.012, 6, 14]} />
        <meshStandardMaterial color="#d8d8e0" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* lid + pull-tab */}
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.015, 14]} />
        <meshStandardMaterial
          color="#9a9aa6"
          metalness={0.95}
          roughness={0.25}
          flatShading
        />
      </mesh>
      <mesh position={[0, 0.435, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.05, 0.012, 6, 10]} />
        <meshStandardMaterial
          color="#bcbcc6"
          metalness={0.95}
          roughness={0.2}
        />
      </mesh>
      {/* bottom rim */}
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[0.24, 0.22, 0.05, 14]} />
        <meshStandardMaterial
          color="#b8b8c2"
          metalness={0.85}
          roughness={0.3}
          flatShading
        />
      </mesh>
    </group>
  );
}

// Classic contour glass bottle (Coca-Cola style), built from a lathe profile.
// Clear glass with the brew colour as the LIQUID inside + a white paper label.
function ColaBottle({ color }) {
  const geo = useMemo(() => {
    const profile = [
      [0.001, 0.0],
      [0.22, 0.02],
      [0.235, 0.12],
      [0.19, 0.3],
      [0.225, 0.52],
      [0.205, 0.74],
      [0.11, 0.9],
      [0.085, 1.12],
      [0.095, 1.22],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const g = new THREE.LatheGeometry(profile, 9); // low-poly facets
    g.translate(0, -0.6, 0); // center it
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group>
      {/* clear glass shell — depthWrite off so it blends over the liquid from
          every angle instead of occluding the top at certain views */}
      <mesh geometry={geo}>
        <meshStandardMaterial
          color="#dceaf2"
          roughness={0.06}
          metalness={0.12}
          transparent
          opacity={0.26}
          depthWrite={false}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>
      {/* coloured liquid inside — shorter than the glass so there's an air gap */}
      <mesh geometry={geo} scale={[0.86, 0.8, 0.86]} position={[0, -0.07, 0]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.2}
          flatShading
        />
      </mesh>
      {/* white paper label around the belly */}
      <mesh position={[0, -0.12, 0]}>
        <cylinderGeometry args={[0.205, 0.205, 0.32, 9, 1, true]} />
        <meshStandardMaterial
          color="#f4f1e6"
          roughness={0.7}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>
      {/* crown cap */}
      <mesh position={[0, 0.66, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.08, 8]} />
        <meshStandardMaterial
          color="#c0392b"
          metalness={0.4}
          roughness={0.4}
          flatShading
        />
      </mesh>
    </group>
  );
}

// Remedy bottle — rounded apothecary shoulders (lathe), liquid fill, cap + label.
function Bottle({ color }) {
  const geo = useMemo(() => {
    const profile = [
      [0.001, -0.3],
      [0.24, -0.3],
      [0.25, -0.05],
      [0.23, 0.12],
      [0.14, 0.26],
      [0.13, 0.34],
      [0.135, 0.4],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const g = new THREE.LatheGeometry(profile, 12);
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group>
      {/* glass body — depthWrite off so the transparent shell blends over the
          opaque liquid fill cleanly from every angle */}
      <mesh geometry={geo}>
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.55}
          depthWrite={false}
          emissive={color}
          emissiveIntensity={0.3}
          roughness={0.12}
          metalness={0.1}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>
      {/* glowing liquid fill in the belly */}
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[0.21, 0.22, 0.34, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          roughness={0.3}
          flatShading
        />
      </mesh>
      {/* label band */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.255, 0.255, 0.22, 12, 1, true]} />
        <meshStandardMaterial
          color="#efe6d2"
          roughness={0.7}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>
      {/* cap */}
      <mesh position={[0, 0.43, 0]}>
        <cylinderGeometry args={[0.15, 0.145, 0.1, 12]} />
        <meshStandardMaterial
          color="#5a3d6b"
          roughness={0.6}
          metalness={0.2}
          flatShading
        />
      </mesh>
    </group>
  );
}

function Flask({ color }) {
  return (
    <group>
      {/* liquid pooled in the bulb — opaque so it always renders; the
          transparent glass blends over it (drawn first in the opaque pass) */}
      <mesh position={[0, -0.1, 0]}>
        <icosahedronGeometry args={[0.25, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.7}
          roughness={0.15}
          flatShading
        />
      </mesh>
      {/* clear glass bulb — faceted low-poly gem. depthWrite off so the
          double-sided transparent shell doesn't sort-fight with itself or hide
          the liquid at certain angles */}
      <mesh position={[0, -0.05, 0]}>
        <icosahedronGeometry args={[0.32, 1]} />
        <meshStandardMaterial
          color="#dfe8ff"
          transparent
          opacity={0.16}
          depthWrite={false}
          roughness={0.05}
          metalness={0.1}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>
      {/* glass neck (open) */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.32, 8, 1, true]} />
        <meshStandardMaterial
          color="#dfe8ff"
          transparent
          opacity={0.18}
          depthWrite={false}
          roughness={0.05}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>
      {/* cork */}
      <mesh position={[0, 0.46, 0]}>
        <cylinderGeometry args={[0.07, 0.085, 0.08, 6]} />
        <meshStandardMaterial color="#caa15a" roughness={0.6} flatShading />
      </mesh>
    </group>
  );
}

const VESSELS = {
  cup: Cup,
  can: Can,
  colabottle: ColaBottle,
  bottle: Bottle,
  flask: Flask,
};

// Render a vessel by kind (cup | can | colabottle | bottle | flask)
export default function Vessel({ vessel, color, scale = 1 }) {
  const Comp = VESSELS[vessel] ?? Flask;
  return (
    <group scale={scale}>
      <Comp color={color} />
    </group>
  );
}
