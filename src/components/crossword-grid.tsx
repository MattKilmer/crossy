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
  // Single hidden input for keyboard capture — positioned off-screen
  // so iOS never shows paste/autofill on grid cells (which are plain divs)
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);

  // Focus the hidden input when active cell changes
  useEffect(() => {
    if (activeCell && !disabled) {
      hiddenInputRef.current?.focus();
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
    (e: React.KeyboardEvent) => {
      if (disabled || !activeCell) return;
      const [row, col] = activeCell;

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
          if (!e.shiftKey) {
            onNextWord();
          }
          break;
        case " ":
          e.preventDefault();
          onDirectionToggle();
          break;
        default:
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
      activeCell,
      values,
      onCellChange,
      onAdvance,
      onRetreat,
      onMoveDirection,
      onDirectionToggle,
      onNextWord,
    ]
  );

  // Handle mobile IME input on the hidden input
  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      if (disabled || !activeCell) return;
      const [row, col] = activeCell;
      const target = e.target as HTMLInputElement;
      const value = target.value;
      if (value && /[a-zA-Z]/.test(value)) {
        const letter = value.slice(-1).toUpperCase();
        onCellChange(row, col, letter);
        onAdvance();
      }
      target.value = "";
    },
    [disabled, activeCell, onCellChange, onAdvance]
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

      // Focus hidden input to capture keyboard
      hiddenInputRef.current?.focus();
    },
    [disabled, template, activeCell, onCellFocus, onDirectionToggle]
  );

  const getCellBg = (row: number, col: number): string => {
    if (template[row][col] === "#") return "bg-crossy-ink";

    if (cellResults) {
      const result = cellResults[row]?.[col];
      if (result === "correct") return "bg-crossy-correct";
      if (result === "incorrect") return "bg-crossy-incorrect";
    }

    if (activeCell && activeCell[0] === row && activeCell[1] === col) {
      return "bg-crossy-focus/20";
    }

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
    <div className="relative inline-block">
      {/* Hidden off-screen input for keyboard capture */}
      {!disabled && (
        <input
          ref={hiddenInputRef}
          className="crossword-cell-input"
          style={{
            position: "absolute",
            left: "-9999px",
            top: "-9999px",
            width: "1px",
            height: "1px",
            opacity: 0,
            fontSize: "16px",
          }}
          type="text"
          inputMode="text"
          enterKeyHint="next"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          aria-hidden="true"
          tabIndex={-1}
        />
      )}

      {/* Grid */}
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
