import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import BrewDial from "./BrewDial";
import BrewDebug from "@/features/brew/debug/BrewDebug";
import HotspotDebug from "@/features/brew/debug/HotspotDebug";
import { CATEGORIES } from "@/features/brew/data/ingredients";
import { useBrew } from "@/features/brew/store";

const FONT = "'Cinzel', Georgia, serif";

// DOM overlay for the brew: status line, the radial dial, dev tools, and the
// shared <View.Port> canvas the dial/debug thumbnails draw into. Ingredients
// are now added by clicking the 3D cabinet in the scene (see CabinetShelf).
export default function BrewShelf({ visible }) {
  const added = useBrew((s) => s.added);
  const potion = useBrew((s) => s.potion);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        fontFamily: FONT,
      }}
    >
      {/* Status / result above the shelf */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          color: "#e9ddff",
          pointerEvents: "auto",
        }}
      >
        {potion ? (
          <div
            style={{
              padding: "14px 22px",
              borderRadius: 14,
              background: "rgba(10,4,26,0.86)",
              border: `1px solid ${potion.color}`,
              boxShadow: `0 0 26px ${potion.color}66`,
            }}
          >
            <div style={{ fontSize: 20, letterSpacing: "0.04em" }}>
              {CATEGORIES[potion.category].icon} {potion.name}
            </div>
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.6 }}>
              ↺ reset on the dial to brew again
            </div>
          </div>
        ) : (
          <div style={{ minHeight: 22, opacity: 0.6, fontSize: 14 }}>
            {added.length === 0
              ? "click an ingredient on the cabinet to add it…"
              : "stir the stick in the pot to brew"}
          </div>
        )}
      </div>

      {/* Dial — what's currently in the brew (+ center reset) */}
      <BrewDial />

      {/* Dev-only model previewer + hotspot visualizer */}
      {import.meta.env.DEV && <BrewDebug />}
      {import.meta.env.DEV && <HotspotDebug />}

      {/* Shared canvas that draws every <View> thumbnail; transparent + click-through */}
      <Canvas
        camera={{ position: [0, 0, 3], fov: 35 }}
        gl={{ alpha: true, antialias: true }}
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        <View.Port />
      </Canvas>
    </div>
  );
}
