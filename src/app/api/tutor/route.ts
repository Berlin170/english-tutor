import { generateText, Output, type ModelMessage } from "ai";
import { gatewayAuthError } from "@/lib/gateway";
import { turnSchema } from "@/lib/schemas";
import {
  MODEL,
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

export async function POST(req: Request) {
  const authError = gatewayAuthError();
  if (authError) return Response.json({ error: authError }, { status: 500 });

  const body = (await req.json()) as Body;

  const system = `${buildSystemPrompt({
    level: body.level,
    explainLang: body.explainLang,
    scenarioId: body.scenarioId,
    learnerName: body.learnerName,
  })}

YOU ARE ON A LIVE VOICE CALL. The "reply" field is converted to speech and played to the learner, so it must sound like real speech: no lists, no markdown, no emoji, no stage directions.
Put all corrections in the other fields - never read the corrections out loud unless the learner asks for them.
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
      maxOutputTokens: 900,
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
