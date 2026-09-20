import { ROAST_ORDER } from "@/features/coffee/data/beans";
import { SHOT_GOOD, SHOT_OVER } from "@/features/coffee/useBrewFlow";

// What the drink actually tastes like, from how it was made.
//
// The summary used to grade the PROCESS — "pulled inside the window" — which
// is feedback about the bar, not about the coffee. This grades the CUP.
//
// The thing that makes it read as real rather than as two lookups glued
// together is that roast and origin are not independent. A washed Yirgacheffe
// is bought for its jasmine and bergamot, and those are the first things a
// dark roast destroys; a wet-hulled Sumatra is bought for earth and body, and
// taken light it just tastes green and savoury. So each origin carries the
// roast band it is FOR, and the verdict is about that pairing.
//
// Grounding, for anyone editing the copy:
//   - Roasting runs first crack (light) through second crack (dark). Before
//     first crack finishes the bean is under-developed: grassy, sour, thin.
//     Through the Maillard phase it gains caramel sweetness and body. At
//     second crack the roast itself starts to dominate — bittersweet, smoky,
//     oils on the surface — and origin character is burned off with it.
//   - Acidity falls and body changes as the roast goes darker. Delicate
//     high-acid coffees have the most to lose; low-acid, body-forward ones
//     have the least.
//   - In the shot, sweet and acidic compounds extract EARLY and bitter,
//     astringent ones LATE. That is why a ristretto reads sweet and syrupy
//     and a long shot reads thin and harsh.
//   - Steaming milk makes it taste sweeter (lactose, plus the change in
//     perception with warmth) up to about the point where it scalds. Milk
//     mutes acidity and adds body: it rescues a harsh roast and buries a
//     delicate one.
//   - Water lengthens without hiding. Chocolate hides almost everything.
//   - ORDER changes the cup. Pouring the shot onto hot water keeps the crema
//     intact on the surface; adding water to a poured shot breaks it up and
//     stirs it through. Chocolate put in before the shot dissolves in the
//     heat; chocolate added at the end sits on top and never mixes. Milk
//     poured into espresso combines; espresso poured through milk bands.

// Where each origin wants to be roasted, as a fraction of the roast track,
// plus what it tastes like on either side of that.
const ORIGIN = {
  ethiopia: {
    best: [0.05, 0.45], // light to medium — anything darker is a waste of it
    at: "jasmine and bergamot over a light, tea-like body",
    under: "green and hay-like, with the florals still locked up",
    over: "the jasmine burnt off, leaving generic roast bitterness",
    body: "delicate",
  },
  colombia: {
    best: [0.2, 0.68], // the forgiving one
    at: "caramel sweetness with a clean red-apple acidity",
    under: "sharp and cereal-ish, sweetness not developed yet",
    over: "caramel tipped into scorched sugar, the apple gone",
    body: "medium",
  },
  brazil: {
    best: [0.35, 0.85], // built for the dark end; the classic espresso base
    at: "milk chocolate and roasted nut, low acid, heavy in the mouth",
    under: "flat and nutty-raw, more cereal than chocolate",
    over: "chocolate turned to charcoal",
    body: "heavy",
  },
  sumatra: {
    best: [0.5, 0.85], // wet-hulled; earth and body are the point
    at: "cedar, damp earth and a syrupy, almost savoury weight",
    under: "green and vegetal — the earthiness reads as raw, not deep",
    over: "ashy, with the cedar gone woody",
    body: "syrupy",
  },
};

/** Which roast band a 0..1 roast lands in, as a word. */
function band(roast) {
  const span = Math.min(1, roast) * (ROAST_ORDER.length - 1);
  return ROAST_ORDER[Math.min(ROAST_ORDER.length - 2, Math.floor(span))];
}

const BAND_PHRASE = {
  light: "taken light",
  medium: "roasted to the middle",
  mediumDark: "pushed to the edge of second crack",
  dark: "taken dark",
};

/**
 * Two to four sentences about the cup, in order: what it tastes of, whether
 * the roast suited the bean, what the shot length did, what the additions
 * did. Returns an array so the card can space them.
 */
