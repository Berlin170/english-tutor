"use client";

/**
 * Practice history, kept in localStorage so the dashboard works with no
 * database and no login.
 */

export type MistakeRecord = {
  id: string;
  at: number;
  wrong: string;
  right: string;
  why: string;
  source: "call" | "grammar";
  scenarioId?: string;
};

export type SessionRecord = {
  id: string;
  at: number;
  kind: "call" | "chat" | "grammar" | "quiz";
  scenarioId: string;
  /** Seconds of practice. */
  seconds: number;
  turns: number;
  averageScore: number;
};

const MISTAKES_KEY = "tutor.mistakes";
const SESSIONS_KEY = "tutor.sessions";
const MAX_MISTAKES = 300;
const MAX_SESSIONS = 200;

function read<T>(key: string): T[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, rows: T[], max: number) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(key, JSON.stringify(rows.slice(0, max)));
  window.dispatchEvent(new Event("tutor:progress"));
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getMistakes(): MistakeRecord[] {
  return read<MistakeRecord>(MISTAKES_KEY);
}

export function addMistakes(
  items: Omit<MistakeRecord, "id" | "at">[],
): void {
  if (items.length === 0) return;
  const rows = getMistakes();
  const added = items.map((m) => ({ ...m, id: makeId(), at: Date.now() }));
  write(MISTAKES_KEY, [...added, ...rows], MAX_MISTAKES);
}

export function getSessions(): SessionRecord[] {
  return read<SessionRecord>(SESSIONS_KEY);
}

export function addSession(session: Omit<SessionRecord, "id" | "at">): void {
  const rows = getSessions();
  write(SESSIONS_KEY, [{ ...session, id: makeId(), at: Date.now() }, ...rows], MAX_SESSIONS);
}

export function clearProgress() {
  localStorage.removeItem(MISTAKES_KEY);
  localStorage.removeItem(SESSIONS_KEY);
  window.dispatchEvent(new Event("tutor:progress"));
}

export type Stats = {
  totalMinutes: number;
  totalSessions: number;
  totalTurns: number;
  averageScore: number;
  dayStreak: number;
  /** Practice minutes for the last 14 days, oldest first. */
  last14: { day: string; minutes: number }[];
  topMistakes: { label: string; count: number }[];
};

export function computeStats(
  sessions: SessionRecord[],
  mistakes: MistakeRecord[],
): Stats {
  const totalSeconds = sessions.reduce((sum, s) => sum + s.seconds, 0);
  const totalTurns = sessions.reduce((sum, s) => sum + s.turns, 0);
  const scored = sessions.filter((s) => s.averageScore > 0);
  const averageScore = scored.length
    ? Math.round(
        scored.reduce((sum, s) => sum + s.averageScore, 0) / scored.length,
      )
    : 0;

  const dayKey = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  const minutesByDay = new Map<string, number>();
  for (const s of sessions) {
    const key = dayKey(s.at);
    minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + s.seconds / 60);
  }

  const last14: { day: string; minutes: number }[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    last14.push({ day: key, minutes: Math.round(minutesByDay.get(key) ?? 0) });
  }

  // A streak counts back from today (or yesterday, if today has no practice yet).
  let dayStreak = 0;
  const cursor = new Date(today);
  if (!minutesByDay.has(dayKey(cursor.getTime()))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (minutesByDay.has(cursor.toISOString().slice(0, 10))) {
    dayStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const counts = new Map<string, number>();
  for (const m of mistakes) {
    const label = m.wrong.trim().toLowerCase();
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const topMistakes = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    totalMinutes: Math.round(totalSeconds / 60),
    totalSessions: sessions.length,
    totalTurns,
    averageScore,
    dayStreak,
    last14,
    topMistakes,
  };
}
