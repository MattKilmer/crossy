"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/lib/types";

interface LeaderboardProps {
  puzzleId: string;
  sessionId: string;
}

export function Leaderboard({ puzzleId, sessionId }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/puzzles/${puzzleId}/leaderboard?sid=${sessionId}`)
      .then((r) => r.json())
      .then((data) => setEntries(data.leaderboard || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [puzzleId, sessionId]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) return null;
  if (entries.length === 0) return null;

  return (
    <div className="w-full max-w-xs">
      <h3 className="font-serif text-lg text-crossy-ink/80 mb-2 text-center">
        Leaderboard
      </h3>
      <div className="bg-white rounded-lg border border-crossy-ink/10 overflow-hidden">
        {entries.map((entry) => (
          <div
            key={entry.rank}
            className={cn(
              "flex items-center justify-between px-3 py-2 border-b border-crossy-ink/5 last:border-b-0",
              entry.isYou && "bg-crossy-gold/10"
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                  entry.rank === 1
                    ? "bg-crossy-gold/20 text-crossy-gold"
                    : entry.rank === 2
                      ? "bg-gray-200 text-gray-500"
                      : entry.rank === 3
                        ? "bg-amber-100 text-amber-600"
                        : "bg-crossy-ink/5 text-crossy-ink/40"
                )}
              >
                {entry.rank}
              </span>
              {entry.isYou && (
                <span className="text-xs font-semibold text-crossy-gold">
                  You
                </span>
              )}
            </div>
            <span className="font-mono text-sm tabular-nums text-crossy-ink/70">
              {formatTime(entry.solveTimeSec)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
