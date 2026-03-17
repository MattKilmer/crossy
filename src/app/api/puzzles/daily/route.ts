import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { puzzles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  const result = await db
    .select({ id: puzzles.id, topic: puzzles.topic })
    .from(puzzles)
    .where(eq(puzzles.dailyDate, today))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json({ daily: null });
  }

  return NextResponse.json({
    daily: { id: result[0].id, topic: result[0].topic, date: today },
  });
}
