import { useState } from "react";
import {
  roastCss,
  roastLabel,
  grindLabel,
  shotLabel,
  accentColor,
} from "@/features/coffee/data/beans";
import { tasteNotes, tasteHeadline } from "@/features/coffee/data/taste";
import { verdictFor } from "@/features/coffee/data/verdict";
import { POUR_LABEL } from "@/features/coffee/data/drinks";
import { uiId } from "@/features/coffee/ids";

// The end of the loop, and the only screen in this app that looks back.
//
// Every station shows you its own number while you are standing at it, and
// then you walk away and it is gone. This is the receipt: what you made, one
// remark about it, and the numbers underneath. Without it the loop just
// stops.
//
// Nothing is stored to produce this — it is the same state the meters were
// drawing, read once at the end, so the card cannot flatter a brew the bars
// were complaining about.
//
// IT IS A MOOD CARD FIRST AND A SPEC SHEET SECOND, and that is a reversal.
// It used to open with four rows of bean numbers and close with four
// paragraphs of tasting notes, every one of them on screen at once — around
// 700px of card for a drink that takes ninety seconds to make. The joke, the
// part anyone would actually read out loud, was two thirds of the way down.
//
// So the order is now: what it is, what it says about you, then the numbers,
// with the long tasting notes behind a toggle. Nothing was deleted. It is
// one click away instead of unavoidable.
//
// AND IT FITS ON A SHORT SCREEN. The card was a single unbounded column
// centred in the viewport, so on anything under about 800px tall the "brew
// another" button hung off the bottom edge with no way to reach it — the
// loop's own exit, unreachable, on the screen whose entire job is to end the
// loop. It is now a flex column with a capped height: the middle scrolls,
// the header and the footer do not, and the button lives in the footer. It
// cannot be pushed off by anything, however long the content gets.
const CARD_W = 412;

