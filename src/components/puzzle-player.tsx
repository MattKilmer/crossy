"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { CrosswordGrid, type GridSlot } from "./crossword-grid";
import { ClueList } from "./clue-list";
import { CompletionScreen } from "./completion-screen";
import { ShareDialog } from "./share-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PuzzleResponse, PuzzleClue, CheckAnswersResponse } from "@/lib/types";

interface PuzzlePlayerProps {
  puzzle: PuzzleResponse;
}

export function PuzzlePlayer({ puzzle }: PuzzlePlayerProps) {
  const { size, template, cluesAcross, cluesDown } = puzzle;

  // Derive slots and clue numbers from template + clue data
  const { slots, clueNumbers } = useMemo(() => {
    const slots: GridSlot[] = [];
    const clueNumbers = new Map<string, number>();
    let displayNumber = 0;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (template[r][c] === "#") continue;

        const startsAcross =
          (c === 0 || template[r][c - 1] === "#") &&
          c + 1 < size &&
          template[r][c + 1] === ".";
        const startsDown =
          (r === 0 || template[r - 1]?.[c] === "#") &&
          r + 1 < size &&
          template[r + 1]?.[c] === ".";

        if (startsAcross || startsDown) {
          displayNumber++;
          clueNumbers.set(`${r},${c}`, displayNumber);
        }

        if (startsAcross) {
          const cells: [number, number][] = [];
          let cc = c;
          while (cc < size && template[r][cc] === ".") {
            cells.push([r, cc]);
            cc++;
          }
          if (cells.length >= 2) {
            slots.push({ direction: "across", cells, number: displayNumber });
          }
        }

        if (startsDown) {
          const cells: [number, number][] = [];
          let rr = r;
          while (rr < size && template[rr]?.[c] === ".") {
            cells.push([rr, c]);
            rr++;
          }
          if (cells.length >= 2) {
            slots.push({ direction: "down", cells, number: displayNumber });
          }
        }
      }
    }

    return { slots, clueNumbers };
  }, [template, size]);

  // Player state
  const [values, setValues] = useState<string[][]>(() =>
    Array.from({ length: size }, () => Array(size).fill(""))
  );
  const [activeCell, setActiveCell] = useState<[number, number] | null>(null);
  const [activeDirection, setActiveDirection] = useState<"across" | "down">(
    "across"
  );
  const [cellResults, setCellResults] = useState<
    ("correct" | "incorrect" | "black" | "empty")[][] | null
  >(null);
  const [solved, setSolved] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // Timer
  const [elapsedSec, setElapsedSec] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!solved) {
      timerRef.current = setInterval(() => {
        setElapsedSec((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [solved]);

  // Auto-select first cell
  useEffect(() => {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (template[r][c] === ".") {
          setActiveCell([r, c]);
          return;
        }
      }
    }
  }, [template, size]);

  // Get the active clue number
  const activeClueNumber = useMemo(() => {
    if (!activeCell) return null;
    const [ar, ac] = activeCell;
    for (const slot of slots) {
      if (slot.direction !== activeDirection) continue;
      if (slot.cells.some(([r, c]) => r === ar && c === ac)) {
        return slot.number;
      }
    }
    return null;
  }, [activeCell, activeDirection, slots]);

  // Find the current active slot
  const getActiveSlot = useCallback((): GridSlot | null => {
    if (!activeCell) return null;
    const [ar, ac] = activeCell;
    for (const slot of slots) {
      if (slot.direction !== activeDirection) continue;
      if (slot.cells.some(([r, c]) => r === ar && c === ac)) {
        return slot;
      }
    }
    return null;
  }, [activeCell, activeDirection, slots]);

  const handleCellChange = useCallback(
    (row: number, col: number, value: string) => {
      setValues((prev) => {
        const next = prev.map((r) => [...r]);
        next[row][col] = value;
        return next;
      });
      // Clear results when user types
      if (cellResults) setCellResults(null);
    },
    [cellResults]
  );

  const handleCellFocus = useCallback(
    (row: number, col: number) => {
      setActiveCell([row, col]);
    },
    []
  );

  const handleDirectionToggle = useCallback(() => {
    setActiveDirection((d) => (d === "across" ? "down" : "across"));
  }, []);

  const handleAdvance = useCallback(() => {
    const slot = getActiveSlot();
    if (!slot || !activeCell) return;
    const [ar, ac] = activeCell;
    const idx = slot.cells.findIndex(([r, c]) => r === ar && c === ac);
    if (idx < slot.cells.length - 1) {
      setActiveCell(slot.cells[idx + 1]);
    }
  }, [activeCell, getActiveSlot]);

  const handleRetreat = useCallback(() => {
    const slot = getActiveSlot();
    if (!slot || !activeCell) return;
    const [ar, ac] = activeCell;
    const idx = slot.cells.findIndex(([r, c]) => r === ar && c === ac);
    if (idx > 0) {
      setActiveCell(slot.cells[idx - 1]);
    }
  }, [activeCell, getActiveSlot]);

  const handleMoveDirection = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      if (!activeCell) return;
      const [r, c] = activeCell;
      const moves: Record<string, [number, number]> = {
        up: [-1, 0],
        down: [1, 0],
        left: [0, -1],
        right: [0, 1],
      };
      const [dr, dc] = moves[direction];
      let nr = r + dr;
      let nc = c + dc;

      // Skip black cells
      while (
        nr >= 0 &&
        nr < size &&
        nc >= 0 &&
        nc < size &&
        template[nr][nc] === "#"
      ) {
        nr += dr;
        nc += dc;
      }

      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        setActiveCell([nr, nc]);
        // Switch direction to match movement
        if (direction === "left" || direction === "right") {
          setActiveDirection("across");
        } else {
          setActiveDirection("down");
        }
      }
    },
    [activeCell, size, template]
  );

  const handleNextWord = useCallback(() => {
    const currentSlot = getActiveSlot();
    if (!currentSlot) return;

    // Find the next slot in the same direction, or wrap to other direction
    const sameDir = slots.filter((s) => s.direction === activeDirection);
    const idx = sameDir.findIndex((s) => s.number === currentSlot.number);
    let nextSlot: GridSlot;

    if (idx < sameDir.length - 1) {
      nextSlot = sameDir[idx + 1];
    } else {
      // Wrap to other direction
      const otherDir = activeDirection === "across" ? "down" : "across";
      const otherSlots = slots.filter((s) => s.direction === otherDir);
      nextSlot = otherSlots[0] || sameDir[0];
      setActiveDirection(otherDir);
    }

    if (nextSlot) {
      setActiveCell(nextSlot.cells[0]);
    }
  }, [activeDirection, getActiveSlot, slots]);

  const handleClueClick = useCallback(
    (number: number, direction: "across" | "down") => {
      const slot = slots.find(
        (s) => s.number === number && s.direction === direction
      );
      if (slot) {
        setActiveDirection(direction);
        setActiveCell(slot.cells[0]);
      }
    },
    [slots]
  );

  const handleCheck = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch(`/api/puzzles/${puzzle.id}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: values,
          solveTimeSec: elapsedSec,
        }),
      });
      const data: CheckAnswersResponse = await res.json();
      setCellResults(data.cellResults);

      if (data.solved) {
        setSolved(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    } catch {
      // silently fail
    } finally {
      setChecking(false);
    }
  }, [puzzle.id, values, elapsedSec]);

  // Check if all cells are filled
  const allFilled = useMemo(() => {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (template[r][c] === "." && !values[r][c]) return false;
      }
    }
    return true;
  }, [values, template, size]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (solved) {
    return (
      <>
        <CompletionScreen
          puzzle={puzzle}
          time={elapsedSec}
          onShare={() => setShowShare(true)}
          onNewPuzzle={() => (window.location.href = "/")}
        />
        <ShareDialog
          open={showShare}
          onOpenChange={setShowShare}
          puzzle={puzzle}
          time={elapsedSec}
          cellResults={cellResults}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <h1 className="font-serif text-2xl tracking-tight text-crossy-ink">
            Crossy
          </h1>
          <Badge
            variant="secondary"
            className="font-sans text-xs bg-crossy-gold/15 text-crossy-gold border-crossy-gold/30"
          >
            {puzzle.topic}
          </Badge>
        </div>
        <div className="font-mono text-lg tabular-nums text-crossy-ink/60">
          {formatTime(elapsedSec)}
        </div>
      </div>

      {/* Grid */}
      <CrosswordGrid
        size={size}
        template={template}
        values={values}
        cellResults={cellResults}
        activeCell={activeCell}
        activeDirection={activeDirection}
        clueNumbers={clueNumbers}
        slots={slots}
        disabled={solved}
        onCellChange={handleCellChange}
        onCellFocus={handleCellFocus}
        onDirectionToggle={handleDirectionToggle}
        onAdvance={handleAdvance}
        onRetreat={handleRetreat}
        onMoveDirection={handleMoveDirection}
        onNextWord={handleNextWord}
      />

      {/* Active clue display */}
      {activeClueNumber && (
        <div className="w-full px-2 py-2 bg-crossy-active/50 rounded-md">
          <p className="font-sans text-sm text-crossy-ink/80 text-center">
            <span className="font-bold">
              {activeClueNumber}
              {activeDirection === "across" ? "A" : "D"}
            </span>{" "}
            {(activeDirection === "across" ? cluesAcross : cluesDown).find(
              (c) => c.number === activeClueNumber
            )?.clue ?? ""}
          </p>
        </div>
      )}

      {/* Check button */}
      <Button
        onClick={handleCheck}
        disabled={!allFilled || checking}
        className="w-full max-w-xs bg-crossy-ink text-crossy-cream hover:bg-crossy-ink/90 font-sans font-semibold tracking-wide"
        size="lg"
      >
        {checking ? "Checking..." : "Check Puzzle"}
      </Button>

      {/* Clue lists */}
      <ClueList
        acrossClues={cluesAcross}
        downClues={cluesDown}
        activeClueNumber={activeClueNumber}
        activeDirection={activeDirection}
        onClueClick={handleClueClick}
      />
    </div>
  );
}
