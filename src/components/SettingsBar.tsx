"use client";

import { EXPLAIN_LANGS, LEVELS, SCENARIOS } from "@/lib/tutor";
import type { Settings } from "@/lib/useSettings";

type Props = {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  /** Hide the scenario picker on pages where it makes no sense. */
  showScenario?: boolean;
  disabled?: boolean;
};

export default function SettingsBar({
  settings,
  update,
  showScenario = true,
  disabled = false,
}: Props) {
  const selectClass =
    "w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-50";

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
          Your level
        </span>
        <select
          className={selectClass}
          value={settings.level}
          disabled={disabled}
          onChange={(e) =>
            update({ level: e.target.value as Settings["level"] })
          }
        >
          {LEVELS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
          Explain mistakes in
        </span>
        <select
          className={selectClass}
          value={settings.explainLang}
          disabled={disabled}
          onChange={(e) =>
            update({ explainLang: e.target.value as Settings["explainLang"] })
          }
        >
          {EXPLAIN_LANGS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

      {showScenario && (
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
            Practice topic
          </span>
          <select
            className={selectClass}
            value={settings.scenarioId}
            disabled={disabled}
            onChange={(e) => update({ scenarioId: e.target.value })}
          >
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.emoji} {s.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
