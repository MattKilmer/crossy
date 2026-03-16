/**
 * Build the crossword word bank from two sources:
 * 1. Primary: christophsjones/crossword-wordlist (170k scored crossword entries)
 * 2. Fallback: ENABLE word list (for coverage)
 *
 * The crossword word list has expert-curated scores (50=common, 25=acceptable, 2=obscure)
 * which are much better quality signals than our heuristic scoring.
 *
 * Run: npx tsx scripts/build-wordbank.ts
 * Output: src/data/words.json
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

function main() {
  const crosswordListPath = join(__dirname, "crossword_wordlist.txt");
  const enableListPath = join(__dirname, "enable1.txt");
  const outputPath = join(__dirname, "..", "src", "data", "words.json");

  // ─── Load crossword word list (primary source) ───
  console.log("Loading crossword word list...");
  const crosswordRaw = readFileSync(crosswordListPath, "utf-8");
  const crosswordEntries = new Map<string, number>();

  for (const line of crosswordRaw.split("\n")) {
    const parts = line.trim().split(";");
    if (parts.length !== 2) continue;
    const word = parts[0].toUpperCase().replace(/[^A-Z]/g, "");
    const score = parseInt(parts[1], 10);
    if (!word || isNaN(score)) continue;
    if (word.length < 3 || word.length > 7) continue;
    // Only include single words (no spaces in original — we already filtered by removing non-alpha)
    // But skip if original had spaces (multi-word entries)
    if (parts[0].includes(" ")) continue;

    // Map crossword scores (2-50) to our scale (1-99)
    // 50 → 95 (excellent), 40 → 80, 30 → 60, 25 → 50, 10 → 25, 2 → 5
    const normalized = Math.max(1, Math.min(99, Math.round((score / 50) * 95)));

    // Keep the higher score if duplicate
    const existing = crosswordEntries.get(word);
    if (!existing || normalized > existing) {
      crosswordEntries.set(word, normalized);
    }
  }

  console.log(`  Crossword list: ${crosswordEntries.size} words (3-7 letters, single-word)`);

  // ─── Load ENABLE list (fallback source) ───
  const enableEntries = new Map<string, number>();
  if (existsSync(enableListPath)) {
    console.log("Loading ENABLE word list (fallback)...");
    const enableRaw = readFileSync(enableListPath, "utf-8");
    for (const line of enableRaw.split("\n")) {
      const word = line.trim().toUpperCase();
      if (!/^[A-Z]+$/.test(word)) continue;
      if (word.length < 3 || word.length > 7) continue;
      if (!crosswordEntries.has(word)) {
        // ENABLE words not in crossword list get a low base score
        enableEntries.set(word, 35);
      }
    }
    console.log(`  ENABLE fallback: ${enableEntries.size} additional words`);
  }

  // ─── Merge ───
  const allWords: { w: string; s: number }[] = [];

  for (const [word, score] of crosswordEntries) {
    allWords.push({ w: word, s: score });
  }
  for (const [word, score] of enableEntries) {
    allWords.push({ w: word, s: score });
  }

  // Sort by length then score descending
  allWords.sort((a, b) => {
    if (a.w.length !== b.w.length) return a.w.length - b.w.length;
    return b.s - a.s;
  });

  // ─── Stats ───
  const byLength = new Map<number, number>();
  for (const { w } of allWords) {
    byLength.set(w.length, (byLength.get(w.length) || 0) + 1);
  }
  console.log("\nWords by length:");
  for (const [len, count] of [...byLength.entries()].sort()) {
    console.log(`  ${len} letters: ${count}`);
  }

  // Score distribution
  const tiers = { excellent: 0, good: 0, fair: 0, poor: 0 };
  for (const { s } of allWords) {
    if (s >= 80) tiers.excellent++;
    else if (s >= 50) tiers.good++;
    else if (s >= 30) tiers.fair++;
    else tiers.poor++;
  }
  console.log("\nQuality tiers:");
  console.log(`  Excellent (80-99): ${tiers.excellent}`);
  console.log(`  Good (50-79):      ${tiers.good}`);
  console.log(`  Fair (30-49):      ${tiers.fair}`);
  console.log(`  Poor (1-29):       ${tiers.poor}`);

  // ─── Write output ───
  writeFileSync(outputPath, JSON.stringify(allWords));
  const sizeMB = (Buffer.byteLength(JSON.stringify(allWords)) / 1024 / 1024).toFixed(1);
  console.log(`\nWritten ${allWords.length} words to ${outputPath} (${sizeMB} MB)`);
}

main();
