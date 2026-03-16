"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import type { PuzzleResponse } from "@/lib/types";

interface CompletionScreenProps {
  puzzle: PuzzleResponse;
  time: number;
  rank?: number | null;
  totalSolvers?: number;
  onShare: () => void;
  onNewPuzzle: () => void;
}

const CELEBRATION_MESSAGES = [
  { threshold: 30, emoji: "\u26A1", message: "Lightning fast!" },
  { threshold: 60, emoji: "\uD83D\uDD25", message: "On fire!" },
  { threshold: 120, emoji: "\uD83C\uDF1F", message: "Brilliant!" },
  { threshold: 300, emoji: "\uD83C\uDFC6", message: "Well done!" },
  { threshold: Infinity, emoji: "\u2728", message: "You solved it!" },
];

const RANK_MESSAGES: Record<number, string> = {
  1: "You\u2019re the fastest solver!",
  2: "So close to the top!",
  3: "On the podium!",
};

export function CompletionScreen({
  puzzle,
  time,
  rank,
  totalSolvers = 0,
  onShare,
  onNewPuzzle,
}: CompletionScreenProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    requestAnimationFrame(() => setAnimateIn(true));
    const t = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const celebration = useMemo(
    () => CELEBRATION_MESSAGES.find((c) => time <= c.threshold)!,
    [time]
  );

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const rankMessage =
    rank && rank <= 3
      ? RANK_MESSAGES[rank]
      : rank
        ? `#${rank} of ${totalSolvers} solver${totalSolvers !== 1 ? "s" : ""}`
        : null;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto px-4 py-8 text-center relative">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {Array.from({ length: 50 }).map((_, i) => {
            const colors = [
              "#c9a84c",
              "#3b82f6",
              "#10b981",
              "#f59e0b",
              "#ef4444",
              "#8b5cf6",
              "#ec4899",
              "#14b8a6",
            ];
            const size = 4 + Math.random() * 8;
            const isRect = Math.random() > 0.5;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${Math.random() * 100}%`,
                  top: "-10px",
                  width: `${size}px`,
                  height: isRect ? `${size * 2}px` : `${size}px`,
                  backgroundColor: colors[i % colors.length],
                  borderRadius: isRect ? "1px" : "50%",
                  animation: `confetti-fall ${2 + Math.random() * 2.5}s ease-in forwards`,
                  animationDelay: `${Math.random() * 1}s`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            );
          })}
          <style>{`
            @keyframes confetti-fall {
              0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
              50% { opacity: 1; }
              100% { transform: translateY(100vh) rotate(${720 + Math.random() * 360}deg) scale(0.5); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      {/* Main content with stagger animation */}
      <div
        className="transition-all duration-700 ease-out"
        style={{
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? "translateY(0)" : "translateY(20px)",
        }}
      >
        {/* Big emoji */}
        <div className="text-6xl mb-2">{celebration.emoji}</div>

        {/* Celebration message */}
        <h2 className="font-serif text-4xl text-crossy-ink tracking-tight">
          {celebration.message}
        </h2>

        <p className="font-sans text-crossy-ink/50 text-sm mt-2">
          You conquered the {puzzle.topic} puzzle
        </p>
      </div>

      {/* Time display */}
      <div
        className="transition-all duration-700 ease-out delay-200"
        style={{
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? "translateY(0)" : "translateY(20px)",
        }}
      >
        <div className="flex flex-col items-center gap-1 bg-white rounded-xl border border-crossy-ink/10 px-8 py-5 shadow-sm">
          <span className="font-mono text-5xl tabular-nums text-crossy-ink tracking-tighter font-bold">
            {formatTime(time)}
          </span>
          <span className="font-sans text-xs text-crossy-ink/40 uppercase tracking-widest">
            solve time
          </span>

          {/* Rank */}
          {rankMessage && (
            <div className="mt-2 px-3 py-1 rounded-full bg-crossy-gold/10 border border-crossy-gold/20">
              <span className="font-sans text-xs font-semibold text-crossy-gold">
                {rank && rank <= 3 && (
                  <span className="mr-1">
                    {rank === 1 ? "\uD83E\uDD47" : rank === 2 ? "\uD83E\uDD48" : "\uD83E\uDD49"}
                  </span>
                )}
                {rankMessage}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex flex-col gap-3 w-full max-w-xs transition-all duration-700 ease-out delay-500"
        style={{
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? "translateY(0)" : "translateY(20px)",
        }}
      >
        <Button
          onClick={onShare}
          className="w-full bg-crossy-ink text-crossy-cream hover:bg-crossy-ink/90 font-sans font-semibold tracking-wide h-12 text-base"
          size="lg"
        >
          Challenge a Friend
        </Button>
        <Button
          onClick={onNewPuzzle}
          variant="outline"
          className="w-full font-sans font-medium border-crossy-ink/20 text-crossy-ink/70 hover:bg-crossy-ink/5 h-12"
          size="lg"
        >
          New Puzzle
        </Button>
      </div>
    </div>
  );
}
