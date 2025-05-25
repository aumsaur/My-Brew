import "./App.css";
import Experience from "@/sections/Experience";
import { OverlayButton, OverlayMenu } from "./sections/Overlay";
import { LiquidTransition } from "@/components/Transitions/LiquidTransition";
import { useState } from "react";

function App() {
  const [transitioning, setTransitioning] = useState(false);

  return (
    <>
      <main>
        <button
          className="absolute top-0 left-0 p-3 text-white z-[99] cursor-pointer"
          onClick={() => setTransitioning(!transitioning)}>
          Start Liquid Fill
        </button>
        <OverlayButton />
        <div className="w-dvw h-dvh">
          <Experience />
        </div>
      </main>
      {/* {transitioning && (
        <LiquidTransition
          color="#3a0ca3"
          waveOptions={{ amplitude: 40, speed: 0.2 }}
          duration={1500}
          onComplete={() => {
            console.log("Screen is full—do the next step!");
            // e.g. navigate or swap scenes here
          }}
        />
      )} */}
      <LiquidTransition active={transitioning} duration={5} />
      <OverlayMenu />
    </>
  );
}

export default App;
