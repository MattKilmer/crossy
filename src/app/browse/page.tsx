import Link from "next/link";
import { db } from "@/lib/db";
import { puzzles, puzzleAttempts } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse Puzzles",
  description:
    "Browse and play mini crosswords on every topic imaginable — from Space to Jazz to Cooking. New puzzles added daily.",
  alternates: {
    canonical: "https://crossygame.app/browse",
  },
};

export default async function BrowsePage() {
  const allPuzzles = await db
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
    .limit(50);

  const results = await Promise.all(
    allPuzzles.map(async (p) => {
      const best = await db
        .select({
          bestTime: sql<number>`min(${puzzleAttempts.solveTimeSec})`,
        })
        .from(puzzleAttempts)
        .where(
          sql`${puzzleAttempts.puzzleId} = ${p.id} AND ${puzzleAttempts.solved} = true AND ${puzzleAttempts.solveTimeSec} IS NOT NULL`
        );

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
        createdAt: p.createdAt,
      };
    })
  );

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <main className="min-h-screen paper-texture px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/"
              className="font-serif text-2xl text-crossy-ink hover:text-crossy-gold transition-colors"
            >
              Crossy
            </Link>
            <p className="font-sans text-sm text-crossy-ink/40 mt-0.5">
              {results.length} puzzles to play
            </p>
          </div>
          <Link
            href="/"
            className="font-sans text-sm font-medium text-crossy-gold hover:underline"
          >
            Create new
          </Link>
        </div>

        {/* Puzzle grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {results.map((p) => (
            <Link
              key={p.id}
              href={`/puzzle/${p.id}`}
              className="group flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-crossy-ink/8 hover:border-crossy-gold/40 hover:shadow-sm transition-all"
            >
              {/* Mini grid */}
              <div
                className="inline-grid border border-crossy-ink/40"
                style={{
                  gridTemplateColumns: `repeat(${p.template.length}, 1fr)`,
                  width: "44px",
                  height: "44px",
                }}
              >
                {p.template.flat().map((cell, i) => (
                  <div
                    key={i}
                    className={
                      cell === "#"
                        ? "bg-crossy-ink"
                        : "bg-white border-[0.5px] border-crossy-ink/15"
                    }
                  />
                ))}
              </div>

              {/* Topic */}
              <p className="font-sans text-xs font-medium text-crossy-ink text-center leading-tight group-hover:text-crossy-gold transition-colors line-clamp-2">
                {p.topic}
              </p>

              {/* Stats */}
              <div className="flex flex-col items-center gap-0.5 text-[10px] text-crossy-ink/35 font-sans">
                <span className="capitalize">{p.difficulty}</span>
                <div className="flex items-center gap-2">
                  {p.bestTime ? (
                    <span className="text-crossy-gold/70 font-medium">
                      {formatTime(p.bestTime)}
                    </span>
                  ) : null}
                  <span>
                    {p.solveCount} solve{p.solveCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {results.length === 0 && (
          <div className="text-center py-16">
            <p className="font-sans text-crossy-ink/40">
              No puzzles yet.{" "}
              <Link href="/" className="text-crossy-gold hover:underline">
                Create the first one
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
