import { PROJECTS } from "@/features/coffee/data/projects";

// What the fridge is actually for.
//
// The three things on its shelves are the portfolio. They are dressed as
// groceries and behave like groceries until you open the door and click one,
// which is the whole joke — a coffee corner that quietly turns out to be a
// portfolio. This replaced a wall of floating project bubbles, and it reads
// better because nothing announces itself.
//
// PROJECTS is the SINGLE SOURCE — copy lives there, so adding a project or
// fixing a tagline happens in one file. Only the disguise is local: it is
// about this fridge, not about the project.
//
// The model ships exactly three item nodes (item_milk / item_jar /
// item_bottle), so a fourth project needs a fourth node in fridge.glb. Until
// then extra PROJECTS entries are simply not stashed, which is why `STASH` is
// built by lookup and skips anything it cannot find rather than throwing.
//
// EACH ONE ALSO STOCKS AN INGREDIENT, and that is what makes the portfolio
// unavoidable rather than optional. Milk, juice and chocolate are only here —
// so any drink past a black coffee means opening the door, and the thing you
// pick up to get your milk is a project. The card is not a detour from the
// loop; it is on the way.
//
// ICE USED TO BE THE JAR and is not any more. No cafe keeps its ice in the
// fridge door, and the cost of pretending otherwise was that the ice well —
// the thing built into the counter, in plain sight, at the station — stood
// empty until you had been shopping, which reads as broken rather than as
// locked. Ice lives in the well now. The jar went back to being something a
// fridge would actually hold.
// WHAT THE COLD STORE HOLDS: SUPPLY, not service.
//
// It used to hold the bar's own containers -- the 62mm milk carton, the
// syrup bottle WITH ITS PUMP ON, a single jug of juice -- and that is not
// what is behind a cafe. Nobody keeps a pump bottle in the walk-in. You keep
// a gallon of chocolate syrup, a bag-in-box of milk and sacks of dry goods,
// and you refill the small things at the bar from them. A cold store full of
// single-serve containers reads as a shop shelf, not as the back of house.
//
// THIS DOES NOT REVIVE THE CARTON BUG, and the difference is worth stating
// because the old note here said the opposite. That bug was ONE object
// silently changing size between two places: a 132mm carton on this shelf
// turning into a 40mm one at the station, so the thing you fetched was not
// the thing you got. A gallon and a carton are never the same object, so
// neither can be the wrong size for the other -- the gallon is the stock and
// the carton is what the bar pours from, and the fetch is the decant.
//
// What DOES still have to hold is the ingredient: the tag, the hotbar slot
// and the pour all name the same thing whatever it is carried in.
//
// TWO FORMS, NOT THREE TINTS. Three gallons in different colours is one
// silhouette three times over, and these are read at station distance where
// shape carries further than colour. The syrup and the juice are gallons,
// the milk is a bag-in-box with a tap, and the dressing behind them is
// sacks. `tint` recolours named materials per instance -- see useProp.
export const GROCERIES = [
  {
    node: "item_milk",
    model: "supply-box.glb",
    label: "whole milk",
    stocks: "milk",
    tint: { m_box_label: "#cddff0" },
  },
  {
    node: "item_jar",
    model: "supply-gallon.glb",
    label: "chocolate syrup",
    stocks: "chocolate",
    tint: { m_sup_fill: "#3a2016", m_sup_label: "#6a4632" },
  },
  {
    node: "item_bottle",
    model: "supply-gallon.glb",
    label: "orange juice",
    stocks: "orange",
    tint: { m_sup_fill: "#e08a24", m_sup_label: "#e8a552" },
  },
];

// DRESSING, and there is less of it than there was because the maths said
// so rather than because it looked busy.
//
// The first pass put a second row BEHIND the stock, which is what you do
// with small jars and cannot do with these: the shelves are 510mm deep, a
// gallon is 143mm and a bag-in-box 158, and the stock already stands at
// z -0.058. That leaves a four-millimetre window for a back row — so the
// back row was not behind the stock, it was inside it, and three pairs were
// interpenetrating by 10 to 20mm.
//
// So everything stands in ONE ROW at the same depth, which is also what
// "organised" looks like on a shelf, and the only question left is whether
// a thing fits in the gap beside the stock. The lower shelf is full with
// its two; the others take one more each. Verified by footprint, including
// the rotation — a 241mm sack turned 0.35rad is 280mm across, which is how
// the first pass lost its margins.
//
// Positions are in fridge MODEL units (the shelves span x +-0.30, z +-0.28,
// with shelf tops at y 0.068, 0.448, 0.828 and 1.208); the component
// converts. Turns are kept small for the wide items for the reason above.
// IT IS ALL UNOPENED KRAFT, and that is the whole point of the palette.
//
// The dressing used to be tinted like the stock, and one entry was tinted
// IDENTICALLY to it: an orange gallon at #e08a24 standing on a shelf beside
// the orange juice gallon at #e08a24, one of them a control and one of them
// scenery, with nothing whatsoever to tell them apart until you put the
// cursor on it. "Hard to tell which can be clicked" is the mildest possible
// way of reporting that.
//
// So the rule is the one a real cold store follows. What is OPEN and in use
// is labelled and coloured -- you can see what is in it through the fill, and
// that is the three in GROCERIES. What is still in its packaging is brown
// board and plain sacking, because nobody prints a label for the inside of a
// fridge. Interactive is the exception here, and the exception is the thing
// that is allowed to have colour.
//
// The hover outline still does its job once you are pointing; this is about
// knowing where to point in the first place.
const KRAFT = "#a98a63"; // board
const KRAFT_DARK = "#8a6c4a"; // printing on board
const SACKING = "#b9a684";

export const FRIDGE_DRESSING = [
  {
    model: "supply-box.glb",
    at: [0.165, 0.828, -0.03],
    turn: 0.1,
    tint: { m_box_label: KRAFT },
  },
  {
    model: "supply-sack.glb",
    at: [-0.148, 1.208, -0.03],
    turn: 0.08,
    tint: { m_sack_label: SACKING },
  },
  {
    model: "supply-gallon.glb",
    at: [0.159, 1.208, -0.03],
    turn: 0.2,
    // an unopened gallon: the fill is not showing through a printed drum
    tint: { m_sup_fill: KRAFT_DARK, m_sup_label: KRAFT },
  },
  {
    model: "supply-box.glb",
    at: [-0.182, 0.068, -0.03],
    turn: -0.12,
    tint: { m_box_label: KRAFT_DARK },
  },
  {
    model: "supply-gallon.glb",
    at: [0.125, 0.068, -0.03],
    turn: 0.18,
    tint: { m_sup_fill: KRAFT, m_sup_label: KRAFT_DARK },
  },
];

const CAKE_TINT = { p1: "#8c5ab8", p4: "#3f7fbf", p3: "#c97c3a" };

export const CAKES = ["p1", "p4", "p3"]
  .map((id) => {
    const project = PROJECTS.find((x) => x.id === id);
    return project
      ? {
          node: `cake_${id}`,
          project,
          label: project.label,
          tint: CAKE_TINT[id],
          // the card's eyebrow names where you took it from, and a cake did
          // not come out of the fridge
          from: "from the case",
        }
      : null;
  })
  .filter(Boolean);

export const CAKE_BY_NODE = Object.fromEntries(CAKES.map((c) => [c.node, c]));
