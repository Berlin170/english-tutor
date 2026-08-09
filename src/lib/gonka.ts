import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Gonka AI - a second, OpenAI-compatible provider used ONLY by the Story
 * Reader (/api/story). The tutor routes stay on Claude; nothing here touches
 * `model.ts`.
 *
 * Why a separate provider: a graded story plus its glossary and questions is a
 * few thousand output tokens per read, which is the one part of this app where
 * per-token price actually bites. The learner's Gonka balance is denominated in
 * hundreds of millions of tokens, so long-form generation is effectively free
 * there while the live call keeps Claude's latency and reliability.
 */

/**
 * Models the learner's Gonka dashboard lists as available.
 *
 * Kimi is the default despite being the slower "big" model: MiniMax-M2.7
 * ignores `response_format` and writes its reasoning into the message as
 * `<think>...` prose, which cannot be parsed as a story object. Kimi honours
 * the JSON schema and returns clean objects. Do not flip the default back
 * without re-testing /api/story end to end.
 */
export const STORY_MODELS = [
  {
    id: "moonshotai/Kimi-K2.6",
    label: "Kimi K2.6",
    hint: "Follows the story format reliably - the default",
  },
  {
    id: "MiniMaxAI/MiniMax-M2.7",
    label: "MiniMax M2.7",
    hint: "Faster, but its reasoning leaks into the output",
  },
] as const;

export const DEFAULT_STORY_MODEL = STORY_MODELS[0].id;

/**
 * Max output tokens for one story. Generous - the whole point of this provider.
 *
 * 4000 was not enough: Kimi spends a few hundred tokens thinking before it
 * writes, and the budget covers that as well as the story, so a full passage
 * with its glossary and five questions was being cut off mid-JSON and failing
 * to parse. Do not lower this below ~8000 without re-testing /api/story.
 */
export const MAX_STORY_TOKENS = 8000;

export function storyAuthError(): string | null {
  if (!process.env.GONKA_API_KEY) {
    return "GONKA_API_KEY is not set. Put your Gonka key in .env.local and restart the dev server.";
  }
  if (!process.env.GONKA_BASE_URL) {
    return "GONKA_BASE_URL is not set. Copy the BASE URL from your Gonka dashboard into .env.local.";
  }
  return null;
}

/**
 * Built per request rather than at module load: the env vars are only read
 * once the route has confirmed they exist, so a missing key returns a readable
 * message instead of throwing during the build.
 */
export function storyModel(modelId: string) {
  const gonka = createOpenAICompatible({
    name: "gonka",
    baseURL: process.env.GONKA_BASE_URL!,
    apiKey: process.env.GONKA_API_KEY!,
    // Gonka accepts OpenAI's `response_format: json_schema`, which is what
    // keeps the story object parseable. Off by default in this provider.
    supportsStructuredOutputs: true,
  });

  const known = STORY_MODELS.some((m) => m.id === modelId);
  return gonka.chatModel(known ? modelId : DEFAULT_STORY_MODEL);
}
