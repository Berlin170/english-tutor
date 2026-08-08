import { generateText, Output, type ModelMessage } from "ai";
import { MAX_TURN_TOKENS, MODEL, modelAuthError } from "@/lib/model";
import { turnSchema } from "@/lib/schemas";
import {
  buildSystemPrompt,
  type ExplainLang,
  type Level,
} from "@/lib/tutor";

export const maxDuration = 60;

/**
 * One turn of the live voice call.
 *
 * The call UI needs the spoken reply and the written feedback as separate
 * fields (the reply goes to text-to-speech, the feedback goes on screen), so
 * this route returns a structured object instead of a text stream.
 */

type Body = {
  messages: { role: "user" | "assistant"; content: string }[];
  level: Level;
  explainLang: ExplainLang;
  scenarioId: string;
  learnerName?: string;
};

/**
 * How much correcting Sara does out loud, by level. Beginners learn from
 * hearing the right form said back to them; advanced learners lose the thread
 * of the conversation if every slip is spoken, so their corrections stay on
 * screen only.
 */
const SPOKEN_CORRECTION_RULE: Record<Level, string> = {
  beginner: `SPOKEN CORRECTIONS: if the learner made an important mistake, say the correct words out loud once, in under eight words, then carry straight on with the conversation. For example: "We say 'five years' - and what do you like there?" Correct at most one thing per turn, and say nothing about small slips.`,
  intermediate: `SPOKEN CORRECTIONS: only say a correction out loud when the mistake would confuse a listener or the learner repeats it often. Keep it to a few words, then continue the conversation. Otherwise say nothing about mistakes - the learner reads them on screen.`,
  advanced: `SPOKEN CORRECTIONS: never correct out loud. Keep the conversation natural and let the learner read their corrections on screen.`,
};

export async function POST(req: Request) {
  const authError = modelAuthError();
  if (authError) return Response.json({ error: authError }, { status: 500 });

  const body = (await req.json()) as Body;

  const system = `${buildSystemPrompt({
    level: body.level,
    explainLang: body.explainLang,
    scenarioId: body.scenarioId,
    learnerName: body.learnerName,
  })}

YOU ARE ON A LIVE VOICE CALL. The "reply" field is converted to speech and played to the learner, so it must sound like real speech: no lists, no markdown, no emoji, no stage directions.
${SPOKEN_CORRECTION_RULE[body.level] ?? SPOKEN_CORRECTION_RULE.beginner}
The full corrections always go in the other fields regardless - they are shown on screen.
If the learner has said nothing yet, greet them and start the scenario with an easy opening question.`;

  // Providers reject an empty message list, so the opening greeting is driven
  // by a synthetic prompt that never appears in the on-screen transcript.
  const messages: ModelMessage[] =
    body.messages.length === 0
      ? [
          {
            role: "user",
            content:
              "(The learner has just joined the call and has not spoken yet. Greet them warmly, say who you are, and start the scenario with one easy opening question.)",
          },
        ]
      : body.messages.map((m) => ({ role: m.role, content: m.content }));

  try {
    const result = await generateText({
      model: MODEL,
      system,
      messages,
      maxOutputTokens: MAX_TURN_TOKENS,
      output: Output.object({ schema: turnSchema }),
    });

    return Response.json(result.output);
  } catch (err) {
    console.error("[/api/tutor]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Tutor request failed." },
      { status: 500 },
    );
  }
}
