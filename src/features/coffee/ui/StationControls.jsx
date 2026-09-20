import { useState } from "react";

// The way back out of a station, and nothing else.
//
// This briefly also held a button for whatever the station would accept —
// "hold to roast", "hold to pull the shot" — because the 3D controls were
// hard to hit. That was the right problem and the wrong fix: putting the
// verb on a HUD button takes it off the object, and operating the object is
// the entire reason the object was modelled. The hit targets grew instead,
// so once the camera is at a station, pressing ANYWHERE on that station's
// model does whatever it is that station does. What was missing was not a
// button but a sentence, and that lives in ui/StationPanel now.
//
// Leaving stays a button, because leaving is not a thing in the room. Esc
// always worked and nothing on screen ever said so.
//
// IT IS A LOUD BUTTON ON PURPOSE. It was a ghost — dark on a dark room, one
// hairline border — and it read as chrome rather than as the way out;
// "i barely notice that button". The only other warm-filled thing on screen
// is the signpost, which is also navigation, so filling this one puts the
// two ways of moving in the same colour. The esc key is printed on the
// button rather than whispered under it, because a keycap IS the label.
const FILL = "#e0a05e";

export default function StationControls({
  focused = null,
  picked = false,
  onExit,
  onPutDown,
}) {
  const [hover, setHover] = useState(false);

  // Two steps when something is in your hand, because putting the grinder
  // down and walking away are two different things you might want.
  const exit = picked
    ? { label: "put the grinder down", go: onPutDown }
    : focused
      ? { label: "back to the room", go: onExit }
      : null;
  if (!exit) return null;

  return (
    <button
      type="button"
      onClick={() => exit.go?.()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "absolute",
        left: 16,
        bottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 10,
        font: "12.5px ui-monospace, monospace",
        letterSpacing: 0.4,
        color: "#20191a",
        background: hover ? "#f0b571" : FILL,
        border: "none",
        borderRadius: 9,
        padding: "11px 14px",
        boxShadow: hover
          ? "0 8px 24px #00000080, 0 0 0 3px #e0a05e3d"
          : "0 6px 18px #00000066",
        cursor: "pointer",
        transition: "background .15s, box-shadow .15s",
      }}
    >
      <span style={{ fontSize: 14, lineHeight: 1 }}>←</span>
      <span>{exit.label}</span>
      {/* a keycap, not a footnote */}
      <span
        style={{
          fontSize: 10,
          letterSpacing: 0.8,
          padding: "2px 6px",
          borderRadius: 4,
          background: "#20191a26",
          border: "1px solid #20191a33",
        }}
      >
        esc
      </span>
    </button>
  );
}
