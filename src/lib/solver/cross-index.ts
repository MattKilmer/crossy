/**
 * Cross-index: precomputed (position, letter) → word[] lookup.
 *
 * For a given word length, position index, and letter, returns all words
 * that have that letter at that position. This turns constraint checking
 * from O(n) scanning to O(1) set intersection.
 *
 * Structure: Map<wordLength, Map<positionIndex, Map<letter, Set<string>>>>
 */
export type CrossIndex = Map<number, Map<number, Map<string, Set<string>>>>;

/**
 * Build the cross-index from a word bank organized by length.
 */
export function buildCrossIndex(
  wordsByLength: Map<number, string[]>
): CrossIndex {
  const index: CrossIndex = new Map();

  for (const [length, words] of wordsByLength) {
    const posMap = new Map<number, Map<string, Set<string>>>();

    for (let pos = 0; pos < length; pos++) {
      posMap.set(pos, new Map());
    }

    for (const word of words) {
      // Skip words that don't match the expected length
      if (word.length !== length) continue;
      for (let pos = 0; pos < word.length; pos++) {
        const letter = word[pos];
        const letterMap = posMap.get(pos)!;
        if (!letterMap.has(letter)) {
          letterMap.set(letter, new Set());
        }
        letterMap.get(letter)!.add(word);
      }
    }

    index.set(length, posMap);
  }

  return index;
}

/**
 * Query the cross-index: get all words of a given length that have
 * a specific letter at a specific position.
 */
export function queryIndex(
  index: CrossIndex,
  length: number,
  position: number,
  letter: string
): Set<string> {
  return index.get(length)?.get(position)?.get(letter) ?? new Set();
}

/**
 * Intersect a candidate set with the cross-index constraint.
 * Returns only candidates that have the required letter at the required position.
 */
export function filterCandidates(
  candidates: string[],
  index: CrossIndex,
  length: number,
  constraints: { position: number; letter: string }[]
): string[] {
  if (constraints.length === 0) return candidates;

  // Get the intersection of all constraint sets
  let validSet: Set<string> | null = null;

  for (const { position, letter } of constraints) {
    const matching = queryIndex(index, length, position, letter);
    if (validSet === null) {
      validSet = new Set(matching);
    } else {
      // Intersect: keep only words in both sets
      for (const word of validSet) {
        if (!matching.has(word)) {
          validSet.delete(word);
        }
      }
    }
    if (validSet.size === 0) return [];
  }

  if (!validSet) return candidates;

  // Preserve original ordering (score order) by filtering
  return candidates.filter((w) => validSet!.has(w));
}
