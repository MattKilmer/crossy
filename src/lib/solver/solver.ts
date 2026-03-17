import type {
  GridTemplate,
  PuzzleSolution,
  SolverConfig,
} from "./types";
import { extractSlots, findIntersections, buildSlotIntersections } from "./extract";
import { buildCrossIndex, filterCandidates } from "./cross-index";
import { scoreSolution } from "./score";

const DEFAULTS: SolverConfig = {
  maxBacktracks: 15000,
  timeoutMs: 8000,
};

/**
 * Solve a crossword grid using backtracking with:
 * - MRV (Minimum Remaining Values) heuristic on filtered domains
 * - AC-3-style constraint propagation via cross-index
 * - Score-ordered candidate selection with seeded shuffle for variety
 */
export function solve(
  template: GridTemplate,
  wordsByLength: Map<number, string[]>,
  config: Partial<SolverConfig> = {}
): PuzzleSolution | null {
  const cfg = { ...DEFAULTS, ...config };
  const slots = extractSlots(template);
  const intersections = findIntersections(slots);
  const slotIxMap = buildSlotIntersections(slots, intersections);
  const crossIndex = buildCrossIndex(wordsByLength);
  const startTime = Date.now();
  let backtracks = 0;

  // Initialize domains: for each slot, all words of matching length
  // Words are already sorted by score (topic words first, then by quality)
  const domains = new Map<number, string[]>();
  for (const slot of slots) {
    const candidates = wordsByLength.get(slot.length);
    if (!candidates || candidates.length === 0) return null;
    domains.set(slot.id, [...candidates]);
  }

  // Assignment state
  const assignment = new Map<number, string>();
  const usedWords = new Set<string>();

  // Seeded PRNG for reproducible variety
  const seed = cfg.seed ?? Math.floor(Math.random() * 2147483647);
  let rngState = seed;
  function nextRandom(): number {
    rngState = (rngState * 1103515245 + 12345) & 0x7fffffff;
    return rngState / 0x7fffffff;
  }

  /**
   * MRV: pick unassigned slot with fewest remaining valid candidates.
   * Tie-break by most intersections (degree heuristic).
   */
  function pickNextSlot(): number | null {
    let bestId: number | null = null;
    let bestCount = Infinity;
    let bestDegree = -1;

    for (const slot of slots) {
      if (assignment.has(slot.id)) continue;
      const domain = domains.get(slot.id)!;
      // Count only candidates not yet used
      const available = domain.filter((w) => !usedWords.has(w));
      const count = available.length;
      const degree = slotIxMap.get(slot.id)?.length ?? 0;

      if (
        count < bestCount ||
        (count === bestCount && degree > bestDegree)
      ) {
        bestCount = count;
        bestDegree = degree;
        bestId = slot.id;
      }
    }

    return bestId;
  }

  /**
   * Get current constraints on a slot from already-assigned crossing words.
   */
  function getConstraints(
    slotId: number
  ): { position: number; letter: string }[] {
    const constraints: { position: number; letter: string }[] = [];
    const ixs = slotIxMap.get(slotId) ?? [];

    for (const ix of ixs) {
      const isA = ix.slotA === slotId;
      const otherId = isA ? ix.slotB : ix.slotA;
      const myPos = isA ? ix.posA : ix.posB;
      const otherPos = isA ? ix.posB : ix.posA;
      const otherWord = assignment.get(otherId);

      if (otherWord) {
        constraints.push({ position: myPos, letter: otherWord[otherPos] });
      }
    }

    return constraints;
  }

  /**
   * Propagate constraints after an assignment.
   * Filters domains of all unassigned crossing slots.
   * Returns saved domains for undo, or null if a domain became empty (contradiction).
   */
  function propagate(
    slotId: number
  ): Map<number, string[]> | null {
    const saved = new Map<number, string[]>();
    const ixs = slotIxMap.get(slotId) ?? [];

    for (const ix of ixs) {
      const otherId = ix.slotA === slotId ? ix.slotB : ix.slotA;

      // Skip already-assigned slots
      if (assignment.has(otherId)) continue;

      const otherSlot = slots.find((s) => s.id === otherId)!;
      const currentDomain = domains.get(otherId)!;

      // Save current domain for undo (only save once per slot)
      if (!saved.has(otherId)) {
        saved.set(otherId, currentDomain);
      }

      // Get ALL constraints on the other slot from assigned crossing words
      // (this includes the word we just assigned, since it's already in the assignment map)
      const constraints = getConstraints(otherId);

      // Filter using cross-index
      const filtered = filterCandidates(
        currentDomain,
        crossIndex,
        otherSlot.length,
        constraints
      ).filter((w) => !usedWords.has(w));

      if (filtered.length === 0) {
        // Contradiction — restore saved domains and fail
        for (const [id, dom] of saved) {
          domains.set(id, dom);
        }
        return null;
      }

      domains.set(otherId, filtered);
    }

    return saved;
  }

  /**
   * Main backtracking search.
   */
  function backtrack(): boolean {
    if (Date.now() - startTime > cfg.timeoutMs) return false;

    const slotId = pickNextSlot();
    if (slotId === null) return true; // All slots assigned

    const slot = slots.find((s) => s.id === slotId)!;

    // Get constrained candidates for this slot
    const constraints = getConstraints(slotId);
    let candidates = filterCandidates(
      domains.get(slotId)!,
      crossIndex,
      slot.length,
      constraints
    ).filter((w) => !usedWords.has(w));

    if (candidates.length === 0) return false;

    // Light shuffle within score tiers for variety
    // Words are already sorted by score; shuffle within groups of ~5
    candidates = shuffleWithinTiers(candidates, 5);

    for (const word of candidates) {
      backtracks++;
      if (backtracks > cfg.maxBacktracks) return false;
      if (Date.now() - startTime > cfg.timeoutMs) return false;

      // Assign
      assignment.set(slotId, word);
      usedWords.add(word);

      // Propagate constraints
      const saved = propagate(slotId);

      if (saved !== null) {
        // No contradiction — recurse
        if (backtrack()) return true;

        // Undo propagation
        for (const [id, dom] of saved) {
          domains.set(id, dom);
        }
      }

      // Undo assignment
      assignment.delete(slotId);
      usedWords.delete(word);
    }

    return false;
  }

  /** Shuffle candidates within tiers of `tierSize` to maintain score ordering but add variety */
  function shuffleWithinTiers(arr: string[], tierSize: number): string[] {
    const result = [...arr];
    for (let i = 0; i < result.length; i += tierSize) {
      const end = Math.min(i + tierSize, result.length);
      // Fisher-Yates within tier
      for (let j = end - 1; j > i; j--) {
        const k = i + Math.floor(nextRandom() * (j - i + 1));
        [result[j], result[k]] = [result[k], result[j]];
      }
    }
    return result;
  }

  // Run solver
  if (!backtrack()) return null;

  // Build solution grid
  const rows = template.length;
  const cols = template[0].length;
  const grid: string[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) =>
      template[r][c] === "#" ? "#" : ""
    )
  );

  for (const [id, word] of assignment) {
    const slot = slots.find((s) => s.id === id)!;
    for (let i = 0; i < slot.cells.length; i++) {
      const [r, c] = slot.cells[i];
      grid[r][c] = word[i].toUpperCase();
    }
  }

  return {
    grid,
    assignments: new Map(assignment),
    score: scoreSolution(assignment),
    slots,
  };
}
