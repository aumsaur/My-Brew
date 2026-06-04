// Registry of click targets in the OUTER world. `pos` is world-space (matches
// the coords used in Experience.jsx / WitchNook.jsx); `radius` sizes the marker
// ring. `active: true` = already wired to a handler; false = planned/decor, not
// clickable yet. Add an entry here to plan a new hotspot — the debug overlay
// draws it so you can eyeball the position before wiring it up.
export const HOTSPOTS = [
  {
    id: "cauldron",
    label: "Cauldron",
    hint: "click → open brew dial",
    pos: [0, 0.25, 0],
    color: "#88ce02",
    radius: 1.25,
    active: true,
  },
  {
    id: "spellbook",
    label: "Spellbook",
    hint: "decor — not wired",
    pos: [-2.4, -2.05, 1.8],
    color: "#caa24a",
    radius: 0.6,
    active: false,
  },
  {
    id: "bottles",
    label: "Potion bottles",
    hint: "decor — not wired",
    pos: [3.0, -2.05, 1.85],
    color: "#5ed0a8",
    radius: 0.6,
    active: false,
  },
];
