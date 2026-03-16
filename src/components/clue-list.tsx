"use client";

import { cn } from "@/lib/utils";
import type { PuzzleClue } from "@/lib/types";

interface ClueListProps {
  acrossClues: PuzzleClue[];
  downClues: PuzzleClue[];
  activeClueNumber: number | null;
  activeDirection: "across" | "down";
  onClueClick: (number: number, direction: "across" | "down") => void;
}

export function ClueList({
  acrossClues,
  downClues,
  activeClueNumber,
  activeDirection,
  onClueClick,
}: ClueListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-xl">
      <ClueSection
        title="Across"
        clues={acrossClues}
        direction="across"
        activeClueNumber={activeClueNumber}
        activeDirection={activeDirection}
        onClueClick={onClueClick}
      />
      <ClueSection
        title="Down"
        clues={downClues}
        direction="down"
        activeClueNumber={activeClueNumber}
        activeDirection={activeDirection}
        onClueClick={onClueClick}
      />
    </div>
  );
}

function ClueSection({
  title,
  clues,
  direction,
  activeClueNumber,
  activeDirection,
  onClueClick,
}: {
  title: string;
  clues: PuzzleClue[];
  direction: "across" | "down";
  activeClueNumber: number | null;
  activeDirection: "across" | "down";
  onClueClick: (number: number, direction: "across" | "down") => void;
}) {
  return (
    <div>
      <h3 className="font-serif text-lg text-crossy-ink/80 mb-2 tracking-wide">
        {title}
      </h3>
      <ul className="space-y-1">
        {clues.map((clue) => {
          const isActive =
            activeClueNumber === clue.number && activeDirection === direction;

          return (
            <li
              key={`${direction}-${clue.number}`}
              className={cn(
                "flex gap-2 py-1.5 px-2 rounded-sm cursor-pointer transition-colors duration-100",
                "hover:bg-crossy-active/50",
                isActive && "bg-crossy-active font-medium"
              )}
              onClick={() => onClueClick(clue.number, direction)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClueClick(clue.number, direction);
                }
              }}
            >
              <span className="font-sans font-bold text-sm text-crossy-ink/60 min-w-[1.5rem] text-right tabular-nums">
                {clue.number}
              </span>
              <span className="font-sans text-sm text-crossy-ink/90 leading-snug">
                {clue.clue}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
