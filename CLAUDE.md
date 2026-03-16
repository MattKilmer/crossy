# Crossy — AI Mini Crossword Generator

## What is this?
Consumer-facing web app that generates playable 5x5 mini crosswords on any topic using AI. Classical constraint solver for grid fill, Claude API for candidate words and clue writing.

## Tech Stack
- Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui
- Neon Postgres via Drizzle ORM (puzzle persistence only)
- Claude API: Opus for clues, Sonnet for candidate generation
- Deployed on Vercel

## Architecture
- `src/lib/solver/` — Backtracking CSP solver with cross-indexed constraint propagation
- `src/lib/llm/` — Claude API integration (candidates + clues)
- `src/lib/words/` — Static 50k word bank loaded from `src/data/words.json`
- `src/lib/db/` — Drizzle schema + lazy Neon connection
- `src/components/` — CrosswordGrid, PuzzlePlayer, PuzzleForm, ClueList, etc.

## Key Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run db:push` — Push Drizzle schema to Neon
- `npm run db:studio` — Open Drizzle Studio
- `npm run build:words` — Rebuild word bank from ENABLE list

## Environment Variables
- `DATABASE_URL` — Neon Postgres connection string
- `ANTHROPIC_API_KEY` — Claude API key

## Puzzle Generation Flow
1. User submits topic + difficulty + tone
2. Template selected (6 curated 5x5 templates, ordered by difficulty)
3. Claude Sonnet generates topic-specific candidate words
4. Candidates merged with base word bank (50k words)
5. Backtracking solver fills grid with constraint propagation
6. Claude Opus generates clues for the filled grid
7. Puzzle persisted to Neon, returned to client without answers

## Solver Notes
- Uses MRV heuristic + degree tiebreaking for slot selection
- Cross-index: `(length, position, letter) → word[]` for O(1) constraint checks
- Domains filtered after each assignment (AC-3-style propagation)
- Auto-retries with easier templates if solver fails
- 15k backtrack limit, 8s timeout
