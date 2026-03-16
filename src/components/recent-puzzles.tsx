"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RecentPuzzle } from "@/lib/types";

export function RecentPuzzles() {
  const [puzzles, setPuzzles] = useState<RecentPuzzle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/puzzles/recent")
      .then((r) => r.json())
      .then((data) => setPuzzles(data.puzzles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading || puzzles.length === 0) return null;

  return (
    <div className="w-full max-w-md mt-8">
      <h2 className="font-serif text-lg text-crossy-ink/70 mb-3 text-center">
        Recent Puzzles
      </h2>
      <div className="space-y-2">
        {puzzles.map((p) => (
          <Link
            key={p.id}
            href={`/puzzle/${p.id}`}
            className="flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-crossy-ink/8 hover:border-crossy-ink/20 transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <p className="font-sans text-sm font-medium text-crossy-ink truncate group-hover:text-crossy-gold transition-colors">
                  {p.topic}
                </p>
                <p className="font-sans text-xs text-crossy-ink/40">
                  {p.difficulty} · {timeAgo(p.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              {p.bestTime && (
                <div className="text-right">
                  <p className="font-mono text-xs text-crossy-gold font-medium">
                    {formatTime(p.bestTime)}
                  </p>
                  <p className="font-sans text-[10px] text-crossy-ink/30">
                    best
                  </p>
                </div>
              )}
              <div className="text-right">
                <p className="font-sans text-xs text-crossy-ink/50 tabular-nums">
                  {p.solveCount}/{p.playCount}
                </p>
                <p className="font-sans text-[10px] text-crossy-ink/30">
                  solved
                </p>
              </div>
              <svg
                className="w-4 h-4 text-crossy-ink/20 group-hover:text-crossy-ink/40 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
