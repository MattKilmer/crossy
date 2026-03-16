import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { puzzles } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import type { PuzzleClue, PuzzleResponse } from "@/lib/types";
import type { ClueData } from "@/lib/solver/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = await db
    .select()
    .from(puzzles)
    .where(eq(puzzles.id, id))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
  }

  const p = result[0];

  // Increment play count
  await db
    .update(puzzles)
    .set({ playCount: sql`${puzzles.playCount} + 1` })
    .where(eq(puzzles.id, id));

  // Return puzzle data WITHOUT solution letters
  const template = (p.grid as string[][]).map((row) =>
    row.map((c) => (c === "#" ? "#" : "."))
  );

  const cluesAcross: PuzzleClue[] = (p.cluesAcross as ClueData[]).map(
    ({ number, clue, length }) => ({ number, clue, length })
  );
  const cluesDown: PuzzleClue[] = (p.cluesDown as ClueData[]).map(
    ({ number, clue, length }) => ({ number, clue, length })
  );

  const response: PuzzleResponse = {
    id: p.id,
    topic: p.topic,
    difficulty: p.difficulty,
    tone: p.tone,
    size: p.size,
    template,
    cluesAcross,
    cluesDown,
    wordCount: p.wordCount,
    createdAt: p.createdAt.toISOString(),
    playCount: p.playCount,
  };

  return NextResponse.json(response);
}
