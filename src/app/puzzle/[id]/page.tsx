import { notFound } from "next/navigation";
import { PuzzlePlayer } from "@/components/puzzle-player";
import { db } from "@/lib/db";
import { puzzles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { PuzzleResponse, PuzzleClue } from "@/lib/types";
import type { ClueData } from "@/lib/solver/types";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  const result = await db
    .select()
    .from(puzzles)
    .where(eq(puzzles.id, id))
    .limit(1);

  if (result.length === 0) {
    return { title: "Puzzle Not Found | Crossy" };
  }

  const p = result[0];
  return {
    title: `${p.topic} Crossword | Crossy`,
    description: `Play a mini crossword about ${p.topic}. ${p.difficulty} difficulty.`,
    openGraph: {
      title: `${p.topic} Crossword | Crossy`,
      description: `Play a mini crossword about ${p.topic}. Can you solve it?`,
    },
  };
}

export default async function PuzzlePage({ params }: PageProps) {
  const { id } = await params;

  const result = await db
    .select()
    .from(puzzles)
    .where(eq(puzzles.id, id))
    .limit(1);

  if (result.length === 0) {
    notFound();
  }

  const p = result[0];

  // Build template (mask without solution letters)
  const template = (p.grid as string[][]).map((row) =>
    row.map((c) => (c === "#" ? "#" : "."))
  );

  const cluesAcross: PuzzleClue[] = (p.cluesAcross as ClueData[]).map(
    ({ number, clue, length }) => ({ number, clue, length })
  );
  const cluesDown: PuzzleClue[] = (p.cluesDown as ClueData[]).map(
    ({ number, clue, length }) => ({ number, clue, length })
  );

  const puzzle: PuzzleResponse = {
    id: p.id,
    topic: p.topic,
    difficulty: p.difficulty,
    tone: p.tone,
    size: p.size,
    template,
    cluesAcross,
    cluesDown,
    wordCount: p.wordCount,
    createdAt: p.createdAt.toISOString(),
    playCount: p.playCount,
  };

  return (
    <main className="min-h-screen paper-texture py-4">
      <PuzzlePlayer puzzle={puzzle} />
    </main>
  );
}
