import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { puzzles, puzzleAttempts } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";

export async function GET() {
  const recentPuzzles = await db
    .select({
      id: puzzles.id,
      topic: puzzles.topic,
      difficulty: puzzles.difficulty,
      playCount: puzzles.playCount,
      solveCount: puzzles.solveCount,
      grid: puzzles.grid,
      createdAt: puzzles.createdAt,
    })
    .from(puzzles)
    .orderBy(desc(puzzles.createdAt))
    .limit(8);

  const results = await Promise.all(
    recentPuzzles.map(async (p) => {
      const best = await db
        .select({
          bestTime: sql<number>`min(${puzzleAttempts.solveTimeSec})`,
        })
        .from(puzzleAttempts)
        .where(
          sql`${puzzleAttempts.puzzleId} = ${p.id} AND ${puzzleAttempts.solved} = true AND ${puzzleAttempts.solveTimeSec} IS NOT NULL`
        );

      // Build template (black/white pattern only, no letters)
      const template = (p.grid as string[][]).map((row) =>
        row.map((c) => (c === "#" ? "#" : "."))
      );

      return {
        id: p.id,
        topic: p.topic,
        difficulty: p.difficulty,
        playCount: p.playCount,
        solveCount: p.solveCount,
        bestTime: best[0]?.bestTime ?? null,
        template,
        createdAt: p.createdAt.toISOString(),
      };
    })
  );

  return NextResponse.json({ puzzles: results });
}
