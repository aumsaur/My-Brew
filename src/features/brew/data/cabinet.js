// Apothecary cabinet layout (local space; +y up, open front faces +Z).
// Shared by CabinetModel (renders the wood) and CabinetShelf (places ingredients).

export const CABINET = { W: 3.3, H: 3.9, D: 0.7 };

// Three rows ~0.8 tall. ROW_COLS sets how many cubbies each row holds, BOTTOM
// row first — 4/3/3 deliberately breaks the grid's symmetry.
export const ROW_BOTTOMS = [1.2, 2.0, 2.8]; // bottom → top
export const GRID_TOP = 3.6;
export const ROW_COLS = [4, 3, 3];

const INNER_W = CABINET.W - 0.4;

// Evenly-spaced column-centre xs for a row of n cubbies.
export function colCenters(n) {
  const cell = INNER_W / n;
  return Array.from({ length: n }, (_, c) => -INNER_W / 2 + cell * (c + 0.5));
}

// Front-facing cubby centres (bottom row first), one slot per ingredient.
export const CUBBIES = ROW_BOTTOMS.flatMap((yb, r) =>
  colCenters(ROW_COLS[r]).map((x) => [x, yb + 0.4, 0.1])
);
