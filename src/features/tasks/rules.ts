import { runsOn } from '@/data/dates';
import type { Task, TaskStep } from '@/data/types';

export type Readiness =
  | { state: 'ready' }
  | { state: 'not-started' } // timed task, timer not started
  | { state: 'running'; remainingMs: number } // timed task, still counting down
  | { state: 'steps-left'; left: number }; // multi-step task with unchecked steps

/** Whether a task may be marked done right now. */
export function readiness(
  task: Task,
  steps: TaskStep[],
  doneStepIds: Set<number>,
  startedAt: number | undefined,
  now: number,
): Readiness {
  if (task.kind === 'timed') {
    if (startedAt === undefined) return { state: 'not-started' };
    const remainingMs = startedAt + (task.duration_min ?? 0) * 60_000 - now;
    return remainingMs > 0 ? { state: 'running', remainingMs } : { state: 'ready' };
  }
  if (task.kind === 'steps') {
    const left = steps.filter((s) => !doneStepIds.has(s.id)).length;
    return left > 0 ? { state: 'steps-left', left } : { state: 'ready' };
  }
  return { state: 'ready' };
}

export function formatRemaining(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function describeKind(task: Task, stepCount: number): string | null {
  if (task.kind === 'timed') return `Timed · ${task.duration_min} min`;
  if (task.kind === 'steps') return `${stepCount} step${stepCount === 1 ? '' : 's'}`;
  return null;
}

/** Wall-clock accessor, kept out of components so render-purity lint doesn't flag event handlers. */
export function currentTime(): number {
  return Date.now();
}

export function tasksForToday(tasks: Task[]): Task[] {
  const now = new Date();
  return tasks.filter((t) => runsOn(t.recurrence, now));
}

/** Unlock rule: every required task scheduled for today is done. */
export function unlockProgress(todayTasks: Task[], doneIds: Set<number>) {
  const required = todayTasks.filter((t) => t.required === 1);
  const done = required.filter((t) => doneIds.has(t.id)).length;
  return { done, total: required.length, unlocked: done === required.length };
}
