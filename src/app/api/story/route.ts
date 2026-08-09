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
- "paragraphs" must hold exactly 5 separate strings. One string is one paragraph of 2 to 3 sentences. Never return the whole story as a single string.
- "glossary" must hold exactly 6 words, in the order they appear in the story. It is never empty. Even in the simplest story, pick the 6 words a beginner is most likely to pause on and explain those - an easy word explained is still useful.
- "questions" must hold exactly 5 questions, each with exactly 3 options.
- Every "why" is one short Roman Urdu sentence, four to twelve words, explaining why that option is right. Never answer with one word.
- "grammarNote" is never empty, and is at most three short lines. Name the tense the story uses and quote one sentence from the story as the example.`;

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

    // Gonka sometimes finishes the request having sent no content at all -
    // its own headers show the model queueing behind other work. The SDK
    // reports that as a parse failure, which is true but means nothing to a
    // learner, so it becomes a plain "try again" instead.
    const emptyReply =
      err instanceof Error && err.name === "AI_NoObjectGeneratedError";

    return Response.json(
      {
        error: emptyReply
          ? "Story writer was busy and sent nothing back. Please press the button again - it usually works the second time."
          : err instanceof Error
            ? err.message
            : "Could not write the story. Please try again.",
      },
      { status: 500 },
    );
  }
}
