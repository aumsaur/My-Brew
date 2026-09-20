// Prop colours for the coffee corner.
//
// These are BAKED into the GLBs, so nothing here is required to render — the
// models look right on their own. This exists so JS can retune a colour without
// reopening Blender (see tint() below), and so the room's lighting/UI can pull
// from the same values the props use.
//
// Runtime-varying colour does NOT belong here: liquid in a cup, brew glow, hover
// highlight. Those are state and should be driven from the store, not constants.

export const PALETTE = {
  // fridge.glb
  fridgeShell: "#8fae96",
  fridgeDoor: "#9cbba3",
  fridgeShelf: "#eee7d8",
  chrome: "#d8d3c8",

  // espresso-machine.glb (Ascaso, hero)
  machineBody: "#7a7e82",
  machineChrome: "#d2d6d8",
  machineBlack: "#1e2022",
  machineGauge: "#eef2f4",
  machineGrate: "#303336",

  // espresso-machine-lo.glb (toy, fallback)
  toyMint: "#9ec9bd",
  toyCream: "#eff1eb",

  // room shell (CoffeeRoom.jsx) - plain meshStandardMaterial, not baked
  counterTop: "#8a6242",
  counterBody: "#7d5533",
  wall: "#e3d4ba",
  floor: "#4a3a2e",
};

// Every prop GLB carries its own materials, keyed by these names.
export const MATERIALS = {
  fridge: {
    shell: "m_shell",
    door: "m_door",
    shelf: "m_shelf",
    chrome: "m_chrome",
  },
  machine: {
    body: "m_a_body",
    chrome: "m_a_chrome",
    black: "m_a_black",
    gauge: "m_a_gauge",
    grate: "m_a_dark",
  },
};

/**
 * Override a baked material's colour at load time.
 *   tint(materials, { m_a_body: "#5f6367" })
 * Mutates the shared material from drei's cache, so it affects every instance —
 * which is what you want for a one-off prop, and what you do NOT want if the
 * model is ever instanced per-ingredient.
 */
export function tint(materials, overrides) {
  for (const [name, hex] of Object.entries(overrides)) {
    const m = materials[name];
    if (m?.color) m.color.set(hex);
  }
}
