export type CellType = "." | "#";
export type GridTemplate = CellType[][];

export interface Slot {
  id: number;
  direction: "across" | "down";
  row: number;
  col: number;
  length: number;
  cells: [number, number][];
  number: number; // display number (1-based)
}

export interface Intersection {
  slotA: number; // slot id
  posA: number; // char position within slot A
  slotB: number; // slot id
  posB: number; // char position within slot B
}

export interface SlotDomain {
  slot: Slot;
  candidates: string[]; // remaining valid candidates (filtered)
  assigned: string | null;
}

export interface PuzzleSolution {
  grid: string[][]; // filled grid (letters + '#')
  assignments: Map<number, string>; // slotId -> word
  score: number;
  slots: Slot[];
}

export interface ClueData {
  number: number;
  clue: string;
  answer: string;
  length: number;
  direction: "across" | "down";
}

export interface SolverConfig {
  maxBacktracks: number;
  timeoutMs: number;
  seed?: number; // for reproducible variety
}

export const DEFAULT_SOLVER_CONFIG: SolverConfig = {
  maxBacktracks: 15000,
  timeoutMs: 8000,
};
