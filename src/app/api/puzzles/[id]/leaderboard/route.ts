import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { puzzleAttempts } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = request.nextUrl.searchParams.get("sid");

  // Top 10 fastest solves (deduplicated by best time per session)
  const leaderboard = await db
    .select({
      solveTimeSec: sql<number>`min(${puzzleAttempts.solveTimeSec})`,
      sessionId: puzzleAttempts.sessionId,
    })
    .from(puzzleAttempts)
    .where(
      sql`${puzzleAttempts.puzzleId} = ${id} AND ${puzzleAttempts.solved} = true AND ${puzzleAttempts.solveTimeSec} IS NOT NULL`
    )
    .groupBy(puzzleAttempts.sessionId)
    .orderBy(sql`min(${puzzleAttempts.solveTimeSec}) asc`)
    .limit(10);

  const entries = leaderboard.map((row, i) => ({
    rank: i + 1,
    solveTimeSec: row.solveTimeSec,
    isYou: sessionId ? row.sessionId === sessionId : false,
  }));

  return NextResponse.json({ leaderboard: entries });
}
