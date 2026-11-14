import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';

import {
  completedStepIds,
  completedTaskIds,
  getTimers,
  listLockedApps,
  listSteps,
  listTasks,
} from '@/data/repositories';
import type { Task, TaskStep } from '@/data/types';
import { syncBlocker } from '@/features/unlock';

export { tasksForToday, unlockProgress } from './rules';

export type TaskState = {
  tasks: Task[];
  steps: TaskStep[];
  doneIds: Set<number>;
  doneStepIds: Set<number>;
  /** taskId -> timer start (epoch ms), today only. */
  timers: Record<number, number>;
  lockedAppCount: number;
  loaded: boolean;
};

const EMPTY: TaskState = {
  tasks: [],
  steps: [],
  doneIds: new Set(),
  doneStepIds: new Set(),
  timers: {},
  lockedAppCount: 0,
  loaded: false,
};

/** Loads everything the Planner/Today screens need; reloads whenever the screen gains focus. */
export function useTaskState() {
  const db = useSQLiteContext();
  const [state, setState] = useState<TaskState>(EMPTY);

  const reload = useCallback(async () => {
    const [tasks, steps, done, doneSteps, timers, locked] = await Promise.all([
      listTasks(db),
      listSteps(db),
      completedTaskIds(db),
      completedStepIds(db),
      getTimers(db),
      listLockedApps(db),
    ]);
    setState({
      tasks,
      steps,
      doneIds: new Set(done),
      doneStepIds: new Set(doneSteps),
      timers,
      lockedAppCount: locked.length,
      loaded: true,
    });
    void syncBlocker(db).catch(() => {});
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { ...state, reload };
}
