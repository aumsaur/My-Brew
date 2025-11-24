import { Model } from "./model";
import Bubbles from "./Bubbles";
import Aura from "./Aura";

const Cauldron = ({
  position = [0, -1.5, 0],
  scale = 1,
  liquidColor = "#8a2be2", // default violet
  bubbleColor = "#c077ff", // sparkles color
  ...props
}) => {
  // need toon water shader

  return (
    <group name="cauldron" position={position} scale={scale} {...props}>
      {/* pass the color down into Model */}
      <Model liquidColor={liquidColor} />
      <Bubbles position={[0, 0.5, 0]} color={bubbleColor} />
      {/* <Aura position={[0, 1, 0]} color="#8B5CF6" /> */}
    </group>
  );
};

export default Cauldron;
