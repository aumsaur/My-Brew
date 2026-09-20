import {
  ROAST_ORDER,
  GRIND_ORDER,
  SHOT_ORDER,
  LADDER_LABELS,
  roastCss,
  roastLabel,
  grindLabel,
  shotLabel,
} from "@/features/coffee/data/beans";
import {
  MIN_ROAST,
  BURNT_AT,
  SHOT_MIN,
  SHOT_GOOD,
  SHOT_OVER,
} from "@/features/coffee/useBrewFlow";

// WHAT THE STATION YOU ARE STANDING AT DOES, and how far through it you are.
//
// It used to be three meters stacked at the bottom of the screen for the
// whole session, roast and grind and shot, two of them always dimmed. That is
// a dashboard: it takes the biggest block of screen in the room and spends it
// telling you about the two things you are not doing. Now there is one meter,
// it belongs to the station the camera is at, and when the camera is not at a
// station there is no panel at all. What persists lives in the inventory, as
// three small rings — see ui/Inventory.
//
// IT ALSO SAYS WHAT TO PRESS, which is the other half of the same problem.
// The controls are the models themselves: the whole roaster roasts, the whole
// machine pulls. That is the right way round — the verb belongs on the object
// — but an object cannot say "press and hold me", so nothing did, and a
// player could stand in front of a station without knowing it was live. One
// line, naming the gesture and naming ANYWHERE, is the cheapest possible fix
// and it costs no button.
//
// Every number is imported, never restated. MIN_ROAST and BURNT_AT gate the
// loop in useBrewFlow and the ladders name the bands in beans.js — retype any
// of them here and the bar starts lying about the simulation.

const TRACK_H = 13;

/** Segment boundaries as fractions, for a ladder of n bands. */
function edges(n) {
  return Array.from({ length: n - 1 }, (_, i) => (i + 1) / n);
}

