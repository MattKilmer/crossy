import { describe, it, expect } from "vitest";
import { extractJSON } from "./parse-json";

// Test the clueContainsAnswer logic inline (function is not exported, so test the pattern)
function clueContainsAnswer(clue: string, answer: string): boolean {
  const upper = clue.toUpperCase();
  const ans = answer.toUpperCase();
  const regex = new RegExp(
    `\\b${ans.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`
  );
  return regex.test(upper);
}

describe("clueContainsAnswer", () => {
  it("detects whole word match", () => {
    expect(clueContainsAnswer("A bop in jazz", "BOP")).toBe(true);
    expect(clueContainsAnswer("The dog ran", "DOG")).toBe(true);
    expect(clueContainsAnswer("CAT in the hat", "CAT")).toBe(true);
  });

  it("allows answer as substring of longer word", () => {
    expect(clueContainsAnswer("Bebop jazz style", "BOP")).toBe(false);
    expect(clueContainsAnswer("A catalog of items", "CAT")).toBe(false);
    expect(clueContainsAnswer("Undogmatic approach", "DOG")).toBe(false);
  });

  it("handles edge cases", () => {
    expect(clueContainsAnswer("", "BOP")).toBe(false);
    expect(clueContainsAnswer("Some clue", "")).toBe(true); // empty word matches boundary
    expect(clueContainsAnswer("BOP", "BOP")).toBe(true);
  });
});

describe("extractJSON", () => {
  it("parses clean JSON", () => {
    const result = extractJSON<{ foo: number }>('{"foo": 42}');
    expect(result.foo).toBe(42);
  });

  it("strips markdown code fences", () => {
    const result = extractJSON<{ x: number }>("```json\n{\"x\": 1}\n```");
    expect(result.x).toBe(1);
  });

  it("handles JSON with surrounding text", () => {
    const result = extractJSON<{ a: string }>(
      'Here is the result:\n{"a": "hello"}\nDone.'
    );
    expect(result.a).toBe("hello");
  });

  it("handles arrays", () => {
    const result = extractJSON<number[]>("[1, 2, 3]");
    expect(result).toEqual([1, 2, 3]);
  });

  it("throws on no JSON", () => {
    expect(() => extractJSON("no json here")).toThrow("No JSON found");
  });
});