export function tasteNotes({
  bean,
  roast = 0,
  shot = 0,
  burnt = false,
  pours = [],
}) {
  const o = ORIGIN[bean?.id];
  const out = [];
  const has = (k) => pours.includes(k);
  const at = (k) => pours.indexOf(k);
  const before = (a, b) => has(a) && has(b) && at(a) < at(b);
  // two milk kinds, one ingredient — but the TEXTURE is a different fact
  const steamedMilk = has("milk-steamed");
  const milk = has("milk") || steamedMilk;
  const milkAt = steamedMilk ? at("milk-steamed") : at("milk");
  const water = has("water");
  const chocolate = has("chocolate");
  const orange = has("orange");
  const iced = has("ice");

  if (!o) return ["Nothing in the cup."];

  // 1 — the bean, as the roast left it
  if (burnt) {
    out.push(
      `The ${bean.name.toLowerCase()} went past dark and never came back: ${o.over}. Everything below this is being tasted through ash.`
    );
  } else if (roast < o.best[0]) {
    out.push(
      `Under-developed. ${bean.name} ${BAND_PHRASE[band(roast)]} comes out ${o.under}.`
    );
  } else if (roast > o.best[1]) {
    out.push(
      `Over-roasted for this bean. ${bean.name} ${BAND_PHRASE[band(roast)]} means ${o.over}.`
    );
  } else {
    out.push(
      `${bean.name} ${BAND_PHRASE[band(roast)]}, which is where it wants to be — ${o.at}.`
    );
  }

  // 2 — the shot. Sweet extracts early, bitter late.
  if (shot < 0.25) {
    out.push(
      "Pulled as a ristretto, so it is dense and sweet-forward — the bitter end of the extraction never arrived."
    );
  } else if (shot > SHOT_OVER) {
    out.push(
      "Run far too long. Past the sweetness you are into the astringent tail, and the body has gone thin and hollow."
    );
  } else if (shot > SHOT_GOOD[1]) {
    out.push(
      "A touch long. Still sweet, but there is a dry, drying edge on the finish."
    );
  } else {
    out.push(
      `Extraction landed in the window, so the ${o.body} body is intact and the finish is clean.`
    );
  }

  // 3 — what went in. Chocolate dominates whatever else is there.
  if (orange && milk) {
    out.push(
      "Orange juice and milk in the same glass. The citric acid drops the casein out of suspension on contact, so it is curdled — this is a chemistry demonstration, not a drink."
    );
  } else if (orange) {
    out.push(
      iced
        ? "Orange juice under the shot and ice through it: sharp, sweet and bitter all at once, and cold enough that the bitterness stays in the background. It works because nothing is pretending to be coffee-flavoured."
        : "Orange juice and a warm shot, which is the same idea without the thing that makes it work. Warm citrus and warm coffee just argue."
    );
  } else if (chocolate) {
    out.push(
      before("chocolate", "espresso")
        ? "The chocolate went in first and dissolved in the hot shot, so it is sweet all the way down — and none of the bean's character survives it."
        : "The chocolate went in last, so it never dissolved: sweet on the first mouthful, bitter coffee underneath, and no amount of stirring will fix it now."
    );
  } else if (milk) {
    const base =
      o.body === "delicate"
        ? "smothers the florals this bean was picked for. Good coffee, wrong use of it."
        : "rounds off the acidity and doubles the body. This is the bean that suits it.";
    // Steaming is not just heat: lactose reads sweeter warm, and the
    // microfoam carries aroma differently from cold milk out of the carton.
    out.push(
      steamedMilk
        ? `Steamed, so the lactose reads sweeter and the texture carries it — it ${base}`
        : `Straight from the carton, so it is thinner and flatter than steamed would be, and cold milk mutes more than it softens. It ${base}`
    );
  } else if (water) {
    out.push(
      "Lengthened with hot water, which hides nothing — it spreads the shot out and lets you taste exactly what you pulled."
    );
  }

  // 4 — ORDER. Only where it genuinely changed the cup, or the sequence
  // mechanic is just a naming trick.
  if (before("water", "espresso")) {
    out.push(
      "Pulled onto the water rather than watered afterwards, so the crema is still sitting on the surface where you can taste it."
    );
  } else if (before("espresso", "water")) {
    out.push(
      "The water went in after the shot, which breaks the crema up and stirs it through. Flatter on the nose than it had to be."
    );
  } else if (milk && milkAt < at("espresso")) {
    out.push(
      "Poured through the milk rather than into it, so it has stayed banded — dark over pale, and it changes as you drink down through it."
    );
  } else if (steamedMilk && at("milk-steamed") === pours.length - 1) {
    out.push(
      "Textured milk poured in last and on top, which is the only way a pattern survives the pour. It will hold for about as long as it takes to carry it to a table."
    );
  }

  if (iced && !orange) {
    out.push(
      "Over ice, which mutes the aromatics and the bitterness together — colder coffee reads cleaner and less sweet, so this tastes sharper and simpler than the same glass warm."
    );
  }

  return out;
}

/** One-line headline for the top of the card. */
export function tasteHeadline({ bean, roast = 0, burnt = false, pours = [] }) {
  if (burnt) return "Burnt";
  if (pours.includes("orange")) {
    return pours.includes("milk") || pours.includes("milk-steamed")
      ? "Curdled"
      : "Odd, but it works";
  }
  if (pours[pours.length - 1] === "milk-steamed")
    return "Poured with a pattern";
  if (pours.includes("chocolate")) {
    return pours.indexOf("chocolate") < pours.indexOf("espresso")
      ? "Sweet, and hiding"
      : "Unmixed";
  }
  const o = ORIGIN[bean?.id];
  if (!o) return "—";
  if (roast < o.best[0]) return "Under-developed";
  if (roast > o.best[1]) return "Over-roasted";
  return "Well matched";
}
