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

// The end of the loop, and the only screen in this app that looks back.
//
// Every station shows you its own number while you are standing at it, and
// then you walk away and it is gone. This is the receipt: what you chose, how
// far you took each step, and one honest line about the result. Without it
// the loop just stops.
//
// Nothing is stored to produce this — it is the same state the meters were
// drawing, read once at the end, so the card cannot flatter a brew the bars
// were complaining about.
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
      <span style={{ color: tint ?? "#e6dccd" }}>{value}</span>
    </div>
  );
}

export default function DrinkCard({ flow, onAgain }) {
  if (!flow || flow.stage !== "served") return null;
  const { drink, beanData, roast, ground, shot, burnt, pours, art, stirred } =
    flow;
  const notes = tasteNotes({ bean: beanData, roast, shot, burnt, pours });
  const verdict = verdictFor({
    bean: beanData,
    roast,
    burnt,
    shot,
    pours,
    stirred,
    art,
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        // the scene stays visible and clickable around it; this is a receipt,
        // not a modal that seizes the room
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          width: 412,
          font: "13px ui-monospace, monospace",
          color: "#e6dccd",
          background: "#1b1412f7",
          border: "1px solid #ffffff22",
          borderTop: `3px solid ${accentColor(beanData)}`,
          borderRadius: 12,
          padding: "20px 22px 22px",
          lineHeight: 1.6,
          boxShadow: "0 18px 60px #000000b5",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
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
            }}
          >
            {tasteHeadline({ bean: beanData, roast, burnt, pours })}
          </span>
        </div>
        <div style={{ fontSize: 27, letterSpacing: 0.4, marginTop: 4 }}>
          {drink.name}
        </div>
        <div style={{ opacity: 0.6, fontSize: 12 }}>{drink.of}</div>

        <div style={{ marginTop: 15, fontSize: 12 }}>
          <Spec
            label="bean"
            value={beanData ? `${beanData.name} · ${beanData.region}` : "—"}
            tint={accentColor(beanData)}
          />
          <Spec
            label="roast"
            value={`${roastLabel(roast)} · ${(roast * 100).toFixed(0)}%`}
            tint={burnt ? "#ff7a4d" : roastCss(roast)}
          />
          <Spec label="grind" value={grindLabel(ground)} />
          <Spec
            label="shot"
            value={`${shotLabel(shot)} · ${(shot * 100).toFixed(0)}%`}
          />
          {/* THE ORDER, spelled out — it is what the name was decided by,
              so hiding it would make the drink look arbitrary */}
          <Spec
            label="poured"
            value={pours.map((k) => POUR_LABEL[k]).join(" → ")}
          />
          {/* earned by steaming the milk AND finishing with it — art sits on
              the surface, so milk that went in first is buried */}
          {art && (
            <Spec label="finish" value="poured with a heart" tint="#8ee6a8" />
          )}
          {stirred && <Spec label="finish" value="stirred through" />}
        </div>

        {/* THE JOKE, and it is doing real work: the notes above will happily
            tell you the coffee is bad, which is useful and not much fun. This
            reads the same choices and refuses to take any of them seriously.
            Keyed to actual state, so the same cup always gets the same title
            — a random one would stop landing by the third brew. */}
        <div
          style={{
            marginTop: 16,
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
              color: accentColor(beanData),
            }}
          >
            {verdict.title}
          </div>
          <div style={{ fontSize: 12, opacity: 0.72, lineHeight: 1.55 }}>
            {verdict.line}
          </div>
          <div style={{ fontSize: 10, opacity: 0.32, marginTop: 7 }}>
            (it does not, it is coffee)
          </div>
        </div>

        {/* How it TASTES, not how well you operated the bar — see data/taste,
            where roast and origin are read together rather than separately. */}
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

        <button
          type="button"
          onClick={onAgain}
          style={{
            marginTop: 16,
            font: "12.5px ui-monospace, monospace",
            letterSpacing: 0.6,
            color: "#14100f",
            background: accentColor(beanData),
            border: "none",
            borderRadius: 7,
            padding: "9px 16px",
            cursor: "pointer",
          }}
        >
          brew another
        </button>
      </div>
    </div>
  );
}
