import { SECTIONS, HOME } from "@/shared/constants/journey";

// Navbar items. The whole portfolio is one continuous scroll, so navigation
// means "smooth-scroll to a phase" rather than jumping to a DOM anchor. Each
// item carries:
//   target — page-scroll fraction (0–1) to scroll to when clicked
//   range  — [start, end] of the item's section; clicking while the page is
//            already inside it is a no-op ("you're already here"). Optional —
//            items without a range always scroll.
//
// Home / Projects / Skills are derived from the data-driven layout in
// journey.js, so they track the content automatically. About has no section of
// its own — the witch's story lives in the grimoire — so it lands on HOME (the
// cauldron, past the splash) and opens the book (opensGrimoire, handled in
// Overlay.jsx go()), so dismissing returns to the workshop. Contact is TBD.
export const navbarItems = [
  { name: "Home", ...SECTIONS.home },
  { name: "About", target: HOME, opensGrimoire: true }, // grimoire, over the cauldron
  { name: "Projects", ...SECTIONS.projects },
  { name: "Skills", ...SECTIONS.skills },
  { name: "Contact", target: 1 }, // section TBD
];
