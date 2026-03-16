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
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { t } = await searchParams;

  const result = await db
    .select()
    .from(puzzles)
    .where(eq(puzzles.id, id))
    .limit(1);

  if (result.length === 0) {
    return { title: "Puzzle Not Found | Crossy" };
  }

  const p = result[0];
  const timeParam = t ? `?t=${t}` : "";
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const description = t
    ? `I solved the ${p.topic} crossword in ${formatTime(parseInt(t, 10))}. Can you beat my time?`
    : `Play a mini crossword about ${p.topic}. Can you solve it?`;

  const ogImageUrl = `https://crossygame.app/puzzle/${id}/opengraph-image${timeParam}`;

  return {
    title: `${p.topic} Crossword | Crossy`,
    description,
    openGraph: {
      title: t
        ? `Can you beat ${formatTime(parseInt(t, 10))}?`
        : `${p.topic} Crossword | Crossy`,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t
        ? `Can you beat ${formatTime(parseInt(t, 10))}?`
        : `${p.topic} Crossword | Crossy`,
      description,
      images: [ogImageUrl],
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
