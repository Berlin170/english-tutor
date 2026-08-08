"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { QUIZ } from "@/lib/tenses";
import { addSession } from "@/lib/progress";

/** Fisher-Yates. Only ever called from a click handler, so SSR stays stable. */
function shuffled(n: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export default function TenseQuiz() {
  // Identity order on the first pass so the server and client render the same
  // markup; "Try again" reshuffles.
  const [order, setOrder] = useState(() =>
    Array.from({ length: QUIZ.length }, (_, i) => i),
  );
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  // Set after mount: reading Date.now() during render is impure.
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const question = QUIZ[order[step]];
  const score = QUIZ.length - wrongIds.length;

  const choose = (index: number) => {
    if (picked !== null) return;
    setPicked(index);
    if (index !== question.correct) {
      setWrongIds((prev) => [...prev, question.id]);
    }
  };

  const next = () => {
    if (step + 1 < QUIZ.length) {
      setStep(step + 1);
      setPicked(null);
      return;
    }

    const correctCount = QUIZ.length - wrongIds.length;
    addSession({
      kind: "quiz",
      scenarioId: "grammar-drill",
      seconds: Math.round((Date.now() - startedAt.current) / 1000),
      turns: QUIZ.length,
      averageScore: Math.round((correctCount / QUIZ.length) * 100),
    });
    setDone(true);
  };

  const restart = useCallback(() => {
    setOrder(shuffled(QUIZ.length));
    setStep(0);
    setPicked(null);
    setWrongIds([]);
    setDone(false);
    startedAt.current = Date.now();
  }, []);

  /* ------------------------------- result ------------------------------- */

  if (done) {
    const percent = Math.round((score / QUIZ.length) * 100);
    const missed = QUIZ.filter((q) => wrongIds.includes(q.id));

    return (
      <div className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
        <h2 className="text-xl font-bold">Your result</h2>
        <p className="mt-3 text-4xl font-bold text-accent">
          {score}/{QUIZ.length}
        </p>
        <p className="mt-1 text-sm text-muted">
          {percent >= 90
            ? "Zabardast! Aap ke tenses bohat behtar ho gaye hain."
            : percent >= 70
              ? "Achha kaam! Bas thori si practice aur chahiye."
              : percent >= 50
                ? "Theek hai - upar wale rules dobara parho aur phir try karo."
                : "Koi baat nahin. Upar 5 golden rules aaram se parho, phir dobara test do."}
        </p>

        {missed.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Yeh dobara dekh lo
            </h3>
            <ul className="mt-2 space-y-3">
              {missed.map((q) => (
                <li
                  key={q.id}
                  className="rounded-lg border border-card-border bg-background p-3 text-sm"
                >
                  <p className="font-medium">{q.prompt}</p>
                  <p className="mt-1 text-good">
                    <span aria-hidden>✅</span> {q.options[q.correct]}
                  </p>
                  <p className="mt-1 text-xs text-muted">{q.why}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={restart}
            className="rounded-xl bg-accent px-5 py-3 font-semibold text-white transition-transform hover:scale-[1.02]"
          >
            🔁 Try again
          </button>
          <Link
            href="/call"
            className="rounded-xl border border-card-border bg-card px-5 py-3 font-semibold transition-colors hover:border-accent"
          >
            🎙️ Practise on a call
          </Link>
        </div>
      </div>
    );
  }

  /* ------------------------------ question ------------------------------ */

  const answered = picked !== null;
  const isRight = picked === question.correct;

  return (
    <div className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Test yourself</h2>
        <span className="text-sm font-medium text-muted">
          {step + 1} / {QUIZ.length}
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-accent-soft">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${((step + (answered ? 1 : 0)) / QUIZ.length) * 100}%` }}
        />
      </div>

      <p className="mt-5 text-lg font-semibold">{question.prompt}</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {question.options.map((option, i) => {
          const correctOne = i === question.correct;
          const chosen = i === picked;

          let tone = "border-card-border bg-background hover:border-accent";
          if (answered && correctOne) {
            tone = "border-good bg-good/10 text-good";
          } else if (answered && chosen) {
            tone = "border-bad bg-bad/10 text-bad";
          } else if (answered) {
            tone = "border-card-border bg-background opacity-60";
          }

          return (
            <button
              key={option}
              type="button"
              disabled={answered}
              onClick={() => choose(i)}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors disabled:cursor-default ${tone}`}
            >
              {answered && correctOne && <span aria-hidden>✅ </span>}
              {answered && chosen && !correctOne && <span aria-hidden>❌ </span>}
              {option}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-4 rounded-xl border border-card-border bg-background p-3">
          <p className={`text-sm font-semibold ${isRight ? "text-good" : "text-bad"}`}>
            {isRight ? "Bilkul sahih!" : "Sahih jawab hai: " + question.options[question.correct]}
          </p>
          <p className="mt-1 text-sm text-muted">{question.why}</p>
          <button
            type="button"
            onClick={next}
            className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
          >
            {step + 1 < QUIZ.length ? "Next question →" : "See my result →"}
          </button>
        </div>
      )}
    </div>
  );
}
