"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ExplainLang, Level } from "./tutor";

export type Settings = {
  learnerName: string;
  level: Level;
  explainLang: ExplainLang;
  scenarioId: string;
};

const DEFAULTS: Settings = {
  learnerName: "",
  level: "beginner",
  explainLang: "roman-urdu",
  scenarioId: "free-talk",
};

const KEY = "tutor.settings";

/* ------------------------------ tiny store ------------------------------- */

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cached: Settings = DEFAULTS;

/**
 * Snapshots have to be referentially stable, so the parsed object is only
 * rebuilt when the raw localStorage string actually changes.
 */
function getSnapshot(): Settings {
  const raw = localStorage.getItem(KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cached = raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Settings) } : DEFAULTS;
    } catch {
      cached = DEFAULTS;
    }
  }
  return cached;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Keep other tabs in sync too.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function writeSettings(next: Settings) {
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

const neverChanges = () => () => {};

/** True once React has hydrated, so the UI can wait for the stored values. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    neverChanges,
    () => true,
    () => false,
  );
}

/* --------------------------------- hook ---------------------------------- */

/** Learner preferences, shared by every page through localStorage. */
export function useSettings() {
  const settings = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => DEFAULTS,
  );
  const ready = useHydrated();

  const update = useCallback((patch: Partial<Settings>) => {
    writeSettings({ ...getSnapshot(), ...patch });
  }, []);

  return { settings, update, ready };
}
