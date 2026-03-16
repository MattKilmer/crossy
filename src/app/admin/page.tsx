import { db } from "@/lib/db";
import { puzzles, puzzleAttempts, subscribers } from "@/lib/db/schema";
import { desc, sql, eq } from "drizzle-orm";
import type { ClueData } from "@/lib/solver/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Aggregate stats
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
      avgErrors: sql<number>`coalesce(avg(${puzzleAttempts.errorCount}), 0)`,
    })
    .from(puzzleAttempts);

  // Topic breakdown
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

  // Subscribers
  const allSubscribers = await db
    .select()
    .from(subscribers)
    .orderBy(desc(subscribers.subscribedAt));

  // All puzzles with details
  const allPuzzles = await db
    .select()
    .from(puzzles)
    .orderBy(desc(puzzles.createdAt))
    .limit(50);

  // Recent attempts
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

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatMs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 font-sans">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-crossy-ink">Crossy Admin</h1>
          <p className="text-sm text-crossy-ink/50 mt-1">
            Puzzle analytics and answer keys
          </p>
        </div>
        <a
          href="/"
          className="text-sm text-crossy-gold hover:underline"
        >
          Back to app
        </a>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Puzzles" value={statsResult.totalPuzzles} />
        <StatCard label="Total Plays" value={statsResult.totalPlays} />
        <StatCard label="Total Solves" value={statsResult.totalSolves} />
        <StatCard
          label="Avg Gen Time"
          value={formatMs(statsResult.avgGenTime)}
        />
        <StatCard label="Total Attempts" value={attemptStats.totalAttempts} />
        <StatCard label="Solved Attempts" value={attemptStats.solvedAttempts} />
        <StatCard
          label="Solve Rate"
          value={
            attemptStats.totalAttempts > 0
              ? `${Math.round((attemptStats.solvedAttempts / attemptStats.totalAttempts) * 100)}%`
              : "—"
          }
        />
        <StatCard
          label="Avg Solve Time"
          value={
            attemptStats.avgSolveTime > 0
              ? formatTime(Math.round(attemptStats.avgSolveTime))
              : "—"
          }
        />
        <StatCard label="Subscribers" value={allSubscribers.length} />
      </div>

      {/* Subscribers */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-xl text-crossy-ink">
            Subscribers ({allSubscribers.length})
          </h2>
          {allSubscribers.length > 0 && (
            <a
              href="/api/admin/subscribers?format=csv"
              className="text-sm text-crossy-gold hover:underline font-sans font-medium"
            >
              Export CSV
            </a>
          )}
        </div>
        <div className="bg-white rounded-lg border border-crossy-ink/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-crossy-ink/5">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-crossy-ink/60">
                  Email
                </th>
                <th className="text-right px-4 py-2 font-medium text-crossy-ink/60">
                  Subscribed
                </th>
              </tr>
            </thead>
            <tbody>
              {allSubscribers.map((s) => (
                <tr key={s.id} className="border-t border-crossy-ink/5">
                  <td className="px-4 py-2 text-crossy-ink font-mono text-xs">
                    {s.email}
                  </td>
                  <td className="px-4 py-2 text-right text-crossy-ink/50 text-xs">
                    {s.subscribedAt.toLocaleString()}
                  </td>
                </tr>
              ))}
              {allSubscribers.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-6 text-center text-crossy-ink/40"
                  >
                    No subscribers yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Topic breakdown */}
      <section className="mb-8">
        <h2 className="font-serif text-xl text-crossy-ink mb-3">
          Topics
        </h2>
        <div className="bg-white rounded-lg border border-crossy-ink/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-crossy-ink/5">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-crossy-ink/60">
                  Topic
                </th>
                <th className="text-right px-4 py-2 font-medium text-crossy-ink/60">
                  Puzzles
                </th>
                <th className="text-right px-4 py-2 font-medium text-crossy-ink/60">
                  Plays
                </th>
                <th className="text-right px-4 py-2 font-medium text-crossy-ink/60">
                  Solves
                </th>
              </tr>
            </thead>
            <tbody>
              {topicStats.map((t) => (
                <tr key={t.topic} className="border-t border-crossy-ink/5">
                  <td className="px-4 py-2 text-crossy-ink">{t.topic}</td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {t.count}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {t.plays}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {t.solves}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent attempts */}
      <section className="mb-8">
        <h2 className="font-serif text-xl text-crossy-ink mb-3">
          Recent Attempts
        </h2>
        <div className="bg-white rounded-lg border border-crossy-ink/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-crossy-ink/5">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-crossy-ink/60">
                  Puzzle
                </th>
                <th className="text-center px-4 py-2 font-medium text-crossy-ink/60">
                  Solved?
                </th>
                <th className="text-right px-4 py-2 font-medium text-crossy-ink/60">
                  Time
                </th>
                <th className="text-right px-4 py-2 font-medium text-crossy-ink/60">
                  Errors
                </th>
                <th className="text-right px-4 py-2 font-medium text-crossy-ink/60">
                  When
                </th>
              </tr>
            </thead>
            <tbody>
              {recentAttempts.map((a) => (
                <tr key={a.id} className="border-t border-crossy-ink/5">
                  <td className="px-4 py-2">
                    <a
                      href={`/puzzle/${a.puzzleId}`}
                      className="text-crossy-gold hover:underline font-mono text-xs"
                    >
                      {a.puzzleId}
                    </a>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {a.solved ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {a.solveTimeSec ? formatTime(a.solveTimeSec) : "—"}
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">
                    {a.errorCount ?? 0}
                  </td>
                  <td className="px-4 py-2 text-right text-crossy-ink/50 text-xs">
                    {a.completedAt.toLocaleString()}
                  </td>
                </tr>
              ))}
              {recentAttempts.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-crossy-ink/40"
                  >
                    No attempts yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* All puzzles with answer keys */}
      <section>
        <h2 className="font-serif text-xl text-crossy-ink mb-3">
          All Puzzles (Answer Keys)
        </h2>
        <div className="space-y-4">
          {allPuzzles.map((p) => {
            const grid = p.grid as string[][];
            const acrossClues = p.cluesAcross as ClueData[];
            const downClues = p.cluesDown as ClueData[];

            return (
              <div
                key={p.id}
                className="bg-white rounded-lg border border-crossy-ink/10 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`/puzzle/${p.id}`}
                        className="font-mono text-xs text-crossy-gold hover:underline"
                      >
                        {p.id}
                      </a>
                      <span className="font-semibold text-crossy-ink">
                        {p.topic}
                      </span>
                      <span className="text-xs text-crossy-ink/40 bg-crossy-ink/5 px-2 py-0.5 rounded">
                        {p.difficulty}
                      </span>
                      <span className="text-xs text-crossy-ink/40 bg-crossy-ink/5 px-2 py-0.5 rounded">
                        {p.tone}
                      </span>
                    </div>
                    <p className="text-xs text-crossy-ink/40 mt-1">
                      {p.createdAt.toLocaleString()} · Gen:{" "}
                      {p.generationTimeMs ? formatMs(p.generationTimeMs) : "?"}
                      {" · "}Plays: {p.playCount} · Solves: {p.solveCount}
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 flex-wrap">
                  {/* Grid with answers */}
                  <div
                    className="inline-grid gap-0 border-2 border-crossy-ink shrink-0"
                    style={{
                      gridTemplateColumns: `repeat(${p.size}, 1fr)`,
                    }}
                  >
                    {grid.map((row, r) =>
                      row.map((cell, c) => (
                        <div
                          key={`${r}-${c}`}
                          className={`w-8 h-8 flex items-center justify-center text-xs font-bold border border-crossy-ink/20 ${
                            cell === "#"
                              ? "bg-crossy-ink text-crossy-ink"
                              : "bg-white text-crossy-ink"
                          }`}
                        >
                          {cell !== "#" ? cell : ""}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Clues */}
                  <div className="flex gap-6 text-xs flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-crossy-ink/60 mb-1">
                        Across
                      </h4>
                      {acrossClues.map((c) => (
                        <p key={c.number} className="text-crossy-ink/70 mb-0.5 truncate">
                          <span className="font-bold">{c.number}.</span>{" "}
                          {c.clue}{" "}
                          <span className="text-crossy-gold font-mono">
                            [{c.answer}]
                          </span>
                        </p>
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-crossy-ink/60 mb-1">
                        Down
                      </h4>
                      {downClues.map((c) => (
                        <p key={c.number} className="text-crossy-ink/70 mb-0.5 truncate">
                          <span className="font-bold">{c.number}.</span>{" "}
                          {c.clue}{" "}
                          <span className="text-crossy-gold font-mono">
                            [{c.answer}]
                          </span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white rounded-lg border border-crossy-ink/10 p-4">
      <p className="text-xs text-crossy-ink/50 font-medium uppercase tracking-wider">
        {label}
      </p>
      <p className="text-2xl font-bold text-crossy-ink tabular-nums mt-1">
        {value}
      </p>
    </div>
  );
}
