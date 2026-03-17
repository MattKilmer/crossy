import wordsData from "@/data/words.json";

interface WordEntry {
  w: string;
  s: number;
}

// Cache per difficulty level
const _bankCache = new Map<string, Map<number, string[]>>();
let _scoreMap: Map<string, number> | null = null;

// Minimum score thresholds by difficulty
// Easy: only well-known words (score >= 70)
// Medium: include acceptable words (score >= 45)
// Hard: include everything (score >= 1)
const DIFFICULTY_MIN_SCORE: Record<string, number> = {
  easy: 85,
  medium: 55,
  hard: 1,
};

/**
 * Get the word bank organized by length, filtered by difficulty.
 * Words are sorted by score (descending) — best words tried first.
 */
export function getWordBank(
  difficulty: "easy" | "medium" | "hard" = "medium"
): Map<number, string[]> {
  const cacheKey = difficulty;
  if (_bankCache.has(cacheKey)) return _bankCache.get(cacheKey)!;

  const minScore = DIFFICULTY_MIN_SCORE[difficulty];
  const bank = new Map<number, string[]>();
  const entries = wordsData as WordEntry[];
  const scoreMap = getScoreMap();

  // Group by length, filtering by score
  for (const { w, s } of entries) {
    if (s < minScore) continue;
    if (!bank.has(w.length)) bank.set(w.length, []);
    bank.get(w.length)!.push(w);
  }

  // Sort each length group by score (descending)
  for (const [, words] of bank) {
    words.sort((a, b) => (scoreMap.get(b) ?? 50) - (scoreMap.get(a) ?? 50));
  }

  _bankCache.set(cacheKey, bank);
  return bank;
}

/**
 * Get word quality scores.
 */
export function getScoreMap(): Map<string, number> {
  if (_scoreMap) return _scoreMap;

  const map = new Map<string, number>();
  const entries = wordsData as WordEntry[];
  for (const { w, s } of entries) {
    map.set(w, s);
  }

  _scoreMap = map;
  return map;
}

/**
 * Merge topic-specific candidate words with the base bank.
 * Topic words go first (higher priority), then base bank words.
 * Deduplicates.
 */
export function mergeWithTopicWords(
  baseBank: Map<number, string[]>,
  topicWords: Map<number, string[]>
): Map<number, string[]> {
  const merged = new Map<number, string[]>();
  const allLengths = new Set([...baseBank.keys(), ...topicWords.keys()]);

  for (const length of allLengths) {
    const topic = topicWords.get(length) ?? [];
    const base = baseBank.get(length) ?? [];
    const seen = new Set<string>();
    const result: string[] = [];

    // Topic words first
    for (const w of topic) {
      const upper = w.toUpperCase();
      if (!seen.has(upper) && /^[A-Z]+$/.test(upper) && upper.length === length) {
        seen.add(upper);
        result.push(upper);
      }
    }

    // Then base bank words
    for (const w of base) {
      if (!seen.has(w)) {
        seen.add(w);
        result.push(w);
      }
    }

    merged.set(length, result);
  }

  return merged;
}
