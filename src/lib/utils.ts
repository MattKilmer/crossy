import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { customAlphabet } from "nanoid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate short, URL-safe puzzle IDs
const nanoid = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyz",
  10
);

export function generatePuzzleId(): string {
  return nanoid();
}

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 3600000 // 1 hour
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

// Sanitize topic input for use in LLM prompts
export function sanitizeTopic(topic: string): string {
  return topic
    .replace(/[^\w\s'-]/g, "") // keep letters, numbers, spaces, hyphens, apostrophes
    .trim()
    .slice(0, 100);
}
