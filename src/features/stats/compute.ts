import { dayKey, runsOn } from '@/data/dates';
import type { Task } from '@/data/types';

export type DayResult = { day: string; scheduled: number; completed: number };

export type Stats = {
  streak: number;
  bestStreak: number;
  /** Past days only (today is still in progress), last 7 / 30 days. */
  week: { completed: number; missed: number };
  month: { completed: number; missed: number };
  completionRate: number | null; // 0..1 over the last 30 days, null if nothing was scheduled
  last7: DayResult[]; // oldest first, includes today
};

const DAY_MS = 86_400_000;

/** Required tasks scheduled for each of the last `days` days (oldest first) and how many were done. */
export function dailyResults(
  tasks: Task[],
  completions: Set<string>, // `${taskId}|${day}`
  days: number,
  now = new Date(),
): DayResult[] {
  const out: DayResult[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = dayKey(d);
    const endOfDay = d.getTime() + DAY_MS;
    const due = tasks.filter(
      (t) => t.required === 1 && t.created_at < endOfDay && runsOn(t.recurrence, d),
    );
    out.push({
      day: key,
      scheduled: due.length,
      completed: due.filter((t) => completions.has(`${t.id}|${key}`)).length,
    });
  }
  return out;
}

export function computeStats(tasks: Task[], completions: Set<string>, now = new Date()): Stats {
  const results = dailyResults(tasks, completions, 365, now);
  const today = results[results.length - 1];
  const past = results.slice(0, -1);

  // A "perfect" day has work scheduled and all of it done; empty days neither break nor extend a streak.
  const perfect = (r: DayResult) => r.scheduled > 0 && r.completed === r.scheduled;
  const broken = (r: DayResult) => r.scheduled > 0 && r.completed < r.scheduled;

  let streak = 0;
  for (let i = results.length - 1; i >= 0; i--) {
    const r = results[i];
    if (r === today && !perfect(r)) continue; // today still has time
    if (broken(r)) break;
    if (perfect(r)) streak++;
  }

  let best = 0;
  let run = 0;
  for (const r of results) {
    if (perfect(r)) best = Math.max(best, ++run);
    else if (broken(r) && r !== today) run = 0;
  }

  const sum = (rs: DayResult[]) => ({
    completed: rs.reduce((n, r) => n + r.completed, 0),
    missed: rs.reduce((n, r) => n + (r.scheduled - r.completed), 0),
  });
  const month = sum(past.slice(-30));
  const total = month.completed + month.missed;

  return {
    streak,
    bestStreak: Math.max(best, streak),
    week: sum(past.slice(-7)),
    month,
    completionRate: total === 0 ? null : month.completed / total,
    last7: results.slice(-7),
  };
}
