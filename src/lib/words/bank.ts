import wordsData from "@/data/words.json";

interface WordEntry {
  w: string;
  s: number;
}

// Cache the loaded + organized word bank
let _bankByLength: Map<number, string[]> | null = null;
let _scoreMap: Map<string, number> | null = null;

/**
 * Get the full word bank organized by length.
 * Words within each length are sorted by score (descending).
 */
export function getWordBank(): Map<number, string[]> {
  if (_bankByLength) return _bankByLength;

  const bank = new Map<number, string[]>();
  const entries = wordsData as WordEntry[];

  // Group by length
  for (const { w, s } of entries) {
    if (!bank.has(w.length)) bank.set(w.length, []);
    bank.get(w.length)!.push(w);
  }

  // Sort each length group by score (descending)
  const scoreMap = getScoreMap();
  for (const [, words] of bank) {
    words.sort((a, b) => (scoreMap.get(b) ?? 50) - (scoreMap.get(a) ?? 50));
  }

  _bankByLength = bank;
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
 * Get words of a specific length, sorted by score.
 */
export function getWordsByLength(length: number): string[] {
  return getWordBank().get(length) ?? [];
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

  // Get all lengths from both sources
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
