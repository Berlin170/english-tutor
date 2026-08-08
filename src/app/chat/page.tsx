"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import SettingsBar from "@/components/SettingsBar";
import { addSession } from "@/lib/progress";
import { getScenario } from "@/lib/tutor";
import { useListening, useTutorVoice } from "@/lib/useSpeech";
import { useSettings } from "@/lib/useSettings";

const DEFAULT_SCENARIO = "free-talk";

const STARTERS = [
  "Hello, my name is Ahmed. I am living in Lahore.",
  "Yesterday I go to market with my brother.",
  "Can you ask me some questions about my job?",
  "I want to improve my speaking for a job interview.",
];

export default function ChatPage() {
  const { settings, update, ready } = useSettings();
  const voice = useTutorVoice();
  const { speak, cancel } = voice;

  const [input, setInput] = useState("");
  const [dictating, setDictating] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedAtRef = useRef(0);
  const spokenRef = useRef<string | null>(null);

  const { messages, sendMessage, status, error, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const busy = status === "submitted" || status === "streaming";

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setInput("");
      void sendMessage(
        { text: trimmed },
        {
          body: {
            level: settings.level,
            explainLang: settings.explainLang,
            scenarioId: settings.scenarioId,
            learnerName: settings.learnerName || undefined,
          },
        },
      );
    },
    [busy, sendMessage, settings],
  );

  // Dictation: speak instead of typing, the words land in the input box.
  const dictation = useListening({
    enabled: dictating,
    onUtterance: (text) =>
      setInput((prev) => (prev ? `${prev} ${text}` : text).trim()),
    pauseMs: 1600,
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  // Read the finished reply out loud when auto-speak is on.
  useEffect(() => {
    if (!autoSpeak || status !== "ready") return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") return;
    if (spokenRef.current === last.id) return;
    spokenRef.current = last.id;
    void speak(spokenForVoice(messageText(last)));
  }, [autoSpeak, messages, status, speak]);

  useEffect(() => {
    if (!autoSpeak) cancel();
  }, [autoSpeak, cancel]);

  // Record the session once, when the learner leaves the page. The ref keeps
  // the unmount effect from re-running (and double-counting) on every message.
  const sessionRef = useRef({ turns: 0, scenarioId: DEFAULT_SCENARIO });
  useEffect(() => {
    sessionRef.current = {
      turns: messages.filter((m) => m.role === "user").length,
      scenarioId: settings.scenarioId,
    };
  }, [messages, settings.scenarioId]);

  useEffect(() => {
    startedAtRef.current = Date.now();
    return () => {
      const seconds = Math.round((Date.now() - startedAtRef.current) / 1000);
      const { turns, scenarioId } = sessionRef.current;
      if (turns > 0 && seconds > 5) {
        addSession({ kind: "chat", scenarioId, seconds, turns, averageScore: 0 });
      }
    };
  }, []);

  if (!ready) return null;

  const scenario = getScenario(settings.scenarioId);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="flex min-h-[70vh] flex-col rounded-2xl border border-card-border bg-card">
        <div className="flex items-center justify-between border-b border-card-border px-5 py-3">
          <div>
            <h1 className="font-bold">Chat with Sara</h1>
            <p className="text-xs text-muted">
              {scenario.emoji} {scenario.label}
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
            <input
              type="checkbox"
              checked={autoSpeak}
              onChange={(e) => setAutoSpeak(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            🔊 Read replies aloud
          </label>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-4xl" aria-hidden>
                👩‍🏫
              </p>
              <p className="mt-3 font-semibold">
                Write anything in English. Mistakes are welcome!
              </p>
              <p className="mt-1 text-sm text-muted">
                Galti hone do — Sara har galti theek kar ke wajah bhi batayegi.
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-xl border border-card-border px-3 py-2 text-left text-sm transition-colors hover:border-accent hover:bg-accent-soft"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => {
            const text = messageText(message);
            if (!text) return null;

            return message.role === "user" ? (
              <div key={message.id} className="flex justify-end">
                <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-accent px-4 py-2 text-sm text-white">
                  {text}
                </p>
              </div>
            ) : (
              <div key={message.id} className="flex gap-2">
                <span className="mt-1 text-lg" aria-hidden>
                  👩‍🏫
                </span>
                <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-accent-soft px-4 py-3 text-sm">
                  <RichText text={text} />
                  <button
                    onClick={() => void speak(spokenForVoice(text))}
                    className="mt-2 text-xs font-medium text-accent hover:underline"
                  >
                    🔊 Listen
                  </button>
                </div>
              </div>
            );
          })}

          {status === "submitted" && (
            <p className="text-sm text-muted">Sara is typing…</p>
          )}
          {error && (
            <p className="rounded-xl border border-bad/40 bg-bad/10 p-3 text-sm">
              {error.message}
            </p>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-card-border p-4"
        >
          {dictating && (
            <p className="mb-2 text-xs text-good">
              🎤 Listening… {dictation.interim}
            </p>
          )}
          {dictation.error && (
            <p className="mb-2 text-xs text-bad">{dictation.error}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDictating((d) => !d)}
              title="Speak instead of typing"
              className={`rounded-xl border px-3 py-3 transition-colors ${
                dictating
                  ? "border-good bg-good/10"
                  : "border-card-border hover:border-accent"
              }`}
            >
              🎤
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={2}
              placeholder="Write your English here… (Enter to send)"
              className="flex-1 resize-none rounded-xl border border-card-border bg-card px-4 py-2 text-sm outline-none focus:border-accent"
            />
            {busy ? (
              <button
                type="button"
                onClick={stop}
                className="rounded-xl bg-bad px-5 py-3 text-sm font-semibold text-white"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                Send
              </button>
            )}
          </div>
        </form>
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-card-border bg-card p-5">
          <h2 className="mb-3 font-bold">Chat settings</h2>
          <SettingsBar settings={settings} update={update} />
          <p className="mt-3 text-xs text-muted">
            New settings apply to your next message.
          </p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5 text-sm text-muted">
          <h2 className="mb-2 font-bold text-foreground">Tips</h2>
          <ul className="list-disc space-y-1 pl-4">
            <li>Write full sentences, not single words.</li>
            <li>Do not use Google Translate — try yourself first.</li>
            <li>Read Sara&apos;s correction out loud once.</li>
            <li>
              Tap 🎤 to speak your answer instead of typing it.
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

/** Join every text part of a UI message. */
function messageText(message: { parts: { type: string }[] }): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

/** Strip the correction block and markdown so speech sounds natural. */
function spokenForVoice(text: string): string {
  return text
    .split("\n")
    .filter((line) => !/^\*\*[^*]+:\*\*/.test(line.trim()))
    .join(" ")
    .replace(/\*\*/g, "")
    .replace(/[#*_`]/g, "")
    .trim();
}

/** Tiny renderer for the **bold:** labels the tutor uses. No markdown lib needed. */
function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-1">
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j} className="text-accent">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{part}</span>
              ),
            )}
          </p>
        );
      })}
    </div>
  );
}
