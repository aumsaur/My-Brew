// Data for the inner world (the underwater project/skill nebula). Pulled out of
// InnerWorld.jsx so the layout is data-driven — tweak positions, sizes and
// colours here without touching render code.

// Featured project bubbles. `depth` is where each sits along the projects
// descent (0 = first/top, increasing = deeper); a bubble is centred on screen
// when innerProgress equals its depth. The scroll LENGTH of this section scales
// with how many projects are here — see shared/constants/journey.js, which
// turns PROJECTS.length into the projects phase budget and derives the navbar
// targets (innerScroll(PROJECTS[i].depth)) from these depths. `url` is optional
// — when present the bubble is clickable and opens the live site in a new tab.
export const PROJECTS = [
  {
    id: "p1",
    depth: 0.08,
    label: "My-Brew",
    sub: "3D scroll-driven portfolio",
    tags: ["React", "Three.js", "GSAP"],
    size: 240,
    xPct: 47,
    color: "#9d4edd",
    glow: "rgba(157,78,221,0.4)",
    home: true, // it's this site — clicking it scrolls back to the top instead of opening a link
  },
  {
    id: "p4",
    depth: 0.35,
    label: "Qrap",
    sub: "Scan-to-send links & files across devices",
    tags: ["Next.js", "Cloudflare", "R2"],
    size: 245,
    xPct: 52,
    color: "#48cae4", // sky-cyan nod to Qrap's brand, a standout among the purples
    glow: "rgba(72,202,228,0.4)",
    url: "https://qrap.vercel.app",
  },
  {
    id: "p3",
    depth: 0.6,
    label: "Stocktomate",
    sub: "Automate a warehouse's SAP-like order-to-ship flow",
    tags: ["React Three Fiber", "Anime.js"],
    size: 225,
    xPct: 43,
    color: "#c77dff",
    glow: "rgba(199,125,255,0.4)",
    url: "https://stocktomate.vercel.app",
  },
];

// Decorative empty bubbles drifting past at various depths.
export const MINI = [
  { id: 0, depth: 0.04, size: 22, xPct: 12, opacity: 0.25 },
  { id: 1, depth: 0.12, size: 45, xPct: 80, opacity: 0.18 },
  { id: 2, depth: 0.19, size: 18, xPct: 28, opacity: 0.3 },
  { id: 3, depth: 0.25, size: 60, xPct: 70, opacity: 0.15 },
  { id: 4, depth: 0.31, size: 28, xPct: 18, opacity: 0.22 },
  { id: 5, depth: 0.44, size: 38, xPct: 85, opacity: 0.2 },
  { id: 6, depth: 0.5, size: 20, xPct: 35, opacity: 0.28 },
  { id: 7, depth: 0.56, size: 55, xPct: 8, opacity: 0.16 },
  { id: 8, depth: 0.7, size: 32, xPct: 75, opacity: 0.24 },
  { id: 9, depth: 0.76, size: 48, xPct: 22, opacity: 0.19 },
];

// Ambient rising particles.
export const PARTICLES = [
  { id: 0, size: 4, xPct: 8, delay: 0, dur: 6, color: "#c77dff" },
  { id: 1, size: 6, xPct: 23, delay: 1.2, dur: 8, color: "#9d4edd" },
  { id: 2, size: 3, xPct: 37, delay: 0.5, dur: 5, color: "#c77dff" },
  { id: 3, size: 8, xPct: 51, delay: 2.1, dur: 9, color: "#9d4edd" },
  { id: 4, size: 5, xPct: 64, delay: 0.8, dur: 7, color: "#e0b0ff" },
  { id: 5, size: 4, xPct: 78, delay: 1.7, dur: 6, color: "#c77dff" },
  { id: 6, size: 7, xPct: 15, delay: 3.0, dur: 10, color: "#9d4edd" },
  { id: 7, size: 3, xPct: 42, delay: 0.3, dur: 5, color: "#e0b0ff" },
  { id: 8, size: 5, xPct: 57, delay: 2.5, dur: 8, color: "#c77dff" },
  { id: 9, size: 4, xPct: 71, delay: 1.0, dur: 6, color: "#9d4edd" },
  { id: 10, size: 9, xPct: 88, delay: 0.7, dur: 11, color: "#9d4edd" },
  { id: 11, size: 3, xPct: 32, delay: 3.5, dur: 6, color: "#e0b0ff" },
];

// Light rays shimmering down from the surface.
export const RAYS = [
  { id: 0, left: "15%", rotate: -15, delay: 0, dur: 4.0, width: 2 },
  { id: 1, left: "30%", rotate: -8, delay: 1.5, dur: 5.0, width: 1 },
  { id: 2, left: "50%", rotate: 0, delay: 0.7, dur: 3.5, width: 3 },
  { id: 3, left: "65%", rotate: 12, delay: 2.2, dur: 4.5, width: 1 },
  { id: 4, left: "80%", rotate: 18, delay: 0.3, dur: 5.0, width: 2 },
];

// How far (in vh) bubbles travel across the full descent.
export const TRAVEL = 140;
