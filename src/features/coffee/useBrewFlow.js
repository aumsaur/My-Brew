import { useCallback, useEffect, useMemo, useState } from "react";
import { BEANS_BY_ID } from "@/features/coffee/data/beans";
import { resolveDrink, hasArt } from "@/features/coffee/data/drinks";

// The brew loop. Stations are gated on it, so you cannot roast with nothing in
// the drum or grind beans you never roasted.
//
// pick -> roast -> grind -> brew -> finish -> served
//
// Deliberately forgiving in one direction: picking a different bean at any
// point resets the chain rather than being refused. Being told "no" for
// reasons you did not know about is worse than losing progress you can see.
export const STAGES = ["pick", "roast", "grind", "brew", "finish", "served"];

// Roast has to clear this before the beans are grindable — under it they are
// still green. Over BURNT_AT they are burnt: grindable, but the brew suffers.
export const MIN_ROAST = 0.22;
export const BURNT_AT = 0.85;

// Pulling the shot. Same shape as the roast: a floor you must clear, a window
// that is actually good, and an overshoot that is legal but worse. The machine
// was the one station with no mechanic at all — it looked like the hero and
// did nothing, which made the whole loop end on a shrug.
//
// These land ON the SHOT_ORDER band boundaries (four equal quarters) rather
// than near them, so the meter's green window IS the `normale` band and its
// red zone IS `bitter`. Off by a few percent and the bar contradicts its own
// labels, which is worse than having no labels.
export const SHOT_MIN = 0.25; // = the ristretto/normale boundary
export const SHOT_GOOD = [0.25, 0.5]; // exactly the `normale` band
export const SHOT_OVER = 0.75; // = where `bitter` starts

// What the FRIDGE holds. These three cannot be poured until you have been and
// got them, which is the point: the groceries on its shelves are the
// portfolio, so a milk drink cannot be made without opening the door and
// meeting a project. Water and ICE live at the bar — the well is part of the
// counter and a cafe's well is never empty — so a black coffee, hot or
// iced, is still reachable without the trip.
export const FROM_FRIDGE = ["milk", "orange", "chocolate"];

// Which station each stage happens at. `finish` is deliberately absent — it
// is the one stage that can want either the bar or the fridge, and that is
// decided below where `stocked` is in scope.
const NEXT_STATION = {
  pick: "beans",
  roast: "roaster",
  grind: "grinder",
  brew: "machine",
};

/**
 * One line telling the player what the loop wants next.
 *
 * A function, not a nested ternary. It was six levels deep by the time the
 * finishing stage arrived, and a branch got added to the wrong nesting level
 * without anything failing — the loop just quietly told you to pick another
 * bean while you were standing at the milk bar.
 */
function hintFor({
  stage,
  roast,
  burnt,
  locked,
  shot,
  pours,
  glass,
  stocked,
  stirred,
  phase,
}) {
  if (phase === "steam") return "steaming the milk…";
  if (phase === "stir") return "stirring…";
  if (phase === "pour") return "pouring…";
  if (phase === "serve") return "serving…";
  if (stage === "pick") return "pick a bean from the shelf";

  if (stage === "roast") {
    return roast < MIN_ROAST
      ? "press and hold the roaster — beans are still green"
      : "keep roasting, or let go to grind";
  }

  if (stage === "grind") {
    return burnt
      ? "burnt. grind it anyway, or pick a fresh bean"
      : "pick the grinder up, then press and hold it";
  }

  if (stage === "brew") {
    if (!locked) return "click the machine — the portafilter goes in";
    if (shot < SHOT_MIN) return "press and hold the machine — pull the shot";
    if (shot > SHOT_OVER) return "that is a long one. let go";
    return "let go when it looks right";
  }

  if (stage === "finish") {
    if (!glass) {
      return "take a glass off the shelf — a cup, or a tall one for ice";
    }
    if (!stocked.length) {
      return "ice is in the well. the cold store has milk, juice and chocolate";
    }
    if (!pours.includes("espresso")) {
      return "pour the shot in whenever you like. the order is the drink";
    }
    if (pours.filter((k) => k !== "ice").length > 1 && !stirred) {
      return "ring the bell — or click the drink to stir it into one colour";
    }
    return "pour anything else in, then ring the bell";
  }

  return "pick another bean to start again";
}

