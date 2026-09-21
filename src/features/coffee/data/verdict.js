import { tasteHeadline } from "@/features/coffee/data/taste";
import { SHOT_MIN, SHOT_GOOD, SHOT_OVER } from "@/features/coffee/useBrewFlow";

// WHAT YOUR COFFEE SAYS ABOUT YOU. Which is nothing, and that is the joke.
//
// The rest of the receipt is honest: taste.js grades the cup on what the
// roast did to the origin and what the extraction did to the shot, and it
// will tell you the coffee is bad. This is the other half — the part that
// takes the same choices completely un-seriously and hands you a title.
//
// Two rules keep it from being a horoscope:
//
//   It reads REAL STATE. Every verdict below is keyed to something you
//   actually did — how long you held the knobs, what order you poured in,
//   whether you went and got the ice. Nothing is random, so brewing the same
//   drink twice gives the same title and brewing a different one changes it.
//   Given the same cup it is the same joke, which is what makes it feel like
//   the machine noticed rather than rolled a dice.
//
//   It is about the COFFEE, not about you. "The Over-Extractor" is a remark
//   about a shot that ran long. It is not a personality test, it does not
//   know you, and the moment it pretends to it stops being funny.
//
// Order matters: the first match wins, so the strange and specific ones go
// above the ordinary ones. A curdled orange latte is a much better story
// than the fact that it also happens to be a milk drink.
const VERDICTS = [
  {
    id: "curdled",
    when: ({ p }) =>
      p.has("orange") && (p.has("milk") || p.has("milk-steamed")),
    title: "The Experiment",
    line: "You put citrus in milk and watched it curdle. Either you did not know, or you did and went ahead anyway. Both are a kind of courage.",
  },
  {
    id: "bumble",
    when: ({ p }) => p.has("orange") && p.has("espresso") && p.has("ice"),
    title: "The Menu Goblin",
    line: "Espresso and orange juice over ice. You are the person who orders the strangest thing on the board, and the annoying part is you are usually right.",
  },
  {
    id: "orange",
    when: ({ p }) => p.has("orange"),
    title: "The Improviser",
    line: "Juice went in. There was a whole bar of things designed to go in, and you reached past all of them.",
  },
  {
    id: "burnt",
    when: ({ burnt, shot }) => burnt && shot > SHOT_OVER,
    title: "The Deadline",
    line: "Roasted past second crack and then pulled long on top of it. This is not a drink, it is a coping mechanism, and honestly it will work.",
  },
  {
    id: "scorched",
    when: ({ burnt }) => burnt,
    title: "The Optimist",
    line: "You took the beans well past dark and brewed them anyway. Somewhere in there is a belief that it will be fine. It is not, but the belief is nice.",
  },
  {
    id: "stirred",
    when: ({ stirred, bands }) => stirred && bands > 1,
    title: "The Pragmatist",
    line: "You built it in layers and then stirred straight through them. No ceremony, no photograph. A drink is for drinking and you are correct.",
  },
  {
    id: "art",
    when: ({ art }) => art,
    title: "The Show-Off",
    line: "Steamed it, saved it for last, landed the heart. Nobody asked you to do that. It is going to be gone in four seconds and you did it anyway.",
  },
  {
    id: "textbook",
    when: ({ headline, shot }) =>
      headline === "Well matched" &&
      shot >= SHOT_GOOD[0] &&
      shot <= SHOT_GOOD[1],
    title: "The Professional",
    line: "Roast in the window, shot in the window, origin treated the way it wanted to be treated. Suspicious. Do you do this for a living?",
  },
  {
    id: "long",
    when: ({ shot }) => shot > SHOT_OVER,
    title: "The Over-Committer",
    line: "You held on well past the point where it was still doing you any good. It went bitter around the four-second mark and you kept going.",
  },
  {
    id: "short",
    when: ({ shot }) => shot < 0.34 && shot >= SHOT_MIN,
    title: "The Minimalist",
    line: "Cut it short and syrupy. You do not want the whole thing, you want the concentrated bit at the front, and then you want to leave.",
  },
  {
    id: "mocha-hidden",
    when: ({ order }) =>
      order.indexOf("chocolate") > -1 &&
      order.indexOf("chocolate") < order.indexOf("espresso"),
    title: "The Negotiator",
    line: "Chocolate in first, so the coffee had to arrive through it. You are not avoiding coffee. You are simply setting terms.",
  },
  {
    id: "mocha-on-top",
    when: ({ p }) => p.has("chocolate"),
    title: "The Decorator",
    line: "Chocolate last, sitting on top, refusing to mix. Presentation over integration. The first sip is going to be wildly unrepresentative.",
  },
  {
    id: "macchiato",
    when: ({ order }) =>
      order.indexOf("espresso") > 0 &&
      (order.indexOf("milk") === 0 || order.indexOf("milk-steamed") === 0),
    title: "The Long Game",
    line: "Milk first, shot through it, bands all the way down. You did the version that takes longer and looks better. In a tall glass, no less.",
  },
  {
    id: "cold-milk",
    when: ({ p }) => p.has("milk"),
    title: "The Impatient",
    line: "Cold milk straight from the carton. The wand was right there, steaming, free. You looked at it and chose speed.",
  },
  {
    id: "iced-black",
    when: ({ p }) => p.has("ice") && !p.has("milk-steamed"),
    title: "The Cold-Blooded",
    line: "Black, over ice, no softening agent of any kind. You have made a decision about how you take your caffeine and you are not revisiting it.",
  },
  {
    id: "long-black",
    when: ({ order }) =>
      order.indexOf("water") === 0 && order.indexOf("espresso") > 0,
    title: "The Traditionalist",
    line: "Water down first, shot on top, crema intact. There is a correct order and you know it, and you would like it noted that you know it.",
  },
  {
    id: "americano",
    when: ({ p }) => p.has("water"),
    title: "The Diplomat",
    line: "Shot first, then water through it. Same ingredients as a long black, opposite order, argued about endlessly. You picked a side.",
  },
  {
    id: "latte",
    when: ({ p }) => p.has("milk-steamed"),
    title: "The Reasonable One",
    line: "Steamed milk into espresso. The drink most people want, made properly, with no story attached. There is nothing wrong with this and it must be so boring for you.",
  },
  {
    id: "straight",
    when: ({ bands }) => bands === 1,
    title: "The Purist",
    line: "One shot. Nothing in it. No glass of water, no sit-down, no conversation. In and out.",
  },
];

