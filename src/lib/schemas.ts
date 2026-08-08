import { z } from "zod";

/**
 * Response shapes shared by the API routes and the client components.
 * Kept out of the route files so client components can import the types
 * without pulling a server module into the graph.
 */

export const turnSchema = z.object({
  reply: z
    .string()
    .describe(
      "What the tutor says out loud, in natural spoken English. Under 60 words. Must end with a question. No markdown, no emoji, no bullet points - this text is read aloud.",
    ),
  hadMistakes: z
    .boolean()
    .describe("True if the learner's message contained real English mistakes."),
  correctedSentence: z
    .string()
    .describe(
      "The learner's message rewritten correctly. Empty string if there was nothing to fix.",
    ),
  betterVersion: z
    .string()
    .describe(
      "A more natural or fluent way a native speaker would say the same thing. Empty string if the learner's sentence was already natural.",
    ),
  mistakes: z
    .array(
      z.object({
        wrong: z.string().describe("The exact wrong words the learner used."),
        right: z.string().describe("The corrected words."),
        why: z
          .string()
          .describe("A one-sentence explanation in the requested language."),
      }),
    )
    .describe("At most 3 mistakes, most important first. Empty if none."),
  usefulPhrase: z
    .string()
    .describe(
      "One short English phrase the learner could use next time in this situation. Empty string if not needed.",
    ),
  score: z
    .number()
    .describe("Score from 0 to 100 for this single message's English quality."),
});

export type TutorTurn = z.infer<typeof turnSchema>;

export const grammarSchema = z.object({
  corrected: z
    .string()
    .describe(
      "The learner's text with every mistake fixed, nothing else changed.",
    ),
  natural: z
    .string()
    .describe(
      "The same meaning rewritten the way a fluent native speaker would write it.",
    ),
  score: z.number().describe("Overall English quality from 0 to 100."),
  summary: z
    .string()
    .describe(
      "Two encouraging sentences: what the learner did well, and the single most important thing to work on.",
    ),
  issues: z
    .array(
      z.object({
        category: z
          .enum([
            "tense",
            "articles",
            "prepositions",
            "subject-verb agreement",
            "word order",
            "plural/singular",
            "spelling",
            "word choice",
            "punctuation",
            "other",
          ])
          .describe("The grammar category of this mistake."),
        wrong: z.string().describe("The exact text that was wrong."),
        right: z.string().describe("The corrected text."),
        why: z
          .string()
          .describe("A short explanation in the requested language."),
      }),
    )
    .describe("Every mistake found, most important first. Empty if none."),
  vocab: z
    .array(
      z.object({
        word: z.string().describe("A better or more advanced word/phrase."),
        meaning: z.string().describe("Its meaning in the requested language."),
        example: z.string().describe("A short English example sentence."),
      }),
    )
    .describe("Up to 3 vocabulary upgrades that fit this text. Empty if none."),
});

export type GrammarReport = z.infer<typeof grammarSchema>;
