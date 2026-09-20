import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Selection,
  Outline,
} from "@react-three/postprocessing";
import * as THREE from "three";
import CoffeeRoom from "@/features/coffee/scene/CoffeeRoom";
import InspectBlur from "@/features/coffee/scene/InspectBlur";
import Inventory from "@/features/coffee/ui/Inventory";
import StationPanel from "@/features/coffee/ui/StationPanel";
import DrinkCard from "@/features/coffee/ui/DrinkCard";
import ProjectCard from "@/features/coffee/ui/ProjectCard";
import StationControls from "@/features/coffee/ui/StationControls";
import { STASH_BY_NODE } from "@/features/coffee/data/stash";
import { OVERVIEW, useRouteBlend } from "@/features/coffee/cameraRoutes";
import { useCameraNudge } from "@/features/coffee/cameraOrbit";
import { clicksSwallowed, swallowClicks } from "@/features/coffee/clickGate";

// The site. One room, one canvas, and everything the room does.
//
// This was a standalone harness at /coffee.html for as long as the witch
// cauldron was still the site, and the shape of the file remembers it: almost
// all of it is framing and focus rather than content, because the room has no
// pages and no scroll, so WHERE THE CAMERA IS is the navigation. The witch app
// is gone now and index.html loads this.

// Props you PICK UP rather than walk to. The camera deliberately does not move
// for these — the prop flies to the lens instead (see Grinder.jsx). Routing the
// camera as well would send both toward each other and the prop ends up through
// the near plane.
const _vp = new THREE.Matrix4();

function Rig({ focused, using, handheld = null }) {
  const { camera, gl } = useThree();
  const blend = useRouteBlend(3.2);
  const pos = useRef(OVERVIEW.pos.clone());
  const look = useRef(OVERVIEW.look.clone());
  // The lean is written HERE, never back into `pos`. See the note in useFrame.
  const out = useRef(OVERVIEW.pos.clone());

  // In-use beats focus: while you hold a station you get its close handling
  // framing, not the standing-back view.
  // THE CAMERA STAYS AT THE STATION WHILE YOU HOLD SOMETHING.
  //
  // A prop in hand is positioned from the camera, so for a while this
  // returned no route at all when something was held — which meant picking
  // the grinder up flung the camera back out to the overview, a jump that
  // read as the interaction throwing you out of the station. It is in your
  // HANDS; you have not gone anywhere. Park at the station's route and let
  // the held prop sit in front of it.
  const target = using ?? focused;
  const key = handheld
    ? focused
    : target
      ? using
        ? `${using}:inspect`
        : focused
      : null;

  // Drag to lean a few degrees around whatever the camera is looking at. It is
  // disabled while a station is being HELD — the roaster's button and the
  // grinder's crank are press-and-hold, and a drag that started on them is
  // part of that gesture, not a request to move the camera.
  const nudge = useCameraNudge({
    enabled: !using,
    resetKey: key ?? "overview",
  });

  useFrame((_state, delta) => {
    const { pos: p, look: l } = blend(OVERVIEW.pos, OVERVIEW.look, key, delta);
    // damp, not a fixed-alpha lerp, so the follow is frame-rate independent
    pos.current.x = THREE.MathUtils.damp(pos.current.x, p.x, 5, delta);
    pos.current.y = THREE.MathUtils.damp(pos.current.y, p.y, 5, delta);
    pos.current.z = THREE.MathUtils.damp(pos.current.z, p.z, 5, delta);
    look.current.x = THREE.MathUtils.damp(look.current.x, l.x, 5, delta);
    look.current.y = THREE.MathUtils.damp(look.current.y, l.y, 5, delta);
    look.current.z = THREE.MathUtils.damp(look.current.z, l.z, 5, delta);

    // The lean is applied AFTER the route, into a SEPARATE vector.
    //
    // It must never be written back into `pos`, which is the route's own
    // damped state. Leaning it in place makes the next frame damp FROM the
    // leaned pose and then lean again, compounding every frame: the camera
    // settles at roughly a quarter of its framing distance and the path
    // between stations warps as it goes. That is one line's difference and it
    // looks like the orbit is broken rather than the rig.
    out.current.copy(pos.current);
    nudge(out.current, look.current, delta);
    camera.position.copy(out.current);
    camera.lookAt(look.current);

    // Dev-only test hooks. The camera is the thing worth asserting on here and
    // it lives entirely inside WebGL, so a headless check has nothing to read
    // — and a pixel hash cannot tell "the camera moved" from "the drum spun".
    // `look` is here too so a test can check the orbit PRESERVES RADIUS, which
    // is what distinguishes a lean from the feedback loop above.
    if (import.meta.env.DEV) {
      const v3 = (v) => `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`;
      const el = gl.domElement;
      el.dataset.cam = v3(out.current);
      el.dataset.look = v3(look.current);
      el.dataset.route = v3(pos.current);
      // The view-projection matrix, so a headless test can aim at a THING
      // rather than a pixel — every camera tweak used to invalidate every
      // hard-coded coordinate in every test script.
      //
      // Published as DOM data, not as a window function: the automation
      // driver evaluates in an isolated world, where the DOM is shared but
      // anything the page hangs off `window` is invisible.
      camera.updateMatrixWorld();
      _vp.copy(camera.projectionMatrix).multiply(camera.matrixWorldInverse);
      el.dataset.vp = _vp.elements.map((n) => n.toFixed(6)).join(",");
    }
  });
  return null;
}

