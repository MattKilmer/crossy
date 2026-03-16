"use client";

import { useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface GridSlot {
  direction: "across" | "down";
  cells: [number, number][];
  number: number;
}

export interface CrosswordGridProps {
  size: number;
  template: string[][];
  values: string[][];
  cellResults?: ("correct" | "incorrect" | "black" | "empty")[][] | null;
  activeCell: [number, number] | null;
  activeDirection: "across" | "down";
  clueNumbers: Map<string, number>;
  slots: GridSlot[];
  disabled?: boolean;
  onCellChange: (row: number, col: number, value: string) => void;
  onCellFocus: (row: number, col: number) => void;
  onDirectionToggle: () => void;
  onAdvance: () => void;
  onRetreat: () => void;
  onMoveDirection: (direction: "up" | "down" | "left" | "right") => void;
  onNextWord: () => void;
}

export function CrosswordGrid({
  size,
  template,
  values,
  cellResults,
  activeCell,
  activeDirection,
  clueNumbers,
  slots,
  disabled = false,
  onCellChange,
  onCellFocus,
  onDirectionToggle,
  onAdvance,
  onRetreat,
  onMoveDirection,
  onNextWord,
}: CrosswordGridProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[][]>(
    Array.from({ length: size }, () => Array(size).fill(null))
  );

  // Focus the active cell's input when it changes
  useEffect(() => {
    if (activeCell && !disabled) {
      const [r, c] = activeCell;
      inputRefs.current[r]?.[c]?.focus();
    }
  }, [activeCell, disabled]);

  // Get the cells belonging to the active word
  const getActiveWordCells = useCallback((): Set<string> => {
    if (!activeCell) return new Set();
    const [ar, ac] = activeCell;

    for (const slot of slots) {
      if (slot.direction !== activeDirection) continue;
      const inSlot = slot.cells.some(([r, c]) => r === ar && c === ac);
      if (inSlot) {
        return new Set(slot.cells.map(([r, c]) => `${r},${c}`));
      }
    }
    return new Set();
  }, [activeCell, activeDirection, slots]);

  const activeWordCells = getActiveWordCells();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, row: number, col: number) => {
      if (disabled) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          onMoveDirection("up");
          break;
        case "ArrowDown":
          e.preventDefault();
          onMoveDirection("down");
          break;
        case "ArrowLeft":
          e.preventDefault();
          onMoveDirection("left");
          break;
        case "ArrowRight":
          e.preventDefault();
          onMoveDirection("right");
          break;
        case "Backspace":
          e.preventDefault();
          if (values[row][col]) {
            onCellChange(row, col, "");
          } else {
            onRetreat();
          }
          break;
        case "Delete":
          e.preventDefault();
          onCellChange(row, col, "");
          break;
        case "Tab":
          e.preventDefault();
          if (e.shiftKey) {
            // Could implement previous word
          } else {
            onNextWord();
          }
          break;
        case " ":
          e.preventDefault();
          onDirectionToggle();
          break;
        default:
          // Letter input
          if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
            e.preventDefault();
            onCellChange(row, col, e.key.toUpperCase());
            onAdvance();
          }
          break;
      }
    },
    [
      disabled,
      values,
      onCellChange,
      onAdvance,
      onRetreat,
      onMoveDirection,
      onDirectionToggle,
      onNextWord,
    ]
  );

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (disabled) return;
      if (template[row][col] === "#") return;

      if (activeCell && activeCell[0] === row && activeCell[1] === col) {
        onDirectionToggle();
      } else {
        onCellFocus(row, col);
      }
    },
    [disabled, template, activeCell, onCellFocus, onDirectionToggle]
  );

  // Handle mobile input (IME, etc.)
  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>, row: number, col: number) => {
      if (disabled) return;
      const target = e.target as HTMLInputElement;
      const value = target.value;
      if (value && /[a-zA-Z]/.test(value)) {
        const letter = value.slice(-1).toUpperCase();
        onCellChange(row, col, letter);
        onAdvance();
      }
      // Always clear the input value — we manage display separately
      target.value = "";
    },
    [disabled, onCellChange, onAdvance]
  );

  const getCellBg = (row: number, col: number): string => {
    if (template[row][col] === "#") return "bg-crossy-ink";

    // Check results (after checking answers)
    if (cellResults) {
      const result = cellResults[row]?.[col];
      if (result === "correct") return "bg-crossy-correct";
      if (result === "incorrect") return "bg-crossy-incorrect";
    }

    // Active cell
    if (activeCell && activeCell[0] === row && activeCell[1] === col) {
      return "bg-crossy-focus/20";
    }

    // Active word highlight
    if (activeWordCells.has(`${row},${col}`)) {
      return "bg-crossy-active";
    }

    return "bg-crossy-cell";
  };

  const getCellBorder = (row: number, col: number): string => {
    if (activeCell && activeCell[0] === row && activeCell[1] === col) {
      return "ring-2 ring-crossy-focus ring-inset";
    }
    return "";
  };

  return (
    <div
      className="inline-grid select-none"
      style={{
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        gap: 0,
        width: `min(calc(100vw - 2rem), ${size * 64}px)`,
        height: `min(calc(100vw - 2rem), ${size * 64}px)`,
        border: "2.5px solid var(--color-crossy-ink)",
      }}
      role="grid"
      aria-label="Crossword puzzle grid"
    >
      {template.map((row, r) =>
        row.map((cell, c) => {
          const isBlack = cell === "#";
          const clueNum = clueNumbers.get(`${r},${c}`);
          const letter = values[r]?.[c] || "";

          return (
            <div
              key={`${r}-${c}`}
              className={cn(
                "relative flex items-center justify-center",
                "border-[1.5px] border-crossy-border/30",
                "transition-colors duration-100",
                getCellBg(r, c),
                getCellBorder(r, c),
                isBlack && "cursor-default",
                !isBlack && !disabled && "cursor-pointer"
              )}
              style={{ aspectRatio: "1" }}
              onClick={() => handleCellClick(r, c)}
              role="gridcell"
              aria-label={
                isBlack
                  ? "Black cell"
                  : `Row ${r + 1}, Column ${c + 1}${clueNum ? `, number ${clueNum}` : ""}`
              }
            >
              {/* Clue number */}
              {clueNum && !isBlack && (
                <span
                  className="absolute font-sans font-semibold text-crossy-ink/70 leading-none pointer-events-none select-none"
                  style={{
                    top: "2px",
                    left: "3px",
                    fontSize: "clamp(8px, 1.8vw, 11px)",
                  }}
                >
                  {clueNum}
                </span>
              )}

              {/* Letter display */}
              {!isBlack && letter && (
                <span
                  className="font-serif text-crossy-ink leading-none pointer-events-none select-none"
                  style={{
                    fontSize: "clamp(18px, 5.5vw, 32px)",
                    marginTop: "2px",
                  }}
                >
                  {letter}
                </span>
              )}

              {/* Hidden input for keyboard capture */}
              {!isBlack && !disabled && (
                <input
                  ref={(el) => {
                    inputRefs.current[r][c] = el;
                  }}
                  className="crossword-cell-input absolute inset-0 w-full h-full cursor-pointer text-transparent caret-transparent bg-transparent"
                  style={{ fontSize: "16px", WebkitTextFillColor: "transparent" }}
                  type="text"
                  inputMode="text"
                  enterKeyHint="next"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  maxLength={2}
                  tabIndex={isBlack ? -1 : 0}
                  onKeyDown={(e) => handleKeyDown(e, r, c)}
                  onInput={(e) => handleInput(e, r, c)}
                  onFocus={() => {
                    if (
                      !activeCell ||
                      activeCell[0] !== r ||
                      activeCell[1] !== c
                    ) {
                      onCellFocus(r, c);
                    }
                  }}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
