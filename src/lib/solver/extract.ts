import type { GridTemplate, Slot, Intersection } from "./types";

/**
 * Extract all across and down slots from a grid template.
 * A slot is a contiguous run of white cells ('.') with length >= 3.
 * Assigns display numbers in standard crossword order (left-to-right, top-to-bottom).
 */
export function extractSlots(template: GridTemplate): Slot[] {
  const rows = template.length;
  const cols = template[0].length;
  const slots: Slot[] = [];
  let slotId = 0;
  let displayNumber = 0;

  // Track which cells get a display number
  const numberAt = new Map<string, number>();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (template[r][c] === "#") continue;

      const startsAcross =
        (c === 0 || template[r][c - 1] === "#") &&
        c + 1 < cols &&
        template[r][c + 1] === ".";
      const startsDown =
        (r === 0 || template[r - 1][c] === "#") &&
        r + 1 < rows &&
        template[r + 1][c] === ".";

      if (startsAcross || startsDown) {
        displayNumber++;
        numberAt.set(`${r},${c}`, displayNumber);
      }

      if (startsAcross) {
        const cells: [number, number][] = [];
        let cc = c;
        while (cc < cols && template[r][cc] === ".") {
          cells.push([r, cc]);
          cc++;
        }
        if (cells.length >= 3) {
          slots.push({
            id: slotId++,
            direction: "across",
            row: r,
            col: c,
            length: cells.length,
            cells,
            number: numberAt.get(`${r},${c}`)!,
          });
        }
      }

      if (startsDown) {
        const cells: [number, number][] = [];
        let rr = r;
        while (rr < rows && template[rr][c] === ".") {
          cells.push([rr, c]);
          rr++;
        }
        if (cells.length >= 3) {
          slots.push({
            id: slotId++,
            direction: "down",
            row: r,
            col: c,
            length: cells.length,
            cells,
            number: numberAt.get(`${r},${c}`)!,
          });
        }
      }
    }
  }

  return slots;
}

/**
 * Find all intersections between slots.
 * An intersection means two slots share a cell — one across, one down.
 */
export function findIntersections(slots: Slot[]): Intersection[] {
  const intersections: Intersection[] = [];
  const cellToSlotPos = new Map<string, { slotId: number; pos: number }[]>();

  for (const slot of slots) {
    for (let pos = 0; pos < slot.cells.length; pos++) {
      const key = `${slot.cells[pos][0]},${slot.cells[pos][1]}`;
      if (!cellToSlotPos.has(key)) cellToSlotPos.set(key, []);
      cellToSlotPos.get(key)!.push({ slotId: slot.id, pos });
    }
  }

  for (const entries of cellToSlotPos.values()) {
    if (entries.length === 2) {
      intersections.push({
        slotA: entries[0].slotId,
        posA: entries[0].pos,
        slotB: entries[1].slotId,
        posB: entries[1].pos,
      });
    }
  }

  return intersections;
}

/**
 * Build a map from slotId to its intersections for fast lookup.
 */
export function buildSlotIntersections(
  slots: Slot[],
  intersections: Intersection[]
): Map<number, Intersection[]> {
  const map = new Map<number, Intersection[]>();
  for (const slot of slots) {
    map.set(slot.id, []);
  }
  for (const ix of intersections) {
    map.get(ix.slotA)!.push(ix);
    map.get(ix.slotB)!.push(ix);
  }
  return map;
}
