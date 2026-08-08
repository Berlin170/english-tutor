"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SelfVideo from "@/components/SelfVideo";
import SettingsBar from "@/components/SettingsBar";
import { addMistakes, addSession } from "@/lib/progress";
import { getScenario } from "@/lib/tutor";
import type { TutorTurn } from "@/lib/schemas";
import {
  useListening,
  useMicLevel,
  useSpeechSupport,
  useTutorVoice,
} from "@/lib/useSpeech";
import { useSettings } from "@/lib/useSettings";

type Phase = "idle" | "thinking" | "speaking" | "listening";

type Turn = {
  id: string;
  role: "user" | "tutor";
  text: string;
  feedback?: TutorTurn;
};

export default function CallPage() {
  const { settings, update, ready } = useSettings();
  const support = useSpeechSupport();
  const voice = useTutorVoice();

  const [phase, setPhase] = useState<Phase>("idle");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [muted, setMuted] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [elapsed, setElapsed] = useState(0);

  // Pull the stable callbacks out: the hook returns a fresh object each render,
  // so depending on `voice` itself would restart the call on every render.
  const { speak: speakTutor, cancel: cancelSpeech } = voice;

  const inCall = phase !== "idle";
  const startedAtRef = useRef(0);
  const callIdRef = useRef(0);
  const turnsRef = useRef<Turn[]>([]);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // The mic callback and "end call" both need the newest transcript without
  // being rebuilt on every turn, so it is mirrored into a ref after each render.
  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  const micActive = phase === "listening" && !muted;
  // Hold one level-meter stream for the whole call instead of re-requesting the
  // microphone on every turn, which makes the browser mic indicator flicker.
  const micLevel = useMicLevel(inCall && !muted);

  /* --------------------------- one call turn ---------------------------- */

  const runTurn = useCallback(
    async (history: Turn[]) => {
      const callId = callIdRef.current;
      setPhase("thinking");
      setError(null);

      try {
        const res = await fetch("/api/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map((t) => ({
              role: t.role === "tutor" ? "assistant" : "user",
              content: t.text,
            })),
            level: settings.level,
            explainLang: settings.explainLang,
            scenarioId: settings.scenarioId,
            learnerName: settings.learnerName || undefined,
          }),
        });

        const data = (await res.json()) as TutorTurn & { error?: string };
        if (callId !== callIdRef.current) return;

        if (!res.ok || data.error) {
          setError(data.error ?? "Sara could not answer. Please try again.");
          setPhase("listening");
          return;
        }

        // Attach the feedback to the learner's message it belongs to.
        setTurns((prev) => {
          const next = [...prev];
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i].role === "user") {
              next[i] = { ...next[i], feedback: data };
              break;
            }
          }
          next.push({
            id: `t-${Date.now()}`,
            role: "tutor",
            text: data.reply,
          });
          return next;
        });

        if (data.mistakes?.length) {
          addMistakes(
            data.mistakes.slice(0, 3).map((m) => ({
              wrong: m.wrong,
              right: m.right,
              why: m.why,
              source: "call" as const,
              scenarioId: settings.scenarioId,
            })),
          );
        }

        setPhase("speaking");
        await speakTutor(data.reply);
        if (callId !== callIdRef.current) return;
        setPhase("listening");
      } catch (err) {
        if (callId !== callIdRef.current) return;
        setError(
          err instanceof Error ? err.message : "Network problem. Try again.",
        );
        setPhase("listening");
      }
    },
    [settings, speakTutor],
  );

  const handleUtterance = useCallback(
    (text: string) => {
      const turn: Turn = { id: `u-${Date.now()}`, role: "user", text };
      const history = [...turnsRef.current, turn];
      setTurns(history);
      void runTurn(history);
    },
    [runTurn],
  );

  const listening = useListening({
    enabled: micActive,
    onUtterance: handleUtterance,
    pauseMs: settings.level === "beginner" ? 2000 : 1400,
  });

  /* ------------------------- start / end the call ----------------------- */

  const startCall = useCallback(() => {
    callIdRef.current += 1;
    startedAtRef.current = Date.now();
    setTurns([]);
    setElapsed(0);
    setError(null);
    setMuted(false);

    // Unlock speech synthesis on this user gesture (required by Chrome/Safari).
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const unlock = new SpeechSynthesisUtterance(" ");
      unlock.volume = 0;
      window.speechSynthesis.speak(unlock);
    }

    void runTurn([]);
  }, [runTurn]);

  const endCall = useCallback(() => {
    callIdRef.current += 1;
    cancelSpeech();
    setPhase("idle");

    const rows = turnsRef.current;
    const seconds = startedAtRef.current
      ? Math.round((Date.now() - startedAtRef.current) / 1000)
      : 0;
    const scores = rows
      .map((t) => t.feedback?.score)
      .filter((s): s is number => typeof s === "number");

    if (seconds > 5) {
      addSession({
        kind: "call",
        scenarioId: settings.scenarioId,
        seconds,
        turns: rows.filter((t) => t.role === "user").length,
        averageScore: scores.length
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0,
      });
    }
    startedAtRef.current = 0;
  }, [settings.scenarioId, cancelSpeech]);

  useEffect(() => {
    if (!inCall) return;
    const id = setInterval(
      () => setElapsed(Math.round((Date.now() - startedAtRef.current) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [inCall]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns, listening.interim]);

  // Stop Sara mid-sentence if the learner navigates away.
  useEffect(() => () => cancelSpeech(), [cancelSpeech]);

  const scenario = useMemo(
    () => getScenario(settings.scenarioId),
    [settings.scenarioId],
  );

  const statusText: Record<Phase, string> = {
    idle: "Ready when you are",
    thinking: "Sara is thinking…",
    speaking: "Sara is speaking…",
    listening: muted ? "Microphone muted" : "Listening — your turn to speak",
  };

  const submitTyped = (e: React.FormEvent) => {
    e.preventDefault();
    const text = typed.trim();
    if (!text || phase === "thinking" || phase === "speaking") return;
    setTyped("");
    handleUtterance(text);
  };

  if (!ready) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      {/* ----------------------------- call stage ---------------------------- */}
      <section className="space-y-4">
        <div className="rounded-2xl border border-card-border bg-gradient-to-b from-accent-soft to-card p-6 text-center">
          <div className="relative mx-auto grid h-32 w-32 place-items-center">
            {phase === "speaking" && (
              <span
                className="tutor-pulse absolute inset-0 text-accent"
                aria-hidden
              />
            )}
            <span
              className="absolute inset-0 rounded-full border-4 border-accent/40 transition-transform duration-100"
              style={{
                transform: micActive
                  ? `scale(${1 + micLevel * 0.35})`
                  : "scale(1)",
                opacity: micActive ? 0.3 + micLevel * 0.7 : 0.3,
              }}
              aria-hidden
            />
            <span className="relative grid h-24 w-24 place-items-center rounded-full bg-accent text-4xl text-white shadow-lg">
              👩‍🏫
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-bold">Sara</h1>
          <p className="text-sm text-muted">
            {scenario.emoji} {scenario.label}
          </p>

          <p className="mt-3 flex items-center justify-center gap-2 text-sm font-medium">
            {phase === "thinking" && (
              <span className="flex gap-1" aria-hidden>
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-accent" />
                <span
                  className="typing-dot h-1.5 w-1.5 rounded-full bg-accent"
                  style={{ animationDelay: "0.15s" }}
                />
                <span
                  className="typing-dot h-1.5 w-1.5 rounded-full bg-accent"
                  style={{ animationDelay: "0.3s" }}
                />
              </span>
            )}
            <span className={phase === "listening" && !muted ? "text-good" : ""}>
              {statusText[phase]}
            </span>
          </p>

          {inCall && (
            <p className="mt-1 font-mono text-xs text-muted">
              {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
              {String(elapsed % 60).padStart(2, "0")}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {!inCall ? (
              <button
                onClick={startCall}
                className="rounded-full bg-good px-8 py-3 font-semibold text-white shadow-md transition-transform hover:scale-105"
              >
                📞 Start call
              </button>
            ) : (
              <>
                <button
                  onClick={() => setMuted((m) => !m)}
                  className={`rounded-full border px-5 py-3 font-semibold transition-colors ${
                    muted
                      ? "border-bad bg-bad/10 text-bad"
                      : "border-card-border bg-card hover:border-accent"
                  }`}
                >
                  {muted ? "🔇 Unmute" : "🎤 Mute"}
                </button>
                <button
                  onClick={listening.sendNow}
                  disabled={phase !== "listening"}
                  className="rounded-full border border-card-border bg-card px-5 py-3 font-semibold transition-colors hover:border-accent disabled:opacity-40"
                >
                  ⏩ I&apos;m done talking
                </button>
                <button
                  onClick={endCall}
                  className="rounded-full bg-bad px-6 py-3 font-semibold text-white shadow-md transition-transform hover:scale-105"
                >
                  📵 End call
                </button>
              </>
            )}
            <button
              onClick={() => setShowVideo((v) => !v)}
              className="rounded-full border border-card-border bg-card px-5 py-3 font-semibold transition-colors hover:border-accent"
            >
              {showVideo ? "📷 Hide camera" : "📷 Show camera"}
            </button>
          </div>

          {micActive && listening.interim && (
            <p className="mx-auto mt-4 max-w-md rounded-lg bg-card px-3 py-2 text-sm italic text-muted">
              {listening.interim}
            </p>
          )}
        </div>

        <SelfVideo active={showVideo} />

        {!support.checked ? null : !support.recognition ? (
          <p className="rounded-xl border border-warn/40 bg-warn/10 p-4 text-sm">
            ⚠️ This browser cannot hear your voice. Use <b>Google Chrome</b> or{" "}
            <b>Microsoft Edge</b> for the live call, or type your answers in the
            box below.
          </p>
        ) : null}

        {listening.error && (
          <p className="rounded-xl border border-bad/40 bg-bad/10 p-4 text-sm">
            {listening.error}
          </p>
        )}
        {error && (
          <p className="rounded-xl border border-bad/40 bg-bad/10 p-4 text-sm">
            {error}
          </p>
        )}

        {/* -------------------------- transcript ------------------------- */}
        <div
          ref={transcriptRef}
          className="max-h-[460px] space-y-3 overflow-y-auto rounded-2xl border border-card-border bg-card p-4"
        >
          {turns.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">
              Press <b>Start call</b>, then just speak normally. Sara will reply
              out loud and show your corrections here.
              <br />
              <span className="text-xs">
                Bas normal baat karein — Sara sab kuch samajh legi.
              </span>
            </p>
          )}

          {turns.map((turn) =>
            turn.role === "tutor" ? (
              <div key={turn.id} className="flex gap-2">
                <span className="mt-1 text-lg" aria-hidden>
                  👩‍🏫
                </span>
                <p className="max-w-[85%] rounded-2xl rounded-tl-sm bg-accent-soft px-4 py-2 text-sm">
                  {turn.text}
                </p>
              </div>
            ) : (
              <div key={turn.id} className="space-y-2">
                <div className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-accent px-4 py-2 text-sm text-white">
                    {turn.text}
                  </p>
                </div>
                {turn.feedback && <FeedbackCard feedback={turn.feedback} />}
              </div>
            ),
          )}

          {phase === "thinking" && (
            <p className="text-center text-xs text-muted">Sara is thinking…</p>
          )}
        </div>

        {/* --------------------- typing fallback ------------------------- */}
        <form onSubmit={submitTyped} className="flex gap-2">
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Can't speak right now? Type your answer here…"
            className="flex-1 rounded-xl border border-card-border bg-card px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={!typed.trim() || phase === "thinking" || phase === "speaking"}
            className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            Send
          </button>
        </form>
      </section>

      {/* ------------------------------ sidebar ------------------------------ */}
      <aside className="space-y-4">
        <div className="rounded-2xl border border-card-border bg-card p-5">
          <h2 className="mb-3 font-bold">Call settings</h2>
          <SettingsBar settings={settings} update={update} disabled={inCall} />
          {inCall && (
            <p className="mt-2 text-xs text-muted">
              End the call to change these.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5">
          <h2 className="mb-3 font-bold">Sara&apos;s voice</h2>
          <label className="mb-3 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
              Voice
            </span>
            <select
              className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
              value={voice.voiceURI}
              onChange={(e) => voice.setVoiceURI(e.target.value)}
            >
              {voice.voices.length === 0 && <option>Loading voices…</option>}
              {voice.voices.map((v) => (
                <option key={v.uri} value={v.uri}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 flex justify-between text-xs font-semibold uppercase tracking-wide text-muted">
              <span>Speaking speed</span>
              <span>{voice.rate.toFixed(1)}x</span>
            </span>
            <input
              type="range"
              min={0.6}
              max={1.3}
              step={0.1}
              value={voice.rate}
              onChange={(e) => voice.setRate(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
            <span className="text-xs text-muted">
              Slow it down if Sara speaks too fast.
            </span>
          </label>

          <button
            onClick={() =>
              void voice.speak(
                "Hello! I am Sara, your English teacher. Are you ready to practise?",
              )
            }
            className="mt-3 w-full rounded-lg border border-card-border px-3 py-2 text-sm font-medium transition-colors hover:border-accent"
          >
            🔊 Test the voice
          </button>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5 text-sm text-muted">
          <h2 className="mb-2 font-bold text-foreground">How it works</h2>
          <ol className="list-decimal space-y-1 pl-4">
            <li>Press <b>Start call</b> and allow the microphone.</li>
            <li>Sara greets you. Wait until she stops speaking.</li>
            <li>Speak your answer. Stop for 1–2 seconds when you finish.</li>
            <li>Your corrections appear under your message.</li>
          </ol>
        </div>
      </aside>
    </div>
  );
}

function FeedbackCard({ feedback }: { feedback: TutorTurn }) {
  const clean = !feedback.hadMistakes && feedback.mistakes.length === 0;

  return (
    <div
      className={`ml-auto max-w-[92%] rounded-xl border p-3 text-sm ${
        clean ? "border-good/40 bg-good/10" : "border-warn/40 bg-warn/10"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-semibold">
          {clean ? "✅ Perfect! No mistakes." : "✍️ Corrections"}
        </span>
        {typeof feedback.score === "number" && (
          <span className="rounded-full bg-card px-2 py-0.5 text-xs font-bold">
            {Math.round(feedback.score)}/100
          </span>
        )}
      </div>

      {!clean && feedback.correctedSentence && (
        <p className="mb-2">
          <span className="text-xs font-semibold uppercase text-muted">
            Correct:{" "}
          </span>
          {feedback.correctedSentence}
        </p>
      )}

      {feedback.mistakes.map((m, i) => (
        <p key={i} className="mb-1">
          <span className="text-bad line-through">{m.wrong}</span>{" "}
          <span aria-hidden>→</span>{" "}
          <span className="font-semibold text-good">{m.right}</span>
          <span className="block text-xs text-muted">{m.why}</span>
        </p>
      ))}

      {feedback.betterVersion && (
        <p className="mt-2">
          <span className="text-xs font-semibold uppercase text-muted">
            🌟 Say it better:{" "}
          </span>
          {feedback.betterVersion}
        </p>
      )}

      {feedback.usefulPhrase && (
        <p className="mt-2">
          <span className="text-xs font-semibold uppercase text-muted">
            💡 Useful phrase:{" "}
          </span>
          &quot;{feedback.usefulPhrase}&quot;
        </p>
      )}
    </div>
  );
}
