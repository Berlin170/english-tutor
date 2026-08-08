"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  GOLDEN_RULES,
  GROUPS,
  IRREGULAR_VERBS,
  TENSES,
  type Mistake,
  type Tense,
  type TenseGroup,
} from "@/lib/tenses";
import { useSettings } from "@/lib/useSettings";
import TenseQuiz from "@/components/TenseQuiz";

type Filter = TenseGroup | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All 12" },
  ...GROUPS.map((g) => ({ id: g.id as Filter, label: g.label })),
];

export default function TensesPage() {
  const { update } = useSettings();
  const [filter, setFilter] = useState<Filter>("all");
  const [verbQuery, setVerbQuery] = useState("");

  const shown = useMemo(
    () => (filter === "all" ? TENSES : TENSES.filter((t) => t.group === filter)),
    [filter],
  );

  const verbs = useMemo(() => {
    const q = verbQuery.trim().toLowerCase();
    if (!q) return IRREGULAR_VERBS;
    return IRREGULAR_VERBS.filter(
      (v) =>
        v.base.includes(q) ||
        v.past.includes(q) ||
        v.participle.includes(q) ||
        v.urdu.includes(q),
    );
  }, [verbQuery]);

  return (
    <div className="space-y-8">
      {/* ------------------------------ intro ------------------------------ */}
      <section className="rounded-2xl border border-card-border bg-gradient-to-br from-accent-soft to-card p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">
          Grammar lesson
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Tenses - Past, Present, Future
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Sab se pehle yeh page aaram se parho. Har tense ka formula, matlab,
          examples aur woh galtiyan jo hum log sab se zyada karte hain - sab yahan
          hain. Jab yeh samajh aa jaye, phir call shuru karna asaan ho jayega.
        </p>
      </section>

      {/* --------------------------- golden rules -------------------------- */}
      <section className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
        <h2 className="text-xl font-bold">5 rules jo aadhi galtiyan khatam kar dete hain</h2>
        <p className="mb-4 mt-1 text-sm text-muted">
          Agar sirf yeh paanch yaad kar lo, aap ki tense ki galtiyan bohat kam ho
          jayengi.
        </p>
        <ol className="space-y-3">
          {GOLDEN_RULES.map((rule, i) => (
            <li key={rule.wrong} className="flex gap-3">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <MistakeRow mistake={rule} />
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------ filter ----------------------------- */}
      <section>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="mr-2 text-xl font-bold">The 12 tenses</h2>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                filter === f.id
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-card-border bg-card text-muted hover:border-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {shown.map((tense) => (
            <TenseCard key={tense.id} tense={tense} />
          ))}
        </div>
      </section>

      {/* -------------------------- irregular verbs ------------------------ */}
      <section className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
        <h2 className="text-xl font-bold">Irregular verbs - yeh &quot;ed&quot; nahin lete</h2>
        <p className="mb-4 mt-1 text-sm text-muted">
          Yeh {IRREGULAR_VERBS.length} verbs apni shakal badal lete hain. &quot;I
          goed&quot; ghalat hai kyunke go ki past form &quot;went&quot; hai. Doosri
          form past ke liye, teesri form have / has / had ke saath.
        </p>

        <input
          className="mb-4 w-full max-w-sm rounded-lg border border-card-border bg-card px-3 py-2 text-sm outline-none focus:border-accent"
          placeholder="Search a verb, e.g. go or jana"
          value={verbQuery}
          onChange={(e) => setVerbQuery(e.target.value)}
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-card-border text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="py-2 pr-3">1st form</th>
                <th className="py-2 pr-3">2nd form (past)</th>
                <th className="py-2 pr-3">3rd form</th>
                <th className="py-2">Urdu</th>
              </tr>
            </thead>
            <tbody>
              {verbs.map((v) => (
                <tr key={v.base} className="border-b border-card-border/60">
                  <td className="py-2 pr-3 font-medium">{v.base}</td>
                  <td className="py-2 pr-3 font-medium text-accent">{v.past}</td>
                  <td className="py-2 pr-3 font-medium text-accent">
                    {v.participle}
                  </td>
                  <td className="py-2 text-muted">{v.urdu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {verbs.length === 0 && (
          <p className="py-4 text-sm text-muted">
            Koi verb nahin mila. Doosra lafz try karo.
          </p>
        )}
      </section>

      {/* ------------------------------- quiz ------------------------------ */}
      <TenseQuiz />

      {/* ------------------------------ next step -------------------------- */}
      <section className="rounded-2xl border border-card-border bg-gradient-to-br from-accent-soft to-card p-6">
        <h2 className="text-xl font-bold">Ab practice karo</h2>
        <p className="mb-4 mt-1 max-w-2xl text-sm text-muted">
          Parhne se sirf aadha kaam hota hai. Ab Sara ke saath grammar drill karo -
          woh aap se sentences banwayegi aur har tense ki galti Roman Urdu mein
          samjhayegi.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/call"
            onClick={() => update({ scenarioId: "grammar-drill" })}
            className="rounded-xl bg-accent px-5 py-3 font-semibold text-white shadow-sm transition-transform hover:scale-[1.02]"
          >
            🎙️ Tense drill on a call
          </Link>
          <Link
            href="/chat"
            onClick={() => update({ scenarioId: "grammar-drill" })}
            className="rounded-xl border border-card-border bg-card px-5 py-3 font-semibold transition-colors hover:border-accent"
          >
            💬 Likh kar practice karo
          </Link>
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function TenseCard({ tense }: { tense: Tense }) {
  const group = GROUPS.find((g) => g.id === tense.group)!;

  return (
    <article className="rounded-2xl border border-card-border bg-card p-5 sm:p-6">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={`rounded-md bg-gradient-to-br ${group.accent} px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white`}
        >
          {group.label}
        </span>
        <h3 className="text-lg font-bold">{tense.name}</h3>
        <span className="text-sm text-muted">{tense.urduName}</span>
      </header>

      <p className="mt-2 font-mono text-sm font-semibold text-accent">
        {tense.short}
      </p>

      {/* formula */}
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <FormulaBox sign="+" label="Positive" text={tense.formula.positive} />
        <FormulaBox sign="-" label="Negative" text={tense.formula.negative} />
        <FormulaBox sign="?" label="Question" text={tense.formula.question} />
      </div>

      {/* when to use */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Kab istemaal karein
          </h4>
          <ul className="mt-2 space-y-1 text-sm">
            {tense.uses.map((u) => (
              <li key={u} className="flex gap-2">
                <span className="text-accent" aria-hidden>
                  •
                </span>
                <span>{u}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Pehchan ke lafz
          </h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tense.signals.map((s) => (
              <span
                key={s}
                className="rounded-md bg-accent-soft px-2 py-1 text-xs font-medium text-accent"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* examples */}
      <div className="mt-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Examples
        </h4>
        <ul className="mt-2 space-y-2">
          {tense.examples.map((ex) => (
            <li
              key={ex.en}
              className="rounded-lg border border-card-border px-3 py-2 text-sm"
            >
              <p className="font-medium">{ex.en}</p>
              <p className="text-xs text-muted">{ex.ur}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* mistakes */}
      <div className="mt-4 rounded-xl border border-card-border bg-background p-3">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Aam galti - aur uska hal
        </h4>
        <div className="space-y-3">
          {tense.mistakes.map((m) => (
            <MistakeRow key={m.wrong} mistake={m} />
          ))}
        </div>
      </div>
    </article>
  );
}

function FormulaBox({
  sign,
  label,
  text,
}: {
  sign: string;
  label: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-card-border bg-background p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        <span aria-hidden>{sign}</span> {label}
      </p>
      <p className="mt-1 text-sm font-medium">{text}</p>
    </div>
  );
}

function MistakeRow({ mistake }: { mistake: Mistake }) {
  return (
    <div className="text-sm">
      <p className="text-bad">
        <span aria-hidden>❌</span>{" "}
        <span className="line-through decoration-bad/50">{mistake.wrong}</span>
      </p>
      <p className="text-good">
        <span aria-hidden>✅</span> <span className="font-medium">{mistake.right}</span>
      </p>
      <p className="mt-1 text-xs text-muted">{mistake.why}</p>
    </div>
  );
}
