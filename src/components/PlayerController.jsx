import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, Raycaster, Box3, Sphere } from "three";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/stores/store";

export default function PlayerController() {
  const { camera, scene } = useThree();
  const keys = useRef({});
  const velocity = useRef(new Vector3());
  const dir = useRef(new Vector3());
  const raycaster = useRef(new Raycaster());
  const speed = 3; // units per second
  const INTERACT_RANGE = 3; // max distance for hover / interact

  const { isPlaying, setHoveredName } = useStore(
    useShallow(({ playerStore }) => ({ ...playerStore }))
  );

  useEffect(() => {
    const onKeyDown = (e) => (keys.current[e.code] = true);
    const onKeyUp = (e) => (keys.current[e.code] = false);
    const onPointerDown = (e) => {
      if (!isPlaying) return;
      // perform a raycast from camera center (limited range)
      raycaster.current.far = INTERACT_RANGE;
      raycaster.current.setFromCamera({ x: 0, y: 0 }, camera);
      const intersects = raycaster.current.intersectObjects(
        scene.children,
        true
      );
      if (intersects.length > 0) {
        const hit = intersects[0];
        // find ancestor named 'cauldron'
        let obj = hit.object;
        while (obj && obj.name !== "cauldron") obj = obj.parent;
        if (obj && obj.name === "cauldron") {
          // simple interaction: log and flash if possible
          console.log("Interacted with cauldron", hit.point);
          // try to set a temporary userData flag
          obj.userData.lastHit = Date.now();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("pointerdown", onPointerDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [camera, scene, isPlaying]);

  useFrame((_, delta) => {
    if (!isPlaying) return;

    const forward = keys.current["KeyW"] || keys.current["ArrowUp"];
    const back = keys.current["KeyS"] || keys.current["ArrowDown"];
    const left = keys.current["KeyA"] || keys.current["ArrowLeft"];
    const right = keys.current["KeyD"] || keys.current["ArrowRight"];

    dir.current.set(0, 0, 0);
    if (forward) dir.current.z -= 1;
    if (back) dir.current.z += 1;
    if (left) dir.current.x -= 1;
    if (right) dir.current.x += 1;

    // center-ray hover detection every frame
    // limit hover detection to nearby objects
    raycaster.current.far = INTERACT_RANGE;
    raycaster.current.setFromCamera({ x: 0, y: 0 }, camera);
    const hits = raycaster.current.intersectObjects(scene.children, true);
    if (hits.length > 0) {
      let obj = hits[0].object;
      // climb to a named ancestor if possible
      while (obj && !obj.name) obj = obj.parent;
      setHoveredName(obj && obj.name ? obj.name : "");
    } else {
      setHoveredName("");
    }

    if (dir.current.lengthSq() > 0) {
      dir.current.normalize();
      // rotate direction by camera yaw
      const camDir = new Vector3();
      camera.getWorldDirection(camDir);
      camDir.y = 0;
      camDir.normalize();

      const rightVec = new Vector3();
      // compute right vector as camera forward cross up (gives right direction)
      rightVec.crossVectors(camDir, new Vector3(0, 1, 0)).normalize();

      velocity.current.copy(camDir).multiplyScalar(-dir.current.z);
      velocity.current.addScaledVector(rightVec, dir.current.x);
      velocity.current.normalize().multiplyScalar(speed * delta);

      // sliding collision against cauldron: allow tangential movement
      const cauldron = scene.getObjectByName("cauldron");
      const playerRadius = 0.35;
      const desiredMove = velocity.current.clone();
      const newPos = camera.position.clone().add(desiredMove);

      if (cauldron) {
        const box = new Box3().setFromObject(cauldron);
        const sphere = new Sphere();
        box.getBoundingSphere(sphere);
        const minDist = sphere.radius + playerRadius;
        const distToNew = newPos.distanceTo(sphere.center);

        if (distToNew < minDist) {
          // collision would occur — try sliding along tangent
          const camToCenter = camera.position.clone().sub(sphere.center);
          const n = camToCenter.clone().normalize(); // normal from center to camera

          // project desiredMove onto plane perpendicular to n
          const V = desiredMove.clone();
          const Vslide = V.clone().sub(n.clone().multiplyScalar(V.dot(n)));
          // Prevent upward climbing: constrain sliding to horizontal plane
          Vslide.y = 0;

          if (Vslide.lengthSq() > 1e-6) {
            const testPos = camera.position.clone().add(Vslide);
            if (testPos.distanceTo(sphere.center) >= minDist) {
              camera.position.add(Vslide);
            } else {
              // try a reduced tangential step (half)
              const half = Vslide.clone().multiplyScalar(0.5);
              const testPos2 = camera.position.clone().add(half);
              if (testPos2.distanceTo(sphere.center) >= minDist) {
                camera.position.add(half);
              }
              // else: too constrained — don't move this frame
            }
          }
          // else: movement is directly into the normal; no sliding available
        } else {
          // no collision, move normally
          camera.position.add(desiredMove);
        }
      } else {
        // no cauldron, move normally
        camera.position.add(desiredMove);
      }
    }
  });

  return null;
}
