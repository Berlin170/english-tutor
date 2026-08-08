import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { MAX_TURN_TOKENS, MODEL, modelAuthError } from "@/lib/model";
import {
  buildSystemPrompt,
  type ExplainLang,
  type Level,
} from "@/lib/tutor";

export const maxDuration = 60;

/**
 * Streaming text chat with the tutor. Corrections come back inside the
 * streamed markdown here (unlike /api/tutor, which needs them split out for
 * text-to-speech).
 */
export async function POST(req: Request) {
  const authError = modelAuthError();
  if (authError) return new Response(authError, { status: 500 });

  const {
    messages,
    level,
    explainLang,
    scenarioId,
    learnerName,
  }: {
    messages: UIMessage[];
    level: Level;
    explainLang: ExplainLang;
    scenarioId: string;
    learnerName?: string;
  } = await req.json();

  const system = `${buildSystemPrompt({
    level,
    explainLang,
    scenarioId,
    learnerName,
  })}

REPLY FORMAT - follow it exactly every time:

**✅ Correction:** the learner's sentence rewritten correctly. If it was already correct, write "Perfect! No mistakes." instead.
**💡 Why:** one or two short lines explaining the fix. Skip this line if there were no mistakes.
**🌟 Say it better:** a more natural way to say the same thing. Skip this line if their sentence was already natural.

Then a blank line, then your conversational reply as the character in the scenario, ending with a question.

Keep the whole message short - a learner should be able to read it in under 20 seconds.`;

  const result = streamText({
    model: MODEL,
    system,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: MAX_TURN_TOKENS,
  });

  return result.toUIMessageStreamResponse();
}
