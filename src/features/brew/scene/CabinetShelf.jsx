import { useState } from "react";
import { useCursor, Html } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
import CabinetModel from "./CabinetModel";
import IngredientModel, { Jar } from "./IngredientModel";
import { CUBBIES } from "@/features/brew/data/cabinet";
import { INGREDIENT_LIST } from "@/features/brew/data/ingredients";
import { useBrew } from "@/features/brew/store";

const FONT = "'Cinzel', Georgia, serif";

// One ingredient sitting in a cabinet cubby. Click to add it to the brew; glows
// + names itself on hover (only while the cauldron can still take ingredients).
function Slot({ ing, position }) {
  const [hovered, setHovered] = useState(false);
  const addIngredient = useBrew((s) => s.addIngredient);
  const canAdd = useBrew((s) => s.added.length < 4 && !s.potion);
  useCursor(hovered && canAdd);

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (canAdd) addIngredient(ing.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <Select enabled={hovered && canAdd}>
        {ing.display === "jar" ? (
          // preserved specimen — shown in a brine jar; clicking still drops the
          // raw contents into the cauldron (see BrewScene)
          <group scale={0.62}>
            <Jar tint={ing.color}>
              <IngredientModel
                kind={ing.kind}
                color={ing.color}
                scale={0.5}
                idle
                seed={1.2}
              />
              <group position={[0.09, -0.17, 0.04]}>
                <IngredientModel
                  kind={ing.kind}
                  color={ing.color}
                  scale={0.4}
                  idle
                  seed={3.7}
                />
              </group>
              <group position={[-0.08, 0.16, -0.04]}>
                <IngredientModel
                  kind={ing.kind}
                  color={ing.color}
                  scale={0.36}
                  idle
                  seed={5.1}
                />
              </group>
            </Jar>
          </group>
        ) : (
          <IngredientModel
            kind={ing.kind}
            color={ing.color}
            scale={0.62}
            autoRotate={hovered}
            idle
            hovered={hovered && canAdd}
          />
        )}
      </Select>
      {hovered && (
        <Html
          center
          position={[0, 0.34, 0]}
          distanceFactor={8}
          style={{ pointerEvents: "none" }}
        >
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

// The 3D apothecary cabinet + its clickable ingredient models. Mount inside the
// scene's <Selection> so the hover outline works.
export default function CabinetShelf(props) {
  return (
    <group {...props}>
      <CabinetModel />
      {INGREDIENT_LIST.map((ing, i) => (
        <Slot key={ing.id} ing={ing} position={CUBBIES[i]} />
      ))}
    </group>
  );
}
