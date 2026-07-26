import { useEffect } from "react";
import { navbarItems } from "@/shared/constants/nav";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/shared/store/ui";
import { toRoman } from "@/shared/utils/lib";
import { ScrollIcon } from "@/features/map/WorkshopMap";

// Current scroll position as a fraction (0–1) of the total page scroll.
function currentFraction() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? window.scrollY / max : 0;
}

// Scroll to a fraction (0–1) of the total page scroll. Works from anywhere in
// the journey — including once the inner world has taken over — because every
// phase is driven off this single window scroll position. `smooth` off jumps
// instantly: used when we're about to open an overlay that locks page scroll
// (the grimoire), so the position is committed BEFORE the freeze catches it.
function scrollToFraction(frac, smooth = true) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const top = frac * max;
  if (smooth) window.scrollTo({ top, behavior: "smooth" });
  else window.scrollTo(0, top);
}

const NavbarItem = () => {
  const { closeOverlayMenu } = useStore(
    useShallow(({ overlayMenuStore }) => ({ ...overlayMenuStore }))
  );
  const openBook = useStore((s) => s.grimoireStore.openBook);

  // `opensGrimoire` items (About) have no section of their own — they live in
  // the grimoire. Jump to HOME (the cauldron) instantly so the position is set
  // before the book locks scroll, then open the book — dismissing it lands back
  // on the workshop, not the top splash.
  const go = ({ target, range, opensGrimoire }) => {
    // already inside this item's section → no-op (you're already there)
    if (range) {
      const cur = currentFraction();
      if (cur >= range[0] && cur <= range[1]) {
        closeOverlayMenu();
        if (opensGrimoire) openBook();
        return;
      }
    }
    scrollToFraction(target, !opensGrimoire);
    closeOverlayMenu();
    if (opensGrimoire) openBook();
  };

  return (
    <div className="nav-inner">
      <p className="nav-eyebrow">The Grimoire</p>
      <ul className="nav-list">
        {navbarItems.map((item, index) => (
          <li className="nav-item" key={`navItem-${index}`}>
            <a
              href="#"
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                go(item);
              }}
            >
              <span className="nav-index">{toRoman(index + 1)}</span>
              <span className="nav-text">{item.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

// A little open-grimoire glyph for the nav toggle — the mirror bookend to the
// map button's rolled scroll (features/map/WorkshopMap.jsx ScrollIcon).
function GrimoireIcon() {
  return (
    <svg
      className="nav-button-icon"
      viewBox="0 0 44 44"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* open book — two pages meeting at the spine */}
      <path d="M22,13 C 17.5,9.5 10.5,9.5 6,11.5 V32 C 10.5,30 17.5,30 22,33.5" />
      <path d="M22,13 C 26.5,9.5 33.5,9.5 38,11.5 V32 C 33.5,30 26.5,30 22,33.5" />
      <path d="M22,13 V33.5" strokeWidth="1.5" />
      {/* faint lines of script on each page */}
      <path
        d="M10,17 q5,-1.4 9,0 M10,22 q5,-1.4 9,0 M25,17 q5,-1.4 9,0 M25,22 q5,-1.4 9,0"
        strokeWidth="1.2"
      />
      {/* a spark of magic rising off the page */}
      <path
        d="M22,3.5 l1,3 3,1 -3,1 -1,3 -1,-3 -3,-1 3,-1 Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export const OverlayButton = () => {
  const { toggleOverlayMenu } = useStore(
    useShallow(({ overlayMenuStore }) => ({ ...overlayMenuStore }))
  );
  const { isMapOpen, toggleMap } = useStore(
    useShallow(({ mapStore }) => ({ ...mapStore }))
  );

  return (
    <div id="overlay-menu-container">
      <header>
        {/* left bookend — the workshop map (its chart lives in WorkshopMap) */}
        <button
          className={`nav-button nav-button--left${isMapOpen ? " active" : ""}`}
          onClick={toggleMap}
          aria-label={isMapOpen ? "Roll up the map" : "Unroll the workshop map"}
          title="The workshop map"
        >
          <ScrollIcon />
          <span className="nav-button-label">the map</span>
        </button>

        {/* right bookend — the grimoire nav menu */}
        <button
          className="nav-button"
          onClick={toggleOverlayMenu}
          aria-label="Open the grimoire menu"
          title="The grimoire"
        >
          <GrimoireIcon />
          <span className="nav-button-label">grimoire</span>
        </button>
      </header>
    </div>
  );
};

export const OverlayMenu = () => {
  const { isOverlayMenuOpen } = useStore(
    useShallow(({ overlayMenuStore }) => ({ ...overlayMenuStore }))
  );

  return (
    <>
      <div id="overlay-menu" className={isOverlayMenuOpen ? "show" : "hide"}>
        <nav>
          <NavbarItem />
        </nav>
      </div>
    </>
  );
};

export const StartOverlay = () => {
  const { isPlaying, startPlaying } = useStore(
    useShallow(({ playerStore }) => ({ ...playerStore }))
  );

  useEffect(() => {
    const onAnyKey = (e) => {
      if (!isPlaying) {
        // try to request pointer lock via the canvas if possible
        const canvas = document.querySelector("canvas");
        if (canvas && canvas.requestPointerLock) {
          canvas.requestPointerLock();
        }
        startPlaying();
      }
    };
    window.addEventListener("keydown", onAnyKey);
    return () => window.removeEventListener("keydown", onAnyKey);
  }, [isPlaying, startPlaying]);

  const handleStart = (e) => {
    // prefer requesting pointer lock on the element that received the gesture
    const el = e && e.currentTarget;
    let locked = false;
    if (el && el.requestPointerLock) {
      try {
        el.requestPointerLock();
        locked = true;
      } catch (err) {
        locked = false;
      }
    }

    if (!locked) {
      const canvas = document.querySelector("canvas");
      if (canvas && canvas.requestPointerLock) {
        try {
          canvas.requestPointerLock();
        } catch (err) {
          // ignore
        }
      }
    }

    if (!isPlaying) startPlaying();
  };

  if (isPlaying) return null;

  return (
    <div
      onClick={handleStart}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          color: "white",
          fontSize: 48,
          letterSpacing: 6,
          textShadow: "0 2px 10px rgba(0,0,0,0.8)",
          userSelect: "none",
        }}
      >
        ENTER
      </div>
    </div>
  );
};

export const Crosshair = () => {
  const { isPlaying } = useStore(
    useShallow(({ playerStore }) => ({ ...playerStore }))
  );

  const { hoveredName } = useStore(
    useShallow(({ playerStore }) => ({ ...playerStore }))
  );

  if (!isPlaying) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 101,
      }}
    >
      <div
        style={{
          width: 12,
          height: 12,
          border: "2px solid white",
          borderRadius: 2,
          opacity: 0.9,
        }}
      />
      {hoveredName ? (
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: 30,
            transform: "translateX(-50%)",
            color: "white",
            fontSize: 16,
            padding: "6px 10px",
            background: "rgba(0,0,0,0.4)",
            borderRadius: 6,
            pointerEvents: "none",
          }}
        >
          {hoveredName}
        </div>
      ) : null}
    </div>
  );
};
