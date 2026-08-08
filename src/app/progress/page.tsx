"use client";

import { useEffect, useState } from "react";
import {
  clearProgress,
  computeStats,
  getMistakes,
  getSessions,
  type MistakeRecord,
  type SessionRecord,
  type Stats,
} from "@/lib/progress";
import { getScenario } from "@/lib/tutor";

export default function ProgressPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = () => {
      const s = getSessions();
      const m = getMistakes();
      setSessions(s);
      setMistakes(m);
      setStats(computeStats(s, m));
    };
    load();
    window.addEventListener("tutor:progress", load);
    return () => window.removeEventListener("tutor:progress", load);
  }, []);

  if (!stats) return null;

  const maxMinutes = Math.max(1, ...stats.last14.map((d) => d.minutes));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Your Progress</h1>
          <p className="text-sm text-muted">
            Everything is saved in this browser only. Aap ka data sirf aap ke
            device par hai.
          </p>
        </div>
        {sessions.length > 0 && (
          <button
            onClick={() => {
              if (confirm("Delete all your practice history?")) clearProgress();
            }}
            className="rounded-lg border border-card-border px-4 py-2 text-sm text-muted hover:border-bad hover:text-bad"
          >
            Reset history
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Practice time" value={`${stats.totalMinutes} min`} />
        <Stat label="Day streak" value={`${stats.dayStreak} 🔥`} />
        <Stat label="Sessions" value={String(stats.totalSessions)} />
        <Stat
          label="Average score"
          value={stats.averageScore ? `${stats.averageScore}/100` : "-"}
        />
      </div>

      <section className="rounded-2xl border border-card-border bg-card p-5">
        <h2 className="mb-4 font-bold">Last 14 days</h2>
        <div className="flex h-40 items-end gap-1.5">
          {stats.last14.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-accent transition-all"
                style={{
                  height: `${Math.max(3, (d.minutes / maxMinutes) * 100)}%`,
                  opacity: d.minutes ? 1 : 0.15,
                }}
                title={`${d.day}: ${d.minutes} min`}
              />
              <span className="text-[10px] text-muted">
                {new Date(`${d.day}T00:00:00`).getDate()}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-card-border bg-card p-5">
          <h2 className="mb-3 font-bold">Mistakes you repeat</h2>
          {stats.topMistakes.length === 0 ? (
            <p className="text-sm text-muted">
              No mistakes recorded yet. Start a call or check some writing.
            </p>
          ) : (
            <ul className="space-y-2">
              {stats.topMistakes.map((m) => (
                <li
                  key={m.label}
                  className="flex items-center justify-between rounded-lg border border-card-border px-3 py-2 text-sm"
                >
                  <span className="text-bad">&ldquo;{m.label}&rdquo;</span>
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
                    {m.count}x
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5">
          <h2 className="mb-3 font-bold">Recent sessions</h2>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted">Nothing yet.</p>
          ) : (
            <ul className="space-y-2">
              {sessions.slice(0, 10).map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-card-border px-3 py-2 text-sm"
                >
                  <span>
                    {s.kind === "call" ? "🎙️" : s.kind === "chat" ? "💬" : "✍️"}{" "}
                    {getScenario(s.scenarioId).label}
                    <span className="block text-xs text-muted">
                      {new Date(s.at).toLocaleString()}
                    </span>
                  </span>
                  <span className="text-right text-xs text-muted">
                    {Math.max(1, Math.round(s.seconds / 60))} min
                    <span className="block">{s.turns} turns</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-card-border bg-card p-5">
        <h2 className="mb-3 font-bold">Your mistake notebook</h2>
        {mistakes.length === 0 ? (
          <p className="text-sm text-muted">
            Every correction from your calls and grammar checks will appear
            here. Review this list once a week.
          </p>
        ) : (
          <ul className="space-y-2">
            {mistakes.slice(0, 40).map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-card-border p-3 text-sm"
              >
                <p>
                  <span className="text-bad line-through">{m.wrong}</span>{" "}
                  <span aria-hidden>→</span>{" "}
                  <span className="font-semibold text-good">{m.right}</span>
                </p>
                <p className="mt-1 text-xs text-muted">{m.why}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
