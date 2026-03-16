import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { puzzles, puzzleAttempts } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import type { CheckAnswersRequest, CheckAnswersResponse } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as CheckAnswersRequest & { sessionId?: string };
  const { answers, solveTimeSec, sessionId } = body;

  const result = await db
    .select()
    .from(puzzles)
    .where(eq(puzzles.id, id))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
  }

  const solutionGrid = result[0].grid as string[][];

  // Compare cell by cell
  let correct = 0;
  let total = 0;
  let errors = 0;
  const cellResults: ("correct" | "incorrect" | "black" | "empty")[][] = [];

  for (let r = 0; r < solutionGrid.length; r++) {
    const row: ("correct" | "incorrect" | "black" | "empty")[] = [];
    for (let c = 0; c < solutionGrid[r].length; c++) {
      if (solutionGrid[r][c] === "#") {
        row.push("black");
      } else {
        total++;
        const playerLetter = (answers?.[r]?.[c] || "").toUpperCase();
        const correctLetter = solutionGrid[r][c].toUpperCase();

        if (!playerLetter) {
          row.push("empty");
        } else if (playerLetter === correctLetter) {
          correct++;
          row.push("correct");
        } else {
          errors++;
          row.push("incorrect");
        }
      }
    }
    cellResults.push(row);
  }

  const solved = correct === total && total > 0;

  // Record attempt
  await db.insert(puzzleAttempts).values({
    puzzleId: id,
    solveTimeSec: solveTimeSec ?? null,
    solved,
    errorCount: errors,
    sessionId: sessionId ?? null,
  });

  // Update puzzle stats if solved
  if (solved) {
    await db
      .update(puzzles)
      .set({ solveCount: sql`${puzzles.solveCount} + 1` })
      .where(eq(puzzles.id, id));
  }

  // Get leaderboard rank if solved
  let rank: number | null = null;
  let totalSolvers = 0;
  if (solved && solveTimeSec) {
    const fasterCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(puzzleAttempts)
      .where(
        sql`${puzzleAttempts.puzzleId} = ${id} AND ${puzzleAttempts.solved} = true AND ${puzzleAttempts.solveTimeSec} < ${solveTimeSec}`
      );
    rank = (fasterCount[0]?.count ?? 0) + 1;

    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(puzzleAttempts)
      .where(
        sql`${puzzleAttempts.puzzleId} = ${id} AND ${puzzleAttempts.solved} = true`
      );
    totalSolvers = totalCount[0]?.count ?? 0;
  }

  const response: CheckAnswersResponse = {
    solved,
    correct,
    total,
    errors,
    cellResults,
    ...(solved ? { solution: solutionGrid, rank, totalSolvers } : {}),
  };

  return NextResponse.json(response);
}