function Meter({
  label,
  value,
  ladder,
  band,
  fill,
  active,
  readyAt = null, // fraction where the stage becomes completable
  dangerAt = null, // fraction where overshoot starts to hurt
  danger = false,
  sweet = null, // [from, to] — the window actually worth hitting
}) {
  const pct = Math.min(1, Math.max(0, value)) * 100;
  const idx = Math.min(ladder.length - 1, Math.floor(value * ladder.length));

  return (
    <div style={{ opacity: active ? 1 : 0.42, transition: "opacity .25s" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontSize: 10,
          letterSpacing: 1.2,
          opacity: 0.6,
        }}
      >
        <span>{label}</span>
        <span
          style={{
            color: danger ? "#ff7a4d" : "#e6dccd",
            opacity: 0.95,
            letterSpacing: 0.4,
          }}
        >
          {band} · {pct.toFixed(0)}%
        </span>
      </div>

      {/* track */}
      <div
        style={{
          position: "relative",
          height: TRACK_H,
          marginTop: 5,
          borderRadius: TRACK_H / 2,
          background: "#00000066",
          border: "1px solid #ffffff1a",
          overflow: "hidden",
        }}
      >
        {/* overshoot zone, drawn under the fill so the fill still reads on top */}
        {dangerAt !== null && (
          <span
            style={{
              position: "absolute",
              left: `${dangerAt * 100}%`,
              right: 0,
              top: 0,
              bottom: 0,
              background: "#ff5a2a2e",
            }}
          />
        )}

        <span
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pct}%`,
            background: fill,
            // the dark end of the roast ladder is nearly black on a dark
            // track, so give the fill its own edge
            boxShadow: "inset 0 0 0 1px #ffffff3d",
            borderRadius: TRACK_H / 2,
          }}
        />

        {/* The window worth aiming for. Only the shot has one: roast is a
            preference, extraction is not. */}
        {sweet && (
          <span
            style={{
              position: "absolute",
              left: `${sweet[0] * 100}%`,
              width: `${(sweet[1] - sweet[0]) * 100}%`,
              top: 0,
              bottom: 0,
              background: "#8ee6a82e",
              borderLeft: "1px solid #8ee6a870",
              borderRight: "1px solid #8ee6a870",
            }}
          />
        )}

        {/* band boundaries */}
        {edges(ladder.length).map((e) => (
          <span
            key={e}
            style={{
              position: "absolute",
              left: `${e * 100}%`,
              top: 2,
              bottom: 2,
              width: 1,
              background: "#00000066",
            }}
          />
        ))}

        {/* the gate: below this the stage cannot complete */}
        {readyAt !== null && (
          <span
            title={`${(readyAt * 100).toFixed(0)}% — usable from here`}
            style={{
              position: "absolute",
              left: `${readyAt * 100}%`,
              top: -1,
              bottom: -1,
              width: 2,
              background: value >= readyAt ? "#8ee6a8" : "#ffffff9e",
            }}
          />
        )}
      </div>

      {/* sub-section: which band you are in */}
      <div style={{ display: "flex", marginTop: 4 }}>
        {ladder.map((k, i) => (
          <span
            key={k}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 9,
              letterSpacing: 0.6,
              color: i === idx && value > 0.001 ? "#ffd9a0" : "#e6dccd",
              opacity: i === idx && value > 0.001 ? 1 : 0.32,
            }}
          >
            {LADDER_LABELS[k] ?? k}
          </span>
        ))}
      </div>
    </div>
  );
}

/** The meter a station owns, if it owns one. Values come from the flow. */
const METERS = {
  roast: (f) => ({
    label: "ROAST",
    value: f.roast,
    ladder: ROAST_ORDER.slice(0, -1),
    band: roastLabel(f.roast),
    fill: roastCss(f.roast),
    readyAt: MIN_ROAST,
    dangerAt: BURNT_AT,
    danger: f.burnt,
  }),
  grind: (f) => ({
    label: "GRIND",
    value: f.ground,
    ladder: GRIND_ORDER,
    band: grindLabel(f.ground),
    fill: "#b8865c",
    readyAt: 1,
  }),
  shot: (f) => ({
    label: "SHOT",
    value: f.shot ?? 0,
    ladder: SHOT_ORDER,
    band: shotLabel(f.shot ?? 0),
    fill: "#7a4526",
    readyAt: SHOT_MIN,
    dangerAt: SHOT_OVER,
    danger: f.bitter,
    sweet: SHOT_GOOD,
  }),
};

/**
 * One station, one sentence — and whether that sentence is TRUE right now.
 *
 * `live` is the same boolean the station's own controls are wired to, never
 * a second guess at it. It has to be: a panel that says "press and hold
 * anywhere on the roaster" at a roaster with no bean in it is worse than no
 * panel, because the press then falls through to the counter and throws you
 * back to the overview — the dead-control rule working exactly as intended,
 * against a promise the HUD had no business making. When it is false the
 * loop's own hint goes there instead, which is already the right sentence.
 *
 * `press` is set apart because it is the word you act on; ANYWHERE is the
 * part nobody could have guessed.
 */
function describe(focused, flow, picked) {
  const f = flow ?? {};
  const anyPour = Object.values(f.pourable ?? {}).some(Boolean);
  switch (focused) {
    case "beans":
      // always: a bag can be picked, swapped or put back at any point
      return {
        title: "bean shelf",
        press: "click",
        at: "a bag",
        tail: "to take it",
        live: true,
      };
    case "roaster":
      return {
        title: "roaster",
        press: "press and hold",
        at: "anywhere on the roaster",
        tail: "to roast",
        meter: "roast",
        live: !!f.canRoast,
      };
    case "grinder":
      return picked
        ? {
            title: "grinder — in hand",
            press: "press and hold",
            at: "anywhere on it",
            tail: "to grind",
            meter: "grind",
            live: !!f.canGrind,
          }
        : {
            title: "grinder",
            press: "click",
            at: "it",
            tail: "to pick it up",
            meter: "grind",
            live: true, // picking it up is never gated
          };
    case "machine":
      return f.canPull
        ? {
            title: "espresso machine",
            press: "press and hold",
            at: "anywhere on the machine",
            tail: "to pull the shot",
            meter: "shot",
            live: true,
          }
        : {
            title: "espresso machine",
            press: "click",
            at: "anywhere on the machine",
            tail: "to lock the portafilter in",
            meter: "shot",
            live: !!f.canLock,
          };
    case "fridge":
      return {
        title: "cold store",
        press: "click",
        at: "a shelf item",
        tail: "to take it out",
        live: true,
      };
    case "milkbar":
      return {
        title: "the bar",
        press: "click",
        at: "a source",
        tail: "to pour it in · the bell to serve",
        live: !!(f.canTakeGlass || f.canServe || f.canStir || anyPour),
      };
    default:
      return null;
  }
}

export default function StationPanel({ flow, focused = null, picked = false }) {
  const s = describe(focused, flow, picked);
  if (!s) return null;
  const meter = s.meter && flow ? METERS[s.meter](flow) : null;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: 20,
        transform: "translateX(-50%)",
        width: 330,
        font: "12px ui-monospace, monospace",
        color: "#e6dccd",
        background: "#1b1412e6",
        border: "1px solid #ffffff1f",
        borderRadius: 10,
        padding: "10px 14px 11px",
        pointerEvents: "none",
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: 1.4, opacity: 0.5 }}>
        {s.title.toUpperCase()}
      </div>
      {s.live ? (
        <div style={{ marginTop: 5, lineHeight: 1.5 }}>
          <b>{s.press}</b> <span style={{ color: "#ffd9a0" }}>{s.at}</span>{" "}
          {s.tail}
        </div>
      ) : (
        // nothing to do here yet — say what the loop is actually waiting for
        <div style={{ marginTop: 5, lineHeight: 1.5, opacity: 0.6 }}>
          {flow?.hint ?? "nothing to do here yet"}
        </div>
      )}
      {meter && (
        <div style={{ marginTop: 10 }}>
          <Meter {...meter} active={!!flow?.bean} />
        </div>
      )}
    </div>
  );
}
