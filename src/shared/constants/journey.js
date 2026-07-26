import { PROJECTS } from "@/features/inner/data/projects";

// ── Data-driven journey layout ───────────────────────────────────────────────
// The whole site is ONE continuous vertical scroll. Each phase gets a budget in
// viewport-heights (vh); the page height is exactly their sum, so the PROJECTS
// phase — and therefore the entire journey — grows automatically as you add
// projects. Every scroll boundary below is DERIVED from these weights, so there
// are no magic fractions to keep in sync (this replaces the old fixed 700vh).
//
// Weights are tuned so the CURRENT content (3 projects) reproduces the original
// timing (dive ≈ 0.55–0.68, inner ≈ 0.68→1.0) — i.e. the dive-in feel is kept.
const VH = {
  hero: 90, // opening splash: name + tagline (fades into the brew below)
  brew: 84, // cauldron scene + brewing mini-game (BrewShelf visible)
  approach: 301, // camera drifts in toward the pot
  dive: 91, // plunge: the 3D canvas crossfades into the liquid world
  perProject: 52, // scroll budget PER project bubble  ← the data-driven part
  skills: 67, // crystal hall (all crystals reveal together — one arrival)
};

const clamp01 = (v) => Math.min(1, Math.max(0, v));

const projectCount = Math.max(1, PROJECTS.length);
const projectsVh = projectCount * VH.perProject;

// phases in scroll order → cumulative boundaries as fractions of the total
const ORDER = [
  ["hero", VH.hero],
  ["brew", VH.brew],
  ["approach", VH.approach],
  ["dive", VH.dive],
  ["projects", projectsVh],
  ["skills", VH.skills],
];
export const TOTAL_VH = ORDER.reduce((sum, [, vh]) => sum + vh, 0);

const bound = {};
let acc = 0;
for (const [name, vh] of ORDER) {
  bound[name] = { start: acc / TOTAL_VH, end: (acc + vh) / TOTAL_VH };
  acc += vh;
}

export const HERO_END = bound.hero.end; // opening splash has fully faded by here
export const BREW_END = bound.brew.end; // BrewShelf hides past here

// "Home" landing — a little into the brew phase, where the cauldron reads as the
// main stage (splash cleared, the mini-game HUD in view). The About nav opens
// the grimoire from here so DISMISSING the book returns to the workshop, not the
// very top splash. See shared/constants/nav.js + shared/components/Overlay.jsx.
export const HOME = HERO_END + (BREW_END - HERO_END) * 0.4;
export const DIVE = bound.dive; // {start,end} of the canvas↔liquid crossfade
export const INNER_START = bound.projects.start; // liquid world begins
export const INNER_SPAN = 1 - INNER_START; // projects + skills, down to the bottom

// Fraction of the inner phase occupied by projects (the rest is the skills
// arrival). The crystals begin revealing once the descent passes this point.
export const PROJECTS_PORTION = projectsVh / (projectsVh + VH.skills);

// opening-splash progress (0→1) across the hero phase — drives the Hero
// overlay's fade + rise as the cauldron scene is revealed beneath it
export const heroProgress = (scroll) => clamp01(scroll / HERO_END);

// crossfade progress (0→1) across the dive phase — drives canvas fade-out and
// the InnerWorld mask reveal (they share this so they stay locked together)
export const diveProgress = (scroll) =>
  clamp01((scroll - DIVE.start) / (DIVE.end - DIVE.start));

// inner-world descent progress (0→1) across the projects + skills span
export const innerProgressOf = (scroll) =>
  clamp01((scroll - INNER_START) / INNER_SPAN);

// crystal floor reveal (0→1): flat 0 through the whole projects portion, then
// ramps up across the skills portion
export const floorRevealOf = (innerProgress) =>
  clamp01((innerProgress - PROJECTS_PORTION) / (1 - PROJECTS_PORTION));

// page-scroll fraction at which the descent reaches a given innerProgress
export const innerScroll = (innerProgress) =>
  INNER_START + innerProgress * INNER_SPAN;

// ── Navigable sections (consumed by the navbar) ──────────────────────────────
// Each section owns a scroll `range`; clicking its nav item while the page is
// already inside that range is a no-op ("you're already here"). Otherwise the
// nav smooth-scrolls to `target`. Derived from the layout above, so they track
// the data automatically (add a project → Projects/Skills targets recompute).
const skillsStart = innerScroll(PROJECTS_PORTION);

export const SECTIONS = {
  home: { range: [0, BREW_END], target: 0 },
  projects: {
    range: [INNER_START, skillsStart],
    target: innerScroll(PROJECTS[0].depth), // centre the first project bubble
  },
  skills: {
    range: [skillsStart, 1],
    // the crystal hall only fully resolves at the very bottom of the descent
    // (the floorReveal/htmlOpacity crossfade is compressed into the final
    // sliver), so the Skills target is the absolute end of the journey
    target: 1,
  },
};
