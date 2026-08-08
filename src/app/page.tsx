"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SettingsBar from "@/components/SettingsBar";
import { LEVELS, SCENARIOS } from "@/lib/tutor";
import { computeStats, getMistakes, getSessions, type Stats } from "@/lib/progress";
import { useSettings } from "@/lib/useSettings";

const MODES = [
  {
    href: "/call",
    emoji: "🎙️",
    title: "Live Call",
    subtitle: "Bolna seekho",
    body: "Talk to Sara like a real phone call. You speak, she listens and answers out loud, and every mistake appears on the screen.",
    cta: "Start a call",
    accent: "from-indigo-500 to-violet-500",
  },
  {
    href: "/chat",
    emoji: "💬",
    title: "Chat Practice",
    subtitle: "Likh kar practice",
    body: "Type your English and get an instant correction, a more natural version and a reply that keeps the conversation going.",
    cta: "Open chat",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    href: "/grammar",
    emoji: "✍️",
    title: "Grammar Check",
    subtitle: "Galtiyan theek karo",
    body: "Paste any message, email or paragraph. Get it corrected line by line with the reason for every fix.",
    cta: "Check my writing",
    accent: "from-amber-500 to-orange-500",
  },
];

export default function DashboardPage() {
  const { settings, update, ready } = useSettings();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const load = () => setStats(computeStats(getSessions(), getMistakes()));
    load();
    window.addEventListener("tutor:progress", load);
    return () => window.removeEventListener("tutor:progress", load);
  }, []);

  const levelHint = LEVELS.find((l) => l.id === settings.level)?.hint;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-card-border bg-gradient-to-br from-accent-soft to-card p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          Your English tutor
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          {ready && settings.learnerName
            ? `Assalam-o-Alaikum, ${settings.learnerName}!`
            : "Assalam-o-Alaikum!"}
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Practise speaking English with Sara, your AI teacher. She talks with
          you, corrects your grammar, and explains every mistake in Roman Urdu
          so it is easy to understand. Ghabrane ki koi baat nahin - galti karna
          hi seekhne ka tareeqa hai.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/call"
            className="rounded-xl bg-accent px-5 py-3 font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
          >
            🎙️ Start a live call
          </Link>
          <Link
            href="/chat"
            className="rounded-xl border border-card-border bg-card px-5 py-3 font-semibold transition-colors hover:border-accent"
          >
            💬 Practise by typing
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Practice time"
          value={stats ? `${stats.totalMinutes} min` : "-"}
          hint="Total minutes spoken"
        />
        <StatCard
          label="Day streak"
          value={stats ? `${stats.dayStreak} 🔥` : "-"}
          hint="Days in a row"
        />
        <StatCard
          label="Sessions"
          value={stats ? String(stats.totalSessions) : "-"}
          hint="Calls, chats and checks"
        />
        <StatCard
          label="Average score"
          value={stats && stats.averageScore ? `${stats.averageScore}/100` : "-"}
          hint="Your English quality"
        />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Choose how you want to practise</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {MODES.map((mode) => (
            <Link
              key={mode.href}
              href={mode.href}
              className="group flex flex-col rounded-2xl border border-card-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-accent hover:shadow-lg"
            >
              <div
                className={`mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${mode.accent} text-2xl`}
              >
                <span aria-hidden>{mode.emoji}</span>
              </div>
              <h3 className="text-lg font-bold">{mode.title}</h3>
              <p className="text-xs font-medium text-accent">{mode.subtitle}</p>
              <p className="mt-2 flex-1 text-sm text-muted">{mode.body}</p>
              <span className="mt-4 text-sm font-semibold text-accent group-hover:underline">
                {mode.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
        <h2 className="text-xl font-bold">Your settings</h2>
        <p className="mb-4 mt-1 text-sm text-muted">
          These apply to every practice mode. {levelHint}
        </p>

        <label className="mb-3 block max-w-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            Your name (optional)
          </span>
          <input
            className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="e.g. Ahmed"
            value={settings.learnerName}
            onChange={(e) => update({ learnerName: e.target.value })}
          />
        </label>

        <SettingsBar settings={settings} update={update} />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Practice topics</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SCENARIOS.map((s) => (
            <Link
              key={s.id}
              href="/call"
              onClick={() => update({ scenarioId: s.id })}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                settings.scenarioId === s.id
                  ? "border-accent bg-accent-soft"
                  : "border-card-border bg-card hover:border-accent"
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {s.emoji}
              </span>
              <span>
                <span className="block font-semibold">{s.label}</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {s.brief}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted">{hint}</p>
    </div>
  );
}
