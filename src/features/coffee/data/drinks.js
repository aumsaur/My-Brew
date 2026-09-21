import { SHOT_OVER } from "@/features/coffee/useBrewFlow";

// What you built, from WHAT you poured and IN WHAT ORDER.
//
// Order is not a gimmick here — it is one of the few places where café
// vocabulary is genuinely about sequence rather than ingredients:
//
//   water, then espresso  -> Long Black. The shot lands on the water and the
//                            crema survives, sitting on top.
//   espresso, then water  -> Americano. Adding water to the shot breaks the
//                            crema up and stirs it through.
//   espresso, then milk   -> Latte. Milk poured into the shot combines.
//   milk, then espresso   -> Latte Macchiato. The shot falls through the milk
//                            and you get the banded glass it is named for.
//   chocolate first       -> it dissolves into the hot shot.
//   chocolate last        -> it sits on top, unmixed.
//
// MILK COMES IN TWO KINDS, because that is the difference between a drink
// and a nicer drink. `milk` is poured cold straight from the carton; it makes
// a latte. `milk-steamed` has been through the wand, and textured milk poured
// LAST is what latte art is — so the art is earned by both steaming it and
// finishing with it, not by a flag set somewhere earlier.
export const POURS = [
  "ice",
  "espresso",
  "milk",
  "milk-steamed",
  "water",
  "orange",
  "chocolate",
];

// What each pour looks like in the glass. The dark two are darker than a
// swatch-picker suggests on purpose: everything here is seen through a glass
// wall, which lifts and neutralises them. Measured, not guessed — espresso
// at #3a1f12 came out of the render as (118,109,105), a neutral grey.
export const POUR_COLOUR = {
  // A FALLBACK, not the live value. The espresso band is the colour of the
  // bean that was roasted and the length it was pulled, so the serve station
  // hands Contents an override from espressoBandCss; this is what anything
  // without a roast to consult gets. Changing it will not change the drink.
  espresso: "#24120b",
  milk: "#efe3cf",
  "milk-steamed": "#f6ede0",
  // NOT BEIGE. #c8b79b was picked so a water band would read inside a
  // layered drink, and the cost was the carafe: a tan fill at 62% opacity in
  // a glass jug on the back shelf is a jug of milk, which is exactly what it
  // got mistaken for. Water is water; if an americano's dilution needs to
  // read, that is the band's job, not the jug's.
  water: "#dcecf1",
  orange: "#e08a24",
  chocolate: "#190c05",
  ice: "#dbeef6",
};

export const POUR_LABEL = {
  espresso: "espresso",
  milk: "cold milk",
  "milk-steamed": "steamed milk",
  water: "hot water",
  orange: "orange juice",
  chocolate: "chocolate",
  ice: "ice",
};

/**
 * Relative volume each pour adds, as a fraction of the usable depth.
 *
 * ICE IS DELIBERATELY ABSENT. It is in the pour list because the order it
 * went in matters, but it is not a band — it is drawn as cubes through the
 * drink, because that is what ice looks like and a flat pale slab under the
 * coffee would read as milk. stackOf skips anything with no volume here.
 */
export const POUR_VOLUME = {
  espresso: 0.3,
  milk: 0.5,
  "milk-steamed": 0.5,
  water: 0.45,
  orange: 0.45,
  chocolate: 0.12,
};

/** True when this pour is a liquid that stacks as a visible band. */
export const isBand = (kind) => POUR_VOLUME[kind] > 0;

/** Textured milk poured LAST, which is the only way to get a pattern. */
export function hasArt(pours = []) {
  return pours[pours.length - 1] === "milk-steamed";
}

/**
 * What is in the glass when none of it is coffee.
 *
 * `coffee: false` travels with these so the receipt can drop the bean, the
 * roast, the grind and the shot — four specs about a bean that never got
 * near the glass. See ui/DrinkCard.
 */
function withoutCoffee({ has, milk, pours }) {
  const rest = pours.filter((k) => k !== "ice");
  const only = (k) => rest.length === 1 && has(k);
  const n = (id, name, of) => ({ id, name, of, coffee: false });

  if (!rest.length) {
    return has("ice")
      ? n(
          "ice-only",
          "Ice",
          "a glass of ice. the well never runs out, so this is a choice you can keep making"
        )
      : n("empty", "Nothing", "an empty glass");
  }
  if (has("chocolate")) {
    if (milk) {
      return n(
        "choc-milk",
        "Chocolate Milk",
        "the order you would have placed at nine, and it still works"
      );
    }
    if (has("water")) {
      return n(
        "hot-choc",
        "Hot Chocolate",
        "syrup and hot water. technically correct, which is the worst kind of correct"
      );
    }
    if (only("chocolate")) {
      return n(
        "syrup-neat",
        "Chocolate Syrup",
        "neat, in a glass. espresso but sweet, minus the espresso"
      );
    }
  }
  if (only("orange")) {
    return n(
      "juice",
      "Orange Juice",
      "straight from the jug, in a coffee bar. no notes"
    );
  }
  if (only("water")) {
    return n(
      "water",
      "Water",
      "a glass of water. it was always free and it still is"
    );
  }
  if (rest.length === 1 && milk) {
    return has("milk-steamed")
      ? n(
          "babyccino",
          "Babyccino",
          "steamed milk and nothing else. that is the real name for it, which is the funniest part"
        )
      : n(
          "milk",
          "Milk",
          "a glass of milk, poured at a bar with an espresso machine on it"
        );
  }
  return n(
    "mixture",
    "Something",
    `${rest.length} things in a glass, none of them coffee`
  );
}

