// Shared types for API requests/responses

export interface GeneratePuzzleRequest {
  topic: string;
  difficulty?: "easy" | "medium" | "hard";
  tone?: "standard" | "witty" | "trivia" | "kids";
}

export interface PuzzleClue {
  number: number;
  clue: string;
  length: number;
}

export interface PuzzleResponse {
  id: string;
  topic: string;
  difficulty: string;
  tone: string;
  size: number;
  template: string[][]; // "." or "#"
  cluesAcross: PuzzleClue[];
  cluesDown: PuzzleClue[];
  wordCount: number;
  createdAt?: string;
  playCount?: number;
}

export interface CheckAnswersRequest {
  answers: string[][];
  solveTimeSec?: number;
}

export interface CheckAnswersResponse {
  solved: boolean;
  correct: number;
  total: number;
  errors: number;
  cellResults: ("correct" | "incorrect" | "black" | "empty")[][];
  solution?: string[][];
  rank?: number | null;
  totalSolvers?: number;
}

export interface LeaderboardEntry {
  rank: number;
  solveTimeSec: number;
  isYou?: boolean;
}

export interface RecentPuzzle {
  id: string;
  topic: string;
  difficulty: string;
  playCount: number;
  solveCount: number;
  bestTime: number | null;
  createdAt: string;
}
