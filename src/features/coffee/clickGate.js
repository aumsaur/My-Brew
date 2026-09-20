// One shared "ignore the click that is about to arrive" gate.
//
// Three separate gestures all end in a click nobody wants acted on:
//   - releasing a hold, where the camera has moved and the cursor now sits
//     over the station's body, which would toggle focus straight back off
//   - releasing a hold over empty space, which R3F reports as a pointer MISS
//     and would clear focus
//   - finishing an orbit drag, which ends wherever the cursor stopped
//
// They were being solved with a timestamp ref per file, which meant the gate
// only covered whichever handlers happened to live in that file. A drag
// started in the rig could not tell CoffeeRoom's focus handler to stand down.
// One module-level deadline covers all of them, in both directions.
let until = 0;

/** Swallow focus clicks for a moment. Call at the END of a drag or hold. */
export function swallowClicks(ms = 400) {
  until = performance.now() + ms;
}

export function clicksSwallowed() {
  return performance.now() < until;
}
