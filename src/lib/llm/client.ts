import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return client;
}

// Opus for clue generation (quality-critical)
export const CLUE_MODEL = "claude-opus-4-20250514";
// Sonnet for candidate generation (speed-critical)
export const CANDIDATE_MODEL = "claude-sonnet-4-20250514";
