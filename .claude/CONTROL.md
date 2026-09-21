# Naming things in the room

Press **F2** in the app to paint an id on every addressable thing. **Click a
badge to copy its id.** F2 again to hide them.

The point is to be able to say *"make `scene.serve.lid` bigger"* instead of
*"the ice lid thing"* — and for that to land on the first try.

Works in `npm run dev` **and** in the built site. It is deliberately not gated
on `import.meta.env.DEV`: the dev-only hooks on the wrapper `<div>` cannot be
used against a production build, and this is the tool for saying what is wrong
with the deployed page.

Blue badges are DOM (`ui.*`), amber ones are 3D (`scene.*`). The strip along
the bottom counts what is currently on screen.

---

## The rule for ids

**Structural, never positional.** `ui.inventory.ring.roast` survives a
re-layout; `ui.panel.3` is wrong the moment anything moves.

A badge only appears when its thing is **on screen and visible**. That is not a
bug: the scoop is hidden until the ice lid opens, the carton until you have
been to the fridge, and the station panel only exists while you are at a
station. If an id is missing, go to where that thing lives and press F2 again.

---

## `scene.*` — things in the room

| id | what |
|---|---|
| `scene.station.serve` | the finishing bar, at its `LAYOUT.serve` centre |
| `scene.station.machine` | the espresso machine |
| `scene.station.roaster` | the roaster |
| `scene.station.grinder` | the hand grinder |
| `scene.station.beans` | the bean shelf on the wall |
| `scene.station.fridge` | the cold store |
| `scene.station.display` | the cake case set into the counter's front — the portfolio |
| `scene.serve.lid` | the ice well's hinged lid |
| `scene.serve.well` | the ice well itself (a hole, so this is a marker at its centre) |
| `scene.serve.scoop` | the ice scoop — only once the lid has opened |
| `scene.serve.carton` | the milk carton — only once fetched from the fridge |

`scene.station.*` names the **`layout.js` entry**, which is what a "move it"
request actually edits. The others name a real object and follow it when it
moves, so the scoop's badge rides along during a pour.

## `ui.*` — things on the glass

| id | what | when |
|---|---|---|
| `ui.inventory` | the IN HAND panel, top right | always |
| `ui.inventory.ring.roast` | the roast state ring | with a bean in hand |
| `ui.inventory.ring.grind` | the grind state ring | with a bean in hand |
| `ui.inventory.ring.shot` | the shot state ring | with a bean in hand |
| `ui.inventory.clear` | the "put back" button | with a bean in hand |
| `ui.station-panel` | the bottom panel: what this station does, and its bar | at a station |
| `ui.exit` | the accented "back to the room" button | at a station |
| `ui.project-card` | the project card from a fridge grocery | holding a grocery |
| `ui.drink-card` | the receipt at the end of the loop | once served |

---

## Adding an id

- **DOM:** spread `{...uiId("thing")}` onto the element. `uiId` is in
  `src/features/coffee/ids.js`; the `ui.` prefix is added for you.
- **3D, static:** `<IdTag id="scene.thing" position={[x, y, z]} />` from
  `scene/SceneIds`. Put the position **on the IdTag**, not on a child — the
  registry reads the tagged object's own world position, and an offset on a
  child silently reports the parent's origin instead.
- **3D, already has a ref the frame loop drives:** bind both refs rather than
  wrapping it in another group, or the wrapper sits between a measured prop
  and its position. See `bind()` in `scene/ServeStation.jsx`.

Registry and hooks: `src/features/coffee/ids.js`. Projection:
`src/features/coffee/scene/SceneIds.jsx`. Badges: `src/features/coffee/ui/IdOverlay.jsx`.
