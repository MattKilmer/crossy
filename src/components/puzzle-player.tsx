"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { CrosswordGrid, type GridSlot } from "./crossword-grid";
import { ClueList } from "./clue-list";
import { CompletionScreen } from "./completion-screen";
import { ShareDialog } from "./share-dialog";
import { Leaderboard } from "./leaderboard";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { PuzzleResponse, CheckAnswersResponse } from "@/lib/types";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = localStorage.getItem("crossy_sid");
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem("crossy_sid", sid);
  }
  return sid;
}

const STORAGE_KEY_PREFIX = "crossy_progress_";

function saveProgress(puzzleId: string, values: string[][], elapsedSec: number) {
  try {
    localStorage.setItem(
      STORAGE_KEY_PREFIX + puzzleId,
      JSON.stringify({ values, elapsedSec, savedAt: Date.now() })
    );
  } catch {}
}

function loadProgress(
  puzzleId: string
): { values: string[][]; elapsedSec: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + puzzleId);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Expire after 24 hours
    if (Date.now() - data.savedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(STORAGE_KEY_PREFIX + puzzleId);
      return null;
    }
    return { values: data.values, elapsedSec: data.elapsedSec };
  } catch {
    return null;
  }
}

function clearProgress(puzzleId: string) {
  try {
    localStorage.removeItem(STORAGE_KEY_PREFIX + puzzleId);
  } catch {}
}

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

  // Restore saved progress or start fresh
  const savedProgress = useMemo(() => loadProgress(puzzle.id), [puzzle.id]);

  const [values, setValues] = useState<string[][]>(() =>
    savedProgress?.values ??
    Array.from({ length: size }, () => Array(size).fill(""))
  );
  const [activeCell, setActiveCell] = useState<[number, number] | null>(() => {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (template[r][c] === ".") return [r, c];
      }
    }
    return null;
  });
  const [activeDirection, setActiveDirection] = useState<"across" | "down">(
    "across"
  );
  const [solved, setSolved] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [incorrect, setIncorrect] = useState(false);
  const [rank, setRank] = useState<number | null>(null);
  const [totalSolvers, setTotalSolvers] = useState(0);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const checkingRef = useRef(false);
  const lastCheckedRef = useRef<string>("");
  const sessionId = useMemo(() => getSessionId(), []);

  // Timer (restore from saved progress)
  const [elapsedSec, setElapsedSec] = useState(savedProgress?.elapsedSec ?? 0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if puzzle has any progress
  const hasProgress = useMemo(() => {
    return values.some((row) => row.some((cell) => cell !== ""));
  }, [values]);

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

  // Auto-save progress on every change
  useEffect(() => {
    if (!solved && hasProgress) {
      saveProgress(puzzle.id, values, elapsedSec);
    }
  }, [values, elapsedSec, solved, hasProgress, puzzle.id]);

  // beforeunload warning when puzzle is in progress
  useEffect(() => {
    if (solved || !hasProgress) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [solved, hasProgress]);

  // (initial cell selection handled by useState initializer above)

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
      if (incorrect) setIncorrect(false);
    },
    [incorrect]
  );

  const handleCellFocus = useCallback((row: number, col: number) => {
    setActiveCell([row, col]);
  }, []);

  const handleDirectionToggle = useCallback(() => {
    setActiveDirection((d) => (d === "across" ? "down" : "across"));
  }, []);

  const handleAdvance = useCallback(() => {
    const slot = getActiveSlot();
    if (!slot || !activeCell) return;
    const [ar, ac] = activeCell;
    const idx = slot.cells.findIndex(([r, c]) => r === ar && c === ac);

    // Skip over already-filled cells to the next empty one
    for (let i = idx + 1; i < slot.cells.length; i++) {
      const [nr, nc] = slot.cells[i];
      if (!values[nr][nc]) {
        setActiveCell(slot.cells[i]);
        return;
      }
    }

    // If no empty cell ahead, just move to the next cell (or stay at end)
    if (idx < slot.cells.length - 1) {
      setActiveCell(slot.cells[idx + 1]);
    }
  }, [activeCell, getActiveSlot, values]);

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

      while (
        nr >= 0 && nr < size && nc >= 0 && nc < size &&
        template[nr][nc] === "#"
      ) {
        nr += dr;
        nc += dc;
      }

      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        setActiveCell([nr, nc]);
        // Don't auto-flip direction on arrow keys — keep current direction.
        // User must intentionally toggle by tapping the same cell twice.
      }
    },
    [activeCell, size, template]
  );

  const handleNextWord = useCallback(() => {
    const currentSlot = getActiveSlot();
    if (!currentSlot) return;

    const sameDir = slots.filter((s) => s.direction === activeDirection);
    const idx = sameDir.findIndex((s) => s.number === currentSlot.number);
    let nextSlot: GridSlot;

    if (idx < sameDir.length - 1) {
      nextSlot = sameDir[idx + 1];
    } else {
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

  // Auto-check when all cells are filled
  useEffect(() => {
    if (solved || checkingRef.current) return;

    let allFilled = true;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (template[r][c] === "." && !values[r][c]) {
          allFilled = false;
          break;
        }
      }
      if (!allFilled) break;
    }

    if (!allFilled) return;

    // Don't re-check the exact same grid (prevents repeated toasts)
    const valuesKey = values.flat().join("");
    if (valuesKey === lastCheckedRef.current) return;

    checkingRef.current = true;
    lastCheckedRef.current = valuesKey;

    fetch(`/api/puzzles/${puzzle.id}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: values,
        solveTimeSec: elapsedSec,
        sessionId,
      }),
    })
      .then((res) => res.json())
      .then((data: CheckAnswersResponse) => {
        if (data.solved) {
          setSolved(true);
          setRank(data.rank ?? null);
          setTotalSolvers(data.totalSolvers ?? 0);
          clearProgress(puzzle.id);
          if (timerRef.current) clearInterval(timerRef.current);
        } else {
          setIncorrect(true);
          toast.error("Not quite right \u2014 keep trying!");
        }
      })
      .catch(() => {})
      .finally(() => {
        checkingRef.current = false;
      });
  }, [values, solved, size, template, puzzle.id, elapsedSec, sessionId]);

  const handleLogoClick = useCallback(
    (e: React.MouseEvent) => {
      if (hasProgress && !solved) {
        e.preventDefault();
        setShowLeaveConfirm(true);
      }
    },
    [hasProgress, solved]
  );

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
          rank={rank}
          totalSolvers={totalSolvers}
          onShare={() => setShowShare(true)}
          onNewPuzzle={() => (window.location.href = "/")}
        />
        <ShareDialog
          open={showShare}
          onOpenChange={setShowShare}
          puzzle={puzzle}
          time={elapsedSec}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            onClick={handleLogoClick}
            className="font-serif text-2xl tracking-tight text-crossy-ink hover:text-crossy-gold transition-colors"
          >
            Crossy
          </Link>
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

      {/* Leave confirmation modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-crossy-cream rounded-xl p-6 max-w-xs mx-4 shadow-lg border border-crossy-ink/10">
            <h3 className="font-serif text-lg text-crossy-ink mb-2">
              Leave puzzle?
            </h3>
            <p className="font-sans text-sm text-crossy-ink/60 mb-5">
              Your progress is saved. You can come back to this puzzle anytime.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-crossy-ink/15 font-sans text-sm font-medium text-crossy-ink/70 hover:bg-crossy-ink/5 transition-colors"
              >
                Keep playing
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="flex-1 px-4 py-2 rounded-lg bg-crossy-ink text-crossy-cream font-sans text-sm font-medium hover:bg-crossy-ink/90 transition-colors"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <CrosswordGrid
        size={size}
        template={template}
        values={values}
        cellResults={null}
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

      {/* Incorrect message */}
      {incorrect && (
        <p className="font-sans text-sm text-crossy-ink/50 text-center animate-in fade-in">
          Something&apos;s not right &mdash; keep trying!
        </p>
      )}

      {/* Clue lists */}
      <ClueList
        acrossClues={cluesAcross}
        downClues={cluesDown}
        activeClueNumber={activeClueNumber}
        activeDirection={activeDirection}
        onClueClick={handleClueClick}
      />

      {/* Leaderboard */}
      <Leaderboard puzzleId={puzzle.id} sessionId={sessionId} />
    </div>
  );
}
