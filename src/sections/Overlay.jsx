import { Fragment, useEffect } from "react";
import { navbarItems } from "@/constants";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/stores/store";

const NavbarItem = () => {
  return (
    <>
      <ul className="">
        {navbarItems.map(({ name, href }, index) => (
          <Fragment key={`navItem-${index}`}>
            <li>
              <a href={href} className="">
                {name}
              </a>
            </li>
          </Fragment>
        ))}
      </ul>
    </>
  );
};

export const OverlayButton = () => {
  const { toggleOverlayMenu } = useStore(
    useShallow(({ overlayMenuStore }) => ({ ...overlayMenuStore }))
  );

  return (
    <div id="overlay-menu-container">
      <header>
        <div style={{ transformOrigin: "top right" }}>
          <button className="nav-button" onClick={toggleOverlayMenu}>
            <span className="">T</span>
          </button>
        </div>
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
      <div
        id="overlay-menu"
        className={`bg-purple-900/10 text-white ${
          isOverlayMenuOpen ? "show" : "hide"
        }`}>
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
      }}>
      <div
        style={{
          color: "white",
          fontSize: 48,
          letterSpacing: 6,
          textShadow: "0 2px 10px rgba(0,0,0,0.8)",
          userSelect: "none",
        }}>
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
      }}>
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
          }}>
          {hoveredName}
        </div>
      ) : null}
    </div>
  );
};
