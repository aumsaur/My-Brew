import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { View } from "@react-three/drei";
import IngredientModel from "@/features/brew/scene/IngredientModel";
import { INGREDIENTS } from "@/features/brew/data/ingredients";
import { useBrew } from "@/features/brew/store";

const FONT = "'Cinzel', Georgia, serif";
const BOX = 340;
const SLOT = 84;
const C = BOX / 2 - SLOT / 2; // centered slot offset (top-left of a centered slot)
const R = 112; // ring radius
const MID = BOX / 2;
const TWO_PI = Math.PI * 2;

// Evenly distribute the items around the ring. Angle measured from the TOP,
// going clockwise. 1 → top, 2 → left/right, 3 → triangle, 4 → square.
function angleFor(i, n) {
  const nn = Math.max(1, n);
  const base = nn === 2 ? -Math.PI / 2 : 0; // 2 items sit horizontally
  return base + i * (TWO_PI / nn);
}

// One ingredient in the brew, shown as its 3D model. The OUTER div is positioned
// + scaled by the parent's animation loop (rAF owns left/top/transform/opacity,
// so they're deliberately absent from JSX). The inner div handles drag-to-remove.
function DialSlot({ ing, locked, open, onRemove, outerRef }) {
  const start = useRef(null);
  const [off, setOff] = useState(null); // [dx,dy] while dragging, else null

  const handlers = locked
    ? {}
    : {
        onPointerDown: (e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          start.current = [e.clientX, e.clientY];
          setOff([0, 0]);
        },
        onPointerMove: (e) => {
          if (start.current)
            setOff([
              e.clientX - start.current[0],
              e.clientY - start.current[1],
            ]);
        },
        onPointerUp: (e) => {
          if (!start.current) return;
          const d = Math.hypot(
            e.clientX - start.current[0],
            e.clientY - start.current[1]
          );
          start.current = null;
          setOff(null);
          if (d > 50) onRemove(); // pulled clear of the dial
        },
      };

  return (
    <div
      ref={outerRef}
      style={{
        position: "absolute",
        width: SLOT,
        height: SLOT,
        transformOrigin: "center",
        willChange: "left, top, transform, opacity",
      }}
    >
      <div
        {...handlers}
        title={`${ing.name}${locked ? "" : " — pull out to remove"}`}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          pointerEvents: open ? "auto" : "none",
          cursor: locked ? "default" : "grab",
          transform: off ? `translate(${off[0]}px, ${off[1]}px)` : "none",
          transition: off ? "none" : "transform .22s",
          zIndex: off ? 10 : 1,
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${ing.color}66`,
          boxShadow: `0 0 16px ${ing.color}55`,
        }}
      >
        <View style={{ width: "100%", height: "100%" }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[2, 3, 4]} intensity={1.2} />
          <pointLight
            position={[-2, -1, 2]}
            intensity={0.6}
            color={ing.color}
          />
          <IngredientModel
            kind={ing.kind}
            color={ing.color}
            scale={1.4}
            autoRotate
            idle
          />
        </View>
      </div>
    </div>
  );
}

// Radial dial showing what's in the cauldron. Opens over the pot on cauldron
// click. Items spring out from the center and redistribute evenly around the
// ring as you add/remove them.
export default function BrewDial() {
  const added = useBrew((s) => s.added);
  const potion = useBrew((s) => s.potion);
  const open = useBrew((s) => s.dialOpen);
  const reset = useBrew((s) => s.reset);
  const removeIngredient = useBrew((s) => s.removeIngredient);

  const n = added.length;
  const has = n > 0;

  // Per-slot animation state (index-based, persists across renders).
  const outerRefs = useRef([]);
  const curAngle = useRef([0, 0, 0, 0]);
  const curRadius = useRef([0, 0, 0, 0]);
  const initialized = useRef([false, false, false, false]);
  const stateRef = useRef({ n, open });
  stateRef.current = { n, open };

  // Stable per-slot ref callbacks. Their identity MUST NOT change between
  // renders — otherwise React detaches (null) + reattaches the ref on every
  // scroll-driven re-render, which re-seeds the slot to the collapsed centre
  // and made the dial replay its expand/collapse on every scroll tick.
  const setSlotRef = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => (el) => {
        outerRefs.current[i] = el;
        if (el && !initialized.current[i]) {
          initialized.current[i] = true;
          curAngle.current[i] = angleFor(i, stateRef.current.n);
          curRadius.current[i] = 0;
          el.style.left = `${C}px`;
          el.style.top = `${C}px`;
          el.style.transform = "scale(0)";
          el.style.opacity = "0";
        } else if (!el) {
          initialized.current[i] = false; // true unmount → allow re-seed later
        }
      }),
    []
  );

  // Make sure the very first paint of each slot is collapsed (no corner flash).
  useLayoutEffect(() => {
    for (let i = 0; i < outerRefs.current.length; i++) {
      const el = outerRefs.current[i];
      if (el && curRadius.current[i] === 0) {
        el.style.left = `${C}px`;
        el.style.top = `${C}px`;
        el.style.transform = "scale(0)";
      }
    }
  });

  // Animation loop: lerp each slot toward its target angle + radius.
  useEffect(() => {
    let raf;
    const tick = () => {
      const { n: count, open: isOpen } = stateRef.current;
      for (let i = 0; i < 4; i++) {
        const el = outerRefs.current[i];
        if (!el) continue;
        const active = i < count;
        const targetAngle = active ? angleFor(i, count) : curAngle.current[i];
        const targetRadius = active && isOpen ? R : 0;

        curAngle.current[i] += (targetAngle - curAngle.current[i]) * 0.2;
        curRadius.current[i] += (targetRadius - curRadius.current[i]) * 0.2;

        const theta = curAngle.current[i];
        const rad = curRadius.current[i];
        const x = MID + rad * Math.sin(theta);
        const y = MID - rad * Math.cos(theta);
        const s = Math.min(1, rad / R);

        el.style.left = `${x - SLOT / 2}px`;
        el.style.top = `${y - SLOT / 2}px`;
        el.style.transform = `scale(${s})`;
        el.style.opacity = `${active ? 1 : s}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!has && !open) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "44%",
        width: BOX,
        height: BOX,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        fontFamily: FONT,
      }}
    >
      {/* center reset */}
      <button
        onClick={reset}
        disabled={!has}
        title="Reset the cauldron"
        style={{
          position: "absolute",
          left: C,
          top: C,
          width: SLOT,
          height: SLOT,
          borderRadius: "50%",
          opacity: open ? 1 : 0,
          pointerEvents: open && has ? "auto" : "none",
          transition: "opacity .25s",
          background: has ? "rgba(192,119,255,0.2)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${has ? "#c077ff" : "#5a4a72"}`,
          color: has ? "#e9ddff" : "#6b5e86",
          cursor: has ? "pointer" : "default",
          fontSize: 34,
          lineHeight: 1,
          fontFamily: FONT,
        }}
      >
        ↺
      </button>

      {added.slice(0, 4).map((id, i) => (
        <DialSlot
          key={i}
          ing={INGREDIENTS[id]}
          locked={!!potion}
          open={open}
          onRemove={() => removeIngredient(i)}
          outerRef={setSlotRef[i]}
        />
      ))}
    </div>
  );
}
