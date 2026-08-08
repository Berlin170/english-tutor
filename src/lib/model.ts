import { anthropic } from "@ai-sdk/anthropic";

/**
 * Server-only model configuration. Kept out of `tutor.ts` so client components
 * can import the scenario/level lists without pulling the provider SDK into the
 * browser bundle.
 *
 * Claude Haiku 4.5 is the cheapest and fastest model in the family
 * ($1 / $5 per million tokens), and it runs without a thinking step — which is
 * what keeps the reply latency low enough for a live voice call.
 */
export const MODEL = anthropic("claude-haiku-4-5");

/** Max output tokens per reply. Haiku 4.5 allows up to 64K; the tutor never
 *  needs more than a short spoken turn plus its corrections. */
export const MAX_TURN_TOKENS = 900;
export const MAX_REPORT_TOKENS = 2000;

export function modelAuthError(): string | null {
  if (process.env.ANTHROPIC_API_KEY) return null;

  return "ANTHROPIC_API_KEY is not set. Put your Claude API key in .env.local and restart the dev server.";
}
