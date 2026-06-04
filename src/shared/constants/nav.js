// Navbar items. The whole portfolio is one continuous scroll (the 700vh
// journey in App.jsx), so navigation means "smooth-scroll to a phase" rather
// than jumping to an anchored DOM section. Each item's `scroll` is the fraction
// (0–1) of total page scroll to travel to:
//
//   0.00  → cauldron hero (Home)
//   0.20  → brewing approach
//   0.706 → Inner world, first project centred. The inner phase begins at
//           scroll 0.68 and spans the remaining 0.32; the first project sits at
//           depth 0.08, so it is centred at 0.68 + 0.08 * 0.32 ≈ 0.706
//           (kept in sync with PROJECTS[0].depth in InnerWorld.jsx).
//   1.00  → end of the journey (Contact)
export const navbarItems = [
  { name: "Home", scroll: 0 },
  { name: "About", scroll: 0.2 },
  { name: "Projects", scroll: 0.706 },
  { name: "Contact", scroll: 1 },
];
