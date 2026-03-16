import { getClient, CLUE_MODEL } from "./client";
import { extractJSON } from "./parse-json";
import type { ClueData } from "../solver/types";

interface ClueRequest {
  topic: string;
  tone: string;
  difficulty: "easy" | "medium" | "hard";
  words: { number: number; answer: string; direction: "across" | "down" }[];
}

const TONE_GUIDE: Record<string, string> = {
  standard:
    "Classic crossword clue style. Concise, clear definitions or wordplay.",
  witty:
    "Clever, humorous clues with puns and double meanings. Make the solver smile.",
  trivia:
    "Trivia-style clues that test knowledge. Include fun facts when possible.",
  kids:
    "Simple, friendly clues suitable for ages 8-12. Use familiar references.",
};

const DIFFICULTY_CLUE_GUIDE: Record<string, string> = {
  easy: "Clues should be straightforward definitions. No tricks or misdirection.",
  medium:
    "Clues can be slightly indirect but should be fair. Some wordplay is okay.",
  hard: "Clues should be challenging — use misdirection, double meanings, or oblique references.",
};

/**
 * Check if a clue contains the answer as a standalone word or obvious substring.
 * More nuanced than simple includes — allows the answer to appear as part of
 * a longer, unrelated word (e.g. "beBOP" in a clue about bebop is fine for answer "BOP"
 * only if the clue doesn't give it away).
 *
 * We check: does the answer appear as a whole word (bounded by spaces/punctuation)?
 */
function clueContainsAnswer(clue: string, answer: string): boolean {
  const upper = clue.toUpperCase();
  const ans = answer.toUpperCase();

  // Check whole word match using word boundaries
  const regex = new RegExp(`\\b${ans.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
  return regex.test(upper);
}

/**
 * Generate a simple fallback clue for a word when the LLM clue is missing or invalid.
 */
function fallbackClue(answer: string): string {
  const len = answer.length;
  return `${len}-letter word`;
}

/**
 * Generate clues for a completed crossword grid using Claude Opus.
 */
export async function generateClues(
  req: ClueRequest
): Promise<{ across: ClueData[]; down: ClueData[] }> {
  const client = getClient();

  const wordList = req.words
    .map((w) => `${w.number}-${w.direction.toUpperCase()}: ${w.answer} (${w.answer.length} letters)`)
    .join("\n");

  const response = await client.messages.create({
    model: CLUE_MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Write crossword clues for a "${req.topic}"-themed mini crossword puzzle.

Tone: ${req.tone}. ${TONE_GUIDE[req.tone] || TONE_GUIDE.standard}
Difficulty: ${req.difficulty}. ${DIFFICULTY_CLUE_GUIDE[req.difficulty]}

Words to write clues for:
${wordList}

Rules:
- Each clue must uniquely and fairly identify its answer
- Try to relate clues to the topic "${req.topic}" when possible, but if a word doesn't relate to the topic, write a good general clue instead
- Keep clues concise (under 60 characters preferred, 80 max)
- CRITICAL: The answer word must NOT appear as a standalone word in the clue. For example, if the answer is "BOP", do not write "Bebop style" — the word BOP is visible inside it. However, compound words where the answer is buried are okay.
- Each clue should be solvable — no impossible references
- Write exactly one clue per word, do not skip any

Respond in this exact JSON format only, no other text:
{
  "clues": [
    { "number": 1, "direction": "across", "clue": "Your clue here" },
    { "number": 1, "direction": "down", "clue": "Your clue here" }
  ]
}`,
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const parsed = extractJSON<{ clues: { number: number; direction: string; clue: string }[] }>(
    text.text
  );

  // Build a map of received clues
  const clueMap = new Map<string, string>();
  for (const item of parsed.clues) {
    const key = `${item.number}-${item.direction}`;
    const clue = item.clue?.trim();
    if (clue) {
      clueMap.set(key, clue);
    }
  }

  const across: ClueData[] = [];
  const down: ClueData[] = [];

  // Ensure every word has a clue — use fallback if LLM missed one or clue is invalid
  for (const word of req.words) {
    const key = `${word.number}-${word.direction}`;
    let clue = clueMap.get(key) ?? null;

    // Validate: reject if clue contains the answer as a whole word
    if (clue && clueContainsAnswer(clue, word.answer)) {
      clue = null; // will use fallback
    }

    // Use fallback if no valid clue
    if (!clue) {
      clue = fallbackClue(word.answer);
    }

    const clueData: ClueData = {
      number: word.number,
      clue,
      answer: word.answer,
      length: word.answer.length,
      direction: word.direction,
    };

    if (word.direction === "across") across.push(clueData);
    else down.push(clueData);
  }

  across.sort((a, b) => a.number - b.number);
  down.sort((a, b) => a.number - b.number);

  return { across, down };
}
