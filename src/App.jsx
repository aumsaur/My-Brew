import { useState, useEffect } from "react";
import "./App.css";
import Experience from "@/features/brew/Experience";
import { OverlayButton, OverlayMenu } from "@/shared/components/Overlay";
import InnerWorld from "@/features/inner/InnerWorld";
import Hero from "@/features/hero/Hero";
import GrimoireOverlay from "@/features/grimoire/GrimoireOverlay";
import WorkshopMap from "@/features/map/WorkshopMap";
import BrewShelf from "@/features/brew/overlay/BrewShelf";
import InspectOverlay from "@/features/brew/overlay/InspectOverlay";
import { useBrew } from "@/features/brew/store";
import {
  TOTAL_VH,
  HERO_END,
  BREW_END,
  diveProgress,
} from "@/shared/constants/journey";

function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    // Reading scrollHeight forces a layout — doing that on every scroll event
    // (which can fire dozens of times per second) was a real source of jank on
    // a page full of filter/mask-image/mix-blend-mode. Cache it and only
    // recompute on resize (the one thing that can actually change it).
    let max = document.documentElement.scrollHeight - window.innerHeight;
    const recomputeMax = () => {
      max = document.documentElement.scrollHeight - window.innerHeight;
    };
    // Coalesce to one React update per animation frame. Some browsers/input
    // devices fire several "scroll" events between frames; without this each
    // one triggers its own setState → full App re-render (Hero, InnerWorld's
    // many bubbles, BrewShelf), which can add up to more re-renders than
    // frames actually available to paint them in.
    let queued = false;
    const update = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        setProgress(max > 0 ? window.scrollY / max : 0);
      });
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", recomputeMax, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", recomputeMax);
    };
  }, []);
  return progress;
}

function App() {
  const scrollProgress = useScrollProgress();
  const inspecting = useBrew((s) => s.inspecting);

  // 3D canvas fades out across the dive phase (after the camera has submerged),
  // crossfading into the InnerWorld mask — both share journey.js's diveProgress
  const canvasOpacity = 1 - diveProgress(scrollProgress);
  // Past the dive, the cauldron scene sits at opacity 0 for the entire rest of
  // the journey (projects + skills, ~28% of the total scroll) — but a plain
  // opacity fade doesn't stop it rendering. Experience uses this to pause its
  // frameloop entirely while invisible, instead of paying for full shadows +
  // bloom + outline post-processing on a scene nobody can see. A thresholded
  // boolean (flips twice per journey) rather than the raw opacity, so it
  // doesn't re-render Experience's subtree on every scroll tick.
  const sceneActive = canvasOpacity > 0.02;

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
        <div style={{ width: "100%", height: "100%" }}>
          <Experience active={sceneActive} />
        </div>
        <BrewShelf
          visible={scrollProgress >= HERO_END && scrollProgress < BREW_END}
        />
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

      {/* Opening splash — fixed, above the canvas (zIndex 20), below the navbar.
          Fades + rises away across the hero phase, revealing the cauldron. */}
      <Hero scrollProgress={scrollProgress} />

      {/* Grimoire content — opens when the lectern book is clicked (zIndex 60,
          above everything); locks scroll + flies the camera to the book. */}
      <GrimoireOverlay />

      {/* Rolled-scroll button + the parchment workshop map it unrolls. */}
      <WorkshopMap />

      {/* Navbar — hoisted above the inner world (zIndex 10) and kept fixed, so
          it stays visible and clickable across the ENTIRE journey, not just
          while the 3D canvas is up. Wrapper is click-through; the button and
          (when open) the menu panel re-enable pointer events themselves. */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          pointerEvents: "none",
        }}
      >
        <OverlayButton />
        <OverlayMenu />
      </div>

      {/* Scroll spacer — total journey height is data-driven (grows with the
          number of projects); see shared/constants/journey.js */}
      <div
        style={{ height: `${TOTAL_VH}vh`, pointerEvents: "none" }}
        aria-hidden="true"
      />
    </>
  );
}

export default App;
