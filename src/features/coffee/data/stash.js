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
const DISGUISES = [
  {
    node: "item_milk",
    material: "m_milk",
    project: "p1",
    // the carton that is always in the fridge — this site
    label: "whole milk",
    stocks: "milk",
  },
  {
    node: "item_jar",
    material: "m_jar2",
    project: "p3",
    // Stocktomate: what is kept on the shelf, ready for later
    label: "chocolate sauce",
    stocks: "chocolate",
  },
  {
    node: "item_bottle",
    material: "m_bottle",
    project: "p4",
    label: "orange juice",
    stocks: "orange",
  },
];

export const STASH = DISGUISES.map((d) => {
  const project = PROJECTS.find((p) => p.id === d.project);
  return project ? { ...d, project } : null;
}).filter(Boolean);

export const STASH_BY_NODE = Object.fromEntries(STASH.map((s) => [s.node, s]));
