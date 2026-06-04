# My-Brew — Session Handover

## Project Overview
Scroll-driven 3D portfolio site. A witch's cauldron scene where the user scrolls through a camera journey: exterior view → approach → plunge into the liquid → descend through a full-screen HTML "liquid world" with section bubbles (About, Projects, Skills, Contact).

**Stack:** React 19, React Three Fiber, Three.js, GSAP ScrollTrigger, Tailwind CSS v4, Vite  
**Dev server:** `npm run dev` — runs on port 5173 (or 5174 if busy)

---

## Architecture

### Scroll journey (App.jsx)
- `useScrollProgress()` → `window.scrollY / (scrollHeight - innerHeight)` as 0→1
- **0–0.62**: 3D cauldron scene visible, camera moves via GSAP ScrollTrigger
- **0.62–0.76**: Crossfade: 3D canvas fades out (`canvasOpacity`), InnerWorld fades in (`transitionIn`)
- **0.76–1.0**: Full HTML liquid world; `innerProgress` drives bubble parallax
- `<div style={{ height: "700vh" }}` spacer drives the native scroll

### Camera path (Experience.jsx)
```js
const PATH = [
  { p: 0,    pos: [4, 1, 4],      look: [0, 0.5, 0]  }, // eye-level front-right start
  { p: 0.2,  pos: [2, 3, 3],      look: [0, 0.3, 0]  }, // rising / approaching
  { p: 0.38, pos: [0, 2, 0.5],    look: [0, 0.3, 0]  }, // above cauldron opening
  { p: 0.52, pos: [0, 0.5, 0.1],  look: [0, 0.3, 0]  }, // at liquid surface
  { p: 0.62, pos: [0, -0.25, 0],  look: [0, 0.3, 0]  }, // submerged (camera below surface)
];
```
Smoothstep easing between waypoints. Module-level `_pos`/`_look` Vector3s (no GC). Lerp factor 0.06 per frame.

### InnerWorld.jsx (HTML overlay)
- Reveals via `clip-path: ellipse(rx% ry% at 50% 0%)` — expands from the **top** (cauldron opening), not center. This simulates liquid closing over you from above.
- Liquid surface glow: large bright oval at top, shrinks as `innerProgress` increases (you're descending farther from the surface)
- Bubble `y` position: `(depth - innerProgress) * 140vh` — each bubble passes viewport center when `depth === innerProgress`
- 4 main section bubbles (About/Projects/Skills/Contact) + 12 mini decorative bubbles

---

## Current State / What Was Done This Session
- Replaced original OrbitControls + leva setup with scroll-driven `CameraRig`
- Built `InnerWorld.jsx` from scratch — dark purple liquid world, parallax bubbles
- Fixed fade timing: both canvas fade and InnerWorld reveal start at scroll **0.62** (after camera submerges, not before)
- Changed clip-path reveal from center-circle to top-ellipse (more immersive submersion feel)
- Changed starting camera from `[5,3,5]` (too far/high) to `[4,1,4]` (eye-level, matches original OrbitControls distance)
- Playwright test in `scroll.spec.ts` for visual verification (captures 6 snapshots to `C:/Users/usEr/AppData/Local/Temp/sXX.png`)

---

## What Still Needs Work

### High priority (user asked about these)
1. **Starting angle** — user says it doesn't match the "head file" feel yet. They liked the original OrbitControls view. Consider letting user pick an angle or trying `[4, 0, 4]` (even lower elevation) or checking if the cauldron feels too small/low in frame at `s00`.
2. **Dive-in transition** — user still felt they were "sitting on top" rather than inside the liquid. The top-ellipse clip helps but the hard clip edge at s68 (mid-transition) is still visible. Ideas:
   - Replace `clip-path` with `mask-image` for a soft gradient edge
   - Or use `backdrop-filter` + background-blend to make the transition less jarring
   - Or add a "liquid surface ripple" element that sits at the 3D→HTML boundary

### Nice-to-have
- Make section bubbles **clickable** — navigate/scroll to each content section
- Actually build the content sections (About, Projects, Skills, Contact pages/panels)
- Clean up `scroll.spec.ts` from project root when done testing
- The `Projects.jsx` (3D orbs scene) is unused dead code — can delete `src/sections/Scenes/Projects.jsx`

---

## Key Files
| File | Role |
|------|------|
| `src/App.jsx` | Scroll progress, canvas/InnerWorld timing, 700vh spacer |
| `src/sections/Experience.jsx` | R3F canvas, CameraRig, lights, cauldron |
| `src/sections/InnerWorld.jsx` | Full-screen HTML liquid world |
| `src/sections/Overlay.jsx` | Top-right menu button + slide-out menu |
| `src/components/Cauldron/` | 3D cauldron model + bubbles + aura |
| `scroll.spec.ts` | Playwright visual verification (temp, project root) |

---

## Verification Workflow
```bash
# Dev server should already be running on 5174, if not:
npm run dev

# Capture scroll journey snapshots:
npx playwright test scroll.spec.ts --reporter=line
# → saves s00/s40/s60/s68/s78/s95.png to C:/Users/usEr/AppData/Local/Temp/
```
Then read each PNG in Claude Code to visually inspect.

> Note: `scrollTo(0, scrollHeight * N)` ≠ progress N. Use `(scrollHeight - innerHeight) * N` to match `useScrollProgress()`.
