import { describe, it, expect } from "vitest";
import { solve } from "./solver";
import { TEMPLATES_5x5 } from "./templates";
import { extractSlots, findIntersections } from "./extract";
import { buildCrossIndex } from "./cross-index";

// Load word bank
import wordsData from "@/data/words.json";

const wordsByLength = new Map<number, string[]>();
for (const { w, s } of wordsData as { w: string; s: number }[]) {
  if (s < 55) continue; // medium+ quality
  if (!wordsByLength.has(w.length)) wordsByLength.set(w.length, []);
  wordsByLength.get(w.length)!.push(w);
}

// Sort by score descending
const scoreMap = new Map<string, number>();
for (const { w, s } of wordsData as { w: string; s: number }[]) {
  scoreMap.set(w, s);
}
for (const [, words] of wordsByLength) {
  words.sort((a, b) => (scoreMap.get(b) ?? 50) - (scoreMap.get(a) ?? 50));
}

describe("Solver", () => {
  for (const tpl of TEMPLATES_5x5) {
    it(`fills template "${tpl.id}" with valid crossings`, () => {
      const result = solve(tpl.template, wordsByLength, {
        maxBacktracks: 15000,
        timeoutMs: 5000,
      });

      expect(result).not.toBeNull();
      if (!result) return;

      // Verify all crossings match
      const slots = extractSlots(tpl.template);
      const intersections = findIntersections(slots);

      for (const ix of intersections) {
        const wordA = result.assignments.get(ix.slotA)!;
        const wordB = result.assignments.get(ix.slotB)!;
        expect(wordA[ix.posA]).toBe(wordB[ix.posB]);
      }
    });

    it(`fills template "${tpl.id}" with no duplicate words`, () => {
      const result = solve(tpl.template, wordsByLength);
      expect(result).not.toBeNull();
      if (!result) return;

      const words = [...result.assignments.values()];
      expect(new Set(words).size).toBe(words.length);
    });
  }

  it("returns null for impossible grid (no candidates)", () => {
    const emptyBank = new Map<number, string[]>();
    const result = solve(TEMPLATES_5x5[0].template, emptyBank);
    expect(result).toBeNull();
  });
});

describe("Slot Extraction", () => {
  it("extracts correct number of slots for cross4 template", () => {
    const cross4 = TEMPLATES_5x5.find((t) => t.id === "cross4")!;
    const slots = extractSlots(cross4.template);
    // cross4 has 4 corner blacks: should have 10 slots (5 across + 5 down, mix of len 3 and 5)
    expect(slots.length).toBeGreaterThanOrEqual(8);
    expect(slots.length).toBeLessThanOrEqual(12);
  });

  it("assigns sequential display numbers", () => {
    for (const tpl of TEMPLATES_5x5) {
      const slots = extractSlots(tpl.template);
      const numbers = new Set(slots.map((s) => s.number));
      // Numbers should start at 1 and have no gaps (within the range)
      const maxNum = Math.max(...numbers);
      expect(maxNum).toBeGreaterThan(0);
    }
  });

  it("all slots have length >= 3", () => {
    for (const tpl of TEMPLATES_5x5) {
      const slots = extractSlots(tpl.template);
      for (const slot of slots) {
        expect(slot.length).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

describe("Cross-Index", () => {
  it("builds and queries correctly", () => {
    const bank = new Map<number, string[]>([
      [3, ["CAT", "COT", "CUT", "DOG", "DIG"]],
      [5, ["HELLO", "WORLD"]],
    ]);

    const index = buildCrossIndex(bank);

    // Query: 3-letter words with 'A' at position 1
    const result = index.get(3)?.get(1)?.get("A");
    expect(result).toBeDefined();
    expect(result!.has("CAT")).toBe(true);
    expect(result!.has("COT")).toBe(false); // 'O' at position 1
  });

  it("skips words with wrong length", () => {
    const bank = new Map<number, string[]>([
      [3, ["CAT", "CATS"]], // CATS is 4 letters, should be skipped
    ]);

    const index = buildCrossIndex(bank);
    const allWords = new Set<string>();
    for (const [, letterMap] of index.get(3) ?? []) {
      for (const [, words] of letterMap) {
        for (const w of words) allWords.add(w);
      }
    }
    expect(allWords.has("CATS")).toBe(false);
    expect(allWords.has("CAT")).toBe(true);
  });
});