export function resolveDrink(pours = [], shot = 0) {
  const has = (k) => pours.includes(k);
  const at = (k) => pours.indexOf(k);
  const before = (a, b) => has(a) && has(b) && at(a) < at(b);

  // the two milk kinds are one ingredient as far as the NAME is concerned;
  // they differ in texture, which is what the art and the notes are about
  const milk = has("milk") || has("milk-steamed");
  const milkAt = has("milk-steamed") ? at("milk-steamed") : at("milk");
  const iced = has("ice");

  // Ice is a modifier on whatever you made, not a drink of its own — except
  // when it is the only thing in the glass, which is its own kind of answer.
  const chill = (d) =>
    iced ? { ...d, id: `iced-${d.id}`, name: `Iced ${d.name}` } : d;

  // Orange juice and milk is not a drink, it is an accident. Citric acid
  // drops milk's casein out of suspension on contact — with or without a
  // shot in there, which is why this is checked before the coffee is.
  if (has("orange") && milk) {
    return {
      id: "curdled",
      name: "Curdled",
      of: "orange juice and milk, which is a chemistry demonstration",
    };
  }

  // NO COFFEE IS STILL AN ANSWER.
  //
  // Everything without a shot in it used to come back as "Nothing / an empty
  // glass" — and the glass was not empty, you had just made something else.
  // Free sequencing means a glass of chocolate milk is two clicks away, so
  // the most reachable drinks in the room were the ones with no name.
  //
  // They are named now, and the naming is the reward: this is a room you
  // learn by trying things, so every combination that resolves to a joke is
  // one more thing to find. The register is the one Curdled set — deadpan,
  // and right about the chemistry.
  if (!has("espresso")) return chill(withoutCoffee({ has, milk, pours }));

  if (has("orange")) {
    return iced
      ? {
          id: "bumble",
          name: "Bumble",
          of: "espresso over orange juice and ice",
        }
      : {
          id: "orange-shot",
          name: "Espresso Orange",
          of: "a shot in orange juice, warm — it wants ice",
        };
  }

  if (has("chocolate")) {
    if (milk) {
      return chill(
        before("chocolate", "espresso")
          ? {
              id: "mocha",
              name: "Mocha",
              of: "chocolate under the shot, then milk — properly mixed",
            }
          : {
              id: "mocha-late",
              name: "Mocha, unmixed",
              of: "chocolate added at the end, sitting on top",
            }
      );
    }
    return chill({
      id: "mocha-black",
      name: "Black Mocha",
      of: "espresso and chocolate, no milk to carry it",
    });
  }

  if (milk && has("water")) {
    return chill({
      id: "misto",
      name: "Café Misto",
      of: "a lengthened shot with milk on top",
    });
  }

  if (milk) {
    return chill(
      milkAt < at("espresso")
        ? {
            id: "macchiato",
            name: "Latte Macchiato",
            of: "milk first, the shot poured through it — banded",
          }
        : { id: "latte", name: "Latte", of: "espresso, then milk" }
    );
  }

  if (has("water")) {
    return chill(
      before("water", "espresso")
        ? {
            id: "longblack",
            name: "Long Black",
            of: "water first, so the crema survives on top",
          }
        : {
            id: "americano",
            name: "Americano",
            of: "the shot, lengthened with water after",
          }
    );
  }

  if (iced) {
    return {
      id: "espresso-ice",
      name: "Espresso on Ice",
      of: "the shot straight over ice, nothing to hide behind",
    };
  }
  if (shot < 0.25) {
    return {
      id: "ristretto",
      name: "Ristretto",
      of: "the short, sweet front of the shot",
    };
  }
  if (shot > SHOT_OVER) {
    return {
      id: "lungo",
      name: "Lungo",
      of: "pulled long, for better or worse",
    };
  }
  return { id: "espresso", name: "Espresso", of: "just the shot, as pulled" };
}

/**
 * The bands in the glass, bottom first — literally the pour order.
 *
 * Heights are FRACTIONS of the usable depth and are clipped at the brim
 * rather than renormalised. Renormalising meant every existing band shrank
 * the moment you added another one: the espresso you poured visibly got
 * smaller as the milk went in, which is its own kind of nonsense. A glass
 * that fills up and then stops is what actually happens.
 *
 * Kinds with no volume (ice) are SKIPPED, not given a zero-height band. With
 * `break` on the height check, ice poured first would have silently thrown
 * away every band after it and served a drink that rendered as an empty glass.
 */
export function stackOf(pours = []) {
  const out = [];
  let y = 0;
  for (const kind of pours) {
    const vol = POUR_VOLUME[kind];
    if (!vol) continue; // not a band — ice, or an unknown kind
    if (y >= 1 - 0.0005) break; // full; the rest would be over the rim
    const h = Math.min(vol, 1 - y);
    out.push({ kind, colour: POUR_COLOUR[kind], y, h });
    y += h;
  }
  return out;
}

/** How full the glass is, 0..1 of the usable depth. */
export function fillOf(pours = []) {
  const bands = stackOf(pours);
  return bands.length
    ? bands[bands.length - 1].y + bands[bands.length - 1].h
    : 0;
}
