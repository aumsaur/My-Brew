import { uiId } from "@/features/coffee/ids";
import { useState } from "react";
import {
  roastCss,
  roastLabel,
  grindLabel,
  shotLabel,
  accentColor,
  LADDER_LABELS,
} from "@/features/coffee/data/beans";

/** The one word under the glyph. Short forms, because the slot is 46px and
    "mediumDark" is not. */
function beanState(roast, ground) {
  if (ground > 0.01) return "ground";
  const r = roastLabel(roast);
  return LADDER_LABELS[r] ?? r;
}

// WHAT YOU ARE CARRYING, as a hotbar.
//
// It was a 196-wide card pinned to the top right, which is where a game puts
// a minimap, not your hands. A row of slots along the bottom centre is the
// shape every player already knows, and it reads as "these are the things I
// have" without a heading saying so.
//
// FOUR SLOTS, and they are the four things you can be carrying: the bean off
// the shelf, then the three the cold store holds. An empty slot is drawn
// rather than hidden, so the room tells you there are three more things to
// find before you have found them.
//
// THE RINGS ARE THE OLD METERS and they stay. There used to be a 360-wide
// stack of three bars along the bottom for the whole session with two of them
// dimmed at any moment - a dashboard, in the largest piece of screen, mostly
// about what you are not doing. The live bar belongs to the station you are
// at (ui/StationPanel, now top centre) and what is left here is state: three
// rings you read at a glance and hover for the words.

const SLOT = 46;

// WHAT IS IN YOUR HANDS, DRAWN. The slot used to be a square of the bean's
// origin colour with the word "green" under it, which is a caption, not a
// picture: the one thing you do to a bean in this room is change what it
// LOOKS like, and the hotbar was the only place that never showed it.
//
// So the slot draws the bean at the state it is actually in, tinted off the
// SAME ramp the roaster's drum uses -- roastCss is the DOM twin of
// roastRampAt -- and the two agree by construction. Watch the drum darken,
// walk away, and the thing in your hand is the colour you left it.
//
// A ground bean stops being a bean. Whole it is one shape with a crease;
// once it has been through the grinder it is a heap of grounds, because a
// bean-shaped icon for coffee powder is a lie you have to read twice.
const GROUNDS = [
  [4.2, 12.4, 1.5],
  [8.0, 13.1, 1.7],
  [12.1, 12.6, 1.5],
  [15.6, 13.2, 1.4],
  [6.1, 9.8, 1.6],
  [10.0, 10.4, 1.8],
  [13.9, 9.9, 1.5],
  [8.2, 7.2, 1.5],
  [11.9, 7.5, 1.4],
];

