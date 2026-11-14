import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CardShadow, Gradients, Spacing } from '@/constants/theme';
import { resetTimer, setStepDone, setTaskDone, startTimer } from '@/data/repositories';
import type { Task, TaskStep } from '@/data/types';
import { PermissionBanner } from '@/features/permissions/permission-banner';
import { PinCard } from '@/features/unlock/pin-card';
import { currentTime, readiness } from '@/features/tasks/rules';
import { TaskCard } from '@/features/tasks/task-card';
import { tasksForToday, unlockProgress, useTaskState } from '@/features/tasks/use-tasks';

export default function TodayScreen() {
  const db = useSQLiteContext();
  const { tasks, steps, doneIds, doneStepIds, timers, lockedAppCount, loaded, reload } =
    useTaskState();
  const [now, setNow] = useState(currentTime);

  const today = tasksForToday(tasks);
  const { done, total, unlocked } = unlockProgress(today, doneIds);
  const pct = total === 0 ? 1 : done / total;

  const stepsOf = (task: Task) => steps.filter((s) => s.task_id === task.id);

  // Tick once a second while any timer is still counting down.
  const timerRunning = today.some(
    (t) =>
      !doneIds.has(t.id) &&
      readiness(t, [], doneStepIds, timers[t.id], now).state === 'running',
  );
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setNow(currentTime()), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  /** Marks done (if the rules allow it right now) or undoes. */
  const toggleDone = async (task: Task) => {
    const current = currentTime();
    setNow(current);
    if (doneIds.has(task.id)) {
      await setTaskDone(db, task.id, false);
    } else if (readiness(task, stepsOf(task), doneStepIds, timers[task.id], current).state === 'ready') {
      await setTaskDone(db, task.id, true);
    }
    await reload();
  };

  const start = async (task: Task) => {
    await startTimer(db, task.id);
    setNow(currentTime());
    await reload();
  };

  const cancelTimer = async (task: Task) => {
    await resetTimer(db, task.id);
    await reload();
  };

  const toggleStep = async (task: Task, step: TaskStep) => {
    await setStepDone(db, step.id, task.id, !doneStepIds.has(step.id));
    await reload();
  };

  const left = total - done;
  const status = unlocked
    ? total === 0
      ? 'No required tasks today'
      : 'All required tasks done'
    : `${left} required task${left === 1 ? '' : 's'} left`;

  return (
    <ThemedView style={styles.root}>
      <FlatList
        data={today}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
          <PermissionBanner />
          <PinCard unlocked={unlocked} lockedAppCount={lockedAppCount} />
          <LinearGradient
            colors={unlocked ? Gradients.unlocked : Gradients.locked}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summary}>
            <View style={styles.statusRow}>
              <Ionicons name={unlocked ? 'lock-open' : 'lock-closed'} size={22} color="#fff" />
              <ThemedText type="smallBold" style={styles.heroText}>
                {unlocked ? 'Apps unlockable — great work!' : 'Apps locked — finish your tasks'}
              </ThemedText>
            </View>
            <ThemedText type="title" style={styles.heroText}>
              {Math.round(pct * 100)}%
            </ThemedText>
            <View style={styles.bar}>
              <View style={[styles.fill, { width: `${pct * 100}%` }]} />
            </View>
            <ThemedText type="small" style={styles.heroSub}>
              {done}/{total} required done · {status} · {lockedAppCount} app{lockedAppCount === 1 ? '' : 's'} selected
            </ThemedText>
          </LinearGradient>
          </>
        }
        ListEmptyComponent={
          loaded ? (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              Nothing scheduled today. Add tasks in the Planner tab.
            </ThemedText>
          ) : undefined
        }
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            steps={stepsOf(item)}
            done={doneIds.has(item.id)}
            doneStepIds={doneStepIds}
            startedAt={timers[item.id]}
            now={now}
            onToggleDone={() => toggleDone(item)}
            onStart={() => start(item)}
            onCancelTimer={() => cancelTimer(item)}
            onToggleStep={(s) => toggleStep(item, s)}
          />
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { padding: Spacing.three, gap: Spacing.two },
  summary: { padding: Spacing.four, borderRadius: 24, gap: Spacing.two, marginBottom: Spacing.two, ...CardShadow },
  heroText: { color: '#fff' },
  heroSub: { color: 'rgba(255,255,255,0.9)' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  bar: { height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.3)' },
  fill: { height: 10, borderRadius: 5, backgroundColor: '#fff' },
  empty: { textAlign: 'center', marginTop: Spacing.five },
});
