import EspressoMachine from "./models/EspressoMachine";
import React, { useState } from "react";

export function BrewingMachine({ scale, position }) {
  const [currentMachine, setCurrentMachine] = useState("espresso");

  return (
    <>
      <EspressoMachine
        scale={Object.values(scale)}
        position={Object.values(position)}
      />
    </>
  );
}
