# Crossy — AI Mini Crossword Generator

## What is this?
Consumer-facing web app that generates playable 5x5 mini crosswords on any topic using AI. Classical constraint solver for grid fill, Claude API for candidate words and clue writing. Goal: Wordle-style viral sharing loop.

Live: https://crossygame.app
Repo: https://github.com/MattKilmer/crossy
Admin: https://crossygame.app/admin

## Tech Stack
- Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui
- Neon Postgres via Drizzle ORM
- Claude API: Opus for clues, Sonnet for candidate generation
- Deployed on Vercel (Matt Kilmer's personal account, scope `matt-kilmers-projects-e07ccc14`)
- Domain: crossygame.app

## Project Structure
```
src/
├── app/
│   ├── page.tsx                         # Landing page with PuzzleForm
│   ├── layout.tsx                       # Root layout (DM Serif + IBM Plex Sans fonts)
│   ├── globals.css                      # Tailwind + Crossy theme (cream/ink/gold palette)
│   ├── admin/page.tsx                   # Admin dashboard (stats, subscribers, answer keys)
│   ├── puzzle/[id]/
│   │   ├── page.tsx                     # Puzzle player page (SSR, fetches from DB)
│   │   └── opengraph-image/route.tsx    # Dynamic OG image (edge runtime)
│   └── api/
│       ├── puzzles/
│       │   ├── generate/route.ts        # POST: generate puzzle (LLM + solver pipeline)
│       │   ├── recent/route.ts          # GET: last 10 puzzles
│       │   └── [id]/
│       │       ├── route.ts             # GET: fetch puzzle (no solution)
│       │       ├── check/route.ts       # POST: validate answers, returns rank
│       │       └── leaderboard/route.ts # GET: top 10 solve times
│       ├── subscribe/route.ts           # POST: email capture
│       └── admin/subscribers/route.ts   # GET: subscriber list + CSV export
├── components/
│   ├── crossword-grid.tsx       # Interactive 5x5 grid (keyboard nav, mobile input)
│   ├── puzzle-player.tsx        # Orchestrator (state, timer, auto-check, localStorage save)
│   ├── clue-list.tsx            # Across/Down clue display with active highlighting
│   ├── puzzle-form.tsx          # Landing page form (topic, difficulty, tone)
│   ├── completion-screen.tsx    # Victory screen (confetti, rank, email capture)
│   ├── share-dialog.tsx         # Share URL + emoji grid + native share
│   ├── leaderboard.tsx          # Per-puzzle top 10 fastest solves
│   ├── recent-puzzles.tsx       # Recent puzzles feed (hidden from homepage currently)
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── solver/
│   │   ├── types.ts             # Slot, Intersection, PuzzleSolution, SolverConfig
│   │   ├── templates.ts         # 6 curated 5x5 templates (cross4 → corner2)
│   │   ├── extract.ts           # Slot extraction + intersection mapping from template
│   │   ├── cross-index.ts       # (length, position, letter) → word[] lookup
│   │   ├── solver.ts            # Backtracking + MRV + AC-3 constraint propagation
│   │   └── score.ts             # Fill quality scoring
│   ├── llm/
│   │   ├── client.ts            # Anthropic SDK (Opus=clues, Sonnet=candidates)
│   │   ├── candidates.ts        # Generate topic words via Claude
│   │   ├── clues.ts             # Generate clues via Claude (with fallback)
│   │   └── parse-json.ts        # Safe JSON extraction from LLM output
│   ├── words/
│   │   └── bank.ts              # Load/query static 50k word bank from words.json
│   ├── db/
│   │   ├── schema.ts            # Drizzle: puzzles, puzzle_attempts, subscribers
│   │   └── index.ts             # Lazy Neon connection (won't fail at build time)
│   ├── types/index.ts           # Shared request/response types
│   └── utils.ts                 # cn(), nanoid, rate limiter, sanitizeTopic
├── data/
│   └── words.json               # 51k scored words (ENABLE list, 3-7 letters)
scripts/
├── build-wordbank.ts            # Process ENABLE list → words.json
├── test-solver.ts               # Unit test: solver with small word bank
└── test-solver-full.ts          # Unit test: solver with full 50k bank
```

## Key Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run db:push` — Push Drizzle schema to Neon
- `npm run db:studio` — Open Drizzle Studio
- `npm run build:words` — Rebuild word bank from ENABLE list
- `vercel --prod --scope matt-kilmers-projects-e07ccc14` — Manual production deploy

## Environment Variables
- `DATABASE_URL` — Neon Postgres connection string (in .env.local and Vercel)
- `ANTHROPIC_API_KEY` — Claude API key (in .env.local and Vercel)

## Database Schema (3 tables)
- **puzzles**: id, topic, difficulty, tone, size, templateId, grid (JSONB solution), cluesAcross, cluesDown, wordCount, generationTimeMs, playCount, solveCount
- **puzzle_attempts**: id, puzzleId (FK), solveTimeSec, solved, errorCount, sessionId, completedAt
- **subscribers**: id, email (unique), subscribedAt, sessionId

## Puzzle Generation Pipeline
1. User submits topic + difficulty + tone
2. Templates sorted by difficulty (easiest first for retry fallback)
3. Claude Sonnet generates ~25 topic-specific candidate words per required length
4. Candidates merged with base word bank (topic words first, then by score)
5. Backtracking solver fills grid with cross-indexed constraint propagation
6. If solver fails, retries with next (easier) template
7. Claude Opus generates clues for all filled words
8. Clue validation: word-boundary check (not substring) for answer-in-clue
9. Fallback clue ("N-letter word") if any clue is missing/invalid
10. Puzzle persisted to Neon, returned to client WITHOUT solution

## Solver Design
- 6 templates: cross4 (easiest, 4 corner blacks) → corner2 (hardest, 2 blacks)
- MRV heuristic + degree tiebreaking for slot selection
- Cross-index: `Map<length, Map<position, Map<letter, Set<word>>>>` for O(1) constraint checks
- Domains filtered after each assignment (AC-3-style propagation)
- Shuffle within score tiers (groups of 5) for variety using seeded PRNG
- 15k backtrack limit, 8s timeout
- All 6 templates verified passing with full word bank (<200ms each)

## Frontend Features
- **Auto-save**: Puzzle progress saved to localStorage on every keystroke, restored on return (24h expiry)
- **Auto-check**: When all cells filled, automatically validates via API — no "Check" button
- **Wrong answer**: Toast "Not quite right" + inline message, no per-cell feedback
- **Correct answer**: Victory screen with speed-based emoji celebration, rank badge, confetti
- **Keyboard nav**: Arrow keys, backspace, tab (next word), space (toggle direction), letter auto-advance
- **Mobile**: inputMode="text" for virtual keyboard, fontSize=16px to prevent iOS zoom, autoCapitalize=characters
- **Logo link**: Clickable, shows confirmation modal mid-game ("progress is saved")
- **beforeunload**: Browser warning on tab close during active puzzle
- **Leaderboard**: Per-puzzle top 10 fastest solves, anonymous session tracking via localStorage
- **Share**: URL with `?t=<seconds>` for competitive challenge, dynamic OG image with "Can you beat X:XX?"
- **Email capture**: On completion screen, stores to DB subscribers table

## Design System
- Aesthetic: "Editorial Ink" — newspaper crossword feel
- Fonts: DM Serif Display (headings), IBM Plex Sans (body)
- Colors: crossy-ink (#1a1a1a), crossy-cream (#faf8f3), crossy-gold (#c9a84c), crossy-active (#dbeafe)
- Paper texture background via SVG noise filter

## Known Limitations / Future Work
- No user accounts (anonymous sessionId only)
- No 7x7 or 15x15 puzzles yet (5x5 only)
- No difficulty-adaptive template selection
- Recent puzzles feed built but hidden from homepage (component exists at recent-puzzles.tsx)
- Email capture stores to DB but no email sending service connected
- Vercel function timeout may be 10s on Hobby plan (generation takes ~12-16s) — may need Pro plan
- Admin page has no authentication
- Fill quality depends heavily on word bank — some obscure words make it through