const FALLBACK = {
  id: "regular",
  title: "The Regular",
  line: "Nothing unusual happened here, and that is its own kind of achievement. You know what you like and you went and made it.",
};

// THE SIDE-EYE: one raised eyebrow about the VESSEL, not about the drink.
//
// The bar does not stop you doing anything. You can take the tall glass for
// a single espresso, put ice in a paper cup, pour boiling water onto the
// rocks — every one of those is allowed, and none of them changes what the
// drink is called. An espresso in a highball is still an Espresso.
//
// So this is the whole of the consequence: the receipt notices, and says
// something. That is deliberately the cheapest possible punishment, because
// the alternative — refusing the pour, or renaming the drink — is a lock,
// and locks are what this station spent three passes getting rid of.
//
// First match wins, and most cups match nothing at all. A remark that fires
// every time is not a remark, it is a status bar.
const SIDE_EYE = [
  {
    id: "espresso-highball",
    when: ({ p, bands, glass }) =>
      glass === "tall" && bands === 1 && p.has("espresso") && !p.has("ice"),
    line: "A single espresso. In a 140mm glass. It is down there somewhere — you may need to go in after it.",
  },
  {
    id: "espresso-rocks",
    when: ({ p, bands }) => bands === 1 && p.has("espresso") && p.has("ice"),
    line: "Espresso. On ice. Nothing else. Really? That is not a coffee, that is a small dark grudge.",
  },
  {
    id: "hot-on-ice",
    when: ({ p }) => p.has("ice") && p.has("water"),
    line: "Ice in first, then boiling water straight onto it. One of those two decisions was wrong and you will find out which.",
  },
  {
    id: "steamed-on-ice",
    when: ({ p }) => p.has("ice") && p.has("milk-steamed"),
    line: "You steamed the milk. Specially. Held the jug under the wand and everything. Then you put it on a rock.",
  },
  {
    id: "ice-in-paper",
    when: ({ p, glass }) => glass === "mug" && p.has("ice"),
    line: "Ice, in a paper cup. That is going to be a wet hand in about four minutes and a wet table after that.",
  },
  {
    id: "overfilled",
    when: ({ pours, glass }) => glass === "mug" && pours.length >= 4,
    line: "Four things. In a takeaway cup. A good deal of this drink is on the counter and we are both going to pretend otherwise.",
  },
  {
    id: "hot-in-highball",
    when: ({ p, glass }) =>
      glass === "tall" &&
      !p.has("ice") &&
      (p.has("water") || p.has("milk-steamed")),
    line: "Hot, in a tall glass, with nothing cold in it. No handle either. Hold it by what, exactly?",
  },
  {
    id: "juice-cup",
    when: ({ p, glass, bands }) =>
      glass === "mug" && bands === 1 && p.has("orange"),
    line: "Orange juice. In an espresso cup. It is a shot of orange juice. Somebody somewhere is charging four pounds for this.",
  },
];

/**
 * A playful title for the cup, from what actually went into it.
 *
 * Reuses tasteHeadline rather than re-deriving whether the roast suited the
 * origin — that table lives in taste.js and there should be exactly one of
 * it, or the serious verdict and the silly one will eventually disagree
 * about the same coffee.
 */
export function verdictFor({
  bean = null,
  roast = 0,
  burnt = false,
  shot = 0,
  pours = [],
  stirred = false,
  art = false,
  // WHICH VESSEL IT WENT INTO. Read only by the side-eye — no title below
  // depends on it, because what you poured is the drink and what you poured
  // it into is a comment.
  glass = null,
}) {
  const ctx = {
    bean,
    roast,
    burnt,
    shot,
    pours,
    stirred,
    art,
    glass,
    p: new Set(pours),
    // ORDER WITHOUT THE ICE. Ice is poured first almost every time, which
    // shifts everything else along one and made "milk went in first" — the
    // whole of what a macchiato is — never match.
    order: pours.filter((k) => k !== "ice"),
    bands: pours.filter((k) => k !== "ice").length,
    headline: tasteHeadline({ bean, roast, burnt, pours }),
  };
  return {
    ...(VERDICTS.find((v) => v.when(ctx)) ?? FALLBACK),
    // null on any cup that is not asking for it, which is most of them
    aside: SIDE_EYE.find((v) => v.when(ctx))?.line ?? null,
  };
}
