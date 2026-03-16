"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { PuzzleResponse } from "@/lib/types";

interface CompletionScreenProps {
  puzzle: PuzzleResponse;
  time: number;
  onShare: () => void;
  onNewPuzzle: () => void;
}

export function CompletionScreen({
  puzzle,
  time,
  onShare,
  onNewPuzzle,
}: CompletionScreenProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setShowConfetti(true);
    const t = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md mx-auto px-4 py-12 text-center relative">
      {/* Confetti particles (CSS-only) */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-5%`,
                backgroundColor: [
                  "#c9a84c",
                  "#3b82f6",
                  "#10b981",
                  "#f59e0b",
                  "#ef4444",
                  "#8b5cf6",
                ][i % 6],
                animation: `confetti-fall ${1.5 + Math.random() * 2}s ease-in forwards`,
                animationDelay: `${Math.random() * 0.8}s`,
              }}
            />
          ))}
          <style>{`
            @keyframes confetti-fall {
              0% { transform: translateY(0) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(${360 + Math.random() * 720}deg); opacity: 0; }
            }
          `}</style>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="font-serif text-4xl text-crossy-ink tracking-tight">
          Solved!
        </h2>
        <p className="font-sans text-crossy-ink/60 text-sm">
          You completed the {puzzle.topic} puzzle
        </p>
      </div>

      {/* Time display */}
      <div className="flex flex-col items-center gap-1">
        <span className="font-mono text-5xl tabular-nums text-crossy-ink tracking-tighter">
          {formatTime(time)}
        </span>
        <span className="font-sans text-xs text-crossy-ink/40 uppercase tracking-widest">
          solve time
        </span>
      </div>

      {/* Divider */}
      <div className="w-16 h-px bg-crossy-ink/15" />

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={onShare}
          className="w-full bg-crossy-ink text-crossy-cream hover:bg-crossy-ink/90 font-sans font-semibold tracking-wide"
          size="lg"
        >
          Share Results
        </Button>
        <Button
          onClick={onNewPuzzle}
          variant="outline"
          className="w-full font-sans font-medium border-crossy-ink/20 text-crossy-ink/70 hover:bg-crossy-ink/5"
          size="lg"
        >
          New Puzzle
        </Button>
      </div>
    </div>
  );
}
