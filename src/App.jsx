import "./App.css";
import Experience from "@/sections/Experience";
import { OverlayButton, OverlayMenu } from "./sections/Overlay";

function App() {
  return (
    <>
      <main>
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
      <OverlayMenu />
    </>
  );
}

export default App;
