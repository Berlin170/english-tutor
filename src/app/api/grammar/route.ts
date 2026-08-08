import { generateText, Output } from "ai";
import { grammarSchema } from "@/lib/schemas";
import { MODEL, type ExplainLang, type Level } from "@/lib/tutor";

export const maxDuration = 60;

const LANG_RULE: Record<ExplainLang, string> = {
  english: "Write every explanation in simple English.",
  "roman-urdu":
    "Write the 'why' and 'meaning' fields in Roman Urdu (Urdu in English letters). Keep 'corrected', 'natural' and 'example' in English.",
  urdu: "Write the 'why' and 'meaning' fields in Urdu script (اردو). Keep 'corrected', 'natural' and 'example' in English.",
};

export async function POST(req: Request) {
  if (!process.env.AI_GATEWAY_API_KEY) {
    return Response.json(
      {
        error:
          "AI_GATEWAY_API_KEY is not set. Add it to .env.local and restart the dev server.",
      },
      { status: 500 },
    );
  }

  const {
    text,
    explainLang,
    level,
  }: { text: string; explainLang: ExplainLang; level: Level } =
    await req.json();

  if (!text?.trim()) {
    return Response.json({ error: "Nothing to check." }, { status: 400 });
  }

  try {
    const result = await generateText({
      model: MODEL,
      system: `You are an English teacher checking work from an adult Pakistani learner at ${level} level.
${LANG_RULE[explainLang]}
Be accurate but encouraging. Do not invent mistakes that are not there - if the text is already correct, return an empty issues list and say so warmly.`,
      prompt: `Check this text:\n\n"""\n${text.slice(0, 6000)}\n"""`,
      maxOutputTokens: 2000,
      output: Output.object({ schema: grammarSchema }),
    });

    return Response.json(result.output);
  } catch (err) {
    console.error("[/api/grammar]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Grammar check failed." },
      { status: 500 },
    );
  }
}
