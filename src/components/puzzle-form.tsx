"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const TOPIC_SUGGESTIONS = [
  "Space Exploration",
  "90s Music",
  "Coffee Culture",
  "Startups",
  "Ocean Life",
  "Classic Movies",
  "World Cuisine",
  "Ancient History",
  "Video Games",
  "Jazz",
  "Gardening",
  "Hip Hop",
  "Dogs",
  "Shakespeare",
  "Basketball",
];

const DIFFICULTY_OPTIONS = [
  { value: "easy" as const, label: "Easy", desc: "Common words" },
  { value: "medium" as const, label: "Medium", desc: "Some challenge" },
  { value: "hard" as const, label: "Hard", desc: "Expert level" },
];

const TONE_OPTIONS = [
  { value: "standard" as const, label: "Classic" },
  { value: "witty" as const, label: "Witty" },
  { value: "trivia" as const, label: "Trivia" },
  { value: "kids" as const, label: "Kids" },
];

const LOADING_MESSAGES = [
  "Finding themed words...",
  "Building the grid...",
  "Fitting letters together...",
  "Writing clever clues...",
  "Almost there...",
];

export function PuzzleForm() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const [tone, setTone] = useState<"standard" | "witty" | "trivia" | "kids">(
    "standard"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  // Rotate placeholder suggestions
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % TOPIC_SUGGESTIONS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Rotate loading messages
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || loading) return;

    setLoading(true);
    setError(null);
    setLoadingMsgIdx(0);

    try {
      const res = await fetch("/api/puzzles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), difficulty, tone }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate puzzle");
      }

      const data = await res.json();
      router.push(`/puzzle/${data.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setTopic(suggestion);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
      {/* Topic input */}
      <div className="space-y-2">
        <label
          htmlFor="topic"
          className="font-sans text-sm font-medium text-crossy-ink/70"
        >
          What should the puzzle be about?
        </label>
        <Input
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={TOPIC_SUGGESTIONS[placeholderIdx]}
          className="h-12 text-lg font-sans bg-white border-crossy-ink/15 focus:border-crossy-gold focus:ring-crossy-gold/30 placeholder:text-crossy-ink/25"
          maxLength={100}
          disabled={loading}
          autoFocus
        />
        {/* Topic suggestions */}
        <div className="flex flex-wrap gap-1.5">
          {TOPIC_SUGGESTIONS.slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSuggestionClick(s)}
              className={cn(
                "font-sans text-xs px-2.5 py-1 rounded-full border transition-colors",
                topic === s
                  ? "bg-crossy-ink text-crossy-cream border-crossy-ink"
                  : "bg-transparent text-crossy-ink/50 border-crossy-ink/15 hover:border-crossy-ink/30 hover:text-crossy-ink/70"
              )}
              disabled={loading}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <label className="font-sans text-sm font-medium text-crossy-ink/70">
          Difficulty
        </label>
        <div className="grid grid-cols-3 gap-2">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDifficulty(opt.value)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 px-3 rounded-lg border transition-all font-sans",
                difficulty === opt.value
                  ? "bg-crossy-ink text-crossy-cream border-crossy-ink shadow-sm"
                  : "bg-white text-crossy-ink/60 border-crossy-ink/10 hover:border-crossy-ink/25"
              )}
              disabled={loading}
            >
              <span className="text-sm font-semibold">{opt.label}</span>
              <span
                className={cn(
                  "text-[10px]",
                  difficulty === opt.value
                    ? "text-crossy-cream/60"
                    : "text-crossy-ink/35"
                )}
              >
                {opt.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tone */}
      <div className="space-y-2">
        <label className="font-sans text-sm font-medium text-crossy-ink/70">
          Clue style
        </label>
        <div className="flex gap-2">
          {TONE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTone(opt.value)}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg border transition-all font-sans text-sm font-medium",
                tone === opt.value
                  ? "bg-crossy-ink text-crossy-cream border-crossy-ink"
                  : "bg-white text-crossy-ink/50 border-crossy-ink/10 hover:border-crossy-ink/25"
              )}
              disabled={loading}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="font-sans text-sm text-red-600 text-center bg-red-50 py-2 px-3 rounded-md">
          {error}
        </p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={!topic.trim() || loading}
        className="w-full h-12 bg-crossy-ink text-crossy-cream hover:bg-crossy-ink/90 font-sans font-semibold text-base tracking-wide disabled:opacity-40"
        size="lg"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-crossy-cream/30 border-t-crossy-cream rounded-full animate-spin" />
            {LOADING_MESSAGES[loadingMsgIdx]}
          </span>
        ) : (
          "Generate Puzzle"
        )}
      </Button>
    </form>
  );
}