function BeanGlyph({ colour, ground = 0 }) {
  if (ground > 0.01) {
    return (
      <svg width="20" height="17" viewBox="0 0 20 17" aria-hidden="true">
        {GROUNDS.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={colour} />
        ))}
      </svg>
    );
  }
  return (
    <svg width="20" height="17" viewBox="0 0 20 17" aria-hidden="true">
      <ellipse cx="10" cy="9" rx="7.4" ry="5.2" fill={colour} />
      {/* the crease, which is the whole of why a coffee bean reads as one */}
      <path
        d="M4.2 6.6 Q10 9.4 15.8 11.4"
        fill="none"
        stroke="#00000059"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const ITEMS = [
  { key: "milk", label: "milk", tint: "#dfe6f2", ink: "#2a3550" },
  { key: "orange", label: "juice", tint: "#e08a24", ink: "#3a1f05" },
  { key: "chocolate", label: "choc", tint: "#4a2c1b", ink: "#e8d5c4" },
];

function Slot({
  id,
  filled,
  tint,
  ink,
  cap,
  sub,
  glyph = null, // drawn INSTEAD of the tint, for a thing with a state
  stripe = null, // a hairline of the thing's own colour, under everything
  meter = null, // 0..1, how far through whatever is being done to it
  meterInk,
  title,
  onClick,
  dim,
  selected,
  live,
}) {
  return (
    <div
      {...uiId(id)}
      title={title}
      onClick={onClick}
      style={{
        position: "relative",
        overflow: "hidden",
        width: SLOT,
        height: SLOT,
        borderRadius: 8,
        // the slot itself is always drawn; only its CONTENTS come and go.
        // A slot with a GLYPH keeps a neutral ground instead, or the drawing
        // has to fight the fill for contrast and neither wins.
        background: glyph ? "#ffffff14" : filled ? tint : "#ffffff0d",
        // SELECTED reads as a hotbar's chosen slot: a bright ring, not a
        // colour change, because the fill already means "what is in here".
        // LIVE is a second, quieter state -- this slot can be used right
        // now, at the station you are standing at.
        outline: selected ? "2px solid #ffd9a0" : "none",
        outlineOffset: 2,
        boxShadow: live ? "0 0 0 1px #e0a05e88, 0 0 12px #e0a05e55" : "none",
        border: `1px solid ${filled ? "#ffffff40" : "#ffffff1f"}`,
        display: "grid",
        placeItems: "center",
        gap: 1,
        opacity: dim ? 0.45 : 1,
        cursor: onClick ? "pointer" : "default",
        pointerEvents: onClick ? "auto" : "none",
        transition: "opacity .2s, background .2s",
        flex: "0 0 auto",
      }}
    >
      {glyph}
      <span
        style={{
          // LONGHANDS, not the `font` shorthand. The size changes between
          // renders here, and React warns (rightly) about a shorthand that
          // moves while a longhand for the same value -- lineHeight -- is
          // set beside it: whichever is applied second wins, and which that
          // is depends on key order.
          fontSize: glyph ? 8 : 11,
          fontFamily: "ui-monospace, monospace",
          letterSpacing: 0.3,
          color: glyph ? "#e6dccd" : filled ? ink : "#ffffff3d",
          lineHeight: 1,
        }}
      >
        {cap}
      </span>
      {/* WHOSE BEAN IT IS, kept as a hairline rather than as the fill. The
          origin still has to be readable -- it is how you tell the bag you
          took from the one next to it -- but it is the least changeable
          thing about what you are carrying, so it gets the least room. */}
      {stripe && (
        <span
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 3,
            background: stripe,
          }}
        />
      )}
      {meter != null && (
        <span
          style={{
            position: "absolute",
            left: 0,
            bottom: stripe ? 3 : 0,
            height: 2,
            width: `${Math.round(Math.min(1, Math.max(0, meter)) * 100)}%`,
            background: meterInk ?? "#e0a05e",
            transition: "width .12s linear",
          }}
        />
      )}
      {sub && (
        <span
          style={{
            font: "8px ui-monospace, monospace",
            letterSpacing: 0.3,
            color: filled ? ink : "#ffffff30",
            opacity: 0.75,
            lineHeight: 1,
          }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

function Ring({ label, value = 0, colour, title }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <span
      {...uiId(`inventory.ring.${label}`)}
      title={title}
      style={{ display: "flex", alignItems: "center", gap: 4 }}
    >
      <span
        style={{
          width: 13,
          height: 13,
          borderRadius: "50%",
          flex: "0 0 auto",
          // the ring itself; the plug in the middle is what makes it one
          background: `conic-gradient(${colour} ${pct}%, #ffffff14 0)`,
          display: "grid",
          placeItems: "center",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#1b1412",
          }}
        />
      </span>
      <span style={{ fontSize: 9, letterSpacing: 0.5, opacity: 0.5 }}>
        {label}
      </span>
    </span>
  );
}

/**
 * THE BIN. Bottom right, away from the hotbar, because the one gesture you
 * must not fire by accident is the one that throws something away.
 *
 * It takes whatever slot is SELECTED rather than offering a drag: dragging a
 * 46px tile onto a 40px target is a dexterity test, and this is a coffee
 * shop. Select, then bin — two deliberate clicks.
 */
function Bin({ armed, label, onEmpty }) {
  return (
    <button
      {...uiId("bin")}
      type="button"
      onClick={onEmpty}
      disabled={!armed}
      title={
        armed ? `put the ${label} back` : "select something to put it back"
      }
      style={{
        position: "absolute",
        right: 16,
        bottom: 16,
        width: 40,
        height: 40,
        display: "grid",
        placeItems: "center",
        borderRadius: 9,
        background: armed ? "#3a2320e6" : "#1b1412b0",
        border: `1px solid ${armed ? "#e08a7a66" : "#ffffff14"}`,
        color: armed ? "#f0b0a0" : "#ffffff30",
        cursor: armed ? "pointer" : "default",
        pointerEvents: "auto",
        transition: "all .2s",
      }}
    >
      {/* a lid, a body and two staves — a bin at 18px, without a font */}
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path
          d="M2.5 4.5h13M7 4.5V3h4v1.5M4 4.5l.9 10a1 1 0 0 0 1 .9h6.2a1 1 0 0 0 1-.9l.9-10M7.4 7.4v5M10.6 7.4v5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export default function Inventory({
  bean,
  roast = 0,
  ground = 0,
  shot = 0,
  stocked = [],
  usable = null,
  selected = null,
  onSelect,
  onUse,
  onClear,
  onDiscard,
}) {
  const [open, setOpen] = useState(false);
  const got = (k) => stocked.includes(k);
  // AT A STATION, A SLOT IS A CONTROL. Away from one it is just state. This
  // is the explicit half of the gesture: the room says what a thing is by
  // being a thing you click, and the hotbar says it by name -- both reach
  // the same act. At the bar that act is a pour; at the roaster it is the
  // bag going into the drum.
  const canUse = (k) => !!usable?.[k];
  const held =
    selected === "bean"
      ? bean
        ? "bean"
        : null
      : selected && got(selected)
        ? selected
        : null;
  const hit = (k) => () => {
    onSelect?.(k);
    if (canUse(k)) onUse?.(k);
  };

  return (
    <>
      <Bin
        armed={!!held}
        label={held === "bean" ? (bean?.name ?? "bean") : held}
        onEmpty={() => {
          if (!held) return;
          if (held === "bean") onClear?.();
          else onDiscard?.(held);
          onSelect?.(null);
        }}
      />
      <div
        {...uiId("inventory")}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        style={{
          position: "absolute",
          left: "50%",
          bottom: 16,
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          font: "12px ui-monospace, monospace",
          color: "#e6dccd",
          pointerEvents: "none",
        }}
      >
        {/* the name of whatever is in the first slot, above the row, so the
          hotbar itself stays a row of squares */}
        {bean && (
          <div
            style={{
              font: "11px ui-monospace, monospace",
              letterSpacing: 0.4,
              color: "#fff",
              background: "#1b1412e6",
              border: "1px solid #ffffff1f",
              borderRadius: 6,
              padding: "3px 9px",
            }}
          >
            {bean.name}
            <span style={{ opacity: 0.55 }}> · {bean.region}</span>
          </div>
        )}

        {open && bean && (
          <div
            style={{
              display: "flex",
              gap: 10,
              background: "#1b1412e6",
              border: "1px solid #ffffff1f",
              borderRadius: 6,
              padding: "4px 9px",
            }}
          >
            <Ring
              label="roast"
              value={roast}
              colour={roastCss(roast)}
              title={`roast · ${roastLabel(roast)} (${(roast * 100).toFixed(0)}%)`}
            />
            <Ring
              label="grind"
              value={ground}
              colour="#b8865c"
              title={`grind · ${grindLabel(ground)} (${(ground * 100).toFixed(0)}%)`}
            />
            <Ring
              label="shot"
              value={shot}
              colour="#7a4526"
              title={`shot · ${shotLabel(shot)} (${(shot * 100).toFixed(0)}%)`}
            />
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 6,
            background: "#1b1412d9",
            border: "1px solid #ffffff1f",
            borderRadius: 10,
            padding: 6,
          }}
        >
          {/* SLOT ONE IS YOUR HANDS. Selecting is the first click and putting
            the bag back is the second, so there is still exactly one way to
            end up empty-handed on purpose -- without it a bag click could
            only SWAP, and "there is no clear" and "picking another bean
            silently wipes what you had" were the same problem. */}
          <Slot
            id="inventory.slot.bean"
            filled={!!bean}
            tint={bean ? accentColor(bean) : undefined}
            ink="#1b1412"
            glyph={
              bean ? (
                <BeanGlyph colour={roastCss(roast)} ground={ground} />
              ) : null
            }
            stripe={bean ? accentColor(bean) : null}
            // the bar under it is whichever thing is being DONE to the bean:
            // it is being roasted until it has been ground, and then it is
            // not a bean any more and the grind is the only number left
            meter={bean ? (ground > 0.01 ? ground : roast) : null}
            meterInk={ground > 0.01 ? "#b8865c" : roastCss(roast)}
            cap={bean ? beanState(roast, ground) : "—"}
            selected={selected === "bean"}
            title={
              !bean
                ? "pick a bean from the shelf"
                : canUse("bean")
                  ? `${bean.name} — click to tip it in`
                  : `${bean.name} — ${roastLabel(roast)}${
                      ground > 0.01 ? `, ${grindLabel(ground)}` : ""
                    }`
            }
            live={canUse("bean")}
            // USE IT WHERE IT CAN BE USED, otherwise just select it.
            //
            // THE SECOND CLICK USED TO THROW THE BEAN AWAY, and that was a
            // soft lock with a friendly face. Standing at the grinder with
            // roasted beans in hand, clicking this slot is the obvious way
            // to ask "put them in" -- so someone clicked it twice, and the
            // second click meant PUT THE BAG BACK: bean gone, roast gone,
            // stage back to `pick`, and a grinder that no longer answered
            // with nothing on screen saying why.
            //
            // It was written before the bin existed and before beans could
            // be carried between stations. Discarding now belongs to the
            // bin alone -- bottom right, armed by selection, two deliberate
            // clicks and a tooltip that says what it will do -- and to the
            // bean shelf, where clicking the bag you are holding puts it
            // back on the shelf you took it from. Neither can be reached by
            // clicking twice on the thing you are trying to use.
            onClick={
              bean
                ? () => {
                    if (canUse("bean")) {
                      onSelect?.("bean");
                      onUse?.("bean");
                      return;
                    }
                    onSelect?.(selected === "bean" ? null : "bean");
                  }
                : undefined
            }
          />
          {ITEMS.map((it) => (
            <Slot
              key={it.key}
              id={`inventory.slot.${it.key}`}
              filled={got(it.key)}
              tint={it.tint}
              ink={it.ink}
              cap={got(it.key) ? it.label : "—"}
              selected={selected === it.key}
              live={canUse(it.key)}
              title={
                canUse(it.key)
                  ? `${it.label} — click to pour it in`
                  : got(it.key)
                    ? `${it.label} — fetched from the cold store`
                    : `${it.label} — in the cold store`
              }
              onClick={got(it.key) ? hit(it.key) : undefined}
              dim={!got(it.key)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
