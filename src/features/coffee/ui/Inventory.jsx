import { useState } from "react";
import {
  roastCss,
  roastLabel,
  grindLabel,
  shotLabel,
  accentColor,
} from "@/features/coffee/data/beans";

// Inventory slot for the bean in hand, and the only thing on screen that
// persists across the whole loop.
//
// THE THREE RINGS ARE THE OLD METERS. There used to be a 360-wide stack of
// three bars along the bottom of the screen for the entire session, and at
// any moment two of them were dimmed — a dashboard, in the room's largest
// piece of screen, mostly about what you are not doing. The live bar now
// belongs to the station you are at (ui/StationPanel) and what remains here
// is state, not progress: three rings you read at a glance and hover for the
// words. A ring is an icon; a bar is a readout, and only one of the two has
// any business being permanent.
//
// This is also where TEXT belongs: parked on a thing you can inspect, not
// narrating the loop. The loop itself is told by the scene — the beacon, the
// loaded drum, the grounds puck.

/** One state ring: filled by how far along, coloured by what it is. */
function Ring({ label, value = 0, colour, title }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <span
      title={title}
      style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}
    >
      <span
        style={{
          width: 16,
          height: 16,
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
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#1b1412",
          }}
        />
      </span>
      <span style={{ fontSize: 10, letterSpacing: 0.6, opacity: 0.55 }}>
        {label}
      </span>
    </span>
  );
}

export default function Inventory({
  bean,
  roast = 0,
  ground = 0,
  shot = 0,
  onClear,
}) {
  const [open, setOpen] = useState(false);
  const empty = !bean;

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      style={{
        position: "absolute",
        right: 16,
        top: 16,
        width: 196,
        font: "12px ui-monospace, monospace",
        color: "#e6dccd",
        background: "#1b1412e6",
        border: "1px solid #ffffff1f",
        borderRadius: 10,
        padding: 12,
        lineHeight: 1.6,
        cursor: empty ? "default" : "help",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ opacity: 0.55, fontSize: 10, letterSpacing: 1 }}>
          IN HAND
        </span>
        {/* An explicit way to end up empty-handed. Without it the only thing a
            bag click could do was SWAP, so "there is no clear" and "picking
            another bean silently wipes what you had" were the same problem. */}
        {!empty && (
          <button
            type="button"
            onClick={onClear}
            title="put the bag back — discards this roast"
            style={{
              font: "10px ui-monospace, monospace",
              letterSpacing: 0.5,
              color: "#e6dccd",
              background: "#ffffff12",
              border: "1px solid #ffffff24",
              borderRadius: 5,
              padding: "2px 7px",
              cursor: "pointer",
            }}
          >
            put back
          </button>
        )}
      </div>

      {empty ? (
        <div style={{ opacity: 0.45, marginTop: 6 }}>— nothing picked —</div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              marginTop: 6,
            }}
          >
            {/* THE BAG'S OWN COLOUR, not the roast's. The four bags on the
                shelf are told apart by their label colour and nothing else,
                so a swatch showing how far the roast has got answered a
                question nobody was asking and left "which one is that?"
                unanswered. The roast has a ring of its own below. */}
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: accentColor(bean),
                border: "1px solid #00000055",
                flex: "0 0 auto",
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "#fff", fontSize: 14, letterSpacing: 0.3 }}>
                {bean.name}
              </div>
              <div style={{ opacity: 0.6, fontSize: 11 }}>{bean.region}</div>
            </div>
          </div>

          {/* the whole loop's state, at a glance and in no space at all */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 6,
              marginTop: 9,
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

          {open && (
            <div
              style={{
                marginTop: 9,
                paddingTop: 9,
                borderTop: "1px solid #ffffff1a",
                opacity: 0.85,
              }}
            >
              <div>
                roast · <b>{roastLabel(roast)}</b> ({(roast * 100).toFixed(0)}%)
              </div>
              <div>
                grind · <b>{grindLabel(ground)}</b> ({(ground * 100).toFixed(0)}
                %)
              </div>
              <div>
                shot · <b>{shotLabel(shot)}</b> ({(shot * 100).toFixed(0)}%)
              </div>
              <div style={{ opacity: 0.7, marginTop: 4 }}>{bean.notes}</div>
              <div style={{ opacity: 0.5, marginTop: 6, fontSize: 11 }}>
                another bag swaps · same bag puts it back
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
