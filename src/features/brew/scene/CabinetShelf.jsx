import { useEffect, useState } from "react";
import { useCursor, Html } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import CabinetModel from "./CabinetModel";
import IngredientModel, { Jar } from "./IngredientModel";
import { CUBBIES } from "@/features/brew/data/cabinet";
import { ingredientsOnPage } from "@/features/brew/data/ingredients";
import { useBrew } from "@/features/brew/store";

const FONT = "'Cinzel', Georgia, serif";

// One ingredient sitting in a cabinet cubby. PRESS-AND-HOLD to pour it into the
// cauldron (the "Right Mix" pour); it glows + names itself on hover, and the
// PourPip above tracks how much you've poured. Pouring is disabled once you've
// begun stirring or the brew is served.
function Slot({ ing, position }) {
  const [hovered, setHovered] = useState(false);
  const startPour = useBrew((s) => s.startPour);
  const canPour = useBrew((s) => s.phase !== "served" && s.phase !== "stirring");
  const pouring = useBrew((s) => s.pouringId === ing.id);
  useCursor(hovered && canPour);

  // hover shows the "you can pour this" outline. Once you're ACTUALLY pouring we
  // drop the outline — it flickered as the spinning model slid under the cursor
  // (hovered toggling on/off), which was the stray "halo". The spin + squash
  // carry the pouring feedback instead.
  const glow = hovered && canPour && !pouring;
  const active = (hovered && canPour) || pouring;

  return (
    <group
      position={position}
      // Start on press. The pour is ENDED by a window pointerup (see the parent)
      // — NOT by onPointerOut — so a spinning/popping model can't slip out from
      // under the cursor and cancel the pour mid-hold.
      onPointerDown={(e) => {
        e.stopPropagation();
        if (canPour) startPour(ing.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <Select enabled={glow}>
        {ing.display === "jar" ? (
          // preserved specimen — shown in a brine jar; pouring still drops the
          // raw contents into the cauldron
          <group scale={0.62}>
            <Jar tint={ing.color}>
              <IngredientModel kind={ing.kind} color={ing.color} scale={0.5} idle seed={1.2} />
              <group position={[0.09, -0.17, 0.04]}>
                <IngredientModel kind={ing.kind} color={ing.color} scale={0.4} idle seed={3.7} />
              </group>
              <group position={[-0.08, 0.16, -0.04]}>
                <IngredientModel kind={ing.kind} color={ing.color} scale={0.36} idle seed={5.1} />
              </group>
            </Jar>
          </group>
        ) : (
          <IngredientModel
            kind={ing.kind}
            color={ing.color}
            scale={0.62}
            autoRotate={hovered || pouring}
            spin={pouring ? 2.4 : 0.6}
            idle
            hovered={active}
            hint={canPour && !hovered && !pouring}
          />
        )}
      </Select>

      {hovered && !pouring && (
        <Html center position={[0, 0.34, 0]} distanceFactor={8} style={{ pointerEvents: "none" }}>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 13,
              color: "#f0e0c0",
              background: "rgba(8,3,20,0.82)",
              border: `1px solid ${ing.color}`,
              borderRadius: 6,
              padding: "2px 8px",
              whiteSpace: "nowrap",
            }}
          >
            {ing.name}
          </div>
        </Html>
      )}
    </group>
  );
}

// The 3D apothecary cabinet + its clickable ingredient models. The shelf pages
// (more ingredients than fit) are driven by the store's cabinetPage; the paging
// arrows themselves live in the HUD (BrewShelf) so they stay crisp + placed.
// Mount inside the scene's <Selection> so the hover outline works.
export default function CabinetShelf(props) {
  const page = useBrew((s) => s.cabinetPage);
  const pouringId = useBrew((s) => s.pouringId);
  const endPour = useBrew((s) => s.endPour);
  const items = ingredientsOnPage(page);

  // End whatever pour is in progress when the mouse/touch is released ANYWHERE.
  // Decoupling the release from the cubby's own pointer events is what makes the
  // hold reliable regardless of how the ingredient model animates.
  useEffect(() => {
    if (!pouringId) return;
    const end = () => endPour();
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [pouringId, endPour]);

  return (
    <group {...props}>
      <CabinetModel />
      {items.map((ing, i) => (
        <Slot key={ing.id} ing={ing} position={CUBBIES[i]} />
      ))}
    </group>
  );
}
