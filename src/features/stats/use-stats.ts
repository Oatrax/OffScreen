import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { blocker, type BlockStats } from '@/blocker';
import type { Task } from '@/data/types';

import { computeStats, type Stats } from './compute';

/** Rough minutes of scrolling each blocked open would otherwise have cost. */
export const MINUTES_SAVED_PER_BLOCK = 5;

export type StatsData = { stats: Stats; blocks: BlockStats; lockedApps: number; firstDay: number | null };

export function useStats() {
  const db = useSQLiteContext();
  const [data, setData] = useState<StatsData | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        // Archived tasks are kept so past days still count after a task is removed.
        const tasks = await db.getAllAsync<Task>('SELECT * FROM tasks');
        const rows = await db.getAllAsync<{ task_id: number; day: string }>(
          'SELECT task_id, day FROM task_completions',
        );
        const completions = new Set(rows.map((r) => `${r.task_id}|${r.day}`));
        const [blocks, locked] = await Promise.all([
          blocker.getBlockStats(),
          db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM locked_apps'),
        ]);
        if (cancelled) return;
        setData({
          stats: computeStats(tasks, completions),
          blocks,
          lockedApps: locked?.n ?? 0,
          firstDay: tasks.length ? Math.min(...tasks.map((t) => t.created_at)) : null,
        });
      })();
      return () => {
        cancelled = true;
      };
    }, [db]),
  );

  return data;
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h} h ${min % 60} min`;
}
