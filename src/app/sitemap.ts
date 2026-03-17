import { db } from "@/lib/db";
import { puzzles } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const allPuzzles = await db
    .select({ id: puzzles.id, createdAt: puzzles.createdAt })
    .from(puzzles)
    .orderBy(desc(puzzles.createdAt))
    .limit(500);

  const puzzleEntries: MetadataRoute.Sitemap = allPuzzles.map((p) => ({
    url: `https://crossygame.app/puzzle/${p.id}`,
    lastModified: p.createdAt,
    changeFrequency: "never",
    priority: 0.7,
  }));

  return [
    {
      url: "https://crossygame.app",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://crossygame.app/browse",
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
    ...puzzleEntries,
  ];
}
