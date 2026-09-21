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

// DRESSING. A cold store with three things in it reads as a cold store
// somebody forgot to fill, which is the complaint the cake case also got.
// These are not clickable and carry no tag, so they cannot be mistaken for a
// fourth ingredient -- they are the stock behind the stock.
//
// ALL BULK, for the same reason the three above are: leaving the bar's props
// back here would have left pump bottles on two shelves and the point of the
// change unmade. Sacks of dry goods, spare gallons, spare boxes.
//
// Positions are in fridge MODEL units (the shelves span x +-0.30, z +-0.28,
// with shelf tops at y 0.448 and 0.828); the component converts. These items
// are two to three times the size of the props they replace, so there are
// six of them rather than ten and the spacing is most of the design: a
// second row sits BEHIND the stock in z, which is the only axis with room
// left once a 168mm gallon is standing in front.
export const FRIDGE_DRESSING = [
  // X IS CONSTRAINED, not composed: the liner is at model +-0.30 and these
  // are 170-250mm wide, so a sack (0.143 in model units either side of its
  // centre) cannot stand further out than 0.157 without its corner inside
  // the fridge wall. Every x below is inside its own model's limit.
  {
    model: "supply-sack.glb",
    at: [-0.15, 0.448, -0.19],
    turn: 0.35,
    tint: { m_sack_label: "#4a3526" },
  },
  {
    model: "supply-gallon.glb",
    at: [0.13, 0.448, -0.2],
    turn: -0.25,
    tint: { m_sup_fill: "#f2efe6", m_sup_label: "#cddff0" },
  },
  {
    model: "supply-box.glb",
    at: [-0.06, 0.828, -0.2],
    turn: -0.15,
    tint: { m_box_label: "#e7d6bd" },
  },
  {
    model: "supply-sack.glb",
    at: [0.15, 0.828, -0.07],
    turn: 0.6,
    tint: { m_sack_label: "#e0d6c4" },
  },
  {
    model: "supply-sack.glb",
    at: [-0.15, 1.208, -0.1],
    turn: -0.4,
    tint: { m_sack_label: "#4a3526" },
  },
  {
    model: "supply-gallon.glb",
    at: [0.1, 1.208, -0.12],
    turn: 0.2,
    tint: { m_sup_fill: "#e08a24", m_sup_label: "#e8a552" },
  },
  // THE BOTTOM SHELF, which had nothing on it at all. It is the one the
  // door's reveal leaves fully visible, so an empty one reads as a fridge
  // that has not been filled rather than as headroom.
  {
    model: "supply-box.glb",
    at: [-0.14, 0.068, -0.14],
    turn: 0.2,
    tint: { m_box_label: "#cddff0" },
  },
  {
    model: "supply-gallon.glb",
    at: [0.12, 0.068, -0.16],
    turn: -0.35,
    tint: { m_sup_fill: "#3a2016", m_sup_label: "#6a4632" },
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
