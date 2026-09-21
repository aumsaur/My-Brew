import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
 * bean while you were standing at the serve station.
 */
function hintFor({
  stage,
  roast,
  burnt,
  charged,
  hopper,
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
    // AN EMPTY DRUM CANNOT BE ROASTED, and telling someone to press and hold
    // a station that will not answer is the one thing this line must never
    // do -- see the note over `describe` in ui/StationPanel.
    if (!charged) return "tip the bag into the roaster — click the drum";
    return roast < MIN_ROAST
      ? "press and hold the roaster — beans are still green"
      : "keep roasting, or let go to grind";
  }

  if (stage === "grind") {
    // THE BEANS ARE IN YOUR HANDS AT THIS POINT, not in the grinder, and
    // saying "press and hold it" first is what made someone click the
    // hotbar twice looking for the missing step.
    if (!hopper) {
      return burnt
        ? "burnt. tip them into the grinder anyway — click the bean in your hotbar"
        : "tip the beans into the grinder — click the bean in your hotbar";
    }
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
      return "take a vessel off the wall — a paper cup, or a tall glass";
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
  // THE BEAN IS IN THE DRUM. Separate from `bean`, which is only what you
  // are carrying: picking a bag off the shelf used to fill the roaster from
  // across the room, so you arrived at a station that had already done its
  // own step. Taking it and loading it are two acts, the same way the
  // portafilter goes in before the shot comes out.
  const [charged, setCharged] = useState(false);
  // AND THE SAME AGAIN FOR THE GRINDER. Beans come out of the drum into
  // your hands, so something has to put them into the next machine -- and
  // trying to do exactly that is what someone got soft-locked by, see the
  // note on the bean slot in ui/Inventory.
  const [hopper, setHopper] = useState(false);
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

  // What is in the GLASS, read by a callback that must not be rebuilt every
  // time it changes. `pours` is a dependency of nothing below, deliberately:
  // handlers whose identity churns per pour are how a ref ends up detaching
  // and reattaching sixty times a second.
  const poursNow = useRef(pours);
  poursNow.current = pours;
  // and the same trick for the vessel, so clicking a dispenser can ask
  // "am I already holding this one?" without rebuilding takeGlass per change
  const glassNow = useRef(glass);
  glassNow.current = glass;

  /**
   * Put the bag back and forget the chain it started: roast, grind,
   * portafilter, shot, and whatever is in the drum.
   *
   * IT DOES NOT TOUCH THE GLASS, and that is the fix for the worst bug in
   * the free-sequencing change. Picking a bean called clearFinish(), so
   * prepping a glass with ice and then going to brew — the exact order the
   * bar is now supposed to allow — threw the glass away on the way past the
   * shelf. The bean chain and the drink are two different things now, and
   * only serving or starting over clears both.
   */
  const clearBean = useCallback((next = "pick") => {
    // guarded, because this is also handed straight to a button's onClick in
    // ui/Inventory and a click event arriving as `next` would set the stage
    // to a React synthetic event
    const to = typeof next === "string" ? next : "pick";
    setBean(null);
    setRoast(0);
    setGround(0);
    setCharged(false);
    setHopper(false);
    setLocked(false);
    // THE SHOT IN THE GLASS IS THE DRINK'S, not the bean's. Zeroing it after
    // it has been poured would rewrite the receipt for a drink already made:
    // resolveDrink reads `shot` for strength, so a served long black would
    // turn back into a weak one because you picked up another bag.
    setShot((s) => (poursNow.current.includes("espresso") ? s : 0));
    setStage(to);
  }, []);

  const pickBean = useCallback(
    (id) => {
      clearBean("roast");
      setBean(id);
    },
    [clearBean]
  );

  // held-button progress; the station calls these each frame while running
  const addRoast = useCallback((d) => setRoast((r) => Math.min(1, r + d)), []);
  const addGrind = useCallback(
    (d) =>
      setGround((g) => {
        const next = Math.min(1, g + d);
        // the drum emptied when the roast came off (see releaseRoast); the
        // hopper empties here, because the grounds are what comes next and
        // they are in the portafilter's hands now, not the grinder's
        if (next >= 1) {
          setStage("brew");
          setHopper(false);
        }
        return next;
      }),
    []
  );

  // called on button release, not each frame: you choose when to stop roasting,
  // which is the whole interaction
  const releaseRoast = useCallback(() => {
    setStage((s) => {
      if (s !== "roast" || roast < MIN_ROAST) return s;
      // AND THE BEANS COME OUT WITH YOU. Stopping the roast is taking the
      // batch off — you tip the drum into your hands and carry it to the
      // grinder. Leaving `charged` true until the grind finished meant you
      // walked away from a roaster that still had your beans in it, which
      // is the same complaint as the drum filling itself from the shelf,
      // one step later: a station showing a step it is no longer doing.
      //
      // Idempotent, so it is safe in an updater React may run twice — the
      // note on the landing effect below is about APPENDING, which is not.
      setCharged(false);
      return "grind";
    });
  }, [roast]);

  // TIPPING THE BAG IN. The roaster's own two beats: the bean is in your
  // hands until you put it in the drum, and only then will the button run.
  const loadRoaster = useCallback(() => setCharged(true), []);
  const loadGrinder = useCallback(() => setHopper(true), []);

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
      // SERVING LANDS FROM WHEREVER YOU WERE. This used to require the stage
      // to be `finish`, which only happens once a shot has been pulled — so
      // a coffee-free drink could be built, and the bell would ring, and the
      // animation would play, and no receipt would ever come. Two gates on
      // the same assumption, in two files; opening canServe alone left the
      // bell chiming into the void.
      //
      // Nothing is lost by dropping the check: `serve` is only reachable
      // from the bell, and the bell is gated on there being a glass with
      // something in it.
      setStage("served");
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
  /**
   * TIP THE VESSEL OUT. Everything in it goes, and so does anything the bar
   * cannot make a second time.
   *
   * Two ingredients are single-use, and forgetting either one is a duplication
   * bug rather than a cosmetic one:
   *
   *   THE SHOT. `pourable.espresso` is gated on `!poured("espresso")`, so
   *   clearing `pours` alone would re-open the pour with the same espresso —
   *   one pull, unlimited shots. It goes down the sink with the drink, and
   *   the loop rewinds to the machine so there is a way to pull another. The
   *   portafilter is still locked, so that is one click away, not five.
   *
   *   THE STEAMED MILK. Same shape: `pourable["milk-steamed"]` only asks
   *   whether the jug was steamed, so an un-cleared `steamed` is a jug that
   *   pours for ever. The carton stays on the bar — a carton holds more than
   *   one drink — so re-steaming is available immediately.
   *
   * Ice, water, juice and syrup are all effectively bottomless at the bar, so
   * they need no accounting: you just poured some away.
   */
  const tipOut = useCallback(() => {
    const had = poursNow.current;
    setPours([]);
    setStirred(false);
    setPouring(null);
    if (had.includes("milk-steamed")) setSteamed(false);
    if (had.includes("espresso")) {
      setShot(0);
      setStage((st) => (st === "finish" ? "brew" : st));
    }
  }, []);

  // YOU PICK THE VESSEL, AND YOU CAN UNPICK IT. One dispenser click does all
  // three things, decided by what you are already holding: take, swap, or put
  // it back. There is no separate bin because there does not need to be — the
  // fixture that gave you the cup is the obvious place to give it back, and a
  // bin standing on the bar would cost counter space the station has spent
  // three passes clearing.
  //
  // It is deliberately DESTRUCTIVE and deliberately never blocked. Nothing in
  // this room stops you making a bad decision; the receipt just notices. See
  // SIDE_EYE in data/verdict for the other half of that bargain.
  const takeGlass = useCallback(
    (kind) => {
      const want = kind === "tall" ? "tall" : "mug";
      tipOut();
      setGlass(glassNow.current === want ? null : want);
    },
    [tipOut]
  );
  // Putting something back. The bin is the only gesture that can empty a
  // slot you did not mean to fill -- without it a trip to the cold store was
  // one-way and a mis-click stayed on the bar for the rest of the session.
  const unstock = useCallback((kind) => {
    if (!kind) return;
    setStocked((s) => s.filter((k) => k !== kind));
  }, []);
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
    setCharged(false);
    setHopper(false);
    setLocked(false);
    setShot(0);
    clearFinish();
    setPhase(null);
    setPhaseT(0);
  }, [clearFinish]);

  return useMemo(() => {
    const burnt = roast > BURNT_AT;
    const idle = phase === null;
    // THE GLASS IS THE ONLY GATE. `idle` used to mean "stage === finish and
    // nothing animating", so the serve station was inert until the shot was
    // pulled -- you could not drop ice in a glass before brewing, or even
    // pick the glass. That is a script, not a bar.
    //
    // Now the sequence is yours: take a vessel whenever you like, put the ice
    // in first if that is how you work. The only thing that still needs the
    // rest of the loop is the ESPRESSO pour, because there is no shot to pour
    // until one has been pulled -- see `pourable.espresso`.
    const ready = idle && glass;
    const hasShot = shot > 0;
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
      // THE DRUM HAS TO HAVE SOMETHING IN IT. It used to be enough to be
      // carrying a bag, which is why the roaster had already loaded itself
      // by the time you walked up to it.
      canRoast: stage === "roast" && bean !== null && charged,
      // and the act that puts it there, which is what the bean slot in the
      // hotbar does at this station -- the same select-then-use gesture the
      // sources at the bar answer to
      canLoadRoaster: idle && stage === "roast" && bean !== null && !charged,
      charged,
      // the grinder's twin of the two above
      canGrind: stage === "grind" && hopper,
      canLoadGrinder: idle && stage === "grind" && bean !== null && !hopper,
      hopper,
      drink: resolveDrink(pours, shot),
      // A stir takes the pattern straight off, which is what stirring a
      // heart does. The DRINK does not change — the order it went in is
      // still what it is — only the look of it.
      art: hasArt(pours) && !stirred,
      // no control responds mid-animation
      // The station responds whenever nothing is animating. It was gated on
      // stage === "finish", which is what made everything here dead until
      // the shot existed.
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
            : "serve"
          : (NEXT_STATION[stage] ?? null),
      // ALWAYS, as long as nothing is animating. It used to close the
      // moment the first thing went in — take the paper cup, pour the ice,
      // and the tall glass you actually wanted was gone for the rest of the
      // drink. `idle` is the only real constraint: a vessel that changes
      // mid-pour would leave a stream falling into nothing.
      canTakeGlass: idle,
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
        // the one pour that still depends on the brew chain: no shot, nothing
        // to pour
        espresso: ready && hasShot && !poured("espresso"),
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
      // ANYTHING IN THE GLASS CAN BE SERVED. This used to demand a shot, so
      // the coffee-free drinks -- which free sequencing makes the easiest
      // things in the room to build -- could be made and then never handed
      // over: the bell stayed dead and the receipt that names them never
      // came. Serving a glass of chocolate syrup is a legitimate thing to
      // do here; the receipt has opinions about it.
      canServe: ready && pours.length > 0,
      canLock: stage === "brew" && !locked,
      canPull: stage === "brew" && locked,
      canBrew: stage === "brew",
      // one line of copy telling the player what the loop wants next
      hint: hintFor({
        stage,
        roast,
        burnt,
        charged,
        hopper,
        locked,
        shot,
        pours,
        glass,
        stocked,
        stirred,
        phase,
      }),
      pickBean,
      clearBean,
      loadRoaster,
      loadGrinder,
      addRoast,
      addGrind,
      releaseRoast,
      lockPortafilter,
      addShot,
      pullShot,
      takeGlass,
      stock,
      unstock,
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
    charged,
    hopper,
    pickBean,
    clearBean,
    loadRoaster,
    loadGrinder,
    addRoast,
    addGrind,
    releaseRoast,
    lockPortafilter,
    addShot,
    pullShot,
    takeGlass,
    stock,
    unstock,
    steam,
    stir,
    pour,
    advance,
    serve,
    reset,
  ]);
}