export function useBrewFlow() {
  const [stage, setStage] = useState("pick");
  const [bean, setBean] = useState(null);
  const [roast, setRoast] = useState(0);
  const [ground, setGround] = useState(0);
  const [locked, setLocked] = useState(false); // portafilter in the group head
  const [shot, setShot] = useState(0);
  // The finishing station records a SEQUENCE, not a set of switches: what went
  // into the glass and in what order. Long black and americano are the same
  // two ingredients in opposite orders, and so are latte and latte macchiato.
  const [pours, setPours] = useState([]);
  // WHICH vessel is on the mat: 'mug' | 'tall' | null. Not a boolean, because
  // a cafe uses two and picks by the order — ice means a tall glass.
  const [glass, setGlass] = useState(null);
  // Fetched from the fridge. SEPARATE from the stash item you are holding:
  // that one is cleared by backing out of the card, and un-stocking the milk
  // because someone put the carton back down would be a nasty surprise.
  const [stocked, setStocked] = useState([]);
  const [steamed, setSteamed] = useState(false); // milk is in the jug, textured
  // Stirred through. The bands ARE the drink's story, so they stay by
  // default — but a layered glass is a thing you can also just mix, and
  // being able to is the difference between a diagram and a drink.
  const [stirred, setStirred] = useState(false);
  const [pouring, setPouring] = useState(null); // what is mid-pour right now
  // A named animation that is PLAYING. Every control is inert while it runs,
  // or a second click during the serve re-enters and you get two receipts —
  // the same class of bug as the grind that would not stop.
  const [phase, setPhase] = useState(null); // 'steam'|'pour'|'stir'|'serve'|null
  const [phaseT, setPhaseT] = useState(0);

  const clearFinish = useCallback(() => {
    setPours([]);
    setGlass(null);
    setStocked([]);
    setSteamed(false);
    setStirred(false);
    setPouring(null);
  }, []);

  const pickBean = useCallback(
    (id) => {
      setBean(id);
      setRoast(0);
      setGround(0);
      setLocked(false);
      setShot(0);
      clearFinish();
      setStage("roast");
    },
    [clearFinish]
  );

  // held-button progress; the station calls these each frame while running
  const addRoast = useCallback((d) => setRoast((r) => Math.min(1, r + d)), []);
  const addGrind = useCallback(
    (d) =>
      setGround((g) => {
        const next = Math.min(1, g + d);
        if (next >= 1) setStage("brew");
        return next;
      }),
    []
  );

  // called on button release, not each frame: you choose when to stop roasting,
  // which is the whole interaction
  const releaseRoast = useCallback(() => {
    setStage((s) => (s === "roast" && roast >= MIN_ROAST ? "grind" : s));
  }, [roast]);

  // Two beats at the machine, because dosing and extracting are two actions
  // and collapsing them into one click threw away the only moment the grounds
  // you made are visibly used for anything.
  const lockPortafilter = useCallback(() => setLocked(true), []);
  const addShot = useCallback((d) => setShot((v) => Math.min(1, v + d)), []);

  // on release, like the roast: when you stop IS the decision
  const pullShot = useCallback(() => {
    setStage((s) => (s === "brew" && shot >= SHOT_MIN ? "finish" : s));
  }, [shot]);

  // Sequences. Steaming is not a progress bar: you either steamed the milk or
  // you did not, and the interesting part is watching the wand do it. Serving
  // is the same — a beat, then the drink, then the receipt.
  const start = useCallback((name, what = null) => {
    setPhase((cur) => (cur ? cur : name));
    setPouring(what);
    setPhaseT(0);
  }, []);
  const advance = useCallback((d) => setPhaseT((t) => Math.min(1, t + d)), []);

  // Landing a finished sequence happens in an EFFECT, not inside the setState
  // updater that noticed it ended. Updaters can be called twice, and appending
  // to `pours` from inside one would double-pour.
  useEffect(() => {
    if (!phase || phaseT < 1) return;
    if (phase === "steam") setSteamed(true);
    else if (phase === "stir") setStirred(true);
    else if (phase === "pour" && pouring) {
      setPours((p) => (p.includes(pouring) ? p : [...p, pouring]));
    } else if (phase === "serve") {
      setStage((st) => (st === "finish" ? "served" : st));
    }
    setPhase(null);
    setPouring(null);
  }, [phase, phaseT, pouring]);

  const serve = useCallback(() => start("serve"), [start]);
  const steam = useCallback(() => start("steam"), [start]);
  const stir = useCallback(() => start("stir"), [start]);
  const pour = useCallback((kind) => start("pour", kind), [start]);
  // YOU PICK THE GLASS, because nothing else can any more. It used to be
  // decided by the fridge — ice in the bag meant a tall glass — and that was
  // a good rule right up until the ice moved to the well at the bar, where
  // it is always available and so can no longer imply anything. Two glasses
  // on the shelf, take the one you want; the drink you get is still decided
  // entirely by what goes in it.
  const takeGlass = useCallback(
    (kind) => setGlass(kind === "tall" ? "tall" : "mug"),
    []
  );
  // Fetching from the fridge. Idempotent, because the click that stocks is
  // the same click that opens the project card and people click it twice.
  const stock = useCallback((kind) => {
    if (!kind) return;
    setStocked((s) => (s.includes(kind) ? s : [...s, kind]));
  }, []);

  const reset = useCallback(() => {
    setStage("pick");
    setBean(null);
    setRoast(0);
    setGround(0);
    setLocked(false);
    setShot(0);
    clearFinish();
    setPhase(null);
    setPhaseT(0);
  }, [clearFinish]);

  return useMemo(() => {
    const burnt = roast > BURNT_AT;
    const idle = stage === "finish" && phase === null;
    const ready = idle && glass; // nothing goes in until there is a glass
    const anyMilk = pours.includes("milk") || pours.includes("milk-steamed");
    const got = (k) => stocked.includes(k);
    const poured = (k) => pours.includes(k);
    return {
      stage,
      bean,
      beanData: bean ? BEANS_BY_ID[bean] : null,
      roast,
      ground,
      locked,
      shot,
      pours,
      glass,
      stocked,
      steamed,
      stirred,
      pouring,
      phase,
      phaseT,
      busy: phase !== null,
      burnt,
      weak: shot > 0 && shot < SHOT_MIN,
      bitter: shot > SHOT_OVER,
      // what each station is allowed to do right now
      canRoast: stage === "roast" && bean !== null,
      canGrind: stage === "grind",
      drink: resolveDrink(pours, shot),
      // A stir takes the pattern straight off, which is what stirring a
      // heart does. The DRINK does not change — the order it went in is
      // still what it is — only the look of it.
      art: hasArt(pours) && !stirred,
      // no control responds mid-animation
      canFinish: idle,
      // WHERE THE LOOP WANTS YOU. One source, read by both the arrow in the
      // scene and the signs on the wall — they were deriving it separately
      // and neither of them knew about the fridge.
      //
      // The fridge gets pointed at when you arrive at the bar with nothing
      // fetched and nothing poured. That is the one moment the nudge is
      // useful: milk, juice and ice are ONLY in there, and until you have
      // opened it the bar cannot make anything but a black coffee. Pour
      // anything at all and it goes back to pointing at the bar, so someone
      // who only wants an espresso is not nagged across the room.
      next: phase
        ? null
        : stage === "finish"
          ? !stocked.length && !pours.length
            ? "fridge"
            : "milkbar"
          : (NEXT_STATION[stage] ?? null),
      // Still clickable while the glass is empty: fetch ice after taking a
      // cup and the rack swaps it for the tall one, rather than stranding
      // you with the wrong vessel and no way back to the right one.
      canTakeGlass: idle && (!glass || pours.length === 0),
      // Steaming does not need a glass — it is about the milk, not the drink —
      // but it does need milk that has not already gone in cold.
      canSteam: idle && got("milk") && !steamed && !anyMilk,
      // Click the drink to stir it. Needs at least two things in there —
      // stirring one ingredient into itself is not a move.
      canStir: ready && pours.filter((k) => k !== "ice").length > 1 && !stirred,
      // THE GLASS GATES EVERYTHING. Pouring into thin air was the thing that
      // made the sequence read as a menu rather than as making a drink.
      pourable: {
        // straight from the well, which is always stocked
        ice: ready && !poured("ice"),
        espresso: ready && !poured("espresso"),
        // the carton: cold milk, straight in. Gone once it has been steamed,
        // because then the milk is in the jug.
        milk: ready && got("milk") && !steamed && !anyMilk,
        // the jug: textured milk. Poured LAST it is what makes the art.
        "milk-steamed": ready && steamed && !anyMilk,
        water: ready && !poured("water"),
        orange: ready && got("orange") && !poured("orange"),
        chocolate: ready && got("chocolate") && !poured("chocolate"),
      },
      // you cannot serve an empty glass, or no glass at all
      canServe: ready && poured("espresso"),
      canLock: stage === "brew" && !locked,
      canPull: stage === "brew" && locked,
      canBrew: stage === "brew",
      // one line of copy telling the player what the loop wants next
      hint: hintFor({
        stage,
        roast,
        burnt,
        locked,
        shot,
        pours,
        glass,
        stocked,
        stirred,
        phase,
      }),
      pickBean,
      addRoast,
      addGrind,
      releaseRoast,
      lockPortafilter,
      addShot,
      pullShot,
      takeGlass,
      stock,
      steam,
      stir,
      pour,
      advance,
      serve,
      reset,
    };
  }, [
    stage,
    bean,
    roast,
    ground,
    locked,
    shot,
    pours,
    glass,
    stocked,
    steamed,
    stirred,
    pouring,
    phase,
    phaseT,
    pickBean,
    addRoast,
    addGrind,
    releaseRoast,
    lockPortafilter,
    addShot,
    pullShot,
    takeGlass,
    stock,
    steam,
    stir,
    pour,
    advance,
    serve,
    reset,
  ]);
}
