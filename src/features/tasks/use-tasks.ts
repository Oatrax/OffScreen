import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import { runsOn } from '@/data/dates';
import { completedTaskIds, listLockedApps, listTasks } from '@/data/repositories';
import type { Task } from '@/data/types';

export type TaskState = {
  tasks: Task[];
  doneIds: Set<number>;
  lockedAppCount: number;
  loaded: boolean;
};

/** Loads tasks, today's completions and lock count; reloads whenever the screen gains focus. */
export function useTaskState() {
  const db = useSQLiteContext();
  const [state, setState] = useState<TaskState>({
    tasks: [],
    doneIds: new Set(),
    lockedAppCount: 0,
    loaded: false,
  });

  const reload = useCallback(async () => {
    const [tasks, done, locked] = await Promise.all([
      listTasks(db),
      completedTaskIds(db),
      listLockedApps(db),
    ]);
    setState({ tasks, doneIds: new Set(done), lockedAppCount: locked.length, loaded: true });
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { ...state, reload };
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
