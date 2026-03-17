import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { puzzles, puzzleAttempts, subscribers } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";
import type { ClueData } from "@/lib/solver/types";

export async function GET() {
  const [statsResult] = await db
    .select({
      totalPuzzles: sql<number>`count(*)`,
      totalPlays: sql<number>`coalesce(sum(${puzzles.playCount}), 0)`,
      totalSolves: sql<number>`coalesce(sum(${puzzles.solveCount}), 0)`,
      avgGenTime: sql<number>`coalesce(avg(${puzzles.generationTimeMs}), 0)`,
    })
    .from(puzzles);

  const [attemptStats] = await db
    .select({
      totalAttempts: sql<number>`count(*)`,
      solvedAttempts: sql<number>`coalesce(sum(case when ${puzzleAttempts.solved} then 1 else 0 end), 0)`,
      avgSolveTime: sql<number>`coalesce(avg(case when ${puzzleAttempts.solved} then ${puzzleAttempts.solveTimeSec} end), 0)`,
    })
    .from(puzzleAttempts);

  const topicStats = await db
    .select({
      topic: puzzles.topic,
      count: sql<number>`count(*)`,
      plays: sql<number>`coalesce(sum(${puzzles.playCount}), 0)`,
      solves: sql<number>`coalesce(sum(${puzzles.solveCount}), 0)`,
    })
    .from(puzzles)
    .groupBy(puzzles.topic)
    .orderBy(desc(sql`count(*)`))
    .limit(20);

  const allSubscribers = await db
    .select()
    .from(subscribers)
    .orderBy(desc(subscribers.subscribedAt));

  const allPuzzles = await db
    .select()
    .from(puzzles)
    .orderBy(desc(puzzles.createdAt))
    .limit(50);

  const recentAttempts = await db
    .select({
      id: puzzleAttempts.id,
      puzzleId: puzzleAttempts.puzzleId,
      solved: puzzleAttempts.solved,
      solveTimeSec: puzzleAttempts.solveTimeSec,
      errorCount: puzzleAttempts.errorCount,
      completedAt: puzzleAttempts.completedAt,
    })
    .from(puzzleAttempts)
    .orderBy(desc(puzzleAttempts.completedAt))
    .limit(30);

  return NextResponse.json({
    stats: statsResult,
    attemptStats,
    topicStats,
    subscribers: allSubscribers,
    puzzles: allPuzzles.map((p) => ({
      ...p,
      grid: p.grid,
      cluesAcross: p.cluesAcross as ClueData[],
      cluesDown: p.cluesDown as ClueData[],
      createdAt: p.createdAt.toISOString(),
    })),
    recentAttempts: recentAttempts.map((a) => ({
      ...a,
      completedAt: a.completedAt.toISOString(),
    })),
  });
}
