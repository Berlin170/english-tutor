import { Output, streamText } from "ai";
import {
  DEFAULT_STORY_MODEL,
  MAX_STORY_TOKENS,
  storyAuthError,
  storyModel,
} from "@/lib/gonka";
import { storySchema } from "@/lib/schemas";
import { LEVELS, type Level } from "@/lib/tutor";

export const maxDuration = 300;

/**
 * Generates one graded reading passage.
 *
 * This is the only route that does NOT use Claude - see `lib/gonka.ts` for
 * why. It is also the only route with no conversation history: every request
 * is a fresh story, so there is nothing to stream back turn by turn.
 *
 * It still asks Gonka to stream, even though the learner gets one finished
 * object. Gonka's endpoint drops any request that has sent no bytes for 150
 * seconds, and a full story - passage, glossary and five questions - takes
 * longer than that to generate in one blocking call, so the non-streaming
 * version always died with IDLE_TIMEOUT. Streaming keeps tokens trickling
 * over the wire, which keeps that timer from ever firing.
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
- Every question must be answerable from the story alone.

LENGTHS - count these before you answer, they are not suggestions:
- "paragraphs" must hold 5 to 8 separate strings. One string is one paragraph of 2 to 4 sentences. Never return the whole story as a single string.
- "glossary" must hold 6 to 10 words, in the order they appear in the story.
- "questions" must hold exactly 5 questions, each with exactly 3 options.
- Every "why" is a complete Roman Urdu sentence of at least four words, explaining why that option is right. Never answer with one word.`;

  try {
    const result = streamText({
      model: storyModel(DEFAULT_STORY_MODEL),
      system,
      prompt: `Write a story about: ${topic}`,
      maxOutputTokens: MAX_STORY_TOKENS,
      output: Output.object({ schema: storySchema }),
    });

    // Awaiting the parsed output drains the stream to the end, which is what
    // keeps Gonka's idle timer quiet. The learner still receives one finished
    // story rather than a half-written one.
    return Response.json(await result.output);
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
