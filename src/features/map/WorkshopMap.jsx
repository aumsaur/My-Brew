import { useEffect } from "react";
import { useStore } from "@/shared/store/ui";

// The unrolled hand-inked chart of the workshop — the scroll-0 scene drawn as an
// old draft map, labelling what's interactive. Being a fixed 2D illustration it's
// inherently responsive (no projecting 3D points to the screen). Toggled by the
// "the map" nav bookend (shared/components/Overlay.jsx); close via ✕, backdrop,
// or Escape.
export default function WorkshopMap() {
  const isOpen = useStore((s) => s.mapStore.isMapOpen);
  const close = useStore((s) => s.mapStore.closeMap);

  // lock page scroll + allow Escape while the map is unrolled
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && close();
    if (isOpen) {
      document.documentElement.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
    }
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  return (
    <div
      className={`wsmap${isOpen ? " open" : ""}`}
      onClick={close}
      aria-hidden={!isOpen}
    >
      <div className="wsmap-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="wsmap-close" onClick={close} aria-label="Roll up the map">
          ✕
        </button>
        <MapArt />
      </div>
      <p className="wsmap-hint">a chart of the workshop — click away to roll it up</p>
    </div>
  );
}

// little rolled-scroll glyph for the "the map" nav bookend (Overlay.jsx)
export function ScrollIcon() {
  return (
    <svg
      className="nav-button-icon"
      viewBox="0 0 44 44"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ellipse cx="11" cy="22" rx="4" ry="12" />
      <ellipse cx="33" cy="22" rx="4" ry="12" />
      <path d="M11,10 H33 M11,34 H33" />
      <path d="M16,20 q6,-4 12,0 M18,27 h8" />
      <path d="M23.5,21.5 l3,3 M26.5,21.5 l-3,3" />
    </svg>
  );
}

