import BeanBag from "@/features/coffee/scene/BeanBag";
import { BEANS, roastColor, accentColor } from "@/features/coffee/data/beans";

// The row of bean bags — this is "pick bean", and it is what replaces
// CabinetShelf's paginated cubbies.
//
// Note there is no pagination here. CabinetShelf paged because 20 invented
// ingredients would not fit; a handful of real origins do, laid out in a line.
// If the list ever outgrows the shelf, the fridge is the second zone rather
// than a pager (its door racks are the natural overflow).

const GAP = 0.115; // spacing between bags, a touch over bag width

// Deterministic per-index jitter. Random() would reshuffle on every render and
// make the shelf twitch; this is stable and still stops the row reading cloned.
function jitter(i) {
  const s = Math.sin(i * 12.9898) * 43758.5453;
  return s - Math.floor(s) - 0.5; // -0.5..0.5
}

export default function BeanShelf({
  beans = BEANS,
  selectedId = null,
  // YOU HAVE TO GO THERE FIRST. Until the camera is at the shelf a bag click
  // is a request to LOOK at the shelf, not to take a bag — the same two
  // beats the fridge has always had, where the door has to be open before a
  // grocery is pickable. Without it the whole room could be operated from
  // the overview and the camera moves were decoration.
  active = false,
  onSelect,
  onFocus,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}) {
  const span = (beans.length - 1) * GAP;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {beans.map((bean, i) => (
        <BeanBag
          key={bean.id}
          name={bean.name}
          labelColor={accentColor(bean)}
          tieColor={roastColor(bean)}
          selected={selectedId === bean.id}
          onSelect={() => (active ? onSelect?.(bean.id) : onFocus?.())}
          position={[
            -span / 2 + i * GAP + jitter(i) * 0.008,
            0,
            jitter(i + 7) * 0.01,
          ]}
          rotation={[0, jitter(i + 3) * 0.28, 0]}
          scale={1 + jitter(i + 11) * 0.12}
        />
      ))}
    </group>
  );
}
