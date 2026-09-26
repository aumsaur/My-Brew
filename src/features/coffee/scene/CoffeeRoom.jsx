import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import Fridge from "@/features/coffee/scene/Fridge";
import EspressoMachine from "@/features/coffee/scene/EspressoMachine";
import Grinder from "@/features/coffee/scene/Grinder";
import Roaster from "@/features/coffee/scene/Roaster";
import BeanShelf from "@/features/coffee/scene/BeanShelf";
import Beacon from "@/features/coffee/scene/Beacon";
import ServeStation from "@/features/coffee/scene/ServeStation";
import WallSign from "@/features/coffee/scene/WallSign";
import StashShelf from "@/features/coffee/scene/StashShelf";
import { PALETTE } from "@/features/coffee/palette";
import { LAYOUT, steamPose, cupPose } from "@/features/coffee/layout";
import { useBrewFlow } from "@/features/coffee/useBrewFlow";
import { clicksSwallowed, swallowClicks } from "@/features/coffee/clickGate";
import { StationIds } from "@/features/coffee/scene/SceneIds";
import DisplayCase from "@/features/coffee/scene/DisplayCase";

// The coffee corner: ONE static room. The camera translates between stations
// rather than the room changing - see ../cameraRoutes.js, whose poses are tuned
// against LAYOUT. Move a station there and its route has to move too.

// where a jug stands to be steamed — a fact about the MACHINE, measured
// from its GLB in layout.js
const WAND = steamPose();
const MACHINE_CUP = cupPose();

