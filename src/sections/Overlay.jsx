import { Fragment } from "react";
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
