import type { GridTemplate } from "./types";

// All templates have 180-degree rotational symmetry
// All slots are length >= 3
// Ordered from easiest to fill (most blacks) to hardest (fewest blacks)

export const TEMPLATES_5x5: { id: string; template: GridTemplate; difficulty: number }[] = [
  {
    // cross4: 4 corner blacks
    // # . . . #
    // . . . . .
    // . . . . .
    // . . . . .
    // # . . . #
    id: "cross4",
    difficulty: 1,
    template: [
      ["#", ".", ".", ".", "#"],
      [".", ".", ".", ".", "."],
      [".", ".", ".", ".", "."],
      [".", ".", ".", ".", "."],
      ["#", ".", ".", ".", "#"],
    ],
  },
  {
    // stair2: opposite corner blacks
    // . . . . #
    // . . . . .
    // . . . . .
    // . . . . .
    // # . . . .
    id: "stair2",
    difficulty: 2,
    template: [
      [".", ".", ".", ".", "#"],
      [".", ".", ".", ".", "."],
      [".", ".", ".", ".", "."],
      [".", ".", ".", ".", "."],
      ["#", ".", ".", ".", "."],
    ],
  },
  {
    // diag2: diagonal pair
    // . . . . .
    // . # . . .
    // . . . . .
    // . . . # .
    // . . . . .
    id: "diag2",
    difficulty: 3,
    template: [
      [".", ".", ".", ".", "."],
      [".", "#", ".", ".", "."],
      [".", ".", ".", ".", "."],
      [".", ".", ".", "#", "."],
      [".", ".", ".", ".", "."],
    ],
  },
  {
    // pinwheel2: pinwheel pattern
    // . . . . .
    // . . . # .
    // . . . . .
    // . # . . .
    // . . . . .
    id: "pinwheel2",
    difficulty: 3,
    template: [
      [".", ".", ".", ".", "."],
      [".", ".", ".", "#", "."],
      [".", ".", ".", ".", "."],
      [".", "#", ".", ".", "."],
      [".", ".", ".", ".", "."],
    ],
  },
  {
    // center1: single center black
    // . . . . .
    // . . . . .
    // . . # . .
    // . . . . .
    // . . . . .
    id: "center1",
    difficulty: 4,
    template: [
      [".", ".", ".", ".", "."],
      [".", ".", ".", ".", "."],
      [".", ".", "#", ".", "."],
      [".", ".", ".", ".", "."],
      [".", ".", ".", ".", "."],
    ],
  },
  {
    // corner2: top-left and bottom-right blacks
    // # . . . .
    // . . . . .
    // . . . . .
    // . . . . .
    // . . . . #
    id: "corner2",
    difficulty: 4,
    template: [
      ["#", ".", ".", ".", "."],
      [".", ".", ".", ".", "."],
      [".", ".", ".", ".", "."],
      [".", ".", ".", ".", "."],
      [".", ".", ".", ".", "#"],
    ],
  },
];

/** Pick a template appropriate for the expected word pool size */
export function selectTemplate(preferEasy: boolean = false): {
  id: string;
  template: GridTemplate;
} {
  if (preferEasy) {
    // Easier templates (more blacks = fewer constraints)
    const easy = TEMPLATES_5x5.filter((t) => t.difficulty <= 2);
    const pick = easy[Math.floor(Math.random() * easy.length)];
    return { id: pick.id, template: pick.template };
  }
  const pick = TEMPLATES_5x5[Math.floor(Math.random() * TEMPLATES_5x5.length)];
  return { id: pick.id, template: pick.template };
}

/** Get a specific template by ID */
export function getTemplate(id: string): GridTemplate | null {
  const found = TEMPLATES_5x5.find((t) => t.id === id);
  return found ? found.template : null;
}

/** Get all template IDs ordered from easiest to hardest */
export function getTemplatesByDifficulty(): string[] {
  return TEMPLATES_5x5.sort((a, b) => a.difficulty - b.difficulty).map((t) => t.id);
}
