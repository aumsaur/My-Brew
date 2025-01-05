import { Cylinder } from "@react-three/drei";

import { CylinderCollider, RigidBody } from "@react-three/rapier";
import { BrewingMachine } from "./BrewingMachine";

export default function Studio() {
  const machineScale = { x: 2.5, y: 2.5, z: 2.5 };
  const machinePosition = { x: 0, y: machineScale.y, z: 0 };
  // const [machinePosition, setMachinePosition] = useState([0, 0, 0])

  return (
    <group position-y={0}>
      {/* BREWING WITH */}
      <BrewingMachine scale={machineScale} position={machinePosition} />

      {/* STATION */}
      <RigidBody colliders={false} type="fixed" position-y={-0.5}>
        <CylinderCollider args={[0.5, 5]} />
        <Cylinder scale={[5, 1, 5]} receiveShadow>
          <meshStandardMaterial color={"white"} />
        </Cylinder>
      </RigidBody>
    </group>
  );
}
