import { useState } from "react";
import GeoCrystal from "./GeoCrystal";
import CrystalCluster from "./CrystalCluster";

// Owns hover state and picks the right crystal shape for a skill.
export default function SkillNode({ data, play }) {
  const [hovered, setHovered] = useState(false);
  return data.shape === "geo" ? (
    <GeoCrystal
      data={data}
      hovered={hovered}
      setHovered={setHovered}
      play={play}
    />
  ) : (
    <CrystalCluster
      data={data}
      hovered={hovered}
      setHovered={setHovered}
      play={play}
    />
  );
}
