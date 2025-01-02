import { Suspense, useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
// import "./App.css";
import { Canvas } from "@react-three/fiber";
import Experience from "./components/Experience";
import { Physics } from "@react-three/rapier";

function App() {
  return (
    <Canvas shadows camera={{ position: [0, 6, 14], fov: 45 }}>
      <color attach={"background"} args={["#dbecfb"]} />
      <Suspense>
        <Physics debug>
          <Experience />
        </Physics>
      </Suspense>
    </Canvas>
  );
}

export default App;