// The chart: iconic ink line-drawings echoing the scroll-0 composition, each
// labelled with what it does. Edit copy/positions freely.
function MapArt() {
  return (
    <svg
      className="wsmap-art"
      viewBox="0 0 900 640"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Hand-drawn map of the workshop"
    >
      {/* ── frame ── */}
      <g className="ink" strokeWidth="2.6">
        <rect x="16" y="16" width="868" height="608" rx="12" />
        <rect
          x="30"
          y="30"
          width="840"
          height="580"
          rx="7"
          strokeWidth="1.4"
          strokeDasharray="2 8"
        />
      </g>

      {/* ── title ── */}
      <text className="wsmap-t" x="450" y="70" textAnchor="middle">
        The Workshop
      </text>
      <g className="ink" strokeWidth="1.6">
        <path d="M300,84 h130 M470,84 h130" />
        <path d="M450,78 l7,6 -7,6 -7,-6 Z" fill="currentColor" stroke="none" />
      </g>

      {/* ── cauldron (centre) ── */}
      <g className="ink">
        <ellipse cx="450" cy="352" rx="86" ry="15" />
        <path d="M366,354 C 372,422 404,466 450,466 C 496,466 528,422 534,354" />
        <path d="M384,398 C 412,410 488,410 516,398" />
        <path d="M366,360 c -16,4 -16,26 0,30" />
        <path d="M534,360 c 16,4 16,26 0,30" />
        <path d="M405,464 l -8,26 M495,464 l 8,26 M450,468 l 0,28" />
        <circle cx="430" cy="336" r="7" />
        <circle cx="453" cy="327" r="9" />
        <circle cx="473" cy="338" r="6" />
        {/* embers below */}
        <path d="M426,476 c 7,10 16,8 10,-4 c 6,8 3,16 -6,16 c -9,0 -11,-8 -4,-12 Z" />
        <path d="M470,478 c 7,10 16,8 10,-4 c 6,8 3,16 -6,16 c -9,0 -11,-8 -4,-12 Z" />
        {/* the stir stick leaning in the pot — the thing you click to brew */}
        <path d="M403,322 L454,382" strokeWidth="4.5" />
        <circle cx="400" cy="318" r="7" fill="currentColor" stroke="none" />
      </g>

      {/* ── cabinet of ingredients (right) ── */}
      <g className="ink">
        <path d="M656,236 q64,-22 128,0" />
        <path d="M662,236 h116 v148 h-116 Z" />
        <path d="M720,236 v148 M662,286 h116 M662,335 h116" />
        <circle cx="691" cy="262" r="7" />
        <rect x="742" y="252" width="16" height="20" rx="3" />
        <circle cx="691" cy="311" r="8" />
        <path d="M740,300 h20 v20 h-20 Z" />
        <circle cx="691" cy="360" r="6" />
        <circle cx="750" cy="358" r="7" />
        <path d="M668,384 l -5,16 M772,384 l 5,16" />
      </g>

      {/* ── lectern + open grimoire (lower-left) ── */}
      <g className="ink">
        <ellipse cx="236" cy="556" rx="30" ry="8" />
        <path d="M236,476 v78" />
        <path d="M198,440 l 78,-14 l 11,28 l -78,14 Z" />
        <path d="M208,458 c 12,-8 24,-8 28,-4 c 4,-4 16,-4 28,4 l -2,22 c -12,-8 -24,-8 -26,-4 c -2,-4 -14,-4 -26,4 Z" />
        <path d="M236,454 v22" />
        <path d="M252,414 l2,7 7,2 -7,2 -2,7 -2,-7 -7,-2 7,-2 Z" fill="currentColor" stroke="none" />
      </g>

      {/* ── broom (upper-left, leaning) ── */}
      <g className="ink">
        <path d="M196,150 L288,238" />
        <path d="M262,214 l 14,14" strokeWidth="4" />
        <path d="M283,232 L314,250 M288,238 L306,264 M280,244 L300,270" />
      </g>

      {/* ── coat stand + hat (left) ── */}
      <g className="ink">
        <path d="M120,470 v-144" />
        <path d="M120,470 l -22,18 M120,470 l 22,18 M120,470 l 0,22" />
        <path d="M120,344 q17,-2 19,10 M120,352 q-17,-2 -19,10" />
        <path d="M96,320 L120,256 L144,320 Z" />
        <ellipse cx="120" cy="322" rx="34" ry="8" />
        <path d="M108,312 h24" />
        <path d="M104,348 c -6,44 4,86 16,96 c 12,-10 22,-52 16,-96 c -10,6 -22,6 -32,0 Z" />
      </g>

      {/* ── floating candles + stars ── */}
      <g className="ink">
        {[
          [566, 236],
          [356, 210],
          [612, 398],
        ].map(([x, y], i) => (
          <g key={i} transform={`translate(${x},${y})`}>
            <path d="M0,-7 c -5,5 -5,13 0,17 c 5,-4 5,-12 0,-17 Z" />
            <path d="M-3,11 h6 v14 h-6 Z" />
          </g>
        ))}
        {[
          [150, 150],
          [700, 470],
          [360, 540],
          [790, 150],
        ].map(([x, y], i) => (
          <path
            key={i}
            transform={`translate(${x},${y})`}
            d="M0,-6 L2,-2 L6,0 L2,2 L0,6 L-2,2 L-6,0 L-2,-2 Z"
            fill="currentColor"
            stroke="none"
          />
        ))}
      </g>

      {/* ── compass rose (bottom-right) ── */}
      <g className="ink">
        <circle cx="806" cy="556" r="30" strokeWidth="1.6" />
        <path d="M806,530 L813,556 L806,582 L799,556 Z" fill="currentColor" stroke="none" />
        <path d="M780,556 H832 M806,530 V582" strokeWidth="1.2" />
      </g>
      <text className="wsmap-tiny" x="806" y="522" textAnchor="middle">
        N
      </text>

      {/* ── labels + connectors ── */}
      <g className="ink conn" strokeWidth="1.8" strokeDasharray="1 7">
        <path d="M451,286 C 453,300 453,310 452,320" />
        <path d="M338,306 C 360,310 380,314 394,318" />
        <path d="M296,524 C 282,506 266,490 254,474" />
        <path d="M672,196 C 686,210 696,220 708,232" />
        <path d="M322,164 C 308,180 298,192 286,208" />
        <path d="M84,524 C 94,508 104,492 114,476" />
      </g>

      <g className="wsmap-labels">
        <text className="wsmap-label" x="450" y="246" textAnchor="middle">
          The Cauldron
          <tspan className="sub" x="450" dy="24">the brewing pot</tspan>
        </text>
        <text className="wsmap-label" x="334" y="298" textAnchor="end">
          The Stir Stick
          <tspan className="sub" x="334" dy="24">click it to brew</tspan>
        </text>
        <text className="wsmap-label" x="300" y="548" textAnchor="middle">
          The Grimoire
          <tspan className="sub" x="300" dy="24">click to read it</tspan>
        </text>
        <text className="wsmap-label" x="662" y="184" textAnchor="end">
          The Cabinet
          <tspan className="sub" x="662" dy="24">pick an ingredient</tspan>
        </text>
        <text className="wsmap-label" x="330" y="150" textAnchor="start">
          The Broom
          <tspan className="sub" x="330" dy="24">click — it sweeps!</tspan>
        </text>
        <text className="wsmap-label" x="46" y="556" textAnchor="start">
          The Coven Nook
        </text>
      </g>
    </svg>
  );
}
