import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { puzzles } from "@/lib/db/schema";
import { TEMPLATES_5x5 } from "@/lib/solver/templates";
import { extractSlots } from "@/lib/solver/extract";
import { solve } from "@/lib/solver/solver";
import { generateCandidates } from "@/lib/llm/candidates";
import { generateClues } from "@/lib/llm/clues";
import { getWordBank, mergeWithTopicWords } from "@/lib/words/bank";
import { generatePuzzleId, checkRateLimit, sanitizeTopic } from "@/lib/utils";
import type { GeneratePuzzleRequest, PuzzleClue } from "@/lib/types";

export const maxDuration = 30; // Vercel function timeout

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const { allowed } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as GeneratePuzzleRequest;
    const topic = sanitizeTopic(body.topic || "");
    const difficulty = body.difficulty ?? "medium";
    const tone = body.tone ?? "standard";

    if (!topic || topic.length < 2) {
      return NextResponse.json(
        { error: "Please provide a topic (at least 2 characters)." },
        { status: 400 }
      );
    }

    // Try templates from easiest to hardest (retry on solver failure)
    const templateOrder = [...TEMPLATES_5x5].sort(
      (a, b) => a.difficulty - b.difficulty
    );

    // Shuffle within same difficulty for variety
    for (let i = 0; i < templateOrder.length; i++) {
      const j =
        i +
        Math.floor(
          Math.random() *
            templateOrder.filter(
              (t, idx) =>
                idx >= i && t.difficulty === templateOrder[i].difficulty
            ).length
        );
      [templateOrder[i], templateOrder[j]] = [
        templateOrder[j],
        templateOrder[i],
      ];
    }

    const baseBank = getWordBank(difficulty);

    // Determine what word lengths we might need (union of all templates)
    const allLengths = new Set<number>();
    for (const t of templateOrder) {
      const slots = extractSlots(t.template);
      for (const s of slots) allLengths.add(s.length);
    }

    // Generate topic-specific candidates via LLM
    const topicWords = await generateCandidates({
      topic,
      difficulty,
      lengths: [...allLengths].sort(),
      countPerLength: 25,
    });

    // Merge topic words with base bank
    const mergedBank = mergeWithTopicWords(baseBank, topicWords);

    // Try each template until solver succeeds
    let solution = null;
    let usedTemplateId = "";
    let usedSlots = null;

    for (const tpl of templateOrder) {
      const result = solve(tpl.template, mergedBank, {
        maxBacktracks: 15000,
        timeoutMs: 6000,
      });

      if (result && result.score >= 40) {
        solution = result;
        usedTemplateId = tpl.id;
        usedSlots = result.slots;
        break;
      }
    }

    if (!solution || !usedSlots) {
      return NextResponse.json(
        {
          error:
            "Could not generate a puzzle for this topic. Try a different or broader topic.",
        },
        { status: 422 }
      );
    }

    // Prepare word list for clue generation
    const wordList = usedSlots.map((slot) => ({
      number: slot.number,
      answer: solution!.assignments.get(slot.id)!,
      direction: slot.direction,
    }));

    // Generate clues via LLM
    const { across, down } = await generateClues({
      topic,
      tone,
      difficulty,
      words: wordList,
    });

    // Build template mask (without solution letters)
    const template = solution.grid.map((row) =>
      row.map((c) => (c === "#" ? "#" : "."))
    );

    // Persist to database
    const puzzleId = generatePuzzleId();
    await db.insert(puzzles).values({
      id: puzzleId,
      topic,
      difficulty,
      tone,
      size: 5,
      templateId: usedTemplateId,
      grid: solution.grid,
      cluesAcross: across,
      cluesDown: down,
      wordCount: usedSlots.length,
      generationTimeMs: Date.now() - startTime,
    });

    // Return puzzle data WITHOUT solution
    const cluesAcross: PuzzleClue[] = across.map(({ number, clue, length }) => ({
      number,
      clue,
      length,
    }));
    const cluesDown: PuzzleClue[] = down.map(({ number, clue, length }) => ({
      number,
      clue,
      length,
    }));

    return NextResponse.json({
      id: puzzleId,
      topic,
      difficulty,
      tone,
      size: 5,
      template,
      cluesAcross,
      cluesDown,
      wordCount: usedSlots.length,
    });
  } catch (error) {
    console.error("Puzzle generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate puzzle. Please try again." },
      { status: 500 }
    );
  }
}
