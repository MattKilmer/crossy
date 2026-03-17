/**
 * Safely extract JSON from LLM text output.
 * Handles markdown code fences, extra whitespace, etc.
 */
export function extractJSON<T = unknown>(text: string): T {
  // Strip markdown code fences
  let cleaned = text.trim();

  // Remove ```json ... ``` wrapping
  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Try to find JSON object or array boundaries
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");

  if (firstBrace === -1 && firstBracket === -1) {
    throw new Error("No JSON found in response");
  }

  // Determine if it starts with { or [
  let start: number;
  if (firstBrace === -1) {
    start = firstBracket;
  } else if (firstBracket === -1) {
    start = firstBrace;
  } else {
    start = Math.min(firstBrace, firstBracket);
  }

  // Find the matching closing brace/bracket
  let depth = 0;
  let end = -1;
  for (let i = start; i < cleaned.length; i++) {
    const c = cleaned[i];
    if (c === "{" || c === "[") depth++;
    if (c === "}" || c === "]") {
      depth--;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }

  if (end === -1) {
    throw new Error("Unmatched JSON brackets in response");
  }

  const jsonStr = cleaned.slice(start, end);
  return JSON.parse(jsonStr) as T;
}
