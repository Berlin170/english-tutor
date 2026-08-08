"use client";

import { useState } from "react";
import SettingsBar from "@/components/SettingsBar";
import { addMistakes, addSession } from "@/lib/progress";
import type { GrammarReport } from "@/lib/schemas";
import { useListening, useTutorVoice } from "@/lib/useSpeech";
import { useSettings } from "@/lib/useSettings";

const SAMPLES = [
  "I am working in this company since two years. Yesterday my boss give me a new project and I am very exciting about it.",
  "Respected sir, I want to inform you that I am not able to come office tomorrow because I have a fever.",
  "Me and my friend was going to the market when we seen a accident on the road.",
];

export default function GrammarPage() {
  const { settings, update, ready } = useSettings();
  const { speak } = useTutorVoice();

  const [text, setText] = useState("");
  const [report, setReport] = useState<GrammarReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dictating, setDictating] = useState(false);
  const [copied, setCopied] = useState(false);

  const dictation = useListening({
    enabled: dictating,
    onUtterance: (spoken) =>
      setText((prev) => (prev ? `${prev} ${spoken}` : spoken).trim()),
    pauseMs: 1800,
  });

  const check = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const res = await fetch("/api/grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          explainLang: settings.explainLang,
          level: settings.level,
        }),
      });
      const data = (await res.json()) as GrammarReport & { error?: string };

      if (!res.ok || data.error) {
        setError(data.error ?? "Could not check the text. Please try again.");
        return;
      }

      setReport(data);
      addSession({
        kind: "grammar",
        scenarioId: settings.scenarioId,
        seconds: 60,
        turns: 1,
        averageScore: Math.round(data.score),
      });
      if (data.issues.length) {
        addMistakes(
          data.issues.slice(0, 10).map((i) => ({
            wrong: i.wrong,
            right: i.right,
            why: i.why,
            source: "grammar" as const,
          })),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network problem.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!ready) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Grammar Check</h1>
          <p className="text-sm text-muted">
            Paste an email, a WhatsApp message or a paragraph. Sara will correct
            it and explain every mistake.
          </p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Write or paste your English here…"
            className="w-full resize-y rounded-xl border border-card-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
          />

          {dictating && (
            <p className="mt-2 text-xs text-good">
              🎤 Listening… {dictation.interim}
            </p>
          )}
          {dictation.error && (
            <p className="mt-2 text-xs text-bad">{dictation.error}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={check}
              disabled={!text.trim() || loading}
              className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            >
              {loading ? "Checking…" : "✍️ Check my English"}
            </button>
            <button
              onClick={() => setDictating((d) => !d)}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                dictating
                  ? "border-good bg-good/10"
                  : "border-card-border hover:border-accent"
              }`}
            >
              {dictating ? "🎤 Stop dictation" : "🎤 Speak it instead"}
            </button>
            {text && (
              <button
                onClick={() => {
                  setText("");
                  setReport(null);
                }}
                className="rounded-xl border border-card-border px-4 py-2.5 text-sm text-muted hover:border-accent"
              >
                Clear
              </button>
            )}
            <span className="ml-auto text-xs text-muted">
              {text.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
        </div>

        {!report && !loading && (
          <div className="rounded-2xl border border-card-border bg-card p-4">
            <p className="mb-2 text-sm font-semibold">Try an example:</p>
            <div className="space-y-2">
              {SAMPLES.map((s) => (
                <button
                  key={s}
                  onClick={() => setText(s)}
                  className="block w-full rounded-xl border border-card-border px-3 py-2 text-left text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-bad/40 bg-bad/10 p-4 text-sm">
            {error}
          </p>
        )}

        {report && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-card-border bg-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-bold">Score</h2>
                <span className="text-2xl font-bold text-accent">
                  {Math.round(report.score)}/100
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-accent-soft">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, report.score))}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-muted">{report.summary}</p>
            </div>

            <ResultBlock
              title="✅ Corrected"
              body={report.corrected}
              onCopy={copy}
              onSpeak={speak}
              copied={copied}
            />
            <ResultBlock
              title="🌟 More natural version"
              body={report.natural}
              onCopy={copy}
              onSpeak={speak}
              copied={copied}
            />

            <div className="rounded-2xl border border-card-border bg-card p-5">
              <h2 className="mb-3 font-bold">
                Mistakes ({report.issues.length})
              </h2>
              {report.issues.length === 0 ? (
                <p className="text-sm text-good">
                  🎉 No mistakes found. Bohat khoob!
                </p>
              ) : (
                <ul className="space-y-3">
                  {report.issues.map((issue, i) => (
                    <li
                      key={i}
                      className="rounded-xl border border-card-border p-3 text-sm"
                    >
                      <span className="mb-1 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
                        {issue.category}
                      </span>
                      <p>
                        <span className="text-bad line-through">
                          {issue.wrong}
                        </span>{" "}
                        <span aria-hidden>→</span>{" "}
                        <span className="font-semibold text-good">
                          {issue.right}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-muted">{issue.why}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {report.vocab.length > 0 && (
              <div className="rounded-2xl border border-card-border bg-card p-5">
                <h2 className="mb-3 font-bold">📖 Better words to learn</h2>
                <ul className="space-y-3">
                  {report.vocab.map((v, i) => (
                    <li key={i} className="text-sm">
                      <b className="text-accent">{v.word}</b> — {v.meaning}
                      <span className="mt-0.5 block text-xs italic text-muted">
                        &ldquo;{v.example}&rdquo;
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-card-border bg-card p-5">
          <h2 className="mb-3 font-bold">Settings</h2>
          <SettingsBar settings={settings} update={update} showScenario={false} />
        </div>
        <div className="rounded-2xl border border-card-border bg-card p-5 text-sm text-muted">
          <h2 className="mb-2 font-bold text-foreground">Good to know</h2>
          <ul className="list-disc space-y-1 pl-4">
            <li>Longer text gives better feedback than one word.</li>
            <li>Every mistake is saved to your Progress page.</li>
            <li>Read the corrected version out loud with 🔊.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function ResultBlock({
  title,
  body,
  onCopy,
  onSpeak,
  copied,
}: {
  title: string;
  body: string;
  onCopy: (v: string) => void;
  onSpeak: (v: string) => void;
  copied: boolean;
}) {
  if (!body) return null;
  return (
    <div className="rounded-2xl border border-card-border bg-card p-5">
      <h2 className="mb-2 font-bold">{title}</h2>
      <p className="whitespace-pre-wrap text-sm">{body}</p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onCopy(body)}
          className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium hover:border-accent"
        >
          {copied ? "Copied!" : "📋 Copy"}
        </button>
        <button
          onClick={() => onSpeak(body)}
          className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium hover:border-accent"
        >
          🔊 Listen
        </button>
      </div>
    </div>
  );
}
