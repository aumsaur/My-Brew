import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { View } from "@react-three/drei";
import {
  INGREDIENT_LIST,
  INGREDIENTS,
  VESSEL_KINDS,
} from "@/features/brew/data/ingredients";
import IngredientModel from "@/features/brew/scene/IngredientModel";
import Vessel from "@/features/brew/scene/Vessel";

function Spin({ children, speed = 0.6 }) {
  const ref = useRef();
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.y += speed * d;
  });
  return <group ref={ref}>{children}</group>;
}

// Dev-only previewer to inspect the models used for brewing (result vessels +
// ingredients). Shares the cabinet's <View.Port> canvas, so it just needs a View.
export default function BrewDebug() {
  const [val, setVal] = useState("v:flask");
  const isVessel = val.startsWith("v:");
  const key = val.slice(2);

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        width: 210,
        pointerEvents: "auto",
        fontFamily: "monospace",
        color: "#cbb6ff",
        background: "rgba(10,4,26,0.82)",
        border: "1px solid rgba(192,119,255,0.3)",
        borderRadius: 10,
        padding: 10,
      }}
    >
      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>
        DEBUG · model preview
      </div>
      <select
        value={val}
        onChange={(e) => setVal(e.target.value)}
        style={{
          width: "100%",
          background: "#1a0e2e",
          color: "#e9ddff",
          border: "1px solid #5a4a72",
          borderRadius: 6,
          padding: "4px 6px",
          fontFamily: "monospace",
          fontSize: 12,
        }}
      >
        <optgroup label="Result vessels">
          {VESSEL_KINDS.map((k) => (
            <option key={k} value={`v:${k}`}>
              {k}
            </option>
          ))}
        </optgroup>
        <optgroup label="Ingredients">
          {INGREDIENT_LIST.map((i) => (
            <option key={i.id} value={`i:${i.id}`}>
              {i.name} — {i.kind}
            </option>
          ))}
        </optgroup>
      </select>

      <View
        style={{
          width: "100%",
          height: 170,
          marginTop: 8,
          borderRadius: 8,
          background: "rgba(0,0,0,0.3)",
        }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 3, 4]} intensity={1.3} />
        <pointLight position={[-2, -1, 2]} intensity={0.6} color="#c077ff" />
        <Spin>
          {isVessel ? (
            <Vessel vessel={key} color="#c9a6ff" scale={1.2} />
          ) : (
            <IngredientModel
              kind={INGREDIENTS[key].kind}
              color={INGREDIENTS[key].color}
              scale={1.5}
            />
          )}
        </Spin>
      </View>
      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
        {isVessel ? `vessel "${key}"` : `kind "${INGREDIENTS[key].kind}"`}
      </div>
    </div>
  );
}
