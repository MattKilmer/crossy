/**
 * Score a completed puzzle solution for fill quality.
 * Returns a score from 0-100 where higher is better.
 */
export function scoreSolution(
  assignments: Map<number, string>,
  wordScores?: Map<string, number> // word -> quality score from bank
): number {
  let totalScore = 0;
  let wordCount = 0;

  for (const [, word] of assignments) {
    wordCount++;

    // Base score from word bank quality (if available)
    const bankScore = wordScores?.get(word) ?? 50;
    totalScore += bankScore;

    // Bonus for longer words (more interesting fill)
    if (word.length >= 5) totalScore += 5;
    if (word.length >= 4) totalScore += 3;

    // Penalty for very short words
    if (word.length === 3) totalScore -= 5;

    // Penalty for uncommon letter combinations
    const awkwardBigrams = ["QU", "ZZ", "XX", "JJ", "QI", "ZX"];
    for (const bigram of awkwardBigrams) {
      if (word.includes(bigram)) totalScore -= 3;
    }

    // Penalty for words that are mostly consonants
    const vowels = word.split("").filter((c) => "AEIOU".includes(c)).length;
    if (vowels === 0) totalScore -= 10;
    if (vowels / word.length < 0.2) totalScore -= 5;
  }

  if (wordCount === 0) return 0;

  // Normalize: average score per word, clamped to 0-100
  const avg = totalScore / wordCount;
  return Math.max(0, Math.min(100, Math.round(avg)));
}
