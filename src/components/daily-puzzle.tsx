"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DailyData {
  id: string;
  topic: string;
  date: string;
}

export function DailyPuzzle() {
  const [daily, setDaily] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/puzzles/daily")
      .then((r) => r.json())
      .then((data) => setDaily(data.daily ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !daily) return null;

  return (
    <Link
      href={`/puzzle/${daily.id}`}
      className="w-full max-w-md mb-8 group"
    >
      <div className="flex items-center gap-4 px-5 py-4 bg-white rounded-xl border-2 border-crossy-gold/25 hover:border-crossy-gold/50 transition-all shadow-sm hover:shadow-md">
        {/* Calendar icon */}
        <div className="w-12 h-12 rounded-lg bg-crossy-gold/10 flex flex-col items-center justify-center shrink-0">
          <span className="font-mono text-lg font-bold text-crossy-gold leading-none">
            {new Date().getDate()}
          </span>
          <span className="font-sans text-[9px] uppercase tracking-wider text-crossy-gold/70">
            {new Date().toLocaleDateString("en-US", { month: "short" })}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-sans text-[10px] uppercase tracking-widest text-crossy-gold/70 font-medium">
            Today&apos;s Daily Puzzle
          </p>
          <p className="font-serif text-lg text-crossy-ink group-hover:text-crossy-gold transition-colors truncate">
            {daily.topic}
          </p>
        </div>

        <svg
          className="w-5 h-5 text-crossy-ink/20 group-hover:text-crossy-gold/60 transition-colors shrink-0"
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
  );
}
