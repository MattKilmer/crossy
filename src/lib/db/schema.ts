import {
  pgTable,
  varchar,
  integer,
  timestamp,
  boolean,
  jsonb,
  real,
  serial,
  index,
} from "drizzle-orm/pg-core";

export const puzzles = pgTable(
  "puzzles",
  {
    id: varchar("id", { length: 12 }).primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),

    // Generation params
    topic: varchar("topic", { length: 100 }).notNull(),
    difficulty: varchar("difficulty", { length: 20 }).notNull(),
    tone: varchar("tone", { length: 30 }).notNull(),
    size: integer("size").default(5).notNull(),

    // Grid data
    templateId: varchar("template_id", { length: 20 }).notNull(),
    grid: jsonb("grid").notNull(), // string[][] - solved grid
    cluesAcross: jsonb("clues_across").notNull(), // ClueData[]
    cluesDown: jsonb("clues_down").notNull(), // ClueData[]

    // Metadata
    wordCount: integer("word_count").notNull(),
    generationTimeMs: integer("generation_time_ms"),

    // Stats
    playCount: integer("play_count").default(0).notNull(),
    solveCount: integer("solve_count").default(0).notNull(),
    avgSolveTimeSec: real("avg_solve_time_sec"),
  },
  (table) => [
    index("idx_puzzles_topic").on(table.topic),
    index("idx_puzzles_created_at").on(table.createdAt),
  ]
);

export const puzzleAttempts = pgTable(
  "puzzle_attempts",
  {
    id: serial("id").primaryKey(),
    puzzleId: varchar("puzzle_id", { length: 12 })
      .notNull()
      .references(() => puzzles.id),
    completedAt: timestamp("completed_at").defaultNow().notNull(),
    solveTimeSec: integer("solve_time_sec"),
    solved: boolean("solved").default(false).notNull(),
    errorCount: integer("error_count").default(0),
    sessionId: varchar("session_id", { length: 50 }),
  },
  (table) => [
    index("idx_attempts_puzzle_id").on(table.puzzleId),
    index("idx_attempts_solved").on(table.puzzleId, table.solved),
  ]
);

export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
  sessionId: varchar("session_id", { length: 50 }),
});
