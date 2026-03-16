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
- NEVER include the answer word (or an obvious anagram of it) in the clue
- Each clue should be solvable — no impossible references
- Write exactly one clue per word

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

  const across: ClueData[] = [];
  const down: ClueData[] = [];

  for (const item of parsed.clues) {
    const wordEntry = req.words.find(
      (w) => w.number === item.number && w.direction === item.direction
    );
    if (!wordEntry) continue;

    // Validate: clue doesn't contain answer
    const clue = item.clue.trim();
    if (clue.toUpperCase().includes(wordEntry.answer.toUpperCase())) {
      continue; // Skip clues that contain the answer
    }

    const clueData: ClueData = {
      number: item.number,
      clue,
      answer: wordEntry.answer,
      length: wordEntry.answer.length,
      direction: wordEntry.direction as "across" | "down",
    };

    if (item.direction === "across") across.push(clueData);
    else down.push(clueData);
  }

  across.sort((a, b) => a.number - b.number);
  down.sort((a, b) => a.number - b.number);

  // Verify we got clues for all words
  if (across.length + down.length < req.words.length) {
    console.warn(
      `Warning: generated ${across.length + down.length} clues for ${req.words.length} words`
    );
  }

  return { across, down };
}
