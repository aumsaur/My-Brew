import { HERO_END, BREW_END, heroProgress } from "@/shared/constants/journey";

const FONT = "'Cinzel', Georgia, serif";

// Opening splash that sits BEFORE the cauldron scene. As you scroll through the
// hero phase it fades + rises away, revealing the 3D brew waiting beneath it.
// journey.js owns the scroll budget (VH.hero / HERO_END); this only paints it.
export default function Hero({ scrollProgress }) {
  const p = heroProgress(scrollProgress); // 0 at the very top → 1 once past it

  // once faded there's nothing to paint and it must not sit over the scene
  if (p >= 1) return null;

  const enterBrew = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    // land mid-brew: hero gone, cabinet up, pot framed
    window.scrollTo({
      top: max * ((HERO_END + BREW_END) / 2),
      behavior: "smooth",
    });
  };

  return (
    <div
      className="hero"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20,
        opacity: 1 - p,
        // while the splash is up it owns the pointer, so clicks can't reach the
        // scene behind it (wheel/touch scroll still works — that's not a click).
        // it unmounts at p>=1, cleanly handing interaction to the brew phase.
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        // rise + recede a touch as the liquid world approaches
        transform: `translateY(${-p * 60}px) scale(${1 - p * 0.04})`,
        // scrim: opaque near the top, clearing toward the floor so the cauldron
        // glow bleeds up from below — the scene feels like it's waiting there
        background:
          "radial-gradient(125% 95% at 50% 12%, rgba(11,4,22,0.94) 0%, rgba(22,10,38,0.72) 46%, rgba(22,10,38,0.18) 74%, transparent 100%)",
        color: "#ece3ff",
        fontFamily: FONT,
        textAlign: "center",
        padding: "0 24px",
      }}
    >
      <div className="hero-content">
        <p className="hero-eyebrow">Witch-Apothecary of the Web</p>
        <h1 className="hero-name">Aumster</h1>
        <div className="hero-rule" />
        <p className="hero-tagline">I brew the mundane into the magical</p>
      </div>

      <button
        className="hero-cue"
        onClick={enterBrew}
        type="button"
        aria-label="Scroll down to the brew"
      >
        <span className="hero-cue-text">scroll to stir the pot</span>
        <span className="hero-cue-arrow" aria-hidden="true">
          ↓
        </span>
      </button>

      {/* Hand-inked hints pointing at the two fixed overlay buttons (same chalk
          style as the workshop map). They're painted ON the splash, so they fade
          + retire with it and — being viewport-fixed like the buttons — stay put
          across screen sizes without any 3D→screen projection. pointer-events off
          so they never intercept the buttons underneath. */}
      <div className="hero-doodles" aria-hidden="true">
        {/* → the rolled-scroll map button, top-left (arrow stops at its right
            edge so it isn't swallowed by the button, which sits above the hero) */}
        <div className="hero-doodle hero-doodle-map">
          <svg className="hero-doodle-arrow" viewBox="0 0 56 44" fill="none">
            <path d="M40,14 C 30,20 18,20 10,20" strokeDasharray="3 6" />
            <path d="M10,20 l 10,-5 M10,20 l 10,5" />
          </svg>
          <span className="hero-doodle-text">unroll the map</span>
        </div>

        {/* → the grimoire nav button, top-right (mirror of the map hint: arrow
            stops at the button's LEFT edge so it isn't hidden beneath it) */}
        <div className="hero-doodle hero-doodle-nav">
          <span className="hero-doodle-text">leaf through it</span>
          <svg className="hero-doodle-arrow" viewBox="0 0 56 44" fill="none">
            <path d="M16,14 C 26,20 38,20 46,20" strokeDasharray="3 6" />
            <path d="M46,20 l -10,-5 M46,20 l -10,5" />
          </svg>
        </div>
      </div>
    </div>
  );
}
