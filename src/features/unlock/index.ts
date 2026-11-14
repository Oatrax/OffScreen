import type { SQLiteDatabase } from 'expo-sqlite';

import { blocker } from '@/blocker';
import { dayKey } from '@/data/dates';
import { clearPin, generatePin, hasPin, revealPin } from '@/data/pin-vault';
import {
  completedTaskIds,
  getSetting,
  listLockedApps,
  listTasks,
  setSetting,
} from '@/data/repositories';
import { tasksForToday, unlockProgress } from '@/features/tasks/rules';

export type UnlockMode = 'pin' | 'auto';

export type LockSettings = {
  /** 'pin': user reveals today's PIN and types it on the lock screen. 'auto': apps just open. */
  mode: UnlockMode;
  /** Strict: locks cannot be removed while locked apps are still locked for today. */
  strict: boolean;
};

export async function getLockSettings(db: SQLiteDatabase): Promise<LockSettings> {
  const [mode, strict] = await Promise.all([
    getSetting(db, 'unlock_mode'),
    getSetting(db, 'strict_lock'),
  ]);
  return { mode: mode === 'auto' ? 'auto' : 'pin', strict: strict !== '0' };
}

export async function setLockSettings(db: SQLiteDatabase, patch: Partial<LockSettings>) {
  if (patch.mode) await setSetting(db, 'unlock_mode', patch.mode);
  if (patch.strict !== undefined) await setSetting(db, 'strict_lock', patch.strict ? '1' : '0');
  await syncBlocker(db);
}

/** Whether every required task for today is done, plus the locked app count. */
export async function getUnlockState(db: SQLiteDatabase) {
  const [tasks, done, locked] = await Promise.all([
    listTasks(db),
    completedTaskIds(db),
    listLockedApps(db),
  ]);
  const progress = unlockProgress(tasksForToday(tasks), new Set(done));
  return { complete: progress.unlocked, lockedCount: locked.length, locked };
}

/**
 * The only way to read the PIN. Returns null until all required tasks for today are done,
 * so the UI can never show it early.
 */
export async function revealPinIfEarned(db: SQLiteDatabase): Promise<string | null> {
  const { complete } = await getUnlockState(db);
  if (!complete) return null;
  return revealPin();
}

/**
 * Pushes the full state to the native blocker: lock list, today's PIN, task completion.
 * Idempotent; call after anything that changes locks, tasks or settings.
 */
export async function syncBlocker(db: SQLiteDatabase) {
  const [{ complete, locked }, settings] = await Promise.all([getUnlockState(db), getLockSettings(db)]);

  if (locked.length === 0) {
    await blocker.stop();
    await blocker.setLockedPackages([]);
    await clearPin();
    return;
  }

  // One fresh PIN per day, generated while locks are active and never shown before tasks are done.
  const today = dayKey();
  if (!(await hasPin()) || (await getSetting(db, 'pin_day')) !== today) {
    await generatePin();
    await setSetting(db, 'pin_day', today);
  }
  const pin = await revealPin();
  if (pin) await blocker.setPin(pin, today);

  await blocker.setLockedPackages(locked.map((l) => l.package_name));
  await blocker.applyTaskState(complete, settings.mode === 'auto');
  await blocker.start();
}
