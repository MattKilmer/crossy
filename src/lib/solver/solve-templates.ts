import type { GridTemplate, PuzzleSolution, Slot } from "./types";
import { solve } from "./solver";

/**
 * Try templates in order until one solves acceptably, bounded by a wall-clock
 * deadline.
 *
 * Without a deadline this loop could run PER_TEMPLATE_TIMEOUT_MS once per
 * template (6 templates x 6s = 36s, plus ~10s of LLM calls), which blew past
 * the route's previous 30s maxDuration and surfaced to the user as an opaque
 * 504 FUNCTION_INVOCATION_TIMEOUT. Now a topic that cannot be solved in the
 * time available falls out of the loop with no solution, so the caller can
 * return its own actionable error instead.
 */

export const PER_TEMPLATE_TIMEOUT_MS = 6000;
const MIN_USEFUL_SLICE_MS = 750;
const MIN_ACCEPTABLE_SCORE = 40;

export type SolvedTemplate = {
  solution: PuzzleSolution;
  templateId: string;
  slots: Slot[];
};

export function solveWithinBudget(
  templates: { id: string; template: GridTemplate; difficulty: number }[],
  wordsByLength: Map<number, string[]>,
  deadlineMs: number
): SolvedTemplate | null {
  for (const tpl of templates) {
    const remaining = deadlineMs - Date.now();
    // Too little left to give the solver a fair attempt — stop rather than
    // burn the caller's remaining budget on a run that probably won't finish.
    if (remaining < MIN_USEFUL_SLICE_MS) break;

    const result = solve(tpl.template, wordsByLength, {
      maxBacktracks: 15000,
      timeoutMs: Math.min(PER_TEMPLATE_TIMEOUT_MS, remaining),
    });

    if (result && result.score >= MIN_ACCEPTABLE_SCORE) {
      return { solution: result, templateId: tpl.id, slots: result.slots };
    }
  }

  return null;
}
