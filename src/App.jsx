import { useState, useEffect } from "react";
import "./App.css";
import Experience from "@/features/brew/Experience";
import { OverlayButton, OverlayMenu } from "@/shared/components/Overlay";
import InnerWorld from "@/features/inner/InnerWorld";
import BrewShelf from "@/features/brew/overlay/BrewShelf";
import InspectOverlay from "@/features/brew/overlay/InspectOverlay";
import { useBrew } from "@/features/brew/store";

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return progress;
}

function App() {
  const scrollProgress = useScrollProgress();
  const inspecting = useBrew((s) => s.inspecting);

  // 3D canvas fades out AFTER camera has submerged (scroll 0.55 → 0.68)
  const canvasOpacity = Math.max(
    0,
    1 - Math.max(0, (scrollProgress - 0.55) / 0.13)
  );

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          opacity: canvasOpacity,
          pointerEvents: canvasOpacity > 0.05 ? "auto" : "none",
          // blur the live world behind the inspect overlay (scene keeps running)
          filter: inspecting ? "blur(7px)" : "none",
          transition: "filter .3s",
        }}
      >
        <OverlayButton />
        <div style={{ width: "100%", height: "100%" }}>
          <Experience />
        </div>
        <OverlayMenu />
        <BrewShelf visible={scrollProgress < 0.12} />
      </div>

      <InspectOverlay />

      {/* dev-only scroll read-out — handy for picking navbar target fractions
          (shared/constants/nav.js) by scrolling to a spot and reading the % */}
      {import.meta.env.DEV && (
        <div
          style={{
            position: "fixed",
            bottom: 12,
            left: 12,
            zIndex: 9999,
            padding: "4px 10px",
            borderRadius: 6,
            font: "600 13px/1 ui-monospace, monospace",
            color: "#e9d5ff",
            background: "rgba(20,8,40,0.7)",
            border: "1px solid rgba(157,78,221,0.4)",
            pointerEvents: "none",
          }}
        >
          scroll {(scrollProgress * 100).toFixed(1)}%
        </div>
      )}

      <InnerWorld scrollProgress={scrollProgress} />

      {/* Scroll spacer — 700vh total journey */}
      <div
        style={{ height: "700vh", pointerEvents: "none" }}
        aria-hidden="true"
      />
    </>
  );
}

export default App;
