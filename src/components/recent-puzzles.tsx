"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RecentPuzzle {
  id: string;
  topic: string;
  difficulty: string;
  playCount: number;
  solveCount: number;
  bestTime: number | null;
  template: string[][];
  createdAt: string;
}

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

  if (loading || puzzles.length === 0) return null;

  return (
    <div className="w-full max-w-lg mt-12">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-crossy-ink/10" />
        <h2 className="font-sans text-xs font-medium uppercase tracking-widest text-crossy-ink/35">
          or play a puzzle
        </h2>
        <div className="h-px flex-1 bg-crossy-ink/10" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {puzzles.map((p) => (
          <Link
            key={p.id}
            href={`/puzzle/${p.id}`}
            className="group flex flex-col items-center gap-2 p-3 bg-white rounded-lg border border-crossy-ink/8 hover:border-crossy-gold/40 hover:shadow-sm transition-all"
          >
            {/* Mini grid preview */}
            <MiniGrid template={p.template} />

            {/* Topic */}
            <p className="font-sans text-xs font-medium text-crossy-ink text-center leading-tight group-hover:text-crossy-gold transition-colors line-clamp-2">
              {p.topic}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-2 text-[10px] text-crossy-ink/35 font-sans">
              {p.bestTime ? (
                <span className="text-crossy-gold/70 font-medium">
                  {formatTime(p.bestTime)}
                </span>
              ) : null}
              {p.solveCount > 0 && (
                <span>
                  {p.solveCount} solve{p.solveCount !== 1 ? "s" : ""}
                </span>
              )}
              {p.solveCount === 0 && !p.bestTime && (
                <span className="text-crossy-gold/60 font-medium">New</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MiniGrid({ template }: { template: string[][] }) {
  const size = template.length;
  return (
    <div
      className="inline-grid border border-crossy-ink/40"
      style={{
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        width: "40px",
        height: "40px",
      }}
    >
      {template.flat().map((cell, i) => (
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
  );
}
