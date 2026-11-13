import type { SQLiteDatabase } from 'expo-sqlite';

import { dayKey } from './dates';
import type { LockedApp, Task, TaskKind, TaskStep } from './types';

// ---- Tasks ----

export async function listTasks(db: SQLiteDatabase): Promise<Task[]> {
  return db.getAllAsync<Task>('SELECT * FROM tasks WHERE archived = 0 ORDER BY created_at');
}

/** Editable task fields. `steps` is only meaningful for kind 'steps'; entries with an id are kept. */
export type TaskInput = {
  title: string;
  recurrence: number;
  required: boolean;
  kind: TaskKind;
  durationMin: number | null;
  steps: { id?: number; title: string }[];
};

export async function addTask(db: SQLiteDatabase, t: TaskInput) {
  await db.withExclusiveTransactionAsync(async (tx) => {
    const res = await tx.runAsync(
      'INSERT INTO tasks (title, recurrence, required, kind, duration_min, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      t.title,
      t.recurrence,
      t.required ? 1 : 0,
      t.kind,
      t.kind === 'timed' ? t.durationMin : null,
      Date.now(),
    );
    await writeSteps(tx, res.lastInsertRowId, t.kind === 'steps' ? t.steps : []);
  });
}

export async function updateTask(db: SQLiteDatabase, id: number, t: TaskInput) {
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync(
      'UPDATE tasks SET title = ?, recurrence = ?, required = ?, kind = ?, duration_min = ? WHERE id = ?',
      t.title,
      t.recurrence,
      t.required ? 1 : 0,
      t.kind,
      t.kind === 'timed' ? t.durationMin : null,
      id,
    );
    await writeSteps(tx, id, t.kind === 'steps' ? t.steps : []);
  });
}

/** Syncs a task's steps: keeps/renames existing ids (preserving today's check state), inserts new, deletes removed. */
async function writeSteps(
  db: SQLiteDatabase,
  taskId: number,
  steps: { id?: number; title: string }[],
) {
  const keep = steps.flatMap((s) => (s.id !== undefined ? [s.id] : []));
  const existing = await db.getAllAsync<{ id: number }>(
    'SELECT id FROM task_steps WHERE task_id = ?',
    taskId,
  );
  for (const { id } of existing) {
    if (!keep.includes(id)) {
      await db.runAsync('DELETE FROM step_completions WHERE step_id = ?', id);
      await db.runAsync('DELETE FROM task_steps WHERE id = ?', id);
    }
  }
  for (const [position, s] of steps.entries()) {
    if (s.id !== undefined) {
      await db.runAsync(
        'UPDATE task_steps SET title = ?, position = ? WHERE id = ?',
        s.title,
        position,
        s.id,
      );
    } else {
      await db.runAsync(
        'INSERT INTO task_steps (task_id, title, position) VALUES (?, ?, ?)',
        taskId,
        s.title,
        position,
      );
    }
  }
}

export async function archiveTask(db: SQLiteDatabase, id: number) {
  await db.runAsync('UPDATE tasks SET archived = 1 WHERE id = ?', id);
}

export async function setTaskDone(db: SQLiteDatabase, id: number, done: boolean, day = dayKey()) {
  if (done) {
    await db.runAsync(
      'INSERT OR IGNORE INTO task_completions (task_id, day, completed_at) VALUES (?, ?, ?)',
      id,
      day,
      Date.now(),
    );
  } else {
    await db.runAsync('DELETE FROM task_completions WHERE task_id = ? AND day = ?', id, day);
  }
}

export async function completedTaskIds(db: SQLiteDatabase, day = dayKey()): Promise<number[]> {
  const rows = await db.getAllAsync<{ task_id: number }>(
    'SELECT task_id FROM task_completions WHERE day = ?',
    day,
  );
  return rows.map((r) => r.task_id);
}

// ---- Steps ----

export async function listSteps(db: SQLiteDatabase): Promise<TaskStep[]> {
  return db.getAllAsync<TaskStep>('SELECT * FROM task_steps ORDER BY task_id, position');
}

export async function completedStepIds(db: SQLiteDatabase, day = dayKey()): Promise<number[]> {
  const rows = await db.getAllAsync<{ step_id: number }>(
    'SELECT step_id FROM step_completions WHERE day = ?',
    day,
  );
  return rows.map((r) => r.step_id);
}

/** Unchecking a step also un-completes its parent task for that day. */
export async function setStepDone(
  db: SQLiteDatabase,
  stepId: number,
  taskId: number,
  done: boolean,
  day = dayKey(),
) {
  if (done) {
    await db.runAsync(
      'INSERT OR IGNORE INTO step_completions (step_id, day) VALUES (?, ?)',
      stepId,
      day,
    );
  } else {
    await db.runAsync('DELETE FROM step_completions WHERE step_id = ? AND day = ?', stepId, day);
    await setTaskDone(db, taskId, false, day);
  }
}

// ---- Timers ----

/** Map of taskId -> start time (epoch ms) for the given day. */
export async function getTimers(db: SQLiteDatabase, day = dayKey()): Promise<Record<number, number>> {
  const rows = await db.getAllAsync<{ task_id: number; started_at: number }>(
    'SELECT task_id, started_at FROM task_timers WHERE day = ?',
    day,
  );
  return Object.fromEntries(rows.map((r) => [r.task_id, r.started_at]));
}

export async function startTimer(db: SQLiteDatabase, taskId: number, day = dayKey()) {
  await db.runAsync(
    'INSERT OR IGNORE INTO task_timers (task_id, day, started_at) VALUES (?, ?, ?)',
    taskId,
    day,
    Date.now(),
  );
}

/** Cancels a running timer so the task can be started again. */
export async function resetTimer(db: SQLiteDatabase, taskId: number, day = dayKey()) {
  await db.runAsync('DELETE FROM task_timers WHERE task_id = ? AND day = ?', taskId, day);
}

// ---- Locked apps ----

export async function listLockedApps(db: SQLiteDatabase): Promise<LockedApp[]> {
  return db.getAllAsync<LockedApp>('SELECT * FROM locked_apps ORDER BY label');
}

export async function setAppLocked(
  db: SQLiteDatabase,
  app: { packageName: string; label: string },
  locked: boolean,
) {
  if (locked) {
    await db.runAsync(
      'INSERT OR IGNORE INTO locked_apps (package_name, label, locked_at) VALUES (?, ?, ?)',
      app.packageName,
      app.label,
      Date.now(),
    );
  } else {
    await db.runAsync('DELETE FROM locked_apps WHERE package_name = ?', app.packageName);
  }
}

// ---- Settings ----

export async function getSetting(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    key,
  );
  return row?.value ?? null;
}

export async function setSetting(db: SQLiteDatabase, key: string, value: string) {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
}