export default function CoffeeRoom({
  focused = null,
  onFocus,
  onFlow,
  onUsing,
  // The grinder in hand. LIFTED, because the HUD needs to be able to put it
  // down again and the camera rig needs to know it is held.
  picked = false,
  onPicked,
  onHoldEnd,
  onStashItem, // a cake was clicked -> open its project card
  // how far the held GRINDER is from the camera, so InspectBlur can focus
  // on its plane. It was called onStashDistance back when the fridge's
  // groceries were the only thing that flew to you; the grinder is the
  // last holder of that behaviour now.
  onHeldDistance,
}) {
  const [holding, setHolding] = useState(null); // 'roast' | 'grind' | 'pull' | null
  const [jugUp, setJugUp] = useState(false); // milk jug carried to the wand
  const flow = useBrewFlow();
  const { counter } = LAYOUT;

  // Walk away and you put it down. Without this the grinder stays in hand
  // across the room and the camera has nothing to fly back to.
  useEffect(() => {
    if (focused !== "grinder" && picked) onPicked?.(false);
  }, [focused, picked, onPicked]);

  // surface the loop state so the HUD (or a real store later) can read it.
  // In an effect, NOT in render: calling a parent setter mid-render triggers
  // "cannot update a component while rendering a different component".
  useEffect(() => {
    onFlow?.(flow);
  }, [onFlow, flow]);

  // The fridge stocks directly now — StashShelf calls flow.stock. The
  // bridge that used to live here turned "you are holding a project card"
  // into "you have the milk", which only made sense while the groceries
  // were projects in disguise.
  // which station is actively being held, so the rig can switch to its close
  // handling framing rather than watching from across the counter
  useEffect(() => {
    onUsing?.(
      holding === "roast" ? "roaster" : holding === "grind" ? "grinder" : null
    );
  }, [onUsing, holding]);

  // ARE WE STANDING AT IT. Every station's controls are gated on this, so
  // the first click on anything is "take me there" and the second is the
  // actual gesture. The fridge always worked this way — its groceries need
  // the door open — and the rest of the room did not, which is why the
  // camera moves felt optional.
  const at = (k) => focused === k;

  // Focus toggles: clicking the focused station releases the camera.
  //
  // But swallow the click that ends a hold OR an orbit drag — see clickGate.js
  // for why that gate is shared rather than a ref in this file.
  const focus = (key) => () => {
    if (clicksSwallowed()) return;
    onFocus?.(focused === key ? null : key);
  };
  const endHold = () => {
    swallowClicks();
    onHoldEnd?.();
  };

  // the jug carries itself back once it has been steamed — leaving it parked
  // under the wand would block the cup you are about to look at
  useEffect(() => {
    if (flow.steamed && jugUp) setJugUp(false);
  }, [flow.steamed, jugUp]);

  // Last-resort release. Every hold is pointer-captured, so the station's own
  // pointerup normally lands — but a capture lost to the browser, a pointer
  // leaving the window, or a release over a different element would otherwise
  // leave the machine running with the mouse already up. A stuck grind is the
  // worst failure this loop has, so it gets a net at the window level.
  useEffect(() => {
    if (!holding) return undefined;
    const stop = () => {
      if (holding === "roast") flow.releaseRoast(); // no-op if already released
      if (holding === "grind") flow.releaseGrind(); // ditto -- see releaseGrind
      if (holding === "pull") flow.pullShot();
      setHolding(null);
      swallowClicks();
      onHoldEnd?.();
    };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    return () => {
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, [holding, flow, onHoldEnd]);

  return (
    <group>
      {/* room shell */}
      <mesh position={[0, 1.5, -0.42]} receiveShadow>
        <boxGeometry args={[6, 3, 0.08]} />
        <meshStandardMaterial color={PALETTE.wall} roughness={0.95} />
      </mesh>
      <mesh
        position={[0, 0, 0.6]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color={PALETTE.floor} roughness={0.9} />
      </mesh>

      {/* counter */}
      <mesh position={[0, counter.h - 0.04, 0]} receiveShadow castShadow>
        <boxGeometry args={[counter.w, 0.08, counter.d]} />
        <meshStandardMaterial color={PALETTE.counterTop} roughness={0.7} />
      </mesh>
      <mesh position={[0, (counter.h - 0.08) / 2, -0.03]} receiveShadow>
        <boxGeometry
          args={[counter.w - 0.1, counter.h - 0.08, counter.d - 0.1]}
        />
        <meshStandardMaterial color={PALETTE.counterBody} roughness={0.8} />
      </mesh>

      {/* wall shelf the bean bags live on */}
      <mesh
        position={[LAYOUT.shelf.x, LAYOUT.shelf.y, LAYOUT.shelf.z]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[LAYOUT.shelf.w, LAYOUT.shelf.t, LAYOUT.shelf.d]} />
        <meshStandardMaterial color={PALETTE.counterTop} roughness={0.75} />
      </mesh>

      {/* board under the small props - connective tissue, so the roaster and
          grinder read as one station instead of two stranded objects */}
      <mesh position={LAYOUT.board.pos} receiveShadow castShadow>
        <boxGeometry args={[LAYOUT.board.w, LAYOUT.board.t, LAYOUT.board.d]} />
        <meshStandardMaterial color={PALETTE.counterBody} roughness={0.72} />
      </mesh>

      {/* Two beats: seat the portafilter, then hold the knobs to pull. The
          machine used to be the hero of the scene and the only station that
          did nothing — the loop ended on a shrug at the thing you were meant
          to be impressed by. */}
      <StationIds />
      <EspressoMachine
        position={LAYOUT.machine.pos}
        scale={LAYOUT.machine.scale}
        label="MY-BREW"
        grounds={flow.ground}
        portafilterOut={flow.canLock}
        lockable={flow.canLock && at("machine")}
        pourable={flow.canPull && at("machine")}
        // the cup leaves with the shot: from the finishing stage on it is at
        // the serve station being poured out of, not under the group head
        cup={flow.locked && flow.stage === "brew"}
        shot={flow.shot}
        roast={flow.roast}
        brewing={holding === "pull"}
        // the wand is a SECOND target on the machine, because one click on
        // the jug cannot mean both "take this to be steamed" and "pour it".
        // Two objects, two meanings, and steaming stays optional — cold milk
        // makes a latte, textured milk makes one with a pattern on it.
        steamable={flow.canSteam && at("machine")}
        onSteam={() => {
          setJugUp(true);
          flow.steam();
        }}
        onLock={flow.lockPortafilter}
        onPourDown={() => setHolding("pull")}
        onPourUp={() => {
          if (holding === "pull") flow.pullShot();
          setHolding(null);
          endHold();
        }}
        onClick={focus("machine")}
      />

      {/* hold-to-run: the button depresses, drum spins, element heats, and the
          bean mass walks the roast ladder while held */}
      <Roaster
        position={LAYOUT.roaster.pos}
        scale={LAYOUT.roaster.scale}
        running={holding === "roast"}
        enabled={flow.canRoast && at("roaster")}
        // THE DRUM IS EMPTY UNTIL YOU TIP THE BAG IN. It used to fill on
        // `bean !== null`, which is the shelf, not the roaster -- so the
        // station had done its own first step before you got there.
        hasBeans={flow.charged}
        roast={flow.roast}
        onPointerDown={() => setHolding("roast")}
        onPointerUp={() => {
          if (holding === "roast") flow.releaseRoast();
          setHolding(null);
          endHold(); // synchronous: beats the click that follows pointerup
        }}
        // Standing at it with a bag in hand, the click LOADS instead of
        // leaving — the one gesture the station is waiting for, on the
        // object it happens to. Everywhere else it is the focus toggle.
        onClick={() =>
          at("roaster") && flow.canLoadRoaster && !clicksSwallowed()
            ? flow.loadRoaster()
            : focus("roaster")()
        }
      />

      {/* Handheld, and TWO separate gestures on purpose:
            press it on the board  -> pick it up, nothing else
            press it once in hand  -> grind while held
          Doing both on the first press meant the act of entering inspection
          also started grinding, so you could never look at the thing without
          using it. Picking up is not using. */}
      <Grinder
        position={LAYOUT.grinder.pos}
        scale={LAYOUT.grinder.scale}
        modelCentre={LAYOUT.grinder.model.c}
        modelHeight={LAYOUT.grinder.model.size[1]}
        onHeldDistance={onHeldDistance}
        held={picked}
        cranking={holding === "grind"}
        enabled={flow.canGrind}
        // THREE beats now, not two: go to it, pick it up, then crank. The
        // middle one used to be missing — pressing the grinder from across
        // the room put it straight in your hands, so the one prop you
        // actually hold was the one you never travelled to.
        onPointerDown={() => {
          if (!at("grinder")) onFocus?.("grinder");
          else if (!picked) onPicked?.(true);
          else setHolding("grind");
        }}
        onPointerUp={() => {
          // WHERE YOU LET GO IS THE GRIND, same as the roaster above. Both
          // this and the window-level net call it, because a pointerup that
          // happens off the canvas never reaches here.
          if (holding === "grind") flow.releaseGrind();
          setHolding(null);
          // swallow the click that follows, either way: on the pickup press it
          // would toggle focus straight back off and put the grinder down
          // again, and on a grind press it would do the same on release
          endHold();
        }}
        onClick={focus("grinder")}
      />

      {/* The finishing station: steam, add, ring. This is where a shot
          becomes a drink with a name — see data/drinks.js. */}
      <ServeStation
        position={LAYOUT.serve.pos}
        active={flow.canFinish && at("serve")}
        arrived={at("serve")}
        glass={flow.glass}
        stocked={flow.stocked}
        shot={flow.shot}
        roast={flow.roast}
        steamed={flow.steamed}
        stirred={flow.stirred}
        pours={flow.pours}
        pouring={flow.pouring}
        pourable={flow.pourable}
        canServe={flow.canServe}
        canTakeGlass={flow.canTakeGlass}
        canStir={flow.canStir}
        atWand={jugUp}
        wandPose={WAND}
        cupFrom={MACHINE_CUP}
        hasShot={flow.stage === "finish" || flow.stage === "served"}
        phase={flow.phase}
        phaseT={flow.phaseT}
        onTakeGlass={flow.takeGlass}
        onStir={flow.stir}
        onPour={flow.pour}
        onServe={flow.serve}
        onClick={focus("serve")}
      />

      {/* Clicking the bag you already hold PUTS IT BACK. Picking a different
          origin still swaps (and still discards the roast, as it must — they
          are different beans), but there was no way at all to end up
          empty-handed again, so switching looked like the only thing a bag
          click could ever do. */}
      <BeanShelf
        position={LAYOUT.beans.pos}
        scale={LAYOUT.beans.scale}
        selectedId={flow.bean}
        active={at("beans")}
        onFocus={focus("beans")}
        // Clicking the bag you are already carrying puts it BACK, and that
        // is all it does now: it used to call reset(), which also emptied
        // the glass you had prepped on the way past.
        onSelect={(id) =>
          flow.bean === id ? flow.clearBean() : flow.pickBean(id)
        }
      />

      {/* THE PORTFOLIO, behind glass in the counter's front. It used to hide
          on the fridge's shelves dressed as groceries; a cake case is a thing
          a cafe labels, so the project name on the plate is the furniture
          doing its job rather than a joke that only lands once. */}
      <DisplayCase
        active={at("display")}
        onPick={onStashItem}
        onClick={focus("display")}
      />

      {/* The fridge opens as the camera arrives — one gesture, one beat. */}
      <Fridge
        position={LAYOUT.fridge.pos}
        scale={LAYOUT.fridge.scale}
        open={focused === "fridge"}
        onClick={focus("fridge")}
      />

      {/* plain groceries now — the portfolio is in the cake case. Clicking
          one stocks it straight into the hotbar; see data/stash.js */}
      <StashShelf
        open={focused === "fridge"}
        stocked={flow.stocked}
        onStock={flow.stock}
      />

      {/* points at the next station, so the loop is legible without reading.
          Progress is the HUD's job now — see ui/BrewMeter. */}
      {/* The shop's signage, and the way around the room. Clicking a station
          only works when the station is on screen — from the serve station the
          machine is off frame, so crossing the room took a trip out to the
          overview and back in. These are always up there. */}
      <WallSign
        focused={focused}
        next={flow.next}
        onPick={(key) => focus(key)()}
      />

      <Beacon station={flow.next} busy={focused !== null || holding !== null} />

      <Ticker
        active={holding === "roast" && flow.canRoast}
        rate={0.18} // ~5.5s green to burnt
        onTick={flow.addRoast}
      />
      <Ticker
        active={holding === "grind" && flow.canGrind}
        rate={0.45} // ~2.2s to a full grind
        onTick={flow.addGrind}
      />
      <Ticker
        active={holding === "pull" && flow.canPull}
        rate={0.3} // ~3.3s from empty to a long one
        onTick={flow.addShot}
      />
      {/* the animation clock. One Ticker for every played sequence, because
          they are all "advance a 0..1 and land the result at the end" */}
      <Ticker
        active={flow.phase !== null}
        rate={
          flow.phase === "serve"
            ? 1.15
            : flow.phase === "stir"
              ? 0.62
              : flow.phase === "pour"
                ? 0.5
                : 0.45
        } // ~0.9s ring, ~2.0s pour, ~2.2s steam. A pour is carry + tip + run
        // + tip back + carry home; at 1.2s none of those beats registered.
        onTick={flow.advance}
      />
    </group>
  );
}

// Advances a held action. Split out so CoffeeRoom stays declarative and does
// not need its own useFrame.
function Ticker({ active, rate, onTick }) {
  useFrame((_s, delta) => {
    if (active) onTick(delta * rate);
  });
  return null;
}