/** One `label ......... value` row. */
function Spec({ label, value, tint }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "5px 0",
        borderBottom: "1px solid #ffffff12",
      }}
    >
      <span style={{ opacity: 0.5, letterSpacing: 0.6 }}>{label}</span>
      <span style={{ color: tint ?? "#e6dccd", textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

const VESSEL = {
  mug: "a paper cup",
  tall: "a tall glass",
};

export default function DrinkCard({ flow, onAgain }) {
  // Hooks before the early return: bailing out above one changes the hook
  // count between renders, which React reads as a different component.
  const [long, setLong] = useState(false);
  if (!flow || flow.stage !== "served") return null;
  const {
    drink,
    beanData,
    roast,
    ground,
    shot,
    burnt,
    pours,
    art,
    stirred,
    glass,
  } = flow;
  // the drink resolver marks anything with no shot in it; see withoutCoffee
  const noCoffee = drink?.coffee === false;
  const notes = noCoffee
    ? []
    : tasteNotes({ bean: beanData, roast, shot, burnt, pours });
  const verdict = verdictFor({
    bean: beanData,
    roast,
    burnt,
    shot,
    pours,
    stirred,
    art,
    glass,
  });
  const accent = accentColor(beanData);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        // the gutter the card may not grow into, which keeps it off the
        // edges on a phone as well as off the bottom on a laptop
        padding: 16,
        boxSizing: "border-box",
        // the scene stays visible and clickable around it; this is a receipt,
        // not a modal that seizes the room
        pointerEvents: "none",
      }}
    >
      <div
        {...uiId("drink-card")}
        style={{
          pointerEvents: "auto",
          // NARROWER THAN THE SCREEN, ALWAYS. 412 is the design width; below
          // that the card is whatever is left after the gutter.
          width: `min(${CARD_W}px, 100%)`,
          // 100% of an inset-0 overlay is the viewport minus that padding —
          // no dvh needed, and nothing to degrade on an older browser
          maxHeight: "100%",
          display: "flex",
          flexDirection: "column",
          fontFamily: "ui-monospace, monospace",
          fontSize: 13,
          lineHeight: 1.6,
          color: "#e6dccd",
          background: "#1b1412f7",
          border: "1px solid #ffffff22",
          borderTop: `3px solid ${accent}`,
          borderRadius: 12,
          boxShadow: "0 18px 60px #000000b5",
          overflow: "hidden", // so the radius clips the scrolling middle
        }}
      >
        {/* ---- WHAT IT IS. Never scrolls: the name of the drink is the one
                thing that should still be readable at any height. ---- */}
        <div style={{ flex: "0 0 auto", padding: "18px 22px 12px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 10, letterSpacing: 1.4, opacity: 0.45 }}>
              SERVED
            </span>
            <span
              style={{
                fontSize: 10,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: burnt ? "#ff7a4d" : "#8ee6a8",
                opacity: 0.85,
                textAlign: "right",
              }}
            >
              {noCoffee
                ? "no coffee was involved"
                : tasteHeadline({ bean: beanData, roast, burnt, pours })}
            </span>
          </div>
          <div style={{ fontSize: 27, letterSpacing: 0.4, marginTop: 4 }}>
            {drink.name}
          </div>
          <div style={{ opacity: 0.6, fontSize: 12 }}>{drink.of}</div>
        </div>

        {/* ---- the middle, and the only part that scrolls. minHeight 0 is
                load-bearing: a flex child defaults to min-content height and
                would refuse to shrink below its own text, pushing the footer
                off the bottom — which is the exact bug this fixes. ---- */}
        <div
          style={{
            flex: "1 1 auto",
            minHeight: 0,
            overflowY: "auto",
            padding: "0 22px",
          }}
        >
          {/* THE JOKE, moved up to where it gets read. The notes below will
              happily tell you the coffee is bad, which is useful and not much
              fun. This reads the same choices and refuses to take any of them
              seriously. Keyed to actual state, so the same cup always gets
              the same title — a random one would stop landing by the third
              brew. */}
          <div
            style={{
              padding: "11px 13px",
              borderRadius: 9,
              background: "#ffffff09",
              border: "1px solid #ffffff14",
            }}
          >
            <div style={{ fontSize: 9.5, letterSpacing: 1.4, opacity: 0.4 }}>
              WHAT THIS CUP SAYS ABOUT YOU
            </div>
            <div
              style={{
                fontSize: 18,
                letterSpacing: 0.3,
                margin: "3px 0 5px",
                color: accent,
              }}
            >
              {verdict.title}
            </div>
            <div style={{ fontSize: 12, opacity: 0.72, lineHeight: 1.55 }}>
              {verdict.line}
            </div>
            <div style={{ fontSize: 10, opacity: 0.32, marginTop: 7 }}>
              {noCoffee
                ? "(it does not, and this one is not even coffee)"
                : "(it does not, it is coffee)"}
            </div>
          </div>

          {/* ---- THE SIDE-EYE, and it only shows up when you have earned
                  one. The bar lets you put anything into either vessel — see
                  data/verdict — so this is the entire consequence of taking
                  a highball for a single espresso: somebody noticed. ---- */}
          {verdict.aside && (
            <div
              style={{
                marginTop: 10,
                padding: "9px 13px",
                borderRadius: 9,
                background: "#ffb45a0e",
                borderLeft: "2px solid #ffb45a66",
                fontSize: 12,
                lineHeight: 1.55,
                color: "#ffcf9a",
              }}
            >
              <span style={{ opacity: 0.55 }}>— </span>
              {verdict.aside}
            </div>
          )}

          <div style={{ marginTop: 14, fontSize: 12 }}>
            {/* THE BEAN, on two rows rather than four. Dropped entirely when
                no bean was used: a glass of chocolate syrup reporting "roast
                · green · 0%" reads as a bug in the receipt rather than as a
                joke about the drink — and the joke is the point of serving
                one. */}
            {!noCoffee && (
              <>
                <Spec
                  label="bean"
                  value={
                    beanData ? `${beanData.name} · ${beanData.region}` : "—"
                  }
                  tint={accent}
                />
                <Spec
                  label="brew"
                  value={
                    <>
                      <span
                        style={{ color: burnt ? "#ff7a4d" : roastCss(roast) }}
                      >
                        {roastLabel(roast)} {(roast * 100).toFixed(0)}%
                      </span>
                      {` · ${grindLabel(ground)} · ${shotLabel(shot)} ${(
                        shot * 100
                      ).toFixed(0)}%`}
                    </>
                  }
                />
              </>
            )}
            {/* THE ORDER, spelled out — it is what the name was decided by,
                so hiding it would make the drink look arbitrary */}
            <Spec
              label="poured"
              value={pours.map((k) => POUR_LABEL[k]).join(" → ")}
            />
            {/* and what it went into, which decides nothing at all and is the
                whole reason the side-eye above has something to say */}
            {glass && <Spec label="served in" value={VESSEL[glass]} />}
            {/* earned by steaming the milk AND finishing with it — art sits
                on the surface, so milk that went in first is buried */}
            {art && (
              <Spec label="finish" value="poured with a heart" tint="#8ee6a8" />
            )}
            {stirred && <Spec label="finish" value="stirred through" />}
          </div>

          {/* How it TASTES, not how well you operated the bar — see
              data/taste, where roast and origin are read together rather than
              separately. Folded away by default; see the note at the top
              about what this card is for now. */}
          {long && notes.length > 0 && (
            <div style={{ marginTop: 14 }}>
              {notes.map((n) => (
                <p
                  key={n}
                  style={{
                    margin: "0 0 7px",
                    opacity: 0.78,
                    fontSize: 12.5,
                    lineHeight: 1.55,
                  }}
                >
                  {n}
                </p>
              ))}
            </div>
          )}
          <div style={{ height: 16 }} />
        </div>

        {/* ---- the footer, which never scrolls and never moves. Everything
                that ENDS the card lives down here. ---- */}
        <div
          style={{
            flex: "0 0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "12px 22px 16px",
            borderTop: "1px solid #ffffff14",
            background: "#1b1412",
          }}
        >
          <button
            type="button"
            onClick={onAgain}
            style={{
              fontFamily: "ui-monospace, monospace",
              fontSize: 12.5,
              letterSpacing: 0.6,
              color: "#14100f",
              background: accent,
              border: "none",
              borderRadius: 7,
              padding: "9px 16px",
              cursor: "pointer",
            }}
          >
            brew another
          </button>
          {notes.length > 0 && (
            <button
              type="button"
              onClick={() => setLong((v) => !v)}
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: 11.5,
                letterSpacing: 0.4,
                color: "#e6dccd",
                opacity: 0.6,
                background: "none",
                border: "none",
                padding: "6px 0",
                cursor: "pointer",
              }}
            >
              {long ? "less" : "how it tastes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
