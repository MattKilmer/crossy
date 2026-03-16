import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format");

  const all = await db
    .select()
    .from(subscribers)
    .orderBy(desc(subscribers.subscribedAt));

  if (format === "csv") {
    const csv =
      "email,subscribed_at,session_id\n" +
      all
        .map(
          (s) =>
            `${s.email},${s.subscribedAt.toISOString()},${s.sessionId ?? ""}`
        )
        .join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="crossy-subscribers-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  return NextResponse.json({ subscribers: all, total: all.length });
}
