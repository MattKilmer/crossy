/**
 * Test solver with the full 50k word bank.
 * Run: npx tsx scripts/test-solver-full.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import { solve } from "../src/lib/solver/solver";
import { TEMPLATES_5x5 } from "../src/lib/solver/templates";
import { extractSlots, findIntersections } from "../src/lib/solver/extract";

// Load word bank
const wordsData: { w: string; s: number }[] = JSON.parse(
  readFileSync(join(__dirname, "..", "src", "data", "words.json"), "utf-8")
);

// Organize by length, sorted by score desc
const wordsByLength = new Map<number, string[]>();
const scoreMap = new Map<string, number>();

for (const { w, s } of wordsData) {
  if (!wordsByLength.has(w.length)) wordsByLength.set(w.length, []);
  wordsByLength.get(w.length)!.push(w);
  scoreMap.set(w, s);
}

for (const [, words] of wordsByLength) {
  words.sort((a, b) => (scoreMap.get(b) ?? 50) - (scoreMap.get(a) ?? 50));
}

console.log("=== Full Word Bank Solver Test ===\n");
for (const [len, words] of [...wordsByLength.entries()].sort()) {
  console.log(`  ${len}-letter words: ${words.length}`);
}
console.log();

let passed = 0;
let failed = 0;

for (const tpl of TEMPLATES_5x5) {
  const startTime = performance.now();
  const result = solve(tpl.template, wordsByLength, {
    maxBacktracks: 15000,
    timeoutMs: 8000,
  });
  const elapsed = (performance.now() - startTime).toFixed(1);

  if (result) {
    // Verify crossings
    const slots = extractSlots(tpl.template);
    const intersections = findIntersections(slots);
    let valid = true;

    for (const ix of intersections) {
      const wordA = result.assignments.get(ix.slotA)!;
      const wordB = result.assignments.get(ix.slotB)!;
      if (wordA[ix.posA] !== wordB[ix.posB]) {
        console.log(`  CROSSING MISMATCH in ${tpl.id}`);
        valid = false;
        break;
      }
    }

    // Check no duplicates
    const words = [...result.assignments.values()];
    if (new Set(words).size !== words.length) {
      console.log(`  DUPLICATE in ${tpl.id}`);
      valid = false;
    }

    if (valid) {
      console.log(
        `PASS  ${tpl.id.padEnd(12)} ${elapsed.padStart(7)}ms  score=${result.score}  words=${words.length}`
      );
      for (const row of result.grid) {
        console.log("      " + row.map((c) => (c === "#" ? "." : c)).join(" "));
      }
      console.log("      Words: " + words.join(", "));
      console.log();
      passed++;
    } else {
      failed++;
    }
  } else {
    console.log(`FAIL  ${tpl.id} — solver returned null (${elapsed}ms)`);
    failed++;
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