export default function CoffeeApp() {
  const [focused, setFocused] = useState(null);
  const [flow, setFlow] = useState(null);
  const [using, setUsing] = useState(null);
  const [picked, setPicked] = useState(false); // the grinder is in hand
  const [stash, setStash] = useState(null); // fridge item node name
  const [heldDist, setHeldDist] = useState(0.4); // plane the held thing sits on
  const handleUsing = setUsing;

  // Walking away from the fridge closes the door, so the card it opened goes
  // with it. Anything else would leave a project pinned to the screen while
  // you stand at the espresso machine.
  useEffect(() => {
    if (focused !== "fridge") setStash(null);
  }, [focused]);

  // ONE way out, used by both Esc and a click on empty space, because they
  // mean the same thing and were doing different things: Esc backed out a
  // layer at a time while a click cleared `focused`, which cascaded through
  // the effect above and put the item back AND shut the fridge in one go.
  // Backing out of two things with one gesture is never what you wanted.
  const stashRef = useRef(null);
  stashRef.current = stash;
  const backOut = useCallback(() => {
    if (stashRef.current)
      setStash(null); // put the item back, stay in the fridge
    else setFocused(null); // then leave the station
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") backOut();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [backOut]);

  // Two things can be in hand: a counter prop the camera does not fly to, and
  // a grocery lifted out of the fridge. Both want the room thrown out of
  // focus; only the second changes where that focus plane sits.
  const holdingItem = stash !== null;
  const inspecting = picked || holdingItem;

  return (
    <div
      // Dev-only test hooks. This scene's entire state is pixels, so a
      // headless check has nothing to assert on without them — but they are
      // debug scaffolding, not part of the page, so they do not ship.
      {...(import.meta.env.DEV
        ? {
            "data-focused": focused ?? "",
            "data-stash": stash ?? "",
            "data-blur": String(heldDist),
            // the animation clock, so a headless check can sample a
            // sequence at a KNOWN moment. Screenshots at arbitrary frames
            // cannot tell "fixed" from "caught it at a lucky frame".
            "data-phase": flow?.phase ?? "",
            "data-phaset": flow?.phase ? flow.phaseT.toFixed(3) : "",
            "data-pours": (flow?.pours ?? []).join(","),
            "data-pouring": flow?.pouring ?? "",
            "data-glass": flow?.glass ?? "",
            "data-stocked": (flow?.stocked ?? []).join(","),
            "data-steamed": flow?.steamed ? "1" : "",
            "data-art": flow?.art ? "1" : "",
            "data-stirred": flow?.stirred ? "1" : "",
            "data-next": flow?.next ?? "",
          }
        : null)}
      style={{ position: "fixed", inset: 0, background: "#20191a" }}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 42, position: OVERVIEW.pos.toArray() }}
        onPointerMissed={() => {
          // a release that ended a hold or an orbit drag is not a click on
          // empty space, however much it looks like one
          if (!clicksSwallowed()) backOut();
        }}
      >
        <color attach="background" args={["#20191a"]} />
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[-2.4, 3.2, 2.6]}
          intensity={1.15}
          color="#ffe6c6"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight
          position={[2.6, 1.8, 1.4]}
          intensity={0.5}
          color="#c3d6ff"
        />
        <Environment
          preset="apartment"
          background={false}
          environmentIntensity={0.35}
        />

        {/* BEFORE the room, on purpose: a held prop is positioned from the
            camera's transform, so the camera has to be moved for this frame
            before anything reads it. Mount this after and the grinder lags a
            frame behind the view and jitters. */}
        <Rig focused={focused} using={using} handheld={picked} />

        <Selection>
          <EffectComposer multisampling={0} autoClear={false}>
            <Outline
              blur
              edgeStrength={3.2}
              visibleEdgeColor={0xffd9a0}
              hiddenEdgeColor={0x000000}
            />
            <InspectBlur active={inspecting} distance={heldDist} />
            <Bloom intensity={0.32} luminanceThreshold={0.85} mipmapBlur />
          </EffectComposer>
          <Suspense fallback={null}>
            <CoffeeRoom
              focused={focused}
              onFocus={setFocused}
              onFlow={setFlow}
              onUsing={handleUsing}
              picked={picked}
              onPicked={setPicked}
              onHoldEnd={swallowClicks}
              stashItem={stash}
              onStashItem={setStash}
              onStashDistance={setHeldDist}
            />
          </Suspense>
        </Selection>
      </Canvas>

      {!holdingItem && (
        <Inventory
          bean={flow?.beanData ?? null}
          roast={flow?.roast ?? 0}
          ground={flow?.ground ?? 0}
          shot={flow?.shot ?? 0}
          onClear={flow?.reset}
        />
      )}

      {/* Only at a station, and only that station's own bar. The receipt
          restates every number, so it is not wanted over that either. */}
      {!holdingItem && flow?.stage !== "served" && (
        <StationPanel flow={flow} focused={focused} picked={picked} />
      )}

      {!holdingItem && (
        <DrinkCard
          flow={flow}
          onAgain={() => {
            flow?.reset();
            setFocused(null);
          }}
        />
      )}

      <ProjectCard
        stash={stash ? STASH_BY_NODE[stash] : null}
        onClose={() => setStash(null)}
      />

      {/* The station's own controls are the props themselves; these are the
          floor under them — see ui/StationControls. */}
      {!holdingItem && flow?.stage !== "served" && (
        <StationControls
          focused={focused}
          picked={picked}
          onExit={() => setFocused(null)}
          onPutDown={() => setPicked(false)}
        />
      )}

      <div
        style={{
          // Top, and inboard of the signpost. Bottom-left is not available
          // — that band belongs to the exit button and the station panel —
          // and left:16 is not available either: the signpost hangs there.
          // It is pointerEvents:none either way, so the worst an overlap
          // can do is look untidy; it can never eat a click meant for a
          // sign.
          position: "absolute",
          left: 420,
          top: 16,
          maxWidth: 380,
          font: "12px ui-monospace, monospace",
          color: "#d9cfc2",
          background: "#00000066",
          padding: "10px 12px",
          borderRadius: 8,
          lineHeight: 1.7,
          pointerEvents: "none",
        }}
      >
        <div>
          <b>click</b> a station — or its <b>sign</b> — to fly to it. What it
          does once you are there is written at the bottom of the screen.
        </div>
        <div>
          <b>drag</b> to lean · <b>scroll</b> to ease in · <b>esc</b> to back
          out
        </div>
        <div style={{ color: "#ffd9a0", marginTop: 4 }}>
          <b>{flow?.stage ?? "pick"}</b> — {flow?.hint ?? "pick a bean"}
        </div>
      </div>
    </div>
  );
}
