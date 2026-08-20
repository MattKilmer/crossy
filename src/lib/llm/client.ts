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

// Rolling aliases, not dated snapshots — snapshots get retired and 404.
// Opus for clue generation (quality-critical)
export const CLUE_MODEL = "claude-opus-4-8";
// Sonnet for candidate generation (speed-critical)
export const CANDIDATE_MODEL = "claude-sonnet-4-6";
