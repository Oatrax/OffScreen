import type { SQLiteDatabase } from 'expo-sqlite';

import { ALL_DAYS, dayKey } from './dates';
import type { LockedApp, Task } from './types';

// ---- Tasks ----

export async function listTasks(db: SQLiteDatabase): Promise<Task[]> {
  return db.getAllAsync<Task>('SELECT * FROM tasks WHERE archived = 0 ORDER BY created_at');
}

export async function addTask(
  db: SQLiteDatabase,
  t: { title: string; recurrence?: number; required?: boolean; notes?: string; dueDate?: string },
) {
  await db.runAsync(
    'INSERT INTO tasks (title, notes, recurrence, due_date, required, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    t.title,
    t.notes ?? null,
    t.recurrence ?? ALL_DAYS,
    t.dueDate ?? null,
    t.required === false ? 0 : 1,
    Date.now(),
  );
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
