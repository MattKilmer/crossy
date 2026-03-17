import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { puzzles } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { TEMPLATES_5x5 } from "@/lib/solver/templates";
import { extractSlots } from "@/lib/solver/extract";
import { solve } from "@/lib/solver/solver";
import { generateCandidates } from "@/lib/llm/candidates";
import { generateClues } from "@/lib/llm/clues";
import { getWordBank, mergeWithTopicWords } from "@/lib/words/bank";
import { generatePuzzleId } from "@/lib/utils";
import { getDailyTopic } from "@/lib/daily-topics";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this automatically)
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get today's date in UTC
  const today = new Date().toISOString().split("T")[0]; // "2026-03-17"

  // Check if today's puzzle already exists
  const existing = await db
    .select({ id: puzzles.id })
    .from(puzzles)
    .where(eq(puzzles.dailyDate, today))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({
      message: "Daily puzzle already exists",
      puzzleId: existing[0].id,
      date: today,
    });
  }

  const topic = getDailyTopic(today);
  const difficulty = "medium";
  const tone = "standard";

  // Generate puzzle (same pipeline as /api/puzzles/generate)
  const templateOrder = [...TEMPLATES_5x5].sort(
    (a, b) => a.difficulty - b.difficulty
  );

  const baseBank = getWordBank(difficulty);

  const allLengths = new Set<number>();
  for (const t of templateOrder) {
    const slots = extractSlots(t.template);
    for (const s of slots) allLengths.add(s.length);
  }

  const topicWords = await generateCandidates({
    topic,
    difficulty,
    lengths: [...allLengths].sort(),
    countPerLength: 25,
  });

  const mergedBank = mergeWithTopicWords(baseBank, topicWords);

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
      { error: "Failed to generate daily puzzle", topic, date: today },
      { status: 500 }
    );
  }

  const wordList = usedSlots.map((slot) => ({
    number: slot.number,
    answer: solution!.assignments.get(slot.id)!,
    direction: slot.direction,
  }));

  const { across, down } = await generateClues({
    topic,
    tone,
    difficulty,
    words: wordList,
  });

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
    generationTimeMs: 0,
    dailyDate: today,
  });

  return NextResponse.json({
    message: "Daily puzzle created",
    puzzleId,
    topic,
    date: today,
  });
}
