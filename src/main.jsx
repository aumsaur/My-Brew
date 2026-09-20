// The site. One room, one canvas, no scroll journey.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CoffeeApp from "@/features/coffee/CoffeeApp";
import "@/index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <CoffeeApp />
  </StrictMode>
);
