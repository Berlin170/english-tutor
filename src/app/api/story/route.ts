import { generateText, Output } from "ai";
import {
  DEFAULT_STORY_MODEL,
  MAX_STORY_TOKENS,
  storyAuthError,
  storyModel,
} from "@/lib/gonka";
import { storySchema } from "@/lib/schemas";
import { LEVELS, type Level } from "@/lib/tutor";

export const maxDuration = 60;

/**
 * Generates one graded reading passage.
 *
 * This is the only route that does NOT use Claude - see `lib/gonka.ts` for
 * why. It is also the only route with no conversation history: every request
 * is a fresh story, so there is nothing to stream back turn by turn.
 */

type Body = {
  topic: string;
  level: Level;
  learnerName?: string;
};

/** Reading difficulty per level, kept separate from the tutor's speaking levels. */
const LEVEL_RULES: Record<Level, string> = {
  beginner: `Use only the 1000 most common English words. Sentences must be under 10 words. Use present simple and past simple only.`,
  intermediate: `Use everyday vocabulary and sentences up to 15 words. You may use present perfect, past continuous and future forms.`,
  advanced: `Use natural, varied vocabulary including some idioms and phrasal verbs. Any tense is fine. Sentences may be longer.`,
};

export async function POST(req: Request) {
  const authError = storyAuthError();
  if (authError) return Response.json({ error: authError }, { status: 500 });

  const body = (await req.json()) as Body;
  const level: Level = LEVELS.some((l) => l.id === body.level)
    ? body.level
    : "beginner";

  const topic = body.topic?.trim().slice(0, 120) || "everyday life";

  const system = `You write short English reading passages for an adult learner from Pakistan whose first language is Urdu${
    body.learnerName ? `, named ${body.learnerName}` : ""
  }.

${LEVEL_RULES[level]}

RULES:
- The story must be about the topic the learner chose, and set somewhere a Pakistani reader will recognise (a Lahore bazaar, an office in Karachi, a family dinner, a bus to Islamabad).
- Tell a real little story with a beginning, a small problem, and an ending. Never write a lecture or a list of facts.
- Glossary meanings and grammar notes are written in Roman Urdu (Urdu in English letters, e.g. "khareedna"). The story itself and the questions stay in pure English.
- Never use Urdu script. Never use emoji or markdown.
- Every glossary word must actually appear in the story.
- Every question must be answerable from the story alone.`;

  try {
    const result = await generateText({
      model: storyModel(DEFAULT_STORY_MODEL),
      system,
      prompt: `Write a story about: ${topic}`,
      maxOutputTokens: MAX_STORY_TOKENS,
      output: Output.object({ schema: storySchema }),
    });

    return Response.json(result.output);
  } catch (err) {
    console.error("[/api/story]", err);
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not write the story. Please try again.",
      },
      { status: 500 },
    );
  }
}
