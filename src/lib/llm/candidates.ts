import { getClient, CANDIDATE_MODEL } from "./client";
import { extractJSON } from "./parse-json";

interface CandidateRequest {
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  lengths: number[];
  countPerLength?: number;
}

const DIFFICULTY_GUIDE = {
  easy: "Use common, everyday words that most people would know. Think vocabulary appropriate for ages 12+.",
  medium: "Use moderately challenging words. Mix common words with some that require general knowledge.",
  hard: "Use challenging vocabulary, proper nouns from the topic, specialized terminology.",
};

/**
 * Generate topic-relevant candidate words using Claude.
 * Returns a map of word length → array of candidate words (uppercase, validated).
 */
export async function generateCandidates(
  req: CandidateRequest
): Promise<Map<number, string[]>> {
  const client = getClient();
  const countPerLength = req.countPerLength ?? 25;

  const response = await client.messages.create({
    model: CANDIDATE_MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Generate crossword answer words related to the topic "${req.topic}".

Difficulty: ${req.difficulty}. ${DIFFICULTY_GUIDE[req.difficulty]}

I need words of these specific lengths: ${req.lengths.join(", ")} letters.
For EACH length, provide exactly ${countPerLength} words.

Rules:
- All words must be real English words or well-known proper nouns
- Words should relate to "${req.topic}" (directly or tangentially)
- All UPPERCASE, letters only (no spaces, hyphens, or punctuation)
- No duplicates
- Prefer interesting, crossword-friendly words with common letter patterns
- Include a mix of directly on-topic and tangentially related words

Respond in this exact JSON format only, no other text:
{
  ${req.lengths.map((l) => `"${l}": ["WORD1", "WORD2", ...]`).join(",\n  ")}
}`,
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const parsed = extractJSON<Record<string, string[]>>(text.text);
  const result = new Map<number, string[]>();

  for (const length of req.lengths) {
    const words = (parsed[String(length)] || [])
      .map((w: string) => w.toUpperCase().replace(/[^A-Z]/g, ""))
      .filter((w: string) => w.length === length)
      .filter((w: string) => new Set(w).size > 1); // reject single-char-repeated
    result.set(length, words);
  }

  return result;
}
