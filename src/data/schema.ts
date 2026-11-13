import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'offscreen.db';
const DATABASE_VERSION = 1;

/** Runs before any screen renders. Add new `if (version === N)` blocks for future migrations. */
export async function migrateDb(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  if (version >= DATABASE_VERSION) return;

  if (version === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';

      -- Task templates. recurrence: bitmask of weekdays (bit0=Sun..bit6=Sat), 0 = one-off on due_date.
      CREATE TABLE tasks (
        id INTEGER PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        notes TEXT,
        recurrence INTEGER NOT NULL DEFAULT 127,
        due_date TEXT,                      -- YYYY-MM-DD, only for one-off tasks
        required INTEGER NOT NULL DEFAULT 1, -- 1 = must be done to unlock
        archived INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      -- One row per task per day it was completed.
      CREATE TABLE task_completions (
        task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
        day TEXT NOT NULL,                  -- YYYY-MM-DD (local)
        completed_at INTEGER NOT NULL,
        PRIMARY KEY (task_id, day)
      );

      -- Apps the user chose to lock, keyed by Android package name.
      CREATE TABLE locked_apps (
        package_name TEXT PRIMARY KEY NOT NULL,
        label TEXT NOT NULL,
        locked_at INTEGER NOT NULL
      );

      -- Simple key/value for preferences (non-secret only; secrets live in SecureStore).
      CREATE TABLE settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
    version = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
