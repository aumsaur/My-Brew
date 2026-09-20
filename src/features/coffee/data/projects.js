// The portfolio itself. Everything else in the room is the excuse.
//
// These used to be bubbles drifting past in an underwater descent, which is
// why the fields read the way they do: `color` and `glow` were a bubble's
// tint, and they survive because they are the only per-project identity we
// have — the fridge card borrows both so a project looks like itself wherever
// it turns up. The layout fields (depth, size, xPct) went with the descent.
//
// This file is the single source for project copy. The fridge dresses each one
// as a grocery in stash.js; `url` makes the card's button live, and `home`
// marks the one project you are already standing in.
export const PROJECTS = [
  {
    id: "p1",
    label: "My-Brew",
    sub: "a 3D coffee corner you actually work",
    tags: ["React Three Fiber", "Blender", "Vite"],
    color: "#9d4edd",
    glow: "rgba(157,78,221,0.4)",
    shot: "my-brew.jpg",
    blurb:
      "The site you are standing in. Every prop was modelled by hand in Blender and every station is a working toy rather than a picture of one — roast the beans, grind them, pull a shot, and find the portfolio in the fridge.",
    home: true, // it's this site — there is nowhere to send you
  },
  {
    id: "p4",
    label: "Qrap",
    sub: "Scan-to-send links & files across devices",
    tags: ["Next.js", "Cloudflare", "R2"],
    color: "#48cae4",
    glow: "rgba(72,202,228,0.4)",
    shot: "qrap.jpg",
    blurb:
      "Scan a QR code and your phone and your laptop are talking. Links and files move between devices with no account and no cable — every device is approved, sessions are ephemeral, and files go when the session ends.",
    url: "https://qrap.vercel.app",
  },
  {
    id: "p3",
    label: "Stocktomate",
    sub: "Automate a warehouse's SAP-like order-to-ship flow",
    tags: ["React Three Fiber", "Anime.js"],
    color: "#c77dff",
    glow: "rgba(199,125,255,0.4)",
    shot: "stocktomate.jpg",
    blurb:
      "A factory floor you automate rather than operate. You do not move the drone by hand — you write the plan (order, buy, build, ship), run the shift, and watch it execute.",
    url: "https://stocktomate.vercel.app",
  },
];
