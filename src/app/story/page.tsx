"use client";

import { useMemo, useState } from "react";
import { addSession } from "@/lib/progress";
import type { Story } from "@/lib/schemas";
import { LEVELS } from "@/lib/tutor";
import { useTutorVoice } from "@/lib/useSpeech";
import { useSettings } from "@/lib/useSettings";

const TOPICS = [
  { emoji: "🏏", label: "Cricket match" },
  { emoji: "🛍️", label: "A day at the bazaar" },
  { emoji: "💼", label: "First day at a new job" },
  { emoji: "🚌", label: "A long bus journey" },
  { emoji: "🍽️", label: "Family dinner" },
  { emoji: "🩺", label: "A visit to the doctor" },
  { emoji: "✈️", label: "Travelling abroad" },
  { emoji: "🌧️", label: "A rainy day in Lahore" },
  { emoji: "📱", label: "Buying a new phone" },
  { emoji: "🎓", label: "Exam day" },
];

export default function StoryPage() {
  const { settings, ready } = useSettings();
  const { speak, cancel, speaking } = useTutorVoice();

  const [topic, setTopic] = useState("");
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openWord, setOpenWord] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const levelHint = LEVELS.find((l) => l.id === settings.level)?.label;

  const write = async (chosen: string) => {
    if (loading) return;
    const value = chosen.trim();
    if (!value) return;

    cancel();
    setLoading(true);
    setError(null);
    setStory(null);
    setAnswers({});
    setOpenWord(null);

    try {
      const res = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: value,
          level: settings.level,
          learnerName: settings.learnerName || undefined,
        }),
      });
      const data = (await res.json()) as Story & { error?: string };

      if (!res.ok || data.error) {
        setError(data.error ?? "Could not write the story. Please try again.");
        return;
      }

      setStory(data);
      addSession({
        kind: "story",
        scenarioId: settings.scenarioId,
        seconds: 180,
        turns: 1,
        averageScore: 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network problem.");
    } finally {
      setLoading(false);
    }
  };

  const readAloud = () => {
    if (!story) return;
    if (speaking) {
      cancel();
      return;
    }
    speak(`${story.title}. ${story.paragraphs.join(" ")}`);
  };

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold">Story Reader</h1>
        <p className="text-sm text-muted">
          Kahani parh kar English seekho. Choose a topic and a new story is
          written for your level ({levelHint}). Har mushkil lafz par click karo -
          Urdu matlab aa jayega.
        </p>
      </section>

      {/* ----------------------------- topic pick ---------------------------- */}
      <section className="rounded-2xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Choose a topic
        </h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button
              key={t.label}
              type="button"
              disabled={loading}
              onClick={() => {
                setTopic(t.label);
                write(t.label);
              }}
              className="rounded-xl border border-card-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:border-accent disabled:opacity-50"
            >
              <span aria-hidden>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>

        <form
          className="mt-4 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            write(topic);
          }}
        >
          <input
            className="min-w-0 flex-1 rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="Ya apna topic likho, e.g. my village"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? "Writing..." : "Write my story"}
          </button>
        </form>
      </section>

      {loading && (
        <p className="text-sm text-muted">
          Kahani likhi ja rahi hai... thora intezaar karo (10-20 seconds).
        </p>
      )}

      {error && (
        <p className="rounded-xl border border-bad/40 bg-bad/10 p-4 text-sm text-bad">
          {error}
        </p>
      )}

      {story && (
        <>
          {/* ------------------------------ story ---------------------------- */}
          <article className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-xl font-bold">{story.title}</h2>
              <button
                type="button"
                onClick={readAloud}
                className="rounded-lg border border-card-border px-3 py-1.5 text-sm font-semibold transition-colors hover:border-accent"
              >
                {speaking ? "⏹ Stop" : "🔊 Listen"}
              </button>
            </div>

            <div className="mt-4 space-y-3 text-[1.05rem] leading-relaxed">
              {story.paragraphs.map((p, i) => (
                <Paragraph
                  key={i}
                  text={p}
                  glossary={story.glossary}
                  openWord={openWord}
                  onWord={(w) => setOpenWord((prev) => (prev === w ? null : w))}
                />
              ))}
            </div>

            <p className="mt-4 text-xs text-muted">
              Neeche lakeer wale lafzon par click karo - unka matlab khul jayega.
            </p>
          </article>

          {/* ---------------------------- glossary --------------------------- */}
          <section className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-bold">New words</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {story.glossary.map((g) => (
                <li
                  key={g.word}
                  className={`rounded-xl border p-3 text-sm transition-colors ${
                    openWord?.toLowerCase() === g.word.toLowerCase()
                      ? "border-accent bg-accent-soft"
                      : "border-card-border bg-background"
                  }`}
                >
                  <p className="font-semibold">{g.word}</p>
                  <p className="text-accent">{g.meaning}</p>
                  <p className="mt-1 text-xs text-muted">{g.example}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* -------------------------- grammar note ------------------------- */}
          <section className="rounded-2xl border border-card-border bg-gradient-to-br from-accent-soft to-card p-5 sm:p-6">
            <h2 className="text-lg font-bold">Grammar in this story</h2>
            <p className="mt-2 whitespace-pre-line text-sm">{story.grammarNote}</p>
          </section>

          {/* --------------------------- questions --------------------------- */}
          <section className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-bold">Did you understand?</h2>
            <ol className="mt-4 space-y-5">
              {story.questions.map((q, qi) => {
                const picked = answers[qi];
                const answered = picked !== undefined;

                return (
                  <li key={qi}>
                    <p className="font-medium">
                      {qi + 1}. {q.question}
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      {q.options.map((option, oi) => {
                        const isCorrect = oi === q.correct;
                        let tone =
                          "border-card-border bg-background hover:border-accent";
                        if (answered && isCorrect) {
                          tone = "border-good bg-good/10 text-good";
                        } else if (answered && oi === picked) {
                          tone = "border-bad bg-bad/10 text-bad";
                        } else if (answered) {
                          tone = "border-card-border bg-background opacity-60";
                        }

                        return (
                          <button
                            key={oi}
                            type="button"
                            disabled={answered}
                            onClick={() =>
                              setAnswers((prev) => ({ ...prev, [qi]: oi }))
                            }
                            className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-default ${tone}`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                    {answered && (
                      <p className="mt-2 text-xs text-muted">{q.why}</p>
                    )}
                  </li>
                );
              })}
            </ol>

            <button
              type="button"
              onClick={() => write(topic || "everyday life")}
              disabled={loading}
              className="mt-6 rounded-xl bg-accent px-5 py-3 font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-50"
            >
              📖 Another story
            </button>
          </section>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Renders one paragraph with every glossary word turned into a button.
 * Splitting on the words themselves (rather than tokenising the whole text)
 * keeps punctuation and spacing exactly as written.
 */
function Paragraph({
  text,
  glossary,
  openWord,
  onWord,
}: {
  text: string;
  glossary: Story["glossary"];
  openWord: string | null;
  onWord: (word: string) => void;
}) {
  const parts = useMemo(() => {
    const words = glossary
      .map((g) => g.word)
      .filter(Boolean)
      // Longest first so "bus stop" wins over "bus".
      .sort((a, b) => b.length - a.length)
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

    if (words.length === 0) return [text];
    return text.split(new RegExp(`(${words.join("|")})`, "gi"));
  }, [text, glossary]);

  const lookup = (value: string) =>
    glossary.find((g) => g.word.toLowerCase() === value.toLowerCase());

  return (
    <p>
      {parts.map((part, i) => {
        const entry = lookup(part);
        if (!entry) return <span key={i}>{part}</span>;

        const open = openWord?.toLowerCase() === entry.word.toLowerCase();
        return (
          <span key={i} className="relative">
            <button
              type="button"
              onClick={() => onWord(entry.word)}
              className={`underline decoration-accent decoration-dotted underline-offset-4 transition-colors ${
                open ? "bg-accent-soft text-accent" : "hover:text-accent"
              }`}
            >
              {part}
            </button>
            {open && (
              <span className="ml-1 rounded-md bg-accent-soft px-1.5 py-0.5 text-sm font-medium text-accent">
                {entry.meaning}
              </span>
            )}
          </span>
        );
      })}
    </p>
  );
}
